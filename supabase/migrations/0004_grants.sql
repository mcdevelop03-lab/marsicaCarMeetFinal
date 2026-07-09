-- I ruoli Supabase (anon/authenticated/service_role) devono avere i privilegi
-- di TABELLA di base: le policy RLS agiscono SOLO dopo i GRANT. Senza questi,
-- ogni query via sessione utente fallisce con "permission denied for table ...".

grant usage on schema public to anon, authenticated, service_role;

-- Lettura: anon e authenticated. Le policy RLS filtrano comunque le righe
-- (di fatto solo events/event_media sono pubblici; il resto richiede auth.uid()).
grant select on all tables in schema public to anon, authenticated;

-- Scrittura via sessione utente: solo authenticated (la RLS limita a owner/self).
grant insert, update, delete on all tables in schema public to authenticated;

-- service_role serve al backend/seed e bypassa la RLS: accesso pieno.
grant all on all tables in schema public to service_role;

-- Sequenze (per eventuali colonne serial/identity).
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Tabelle/sequenze FUTURE (Fase 1B/1C) ereditano gli stessi privilegi.
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
