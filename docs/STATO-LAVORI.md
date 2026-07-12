# STATO LAVORI — Punto di ripartenza

> **Questo è il file da consultare per riprendere.** Ultima modifica: **2026-07-12**.
> Quando riprendi, dimmi: *"vai in docs/STATO-LAVORI.md e controlla da cosa ripartire"*.
> Viene aggiornato ogni volta che ci fermiamo con gli sviluppi.

## 🔖 Dove siamo

- **Ultimo completato:** **Fase 1B-1 — Profilo** ✅ (8 task su 8). Collaudata; **da mergiare in `main`** (branch `feat/fase1b1-profilo`).
- **Prossimo:** **Fase 1B-2 — Garage** (non ancora iniziata).
- **Piano 1B-1:** [`superpowers/plans/2026-07-10-fase1b1-profilo.md`](./superpowers/plans/2026-07-10-fase1b1-profilo.md)
- **Design/spec 1B-1:** [`superpowers/specs/2026-07-10-fase1b1-profilo-design.md`](./superpowers/specs/2026-07-10-fase1b1-profilo-design.md)

## ✅ Esito Fase 1B-1 — Profilo (2026-07-12)

Rotte aggiunte (tutte sotto `(auth)`): **`/profilo`** (mio, modificabile + upload avatar), **`/membri`** (ricerca per nome/tag, `?q=`), **`/membri/[tag]`** (profilo altrui in sola lettura, con icone social e link "Torna ai membri"). **Avatar nell'header** accanto al menu, link a `/profilo`. Migrazioni nuove: **`0005`** (limiti 2 MB + MIME sul bucket `avatars`), **`0006`** (policy SELECT sullo storage, senza cui la pulizia degli avatar orfani non funzionava).

**Collaudo (tutto verde):** RLS profiles (un utente non modifica il profilo altrui né si promuove admin), storage negativo (cartella altrui / MIME non ammesso / file >2 MB tutti respinti HTTP 400), pulizia avatar (dopo 2 upload resta 1 solo file), escaping ricerca contro PostgREST reale (jolly `%`/`_` neutralizzati, filtro `.or()` non spezzabile), build/lint/tsc verdi. Review finale (opus): **pronto per il merge, 0 Critical**.

**5 bug/rifiniture emersi dal collaudo dal vivo, corretti (commit dedicati):**
1. `fix(profilo)` — **attributo `pattern` HTML ignorato**: il browser lo compila col flag `v`, dove il trattino in classe di caratteri va escapato (`[a-z0-9._\-]+`); senza escape la regex non compila e la spec impone di **ignorare l'attributo in silenzio**, quindi il tag accettava le maiuscole.
2. `fix(db)` — **policy SELECT mancante sul bucket `avatars`**: `storage.list()` tornava sempre `[]` e la pulizia dei file orfani non cancellava nulla (avatar vecchi accumulati nel bucket pubblico). Migrazione `0006`.
3. `feat(ui)` — **bordo rosso sui campi invalidi** (`user-invalid`): con 9 campi il solo submit disabilitato non diceva quale bloccava il salvataggio.
4. `fix(profilo)` — testo del tag riscritto: "minuscole, numeri…" si leggeva come elenco di caratteri ammessi, non come obbligo. Ora "deve essere tutto minuscolo".
5. `feat(membri)` — link "Torna ai membri" (Link vero, conserva `?q=`) su richiesta utente.

**Debito noto (follow-up, non bloccante):**
- Messaggi zod hardcoded in italiano + `locale:"it"` fisso in alcune redirect → da sistemare in Fase 3 (inglese).
- **Icone social marchi:** `lucide-react` v1 le ha rimosse; i path SVG sono vendorizzati da Simple Icons (CC0) in `src/components/ui/icons/SocialIcon.tsx`.

### 🔧 Follow-up tecnico: memoizzazione dell'autenticazione (candidato per una micro-fase)

**Problema.** Ogni chiamata a `getUser()` in `src/lib/auth/index.ts` fa una richiesta di rete a GoTrue (il servizio auth di Supabase) per validare il JWT — `@supabase/ssr` funziona così. Queste chiamate **non sono deduplicate** all'interno della stessa richiesta HTTP. Aprendo una singola pagina protetta si accumulano:
- `getProfile()` nel layout `[locale]/layout.tsx` (→ 1 getUser + 1 select su `profiles`)
- `requireUser()` nel layout `(auth)/layout.tsx` (→ 1 getUser + 1 chiamata MFA `getAuthenticatorAssuranceLevel`)
- `getProfile()` di nuovo nella pagina, es. `profilo/page.tsx` (→ 1 getUser + 1 select)

