# SETUP — Configurare Marsica Car Meet da zero su un nuovo dispositivo

> Documento vivo. Guida generica passo-passo per portare a regime il progetto su **qualsiasi
> dispositivo** (Windows/macOS/Linux), da un clone pulito fino all'app funzionante.
> Se un domani chiedi "aiutami a configurare da zero questo progetto su questo dispositivo",
> si segue questo file.

## 0. Riepilogo in breve

Il progetto è un'app **Next.js 16 + Supabase**. Per lavorare servono:
- **Node.js ≥ 20** e **npm** — sempre.
- **Git** — per clonare il repo.
- **Docker Desktop** — solo se vuoi lo **stack Supabase locale** (sviluppo offline).
  In alternativa puoi lavorare puntando al **progetto Supabase cloud**, senza Docker.
- Un file **`.env.local`** con le chiavi (NON è nel repo: va creato su ogni dispositivo).

Due modalità di lavoro (scegline una):
- **A — Locale (con Docker):** DB/Auth/Storage girano sul tuo PC. Consigliata per sviluppare.
- **B — Cloud (senza Docker):** ti colleghi al progetto Supabase online. Utile su dispositivi senza Docker.

---

## 1. Prerequisiti (installazione una tantum)

| Software | Come verificarlo | Dove prenderlo |
|---|---|---|
| Node.js ≥ 20 | `node -v` | https://nodejs.org (LTS) |
| npm | `npm -v` | incluso con Node |
| Git | `git --version` | https://git-scm.com |
| Docker Desktop *(solo modalità A)* | `docker --version` poi `docker info` | https://www.docker.com/products/docker-desktop |

> La **Supabase CLI NON va installata a parte**: è una dev-dependency del progetto e si usa via `npx supabase ...`.

---

## 2. Clonare il progetto e installare le dipendenze

```bash
git clone <URL_DEL_REPO>
cd marsicaCarMeetFinal/marsicaCarMeetFinal   # NB: la root del progetto Next è nella cartella annidata
npm install
```
`npm install` scarica anche la Supabase CLI (dev-dependency).

---

## 3. Creare il file `.env.local`

Copia il modello e riempilo (il file è gitignored: non verrà mai committato).

```bash
cp .env.local.example .env.local
```

Quali valori mettere dipende dalla modalità scelta (Sezione 4A o 4B). Le variabili sono:

```bash
NEXT_PUBLIC_SUPABASE_URL="..."        # URL del backend Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."   # chiave pubblica (anon)
SUPABASE_SERVICE_ROLE_KEY="..."       # chiave privata SOLO server (mai esporre)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="..."  # Cloudflare Turnstile (anti-bot)
TURNSTILE_SECRET_KEY="..."            # Turnstile secret (solo server)
```

> **Turnstile in sviluppo:** puoi usare le *test key* Cloudflare che validano sempre —
> site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
> Le chiavi reali servono solo per il cloud/produzione.

---

## 4A. Modalità LOCALE (con Docker)

1. **Avvia Docker Desktop** e attendi che il motore sia "running" (`docker info` deve rispondere).
2. Avvia lo stack Supabase locale (la **prima volta** scarica alcune immagini, alcuni minuti):
   ```bash
   npx supabase start
   ```
   Al termine stampa un blocco con `API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `STUDIO_URL`, ecc.
   > Se ti serve rivederlo: `npx supabase status`.
3. Metti in `.env.local` i valori **locali**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<ANON_KEY dallo start>"
   SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY dallo start>"
   ```
   > Le chiavi locali sono **standard** (uguali per tutti, non sono segreti reali).
4. Applica lo schema del database (migrazioni versionate nel repo) + seed:
   ```bash
   npx supabase db reset
   ```
   Ricrea il DB locale applicando `supabase/migrations/*.sql` e `supabase/seed.sql`.
5. Interfacce grafiche locali:
   - **Supabase Studio** (tabelle, SQL, utenti): http://127.0.0.1:54323
   - **Inbucket/Mailpit** (email di test: conferme/reset): http://127.0.0.1:54324
6. Per fermare lo stack a fine giornata: `npx supabase stop` (i dati restano; `--no-backup` per azzerarli).

---

## 4B. Modalità CLOUD (senza Docker)

Utile su dispositivi dove non vuoi/puoi installare Docker.

1. Serve un **progetto Supabase cloud** già creato (vedi Sezione 6). Chiedi le chiavi a chi lo gestisce
   o prendile da: dashboard Supabase → **Project Settings → API**.
2. Metti in `.env.local` i valori **cloud**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://<REF>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key cloud>"
   SUPABASE_SERVICE_ROLE_KEY="<service_role key cloud>"
   ```
3. (Solo per chi applica le migrazioni al cloud) collega la CLI e applica lo schema:
   ```bash
   npx supabase link --project-ref <REF>
   npx supabase db push
   ```
   > Se il DB cloud è già allineato, salta questo passo: ti basta avviare l'app.

---

## 5. Avviare l'applicazione

```bash
npm run dev
```
Apri **http://localhost:3000** → reindirizza a `/it`.

Comandi utili:
```bash
npm run build       # build di produzione
npm run lint        # lint
npx tsc --noEmit    # type-check
```

---

## 6. Creare un nuovo progetto Supabase cloud (una tantum, per il team)

Solo se il progetto cloud non esiste ancora:
1. https://supabase.com → **New project** (regione EU, es. Frankfurt), scegli una password DB.
2. **Project Settings → API**: copia `Project URL`, `anon key`, `service_role key`.
3. **Project Settings → General**: copia il **Reference ID**.
4. Dalla cartella del progetto: `npx supabase link --project-ref <REF>` poi `npx supabase db push`.
5. **Auth providers** (Google) e **Turnstile**: vedi il piano di Fase 1A per la configurazione guidata.

---

## 7. Risoluzione problemi

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| `npx supabase start` si blocca/fallisce | Docker non avviato | Avvia Docker Desktop, attendi "running", riprova |
| App parte ma niente auth/dati | `.env.local` mancante o chiavi errate | Ricontrolla i valori (Sezione 3/4) |
| Porte 54321-54324 occupate | Un altro stack Supabase attivo | `npx supabase stop` nel progetto che lo teneva su |
| Email di conferma non arrivano (locale) | Cerchi nella posta vera | In locale le email sono su Inbucket http://127.0.0.1:54324 |
| Migrazioni non applicate | Non hai eseguito il reset/push | `npx supabase db reset` (locale) o `db push` (cloud) |

---

## 8. Checklist rapida "da zero a funzionante"

- [ ] Node ≥ 20, Git installati (`node -v`, `git --version`)
- [ ] *(modalità A)* Docker Desktop installato e avviato
- [ ] `git clone` + `cd` nella root annidata del progetto
- [ ] `npm install`
- [ ] `.env.local` creato con le chiavi (locali **o** cloud)
- [ ] *(modalità A)* `npx supabase start` + `npx supabase db reset`
- [ ] `npm run dev` → http://localhost:3000/it risponde
