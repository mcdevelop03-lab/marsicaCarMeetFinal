# Fase 1C-3 — Album foto (media evento) — Design/Spec

> Data: **2026-07-28**. Chiude la **Fase 1C**. Precedenti: 1C-1 (Eventi), 1C-2 (RSVP).
> Requisiti di riferimento: **RF-28**, **RF-31**, **RF-32**; decisioni **D-133**, **D-171**, **D-172**.

## Obiettivo

Ogni evento ha un **album media** caricato **solo dall'Admin**, **a raduno concluso**, **pubblico** (visibile anche ai non loggati). Tre tipi di contenuto (approccio ibrido D-171):

- **(a) Foto** → nel nostro bucket `event-media`, compresse in **WebP** dal browser.
- **(b) Video** → **non** si caricano: si salva un **link YouTube** e lo si **incorpora** nella pagina.
- **(c)** Link **Drive** opzionale per-evento → bottone "scarica gli originali in alta risoluzione".

**Nessun upload dei membri, nessuna moderazione dei contenuti utente** (RF-31/RF-32): l'unico che carica è l'Admin.

## Cosa è già pronto (non si tocca)

- Tabella **`event_media`** (`id, event_id, uploader_id, type, url, caption, created_at`), enum **`media_type` = image|video** — dalla `0001`.
- **RLS** su `event_media`: `event_media_select_public` (SELECT pubblica, `using(true)`) + `event_media_admin_write` (scrittura solo admin) — dalla `0002`.
- **RLS storage** bucket `event-media`: scrittura solo admin (`event_media_admin_write`, `for all`) — dalla `0003`; la SELECT è coperta dalla `for all`, non serve aggiungerla.
- Bucket `event-media`: **public**, limite **2 MB**, MIME `image/jpeg|png|webp` — dalla `0008`.
- **Grant** su `event_media`: SELECT per `anon`/`authenticated`, write per `authenticated` (RLS limita ad admin) — dalla `0004`.
- Utility di compressione **`comprimiImmagine(file): Promise<File>`** (`src/lib/images/compress.ts`) — riusabile per ogni foto del batch.
- Pattern **"vista admin inline in fondo alla pagina pubblica"** (già in `eventi/[slug]/page.tsx` con `AdminIscritti`).

## Decisioni prese in brainstorming (non ridiscuterle)

1. **Scope = tutti e tre** i pezzi di D-171 (foto + YouTube + Drive) in questa sotto-fase → la Fase 1C chiude completa.
2. **Gate su "concluso"**: il pannello admin di caricamento compare **solo se l'evento è concluso**, riusando `eConcluso()` di `src/lib/events/stato.ts` (fine giornata italiana). La gallery pubblica compare comunque solo se c'è almeno un media o un link Drive.
3. **Upload foto = batch multi-file** (input `multiple`), con avanzamento e tolleranza ai fallimenti parziali.
4. **Orchestrazione client-side** (approccio A), identica a `VehicleForm`: il browser comprime + carica nel bucket + chiama una server action che inserisce la riga. La compressione resta nel browser.
5. **Caption**: le **foto non hanno caption** (batch → didascalie per-foto scomode; RF non le chiede → YAGNI). Il **video YouTube ha una caption opzionale** (un titolo, utile perché è un singolo elemento).
6. **Drive link gestito nel pannello media**, non nell'`EventForm` (è contenuto post-evento, coerente con l'album).
7. **Ordine gallery**: foto e video insieme per `created_at` **decrescente** (più recenti in alto).

## Approccio scartato

**B — Server-orchestrato** (i file passano da una server action che carica con service role e inserisce atomicamente): più atomico, ma spedire decine di file multi-MB attraverso una server action è pesante (limiti body di Next 16), perde la compressione client e si discosta dal pattern del progetto. Scartato.

## Architettura

### Migrazione `0010_event_media.sql`

```sql
-- Path del file nel bucket, per cancellarlo con certezza quando si elimina la foto.
-- Stessa lezione di events.cover_path (0008) e vehicles.image_path (0007): mai
-- ricavare il path spezzando l'URL pubblico. NULL per le righe video (YouTube non
-- ha un file nostro).
alter table public.event_media add column if not exists storage_path text;

-- Link Drive opzionale per-evento (D-171c): bottone per scaricare gli originali in
-- alta risoluzione. Fuori dal nostro perimetro (caveat GDPR D-172).
alter table public.events add column if not exists drive_url text;
```