Totale per una pagina: **~3 getUser + 2 select profilo + 1 chiamata MFA**. In locale non si nota; in produzione è latenza inutile a ogni navigazione. Segnalato dalla review finale di fase 1B-1 come *Important, non bloccante*. È architettura **ereditata dalla Fase 1A**, non introdotta da 1B-1 — ma 1B-1 la amplifica (il secondo `getProfile` nella pagina duplica quello del layout).

**Fix (due opzioni, non esclusive).**
1. Avvolgere `getUser` e `getProfile` in `cache()` di React (`import { cache } from "react"`): dedup automatica per-richiesta, cambio centralizzato in un solo file (`src/lib/auth/index.ts`). È la strada consigliata, la meno invasiva. Verificare che `cache()` si comporti bene con `cookies()`/`headers()` di Next 16 (sono già request-scoped).
2. Far leggere il profilo **una volta sola** al layout e passarlo alle pagine come prop / via context, invece di rileggerlo in ogni pagina. Più lavoro, ma toglie anche le select duplicate.

**File da toccare:** `src/lib/auth/index.ts` (le tre funzioni). Nessuna migrazione.

**Come verificare che funzioni:** aggiungere temporaneamente un `console.count("getUser")` dentro `getUser`, caricare `/it/profilo`, e controllare nel log del dev server che il contatore scenda da ~3 a 1 per richiesta. Rimuovere il `console.count` prima del commit.

**Rischio:** basso. È un'ottimizzazione trasparente al comportamento: nessun cambiamento funzionale visibile, quindi il collaudo è solo "conta le chiamate" + `tsc`/`lint`/`build` verdi.

### 🔧 Follow-up tecnico: errori di lettura Supabase silenziati

**Problema.** In `membri/page.tsx` e `membri/[tag]/page.tsx` il risultato di Supabase viene destrutturato scartando `error` (`const { data } = await …`). Se la query fallisce (rete, RLS, DB giù), l'utente vede *"Nessun membro trovato"* o un 404, indistinguibile da un risultato realmente vuoto. È lo **stesso pattern preesistente** di `getProfile()` in `src/lib/auth/index.ts`, quindi coerente col resto del codebase, ma resta una lacuna.

**Fix minimo:** loggare l'`error` lato server con `console.error` (come già fa `setAvatar` in `profilo/actions.ts`), senza per forza cambiare la UI. **File:** `membri/page.tsx`, `membri/[tag]/page.tsx`. Rischio nullo.

## ▶️ DA COSA RIPARTIRE: Fase 1B-2 — Garage

Sotto-progetto successivo (vedi [ROADMAP.md](./ROADMAP.md) e [TODO.md](./TODO.md)):
- **Garage:** CRUD auto (marca/modello/anno/foto obbligatori; categoria/descrizione/specifiche opzionali) + upload foto; vista garage di un membro in sola lettura per gli altri loggati.
- **Spostare `/garage`** dal gruppo `(public)` a `(auth)` (i dati richiedono login; in 1B-1 non è stata toccata).
- **Riempire il segnaposto "Garage"** in `/membri/[tag]` (oggi mostra "In arrivo").

Prima di iniziare: brainstorming → spec → piano con checkbox (come per 1A e 1B-1).

## 🧪 Esito collaudo 1A (Task 13) — 2026-07-09

Collaudo e2e dal vivo (browser via Playwright + Mailpit + SQL). **Tutto verde:**
registrazione→conferma email→auto-login, login/logout, guardie, admin, 2FA (attivazione+enforcement AAL2+codice errato), RLS `vehicles`, reset password. Build/lint/tsc verdi.

**7 bug trovati e corretti durante il collaudo** (commit dedicati sul branch):
1. `fix(db)` — **GRANT di tabella mancanti** per i ruoli Supabase: ogni accesso dati via sessione utente falliva (`getProfile` null → admin inaccessibile, dashboard senza nome). Migrazione `0004_grants.sql`.
2. `fix(auth)` — allow-list redirect + host: `additional_redirect_urls` non ammetteva `/it/auth/callback` → niente auto-login dopo la conferma. Allineato `site_url` a `localhost` + glob `**`.
3. `fix(auth)` — **Turnstile** render esplicito (il widget non partiva: "preloaded but not used").
4. `fix(2fa)` — **config MFA TOTP disabilitata** (`enroll/verify_enabled=false`) + **QR** rotto con `next/image` (SVG data-URI) + errore UI non mostrato nello stato iniziale.

