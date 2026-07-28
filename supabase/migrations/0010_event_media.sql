-- Fase 1C-3 (Album foto). L'infrastruttura media è già quasi tutta pronta dalle
-- migrazioni 0001-0004/0008: tabella event_media, enum media_type, RLS (SELECT
-- pubblica / write admin) su tabella E bucket, limiti 2 MB/MIME sul bucket, grant.
-- Qui mancano solo due colonne.

-- Path del file nel bucket, per cancellarlo con certezza quando si elimina la foto.
-- Stessa lezione di events.cover_path (0008) e vehicles.image_path (0007): mai
-- ricavare il path spezzando l'URL pubblico. NULL per le righe video (un link
-- YouTube non ha un file nel nostro storage).
alter table public.event_media add column if not exists storage_path text;

-- Link Drive opzionale per-evento (D-171c): bottone per scaricare gli originali in
-- alta risoluzione. È fuori dal nostro perimetro (caveat GDPR D-172, da dichiarare
-- nella privacy policy).
alter table public.events add column if not exists drive_url text;
