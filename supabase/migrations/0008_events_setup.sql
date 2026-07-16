-- 1) Limiti di dimensione e vincolo MIME sui bucket degli eventi.
-- Come la 0005 per `avatars` e la 0007 per `vehicles`: il controllo nel browser è
-- solo feedback immediato, la difesa vera sta sul bucket.
--
-- ATTENZIONE: a differenza di `avatars`/`vehicles`, qui la policy SELECT NON manca.
-- La 0003 protegge questi due bucket con una policy `for all`, che in Postgres copre
-- anche la SELECT; `avatars`/`vehicles` usavano invece comandi espliciti
-- (`for insert`/`update`/`delete`) ed è per questo che servirono la 0006 e la 0007.
-- Aggiungere qui una policy SELECT sarebbe un duplicato inutile.
--
-- `event-media` si configura già ora, benché serva solo in 1C-3: D-171 ha stabilito
-- che i video sono link YouTube, quindi quel bucket ospiterà solo immagini. La
-- decisione è presa, rimandarla significherebbe solo rischiare di dimenticarla.
update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('event-covers', 'event-media');

-- 2) Path della copertina nello storage, accanto all'URL pubblico.
-- Stessa lacuna che la 0007 ha colmato per `vehicles`: senza il path, per cancellare
-- il file giusto quando si sostituisce la copertina bisognerebbe ricavarlo
-- spezzettando l'URL pubblico, cosa fragile.
alter table public.events add column if not exists cover_path text;

-- 3) La data di inizio diventa obbligatoria.
-- Lo stato dell'evento è DERIVATO dalle date (spec 1C-1): senza `starts_at` non
-- esiste uno stato. La tabella è vuota, non c'è nulla da migrare.
alter table public.events alter column starts_at set not null;

-- 4) Semantica di `status` con lo stato derivato.
comment on column public.events.status is
  'Con lo stato derivato (spec 1C-1) qui si scrive SOLO ''upcoming'' (= non annullato) o ''canceled''. Lo stato mostrato (imminente/in corso/concluso) lo calcola statoEvento() in src/lib/events/stato.ts a partire da starts_at/ends_at: i valori ''ongoing'' e ''completed'' dell''enum non vengono mai scritti.';
