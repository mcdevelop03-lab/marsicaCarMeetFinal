# Fase 1A — Backend + Auth · Design (Spec)

> Documento di design. Ultima modifica: 2026-07-08.
> Primo sotto-progetto della **Fase 1 — MVP**. Decomposizione della Fase 1 in 1A→1D
> concordata con l'utente (vedi [ROADMAP.md](../../ROADMAP.md) e [TODO.md](../../TODO.md)).
> Scelte di prodotto in [DECISIONS.md](../../DECISIONS.md); architettura in [ARCHITECTURE.md](../../ARCHITECTURE.md).

## 1. Obiettivo e scope

**Obiettivo:** dare al progetto un backend Supabase reale (schema + RLS + Storage) e
un'**autenticazione completa**, con aree protette funzionanti. Al termine di 1A un utente
può registrarsi, confermare l'email, accedere (anche con Google e 2FA), e le aree membro/admin
sono protette a due livelli (server-side + RLS).

### Dentro 1A
- Setup Supabase: CLI (dev-dependency, via `npx`), `supabase init`, **stack locale (Docker)**,
  progetto **cloud** gratuito, `link`, variabili d'ambiente.
- Migrazione schema **completa Fase 1**: `profiles`, `vehicles`, `events`,
  `event_registrations`, `event_vehicles`, `event_media` + enum + indici.
- Bucket **Storage**: `avatars`, `vehicles`, `event-covers`, `event-media`.
- **RLS** su tutte le tabelle (regole da [USER_ROLES.md](../../USER_ROLES.md) §4).
- Trigger `handle_new_user` (crea `profiles` al signup) + seed **primo admin**.
- **Auth completa** (Server Actions): registrazione + **conferma email obbligatoria**,
  login/logout, reset password, **Google OAuth**, **Cloudflare Turnstile**, **2FA TOTP** opzionale.
- Riorganizzazione **route groups** `(public)` / `(auth)` / `(admin)` + **guardie** server-side
  e **refresh sessione** nel `proxy.ts`.
- Pagina **`/impostazioni`** minima (solo attivazione/disattivazione 2FA) + **`/dashboard`** minima.

### Fuori da 1A (sotto-fasi successive)
- Editing profilo completo e avatar UI ricca → **1B**.
- Garage (CRUD veicoli) → **1B**.
- Eventi/RSVP/album media (UI e azioni) → **1C**.
- Cookie banner + consensi + pagine privacy/cookie reali → **1D**.
- Tabelle `gadgets` (Fase 3) e `posts` (Fase 2): **non** create ora.

> Nota: lo **schema** delle tabelle usate in 1B/1C viene creato già in 1A (una sola migrazione
> di base), ma le relative **UI/azioni** arrivano nelle sotto-fasi dedicate. Questo evita
> migrazioni frammentate e permette a RLS di essere completa da subito.

## 2. Vincoli e prerequisiti

- **Next.js 16** (non 15): consultare `node_modules/next/dist/docs/` prima di usare API Next;
  rispettare deprecazioni (già migrato `middleware.ts`→`proxy.ts`).
- **Nessun colore hardcoded**; solo token del tema.
- **Lingua:** IT; tutte le stringhe UI passano da `next-intl` (`messages/it.json`).
- **Ambiente rilevato:** Docker installato (v20.10.20) ma **daemon da avviare**; Supabase CLI
  **non installata** (usiamo `npx supabase`, install globale npm deprecata).
- **Account esterni da predisporre (task guidati):**
  - Progetto **Supabase** cloud (URL, anon key, service role key).
  - **Google OAuth** (Google Cloud Console): Client ID/Secret + redirect autorizzati.
  - **Cloudflare Turnstile**: site key + secret key.
- **Branch dedicato:** `feat/fase1a-backend-auth` (non `main`).

## 3. Architettura tecnica

### 3.1 Pattern auth
- **Server Actions** per registrazione, login, logout, reset password, enrollment/verify 2FA.
- **Un solo Route Handler**: `GET /[locale]/auth/callback` per lo scambio del `code` OAuth di Google
  (obbligatorio) e per il redirect post-conferma email.
- Client Supabase: `lib/supabase/client.ts` (browser) e `lib/supabase/server.ts` (server) — **già
  presenti**. Si aggiunge `lib/supabase/proxy.ts`-helper per il refresh sessione dentro `proxy.ts`.

### 3.2 Sessione & proxy
`src/proxy.ts` oggi esegue solo il middleware next-intl. Va **composto** con il refresh sessione
Supabase (`@supabase/ssr`): ad ogni richiesta si aggiorna il cookie di sessione e si passa la
risposta a next-intl (o viceversa), mantenendo il `matcher` per il locale. Ordine: prima creare la
response di next-intl, poi far scrivere a Supabase i cookie aggiornati sulla stessa response.

