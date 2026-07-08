-- Helper: l'utente corrente è admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Abilita RLS
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_vehicles enable row level security;
alter table public.event_media enable row level security;

-- profiles: lettura solo loggati; update solo self (senza cambiare role) o admin
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.uid() is not null);
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- vehicles: lettura loggati; scrittura solo owner; admin tutto
create policy "vehicles_select_authenticated" on public.vehicles
  for select using (auth.uid() is not null);
create policy "vehicles_insert_owner" on public.vehicles
  for insert with check (owner_id = auth.uid());
create policy "vehicles_update_owner" on public.vehicles
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "vehicles_delete_owner_or_admin" on public.vehicles
  for delete using (owner_id = auth.uid() or public.is_admin());

-- events: lettura pubblica; scrittura solo admin
create policy "events_select_public" on public.events
  for select using (true);
create policy "events_admin_write" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

-- event_registrations: self o admin
create policy "registrations_select_self_or_admin" on public.event_registrations
  for select using (user_id = auth.uid() or public.is_admin());
create policy "registrations_insert_self" on public.event_registrations
  for insert with check (user_id = auth.uid());
create policy "registrations_update_self_or_admin" on public.event_registrations
  for update using (user_id = auth.uid() or public.is_admin());
create policy "registrations_delete_self_or_admin" on public.event_registrations
  for delete using (user_id = auth.uid() or public.is_admin());

-- event_vehicles: legato alla propria registrazione, o admin
create policy "event_vehicles_select" on public.event_vehicles
  for select using (
    public.is_admin() or exists (
      select 1 from public.event_registrations r
      where r.id = registration_id and r.user_id = auth.uid()
    )
  );
create policy "event_vehicles_insert" on public.event_vehicles
  for insert with check (
    exists (
      select 1 from public.event_registrations r
      where r.id = registration_id and r.user_id = auth.uid()
    )
  );
create policy "event_vehicles_delete" on public.event_vehicles
  for delete using (
    public.is_admin() or exists (
      select 1 from public.event_registrations r
      where r.id = registration_id and r.user_id = auth.uid()
    )
  );

-- event_media: lettura pubblica; scrittura solo admin
create policy "event_media_select_public" on public.event_media
  for select using (true);
create policy "event_media_admin_write" on public.event_media
  for all using (public.is_admin()) with check (public.is_admin());
