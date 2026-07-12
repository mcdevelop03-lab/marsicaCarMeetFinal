-- Vincoli lato server sul bucket degli avatar: non aggirabili dal client.
-- Il controllo nel browser (AvatarUploader) serve solo a dare feedback immediato.
update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';