### 3.3 Guardie (difesa a due livelli)
- **Server-side:** helper in `lib/auth/`:
  - `getUser()` → `User | null` (da `supabase.auth.getUser()`).
  - `getProfile()` → profilo con `role`.
  - `requireUser()` → redirect a `/login` se non loggato.
  - `requireAdmin()` → redirect a `/dashboard` (o 403) se `role !== 'admin'`.
  I layout dei gruppi `(auth)` e `(admin)` chiamano rispettivamente `requireUser()` / `requireAdmin()`.
- **DB:** RLS su tutte le tabelle (sotto §5).

### 3.4 Struttura cartelle target (fine 1A)
```
src/
  app/[locale]/
    (public)/
      page.tsx                 # home (spostata)
      eventi/ garage/ gadget/   # placeholder (spostati)
      privacy/ cookie/          # placeholder (spostati)
      login/page.tsx
      registrati/page.tsx
      reset-password/page.tsx
      auth/callback/route.ts    # Route Handler OAuth/email
    (auth)/
      layout.tsx                # requireUser()
      dashboard/page.tsx
      impostazioni/page.tsx     # 2FA enrollment
    (admin)/
      layout.tsx                # requireAdmin()
      admin/page.tsx            # placeholder pannello
    layout.tsx                  # invariato (Header/Footer)
    not-found.tsx
  components/
    features/auth/              # form login/registrati/reset, TurnstileWidget, TwoFactorSetup
  lib/
    supabase/ client.ts server.ts   # esistenti
    auth/ index.ts                   # getUser/getProfile/requireUser/requireAdmin
    turnstile.ts                     # verifica server-side token
  proxy.ts                     # next-intl + refresh sessione Supabase
supabase/
  config.toml                  # da `supabase init`
  migrations/
    0001_init_schema.sql       # enum, tabelle, indici, trigger
    0002_rls_policies.sql      # policy RLS + is_admin()
    0003_storage_buckets.sql   # bucket + policy storage
  seed.sql                     # primo admin (istruzioni)
```

## 4. Modello dati (migrazione `0001_init_schema.sql`)

Enum:
- `user_role`: `member` | `organizer` | `admin` (default `member`; `organizer` predisposto, non assegnato).
- `event_status`: `upcoming` | `ongoing` | `completed` | `canceled`.
- `event_type`: `raduno` | `giro` | `sociale`.
- `registration_status`: `going` | `waitlist` | `canceled`.
- `media_type`: `image` | `video`.

Tabelle (campi principali; tipi rifiniti in implementazione, coerenti con [ARCHITECTURE.md](../../ARCHITECTURE.md) §5):

- **`profiles`**: `id uuid PK → auth.users.id`, `name text`, `tag text unique`, `avatar_url text`,
  `role user_role default 'member'`, `bio text`, `town text`, `socials jsonb`, `created_at timestamptz default now()`.
- **`vehicles`**: `id uuid PK default gen_random_uuid()`, `owner_id uuid → profiles(id) on delete cascade`,
  `make text not null`, `model text not null`, `year int not null`, `image_url text not null`,
  `category text`, `description text`, `specs jsonb`, `created_at`.
- **`events`**: `id uuid PK`, `slug text unique not null`, `title text not null`, `description text`,
  `location text`, `coords jsonb`, `starts_at timestamptz`, `ends_at timestamptz`, `capacity int`,
  `status event_status default 'upcoming'`, `type event_type not null`, `map_url text`, `cover_url text`,
  `created_by uuid → profiles(id)`, `created_at`.
- **`event_registrations`**: `id uuid PK`, `event_id uuid → events on delete cascade`,
  `user_id uuid → profiles on delete cascade`, `status registration_status default 'going'`, `created_at`,
  **unique(event_id, user_id)**.
- **`event_vehicles`**: `id uuid PK`, `registration_id uuid → event_registrations on delete cascade`,
  `vehicle_id uuid → vehicles on delete cascade`, **unique(registration_id, vehicle_id)**.
- **`event_media`**: `id uuid PK`, `event_id uuid → events on delete cascade not null`,
  `uploader_id uuid → profiles`, `type media_type not null`, `url text not null`, `caption text`, `created_at`.

Indici: FK principali (`vehicles.owner_id`, `event_registrations.event_id/user_id`,
`event_media.event_id`), `events.slug`, `events.status`.

Trigger:
- `handle_new_user()` `after insert on auth.users` → `insert into profiles (id, name, tag)`
  usando `new.id`, `new.raw_user_meta_data->>'name'`, e un `tag` derivato (fallback: parte locale email + suffisso).

## 5. RLS (migrazione `0002_rls_policies.sql`)

`alter table ... enable row level security` su tutte. Helper:
```sql
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
```

Policy (sintesi; regole da [USER_ROLES.md](../../USER_ROLES.md) §4):

