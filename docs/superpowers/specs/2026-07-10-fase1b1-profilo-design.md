# Design — Fase 1B-1: Profilo

> Data: 2026-07-10 · Branch: `feat/fase1b1-profilo`
> Sotto-progetto della Fase 1B (Profilo + Garage). Il Garage è il sotto-progetto successivo (**1B-2**).

## Obiettivo

Dare a ogni membro loggato un **profilo** consultabile e modificabile, con **foto profilo**, e un modo per **trovare gli altri membri**. È il presupposto di 1B-2: dalla pagina di un membro si raggiungerà il suo garage.

Requisiti di riferimento: `FEATURES.md` §2 (Profilo Membro), decisioni **D-146** (profili visibili ai soli membri loggati), **D-111/D-114** (niente gamification, niente tessera).

## Fuori scope (YAGNI)

Paginazione/elenco completo dei membri, follow, messaggistica, gamification, tessera, filtri per comune, moderazione profili. Il **garage** (anche quello altrui) è **1B-2**.

## Decisioni prese in brainstorming

| Tema | Decisione |
|------|-----------|
| Struttura 1B | Divisa in **1B-1 Profilo** (questo spec) e **1B-2 Garage** |
| Scoperta membri | **Pagina dedicata `/membri`** con barra di ricerca (non elenco statico, non ricerca nell'header) |
| Rotte | `/profilo` (mio, modificabile) + `/membri/[tag]` (altri, sola lettura) |
| Social | **Instagram, Facebook, TikTok, YouTube**, tutti opzionali, salvati come **handle** (l'URL lo costruisce l'app) |
| Comune | **Testo libero** |
| Upload avatar | **Dal browser** direttamente su Supabase Storage + server action che salva l'URL |
| Ricerca | **Server-side via URL** (`?q=`), form GET |

## Rotte e guardie

Tutte nel gruppo `(auth)`, il cui layout chiama `requireUser()` (che impone anche AAL2 se il membro ha il 2FA attivo). Questo soddisfa D-146.

| Rotta | Contenuto |
|-------|-----------|
| `/profilo` | Il mio profilo: vista + form di modifica + upload avatar |
| `/membri` | Ricerca membri (`?q=`) e risultati |
| `/membri/[tag]` | Profilo di un altro membro, **sola lettura**. Se il tag è il mio → `redirect('/profilo')`. Se non esiste → `notFound()` |

Nel menu (header + mobile) compaiono **Profilo** e **Membri** solo quando `isAuthenticated`, accanto a Dashboard/Impostazioni.

> Nota: la pagina placeholder `/garage` oggi sta nel gruppo `(public)`, ma i dati richiedono login. Verrà spostata sotto `(auth)` in **1B-2**; in 1B-1 non la tocchiamo.

## Modello dati e validazione

La tabella `public.profiles` esiste già e non va modificata:
`id, name, tag (unique), avatar_url, role, bio, town, socials jsonb, created_at`.

Nuovo `src/lib/validation/profile.ts` (zod), sullo stile di `validation/auth.ts`:

- `name` — 2–50 caratteri, trim. Obbligatorio.
- `tag` — 3–30 caratteri, `^[a-z0-9._-]+$` (minuscolo). Obbligatorio, **unico**.
- `bio` — max 300 caratteri, opzionale.
- `town` — max 60 caratteri, testo libero, opzionale.
- `socials` — 4 handle opzionali (`instagram`, `facebook`, `tiktok`, `youtube`), max 30 caratteri, `^[A-Za-z0-9._-]+$`. Salvati **senza** `@` e senza URL.

Server action `updateProfile` in `src/app/[locale]/(auth)/profilo/actions.ts`:
1. valida con zod (errore → messaggio inline nel form);
2. `update` su `profiles` per `id = auth.uid()`;
3. intercetta la violazione di unicità sul `tag` (codice Postgres `23505`) → errore **"Tag già in uso"**;
4. `revalidatePath` sulle rotte interessate (profilo + header).

La RLS `profiles_update_self` impedisce già di modificare il proprio `role` e i profili altrui: non serve logica extra lato applicativo.

## Avatar

**Migrazione `0005_storage_avatar_limits.sql`** — vincoli lato server, non aggirabili dal client:
```sql
update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'avatars';
```

**Componente client `AvatarUploader`** (`src/components/features/profile/AvatarUploader.tsx`):
- mostra l'avatar corrente (o quello di default);
- controlla tipo e peso **prima** di caricare (feedback immediato);
- carica con il client browser Supabase in `avatars/{uid}/avatar-<timestamp>.<ext>`
  (le policy dello storage consentono la scrittura solo nella cartella `{uid}/`);
- chiama la server action `setAvatar(path)`.

**Server action `setAvatar(path)`**:
1. verifica che `path` inizi con `{auth.uid()}/` (difesa in profondità);
2. salva l'URL pubblico in `profiles.avatar_url`;
3. **elimina gli altri file** presenti in `avatars/{uid}/` (si elencano con `storage.list` e si cancellano quelli diversi dal nuovo `path`): nella cartella resta sempre un solo avatar, così non si accumulano file orfani. Non si ricava il path dall'URL salvato;
4. `revalidatePath`.

**Avatar di default:** `public/default-avatar.svg` (cerchio grigio + silhouette), usato quando `avatar_url` è `null`. Reso con un `<img>` semplice: servire SVG tramite `next/image` richiederebbe `dangerouslyAllowSVG` in `next.config`, che preferiamo non abilitare per un asset decorativo.

## Avatar nell'header

`src/app/[locale]/layout.tsx` oggi chiama `getUser()`; passa a **`getProfile()`** per ottenere anche `avatar_url`. Per gli utenti anonimi `getProfile()` ritorna `null` subito, senza query aggiuntive.

`Header` riceve `avatar: string | null`:
- se presente → mostra l'avatar (cerchio, bordo sottile) **accanto al menu**, a destra: su desktop dopo la nav, su mobile accanto all'hamburger;
- è un **link a `/profilo`**;
- se assente (anonimo) → non mostra nulla.

Questo chiude il requisito raccolto in precedenza e rimandato apposta a 1B.

## Ricerca membri

`/membri` è un server component che legge `searchParams.q`.

- **Form GET** con un input `q` (nessun JS richiesto, URL condivisibile).
- Con `q`: query su `profiles` con `ilike` su **nome** e **tag**
  (`.or('name.ilike.%q%,tag.ilike.%q%')`), `limit(24)`, ordinata per nome.
- Senza `q`: mostra gli **ultimi iscritti** (`order by created_at desc`, `limit 12`).
- La RLS `profiles_select_authenticated` limita già la lettura ai soli loggati.
- Risultati come **card**: avatar, nome (o `@tag` se il nome manca), `@tag`, comune. Clic → `/membri/[tag]`.
- Stato vuoto: messaggio "Nessun membro trovato".
- L'input `q` viene sanificato per i caratteri jolly di `ilike` (`%`, `_`).

## Pagina membro `/membri/[tag]`

Sola lettura: avatar, nome, `@tag`, comune, bio, icone social.
I link social si aprono in una nuova scheda con `rel="noopener noreferrer"`; l'URL si costruisce dall'handle (es. `https://instagram.com/<handle>`).
In fondo, una **sezione "Garage" segnaposto** ("In arrivo"), che 1B-2 riempirà.

## Internazionalizzazione e stile

- Tutte le stringhe nuove in `src/messages/it.json` sotto le chiavi `profile` e `members`. **Nessun testo hardcoded.**
- Colori **solo da token** di tema. Riuso dei componenti esistenti (`Button`, `Card`, `Input`, `SectionHeading`, `ValidatedInput` dove ha senso).

## Gestione errori

| Caso | Comportamento |
|------|---------------|
| Tag già in uso | Errore inline nel form ("Tag già in uso") |
| Validazione fallita | Messaggio inline sul campo |
| File troppo grande / tipo non ammesso | Messaggio nell'uploader, nessun upload |
| Upload fallito | Messaggio; `avatar_url` invariato |
| Membro inesistente | `notFound()` (404) |
| Profilo senza nome | Mostra `@tag` al posto del nome |

## Sicurezza

- Tutte le pagine sotto `(auth)` → solo membri loggati (D-146).
- RLS già attiva: lettura profili solo autenticati; update solo del proprio; `role` non modificabile.
- Storage: scrittura consentita solo in `avatars/{uid}/`; limiti di peso/MIME imposti sul bucket.
- `setAvatar` ricontrolla il prefisso del path lato server.

## Collaudo (definizione di "fatto")

1. **e2e (Playwright):** modifica profilo (nome/tag/bio/comune/social) → persistita; tag duplicato → errore; upload avatar → compare nel profilo **e nell'header**; ricerca membri trova per nome e per tag; clic su un risultato → pagina membro in sola lettura; il proprio tag su `/membri/[tag]` → redirect a `/profilo`; tag inesistente → 404.
2. **RLS via SQL:** un utente non può fare `update` sul profilo altrui (0 righe) né cambiarsi il `role`.
3. **Storage:** upload in `avatars/{altro-uid}/` respinto; file > 2 MB o MIME non ammesso respinto.
4. **build, lint, tsc verdi.**

## Criteri di accettazione

- [ ] Un membro loggato può vedere e modificare il proprio profilo, compreso l'avatar.
- [ ] L'avatar compare nell'header accanto al menu ed è link a `/profilo`.
- [ ] Un membro loggato può cercare altri membri per nome o tag e aprirne il profilo in sola lettura.
- [ ] Un utente non loggato non raggiunge nessuna di queste pagine.
- [ ] Il `tag` resta unico e il `role` non è modificabile dall'utente.
