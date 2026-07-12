-- La 0003 ha creato per `avatars` le policy di INSERT, UPDATE e DELETE, ma NON
-- quella di SELECT. Su `storage.objects` la RLS è attiva: senza policy di lettura
-- `storage.list()` chiamato con la sessione dell'utente restituisce sempre una
-- lista vuota, e la pulizia dei file orfani in `setAvatar` non cancella mai nulla
-- (i vecchi avatar restano nel bucket, pubblicamente scaricabili via URL).
--
-- Il bucket è `public = true`, quindi la lettura anonima via URL pubblico passa
-- già da un'altra strada e questa policy non la tocca: qui abilitiamo soltanto
-- l'elenco della PROPRIA cartella `{uid}/` da parte dell'utente autenticato.
create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