## 🎨 Rifiniture UI/UX post-1A — 2026-07-09 (su `main`, pushate)

Dopo la chiusura di 1A, migliorie all'interfaccia auth e alla navigazione (non nuove fasi):
- **Pagine auth a card**: login/registrati/reset avvolte in `AuthShell` (card centrata su sfondo "racing": griglia + alone rosso), campi/bottoni full-width.
- **Validazione live** (`ValidatedInput`): hint sotto email (formato) e password (min 8), spariscono quando validi.
- **Submit disabilitato** finché il form non è valido (validazione nativa) + stile disabled.
- **Vista successo**: dopo registrazione/reset resta solo il messaggio (form e footer nascosti).
- **Link "Clicca qui per accedere"** dopo l'aggiornamento password.
- **Fix menu hamburger**: reso fratello dell'header (era compresso dal `backdrop-filter`).
- **Navigazione da loggato**: `Dashboard`/`Impostazioni`/`Logout` nel menu (o `Accedi` da sloggato). `isAuthenticated` passato dal layout.

> **Avatar profilo accanto al menu**: ✅ **fatto in Fase 1B-1** (display nell'header + upload da `/profilo`).

## 🔧 Come rimettere in moto l'ambiente

Dalla root del progetto Next (`marsicaCarMeetFinal/marsicaCarMeetFinal/`):
1. Avvia **Docker Desktop** e attendi "running".
2. `npx supabase start` (dati nel volume Docker). Se serve pulito: `npx supabase db reset` (riapplica migrazioni 0001–0004 + seed).
3. `npm run dev` → **http://localhost:3000/it** (usa `localhost`, non `127.0.0.1`: l'HMR dev è legato a localhost e le email puntano lì).
4. Casella email locale = **Mailpit** su http://127.0.0.1:54324 (API: `/api/v1/messages`).
5. `.env.local` presente (gitignored); se manca vedi [`SETUP.md`](./SETUP.md).

Per promuovere un utente ad admin dopo la registrazione: rieseguire la `update` in `supabase/seed.sql` (il seed promuove solo se l'utente esiste già).

**Credenziali di test locali (volatili — si azzerano con `db reset`):** admin `mcdevelop03@gmail.com` / `Marsica2026!` (2FA disattivo). Da loggato, il **2FA** si attiva da **Impostazioni** (link nel menu/header, non serve più digitare l'URL).

## 📌 Decisioni e regole permanenti (non dimenticare)

- **Email:** MAI usare l'email dell'account (`aidev3@goproject.it`). Admin di seed = **`mcdevelop03@gmail.com`**. Chiedere sempre conferma prima di usare qualsiasi email.
- **Ritmo:** dopo ogni task completato (con review), **fermarsi e chiedere** se proseguire.
- **Stop = aggiornare questo file** col punto di ripartenza.
- **Next.js 16** (non 15): consultare `node_modules/next/dist/docs/` prima di toccare API Next; convenzione `proxy.ts` (non `middleware.ts`).
- **Solo token di tema** per i colori; stringhe UI via next-intl (IT).

## 🐞 Note aperte (non bloccanti)

- ✅ **Reset password con 2FA attivo — RISOLTO e collaudato (2026-07-09).** GoTrue esige AAL2 per cambiare password con MFA attivo: ora il link di recovery porta alla sfida MFA e, dopo la verifica, si torna alla pagina di reset (`/it/reset-password/aggiorna`, spostata fuori dal gruppo AAL2) per impostare la nuova password. Commit `fix(auth): reset password funzionante con 2FA attivo`.
- **Google OAuth / Turnstile reali + progetto Supabase cloud** da configurare (solo codice presente; guida in [`SETUP.md`](./SETUP.md) §6).
- Logo header troppo piccolo (feedback 2026-07-08).
- Messaggi di validazione zod hardcoded in italiano + prefisso `/it/` fisso in alcune redirect → sistemare con l'inglese (Fase 3).
- In dev l'app va usata su `localhost:3000` (su `127.0.0.1:3000` l'HMR e il caricamento di script esterni falliscono: artefatto solo-dev).
