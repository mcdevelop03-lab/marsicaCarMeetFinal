-- Bucket (public=true → lettura via URL pubblico; scrittura sempre regolata da policy)
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('vehicles', 'vehicles', true),
  ('event-covers', 'event-covers', true),
  ('event-media', 'event-media', true)
on conflict (id) do nothing;

-- avatars/vehicles: scrittura solo nella propria cartella {uid}/...
create policy "avatars_write_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vehicles_write_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicles_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicles_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);

-- event-covers / event-media: scrittura solo admin
create policy "event_covers_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'event-covers' and public.is_admin())
  with check (bucket_id = 'event-covers' and public.is_admin());
create policy "event_media_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'event-media' and public.is_admin())
  with check (bucket_id = 'event-media' and public.is_admin());
