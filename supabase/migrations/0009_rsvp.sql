-- Fase 1C-2 — RSVP. Spec: docs/superpowers/specs/2026-07-22-fase1c2-rsvp-design.md
--
-- Due nodi risolti qui:
--   (1) la capienza non era MOSTRABILE: `registrations_select_self_or_admin` fa vedere a
--       un membro solo la propria iscrizione. -> funzione aggregata + SELECT allargata.
--   (2) la capienza non era APPLICABILE senza corsa: `registrations_insert_self` non
--       controlla la capienza. -> l'unica via d'ingresso diventa una funzione che blocca
--       la riga dell'evento (FOR UPDATE) prima di contare e inserire.

-- 1) Iscrizione atomica. SECURITY DEFINER: gira coi privilegi del proprietario della
--    funzione, quindi BYPASSA le RLS. Per questo si fa da sé ogni controllo di identità
--    e di proprietà delle auto: nulla la protegge, se non lei stessa.
create or replace function public.iscriviti_evento(
  p_event_id uuid,
  p_vehicle_ids uuid[] default '{}',
  p_user_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
  v_capacity int;
  v_status public.event_status;
  v_iscritti int;
  v_registration_id uuid;
  v_vehicle_id uuid;
begin
  -- Destinatario: se non specificato, l'utente corrente. Iscrivere QUALCUN ALTRO è
  -- riservato all'admin.
  v_target := coalesce(p_user_id, auth.uid());
  if v_target is null then
    raise exception 'non autenticato' using errcode = '28000';
  end if;
  if v_target <> auth.uid() and not public.is_admin() then
    raise exception 'solo un admin puo iscrivere altri' using errcode = '42501';
  end if;

  -- Lock di riga sull'evento: due iscrizioni concorrenti sullo stesso evento si
  -- SERIALIZZANO qui. È ciò che rende impossibile la corsa sull'ultimo posto.
  select capacity, status into v_capacity, v_status
  from public.events
  where id = p_event_id
  for update;

  if not found then
    return 'evento_inesistente';
  end if;

  if v_status = 'canceled' then
    return 'annullato';
  end if;

  -- Già iscritto? (la unique(event_id,user_id) è la rete di sicurezza finale)
  if exists (
    select 1 from public.event_registrations
    where event_id = p_event_id and user_id = v_target
  ) then
    return 'gia_iscritto';
  end if;

  -- Capienza: NULL = illimitata. Il lock qui sopra garantisce che questo conteggio non
  -- possa essere superato da un inserimento concorrente.
  if v_capacity is not null then
    select count(*) into v_iscritti
    from public.event_registrations
    where event_id = p_event_id and status = 'going';
    if v_iscritti >= v_capacity then
      return 'esaurito';
    end if;
  end if;

  -- Proprietà delle auto: ogni veicolo deve appartenere al destinatario. Bypassando le
  -- RLS, questo è l'unico controllo che ferma "iscrivo l'auto di un altro".
  if p_vehicle_ids is not null then
    foreach v_vehicle_id in array p_vehicle_ids loop
      if not exists (
        select 1 from public.vehicles where id = v_vehicle_id and owner_id = v_target
      ) then
        raise exception 'veicolo % non appartiene al destinatario', v_vehicle_id
          using errcode = '42501';
      end if;
    end loop;
  end if;

  insert into public.event_registrations (event_id, user_id, status)
  values (p_event_id, v_target, 'going')
  returning id into v_registration_id;

  if p_vehicle_ids is not null then
    foreach v_vehicle_id in array p_vehicle_ids loop
      insert into public.event_vehicles (registration_id, vehicle_id)
      values (v_registration_id, v_vehicle_id);
    end loop;
  end if;

  return 'ok';
end;
$$;

-- 2) Conteggio pubblico aggregato. SECURITY DEFINER + STABLE: espone SOLO il numero, mai
--    le righe (che restano protette dalle RLS). Serve agli sloggati per vedere "X su Y
--    posti" senza poter leggere CHI è iscritto.
create or replace function public.iscritti_per_eventi(p_event_ids uuid[])
returns table(event_id uuid, iscritti int)
language sql
security definer
set search_path = public
stable
as $$
  select r.event_id, count(*)::int
  from public.event_registrations r
  where r.event_id = any(p_event_ids) and r.status = 'going'
  group by r.event_id;
$$;

-- 3) RLS: l'insert diretto sparisce (unica via = la funzione), la SELECT si allarga ai
--    loggati (per la lista "chi partecipa").
drop policy if exists "registrations_insert_self" on public.event_registrations;
drop policy if exists "registrations_update_self_or_admin" on public.event_registrations;
drop policy if exists "registrations_select_self_or_admin" on public.event_registrations;

create policy "registrations_select_authenticated" on public.event_registrations
  for select using (auth.uid() is not null);
-- La DELETE resta `registrations_delete_self_or_admin` (0002): la disdetta (self) e la
-- rimozione (admin) sono delete diretti, senza corsa. NON si tocca.

-- event_vehicles: la SELECT si allarga ai loggati (vedere le auto altrui al raduno).
-- insert/delete restano `self` (il membro gestisce le proprie auto): NON si toccano.
drop policy if exists "event_vehicles_select" on public.event_vehicles;
create policy "event_vehicles_select" on public.event_vehicles
  for select using (auth.uid() is not null);

-- 4) Grant di esecuzione. Senza, PostgREST non espone le funzioni ai ruoli.
--    `iscriviti_evento` solo ai loggati; il conteggio anche agli anonimi.
grant execute on function public.iscriviti_evento(uuid, uuid[], uuid) to authenticated;
grant execute on function public.iscritti_per_eventi(uuid[]) to anon, authenticated;