| Tabella | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | loggati (`auth.uid() is not null`) | via trigger/self | self (`id = auth.uid()`) o admin | admin |
| `vehicles` | loggati | self (`owner_id = auth.uid()`) | self | self o admin |
| `events` | **pubblico** (anche anon) | admin | admin | admin |
| `event_registrations` | self o admin | self (`user_id = auth.uid()`) | self o admin | self o admin |
| `event_vehicles` | self (della propria registrazione) o admin | self | — | self o admin |
| `event_media` | **pubblico** | admin | admin | admin |

> `role` in `profiles` non è auto-modificabile dal membro: la policy UPDATE self **non** consente
> il cambio di `role` (enforced con `with check` che confronta il `role` col valore esistente, o
> gestendo la promozione solo via admin/service role). Dettaglio risolto in implementazione.

Storage (`0003_storage_buckets.sql`): bucket `avatars`, `vehicles`, `event-covers`, `event-media`.
Policy: lettura pubblica per `event-covers`/`event-media`; lettura loggati per `avatars`/`vehicles`;
scrittura solo sul proprio path (`avatars/{uid}/...`, `vehicles/{uid}/...`) e admin per i bucket evento.

## 6. Flussi auth

### 6.1 Registrazione
Form (email, password, nome, tag opzionale) + **Turnstile**. Server Action:
1. verifica token Turnstile server-side (`lib/turnstile.ts`);
2. `supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: /auth/callback } })`;
3. mostra schermata "controlla la tua email". Account inattivo finché non conferma.

### 6.2 Conferma email
Link email → `/[locale]/auth/callback?code=...` → scambia il code → redirect a `/dashboard`.

### 6.3 Login
Form (email, password) + **Turnstile**. Server Action → `signInWithPassword`. Se l'utente ha **2FA
attiva**, Supabase richiede lo step MFA: si mostra il campo codice TOTP → `mfa.challenge`+`verify`.
Al successo → `/dashboard`.

### 6.4 Google OAuth
Bottone "Continua con Google" → `signInWithOAuth({ provider: 'google', redirectTo: /auth/callback })`
→ callback handler scambia il code → `/dashboard`.

### 6.5 Reset password
`/reset-password` (richiesta via email) + pagina di impostazione nuova password dopo il link.

### 6.6 2FA TOTP (in `/impostazioni`)
`TwoFactorSetup`: `mfa.enroll` (TOTP) → mostra **QR** + secret → utente inserisce codice → `mfa.verify`
→ factor attivo. Possibilità di **disattivare** (`mfa.unenroll`). Nessun costo email (TOTP app-based).

### 6.7 Logout
Server Action `signOut()` → redirect a `/`.

## 7. i18n
Nuove chiavi in `messages/it.json` sotto `auth`, `settings`, `dashboard`, `admin`
(label form, errori, messaggi email, testi 2FA). Nessuna stringa hardcoded.

## 8. Sicurezza & errori
- Errori auth mostrati con messaggi generici lato UI (no leak "email esiste/non esiste").
- Turnstile verificato **server-side** prima di ogni signUp/signIn.
- `getUser()` usa **`auth.getUser()`** (valida il token col server), non `getSession()`, nelle guardie.
- Service role key **solo server**, mai esposta; usata solo dove indispensabile (seed/admin ops).
- Rate limiting: si sfrutta quello nativo Supabase Auth.

## 9. Strategia di verifica (end-to-end reale)
1. `supabase start` (stack locale) → migrazioni applicate senza errori; tabelle/enum/policy presenti.
2. Registrazione → email di conferma (Inbucket locale) → conferma → login → `/dashboard` raggiungibile.
3. Accesso a `(admin)` da un membro → **redirect** (guardia). Da admin (seed) → pannello visibile.
4. RLS: query diretta come utente A ai veicoli di B → lettura ok se loggato, **update negato**.
5. 2FA: enroll in `/impostazioni` → logout → login richiede codice TOTP.
6. Google/Turnstile: verificati sul progetto **cloud** (config esterna) in un task dedicato.
7. `npm run build`, `npm run lint`, `npx tsc --noEmit` verdi.

## 10. Rischi e mitigazioni
- **Docker non avviato** → task esplicito di avvio Docker Desktop prima di `supabase start`.
- **Composizione proxy next-intl + Supabase** → seguire pattern ufficiale @supabase/ssr; test locale del refresh cookie.
- **Config Google/Turnstile** → richiede account esterni: isolata in task dedicati, non blocca lo sviluppo del resto.
- **RLS troppo restrittiva/permissiva** → test espliciti (punto §9.4) prima di chiudere 1A.

## 11. Esito atteso
Backend reale + auth completa e sicura; aree membro/admin protette; base pronta per costruire
Profilo/Garage (1B) ed Eventi/RSVP/Media (1C) sopra questo fondamento.
