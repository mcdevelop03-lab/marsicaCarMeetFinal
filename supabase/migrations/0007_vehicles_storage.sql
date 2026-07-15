-- 1) Policy SELECT sullo storage per il bucket `vehicles`.
-- La 0003 ha creato INSERT/UPDATE/DELETE ma NON la SELECT. Su `storage.objects`
-- la RLS è attiva: senza policy di lettura, `list()` e `remove()` chiamati con la
-- sessione dell'utente non vedono nulla e la cancellazione delle foto FALLISCE IN
-- SILENZIO. È lo stesso bug che la 0006 ha corretto per `avatars`.
-- Il bucket è public=true, quindi la lettura anonima via URL pubblico passa da
-- un'altra strada: qui si abilita solo la propria cartella `{uid}/`.
create policy "vehicles_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2) Vincoli lato server sul bucket (non aggirabili dal client, che comprime e
-- controlla solo per dare feedback immediato). Come la 0005 per `avatars`.
update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'vehicles';

-- 3) Path del file nello storage, accanto all'URL pubblico.
-- Serve a sapere QUALE file cancellare quando si sostituisce la foto o si elimina
-- l'auto. Per gli avatar bastava elencare la cartella e tenere l'unico file, perché
-- l'avatar è uno solo per utente; con più auto per utente quell'invariante non
-- esiste, e ricavare il path spezzettando l'URL pubblico sarebbe fragile.
alter table public.vehicles add column if not exists image_path text;