Nessun'altra modifica: tabella, enum, RLS, bucket e grant esistono già e sono corretti. **Zero nuove policy.**

### Layout storage

`event-media/{event-id}/{uuid}.webp` — path per-evento (le foto sono molte e l'evento esiste già alla creazione dell'album, a differenza della copertina che ha path piatto perché in creazione l'evento non ha ancora un id). Nome file = uuid casuale → niente collisioni.

### Righe `event_media`

- **Foto**: `type='image'`, `url` = URL pubblico, `storage_path` = path nel bucket, `uploader_id = auth.uid()`, `caption = null`.
- **Video**: `type='video'`, `url` = link YouTube canonico, `storage_path = null`, `caption` = opzionale.

## Componenti e file

### Nuovi

- **`src/lib/media/youtube.ts`** — `estraiIdYouTube(url): string | null`. Logica pura, testata con vitest.
- **`src/components/features/events/AdminMedia.tsx`** — pannello admin (client): upload batch foto, aggiunta video YouTube, campo link Drive, elimina per singolo media. Compare solo se admin **e** evento concluso.
- **`src/components/features/events/GalleryEvento.tsx`** — gallery pubblica (foto in griglia + lightbox, video YouTube incorporati, bottone Drive). Compare solo se c'è almeno un media o un `drive_url`.
- **`src/components/features/events/Lightbox.tsx`** — overlay a schermo intero (Esc/click fuori per chiudere, frecce ‹ › e tasti freccia per scorrere). Componente client piccolo e isolato. *(Può nascere dentro `GalleryEvento` se resta abbastanza piccolo; separato se cresce.)*
- **`src/lib/media/youtube.test.ts`** — test della logica pura.

### Modificati

- **`src/app/[locale]/(public)/eventi/[slug]/actions.ts`** — nuove server action:
  - `aggiungiFoto(eventId, storagePath, url)` — inserisce una riga foto.
  - `aggiungiVideo(eventId, url, caption?)` — valida URL YouTube, estrae l'id, inserisce una riga video.
  - `impostaDriveUrl(eventId, url)` — scrive/azzera `events.drive_url`.
  - `rimuoviMedia(mediaId)` — elimina la riga; se foto, cancella anche il file dal bucket.
- **`src/app/[locale]/(public)/eventi/[slug]/page.tsx`** — legge i media (`event_media` per `event_id`, ordine `created_at` desc) e `drive_url`; monta `GalleryEvento` (dopo la card informativa) e `AdminMedia` (in fondo, se admin + concluso).
- **`src/types/database.ts`** — tipi per `event_media` con `storage_path`, `events.drive_url`.
- **`src/messages/it.json`** — namespace `gallery` (o esteso `events`) per le stringhe UI.

## Flussi

### Upload batch foto (client-orchestrato)

1. Admin seleziona N file (input `multiple`).
2. Per ogni file, in sequenza con avanzamento "k/N":
   a. `comprimiImmagine(file)` → WebP.
   b. Upload su `event-media/{event-id}/{uuid}.webp` col client Supabase browser (RLS bucket ammette admin).
   c. `aggiungiFoto(eventId, path, url)` inserisce la riga.
   d. Se (c) fallisce dopo che (b) è riuscito → **`remove()` best-effort** del file appena caricato (anti-orfano sul caso comune).
3. Se un file fallisce (bucket lo respinge, ecc.) → si prosegue con gli altri; a fine si elenca cosa non è passato.
4. `router.refresh()` → le nuove foto compaiono nella gallery.

### Aggiunta video YouTube

Campo URL (+ caption opzionale) → `aggiungiVideo`. La action valida che sia un URL YouTube (`estraiIdYouTube` ≠ null), salva `type='video'`, `url` canonico, `storage_path=null`. URL non-YouTube → errore distinto ("inserisci un link YouTube valido"), niente riga.

### Link Drive

Campo URL inline → `impostaDriveUrl(eventId, url)` scrive `events.drive_url`; svuotare = rimuovere.

### Elimina (moderazione, D-171 "moderabili dall'admin")

Ogni media, per l'admin, ha un elimina con conferma in-linea a due passi (come il garage). `rimuoviMedia(mediaId)`: cancella la riga; se `type='image'`, cancella anche il file via `storage_path` (0 orfani). Video → solo la riga.

### Gallery pubblica

- **Foto** → griglia responsiva di miniature (`<img>` dal bucket pubblico). Click → **lightbox** (overlay, Esc/click-fuori per chiudere, ‹ › e tasti freccia per scorrere).
- **Video** → `<iframe>` verso `https://www.youtube-nocookie.com/embed/{id}` (privacy-enhanced), blocchi 16:9; caption sotto se presente.
- **Drive** (se valorizzato) → bottone "Scarica le foto originali" (link esterno `target=_blank rel=noopener`), con riga di nota (l'utente esce dal nostro perimetro — caveat GDPR D-172).
- La sezione compare solo se c'è almeno un media o un `drive_url`; altrimenti nulla (niente riquadro vuoto).
- Collocazione: **dopo la card informativa** (per un evento concluso l'RSVP è chiuso, l'album è il contenuto principale).

## Sicurezza

- **Difesa server**: ogni action richiama `requireAdmin()` **e** ricontrolla `eConcluso(evento)` lato server (il gate UI non basta).
- **Difesa vera** (non bypassabile via PostgREST/storage diretto): RLS `event_media_admin_write` sulla tabella + policy admin sul bucket + limiti 2 MB/MIME sul bucket.
- L'anon vede solo ciò che la pagina pubblica seleziona; `event_media` è pubblico per progetto (D-146/D-171: le foto sono pubbliche anche ai non loggati).

## Gestione errori

- Batch a fallimento parziale: prosegue, elenca cosa non è passato.
- Errori Supabase **loggati** e mai confusi col vuoto (convenzione del progetto).
- **Anti-orfani** sul caso comune: `remove()` best-effort se l'insert fallisce dopo l'upload. Il debito storage generale resta quello già documentato (pulizia orfani di sistema, fuori scope).

## Test

**Vitest (logica pura):** `estraiIdYouTube` — `youtu.be/ID`, `youtube.com/watch?v=ID`, parametri extra (`&t=30s`, `list=…`), `/embed/ID`, URL non-YouTube, stringa vuota, id malformato.

**Collaudo dal vivo (prove negative):**
- POST alle action da **non-admin** e da **sloggato** → respinto.
- **Insert diretto** in `event_media` via PostgREST da non-admin → 403; **upload diretto** in `event-media/` da non-admin → 403.
- Upload **>2 MB** / **MIME non ammesso** → 413/415 dal bucket.
- Azioni forzate su un evento **non concluso** → respinte server-side.
- `aggiungiVideo` con URL non-YouTube → errore distinto, niente riga.
- **Elimina foto** → riga **e** file via (0 orfani); **elimina video** → solo riga.
- Gallery pubblica visibile **da sloggato**; embed YouTube che carica.
- Regressione 1C-1: eliminare un evento **con media** resta bloccato (`notEmpty`).

**Standard:** `npm test` verde, `tsc`/`lint`, `rm -rf .next && npm run build` verde (non mentre gira `next dev`).

## Da verificare nel piano (check, non buco di design)

- **CSP**: se l'app ha una Content-Security-Policy (`proxy.ts`/config Next), l'iframe YouTube richiede `frame-src https://www.youtube-nocookie.com` — controllare e semmai aggiungere, altrimenti il browser blocca l'embed.
- `URL.createObjectURL` per le anteprime del batch: se usato, va revocato (debito già noto nelle altre form).

## Fuori scope (non fare)

- Upload/moderazione contenuti dei membri (RF-31/RF-32: nessun upload utente).
- Upload di video (D-171b: solo link YouTube).
- Caption per-foto.
- Riordino manuale dei media (ordine = `created_at`).
- Privacy policy vera del caveat Drive (D-172): fuori scope tecnico di questa fase.
- Pulizia orfani di sistema (debito già tracciato, da affrontare insieme al debito storage di 1B-2/1C-1).
