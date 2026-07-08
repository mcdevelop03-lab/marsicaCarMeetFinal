# STATO LAVORI — Punto di ripartenza

> **Questo è il file da consultare per riprendere.** Ultima modifica: **2026-07-08**.
> Quando riprendi, dimmi: *"vai in docs/STATO-LAVORI.md e controlla da cosa ripartire"*.
> Viene aggiornato ogni volta che ci fermiamo con gli sviluppi.

## 🔖 Dove siamo

- **Fase in corso:** Fase 1A — *Backend + Auth* (primo sotto-progetto della Fase 1 MVP).
- **Branch git:** `feat/fase1a-backend-auth` (NON ancora integrato in `main`).
- **Avanzamento:** **12 task su 13 completati.** Manca solo il **Task 13**.
- **Piano completo:** [`superpowers/plans/2026-07-08-fase1a-backend-auth.md`](./superpowers/plans/2026-07-08-fase1a-backend-auth.md)
- **Design/spec:** [`superpowers/specs/2026-07-08-fase1a-backend-auth-design.md`](./superpowers/specs/2026-07-08-fase1a-backend-auth-design.md)
- **Ledger tecnico task-by-task:** `.superpowers/sdd/progress.md` (nella root del progetto Next; non versionato).

## ▶️ DA COSA RIPARTIRE: Task 13 — Verifica finale + collaudo e2e + chiusura

È un task **interattivo** (serve la tua presenza per cliccare nel browser). Comprende:
1. **Riavviare l'ambiente** (vedi sotto "Come rimettere in moto").
2. **Collaudo end-to-end nel browser** (finora tutto è compilato/buildato ma NON ancora provato dal vivo):
   - Registrazione → email di conferma su Inbucket (http://127.0.0.1:54324) → conferma → `/it/dashboard`.
   - Login email/password → dashboard; Logout → home.
   - `/it/dashboard` e `/it/admin` da NON loggato → redirect a `/it/login`.
   - Promuovi il tuo profilo ad admin (il seed promuove `mcdevelop03@gmail.com`; oppure via Studio SQL) → `/it/admin` accessibile.
   - **2FA:** attiva in `/it/impostazioni` (scansiona QR) → logout → al login successivo chiede il codice; codice errato NON entra.
   - **RLS:** da Studio, come utente non proprietario, UPDATE su `vehicles` altrui deve essere negato.
   - **Reset password:** richiesta → email Inbucket → nuova password.
3. **Aggiornare docs** (ROADMAP/TODO: marcare 1A completata).
4. **Chiudere il branch** con la skill *finishing-a-development-branch* (merge in `main` o come preferisci).

> Nota: **Google OAuth e Turnstile reali** (Task 10) e il **progetto Supabase cloud** sono stati **rimandati**: in locale l'auth email/password usa le test-key. Vanno configurati quando creiamo il progetto cloud (guida in [`SETUP.md`](./SETUP.md) §6 e nel piano Task 10).

## 🔧 Come rimettere in moto l'ambiente (all'inizio della prossima sessione)

Dalla root del progetto Next (`marsicaCarMeetFinal/marsicaCarMeetFinal/`):
1. Avvia **Docker Desktop** e attendi che sia "running".
2. `npx supabase start` — riavvia lo stack locale (i dati sono salvati nel volume Docker: utenti/tabelle ci sono ancora). Se qualcosa non torna: `npx supabase db reset` riapplica migrazioni + seed.
3. `npm run dev` → http://localhost:3000/it
4. `.env.local` è già presente (gitignored) con le chiavi locali; se manca, vedi [`SETUP.md`](./SETUP.md).

## ✅ Cosa è già fatto in 1A (Task 1–12)

1. Setup Supabase (CLI, stack locale) — *cloud rimandato*.
2. Schema DB (6 tabelle, enum, trigger crea-profilo) — `supabase/migrations/0001`.
3. RLS + `is_admin()` — `0002`.
4. Bucket Storage + seed primo admin (`mcdevelop03@gmail.com`) — `0003` + `seed.sql`.
5. Client Supabase + helper auth (`getUser/requireUser/requireAdmin`) + refresh sessione nel `proxy.ts`.
6. Route groups `(public)/(auth)/(admin)` + guardie server-side.
7. Turnstile + validazione zod + shell UI dei form auth.
8. Registrazione + conferma email + callback OAuth/email.
9. Login/logout + sfida 2FA condizionale.
10. Login con Google (solo codice; config esterna rimandata).
11. Reset password (richiesta + nuova password).
12. Attivazione 2FA TOTP in `/impostazioni` + **hardening enforcement AAL2** nelle guardie.

## 📌 Decisioni e regole permanenti (non dimenticare)

- **Email:** MAI usare l'email dell'account (`aidev3@goproject.it`). Admin di seed = **`mcdevelop03@gmail.com`**. Chiedere sempre conferma prima di usare qualsiasi email.
- **Ritmo:** dopo ogni task completato (con review), **fermarsi e chiedere** se proseguire col successivo.
- **Stop = aggiornare questo file:** ogni volta che ci si ferma, aggiornare `docs/STATO-LAVORI.md` col punto di ripartenza.
- **Next.js 16** (non 15): consultare `node_modules/next/dist/docs/` prima di scrivere codice che tocca API Next; rispettare le deprecazioni. Convenzione `proxy.ts` (non `middleware.ts`).
- **Solo token di tema** per i colori; tutte le stringhe UI via next-intl (IT).

## 🧭 Roadmap dei prossimi sotto-progetti (dopo 1A)

- **1B** — Profilo (view/edit, avatar) + Garage (CRUD auto + foto).
- **1C** — Eventi (lista/dettaglio, admin CRUD) + RSVP + album media.
- **1D** — GDPR (cookie banner + pagine privacy/cookie) + rifinitura guardie.

## 🐞 Note minori aperte (da rivedere più avanti, non bloccanti)

- Logo header troppo piccolo (feedback 2026-07-08).
- Messaggi di validazione zod hardcoded in italiano + prefisso `/it/` fisso in alcune redirect → sistemare quando si aggiunge l'inglese (Fase 3).
- Google OAuth / Turnstile reali + progetto Supabase cloud da configurare.
