# SETUP — Configurare Marsica Car Meet da zero su un nuovo dispositivo

> Documento vivo. Ultima modifica: **2026-08-04**. Guida generica passo-passo per portare a
> regime il progetto su **qualsiasi dispositivo** (Windows/macOS/Linux), da un clone pulito fino
> all'app funzionante. Se un domani chiedi "aiutami a configurare da zero questo progetto su
> questo dispositivo", si segue questo file.
>
> Per **il cloud e il deploy** vai alle sezioni **6** (Supabase) e **6-bis** (Netlify): sono
> state riscritte col percorso realmente seguito, trappole incluse.

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
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."   # chiave pubblica
NEXT_PUBLIC_TURNSTILE_SITE_KEY="..."  # Cloudflare Turnstile (anti-bot)
TURNSTILE_SECRET_KEY="..."            # Turnstile secret (solo server)
```

> **Turnstile in sviluppo:** puoi usare le *test key* Cloudflare che validano sempre —
> site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
> Le chiavi reali servono solo per il cloud/produzione.

⚠️ **`SUPABASE_SERVICE_ROLE_KEY` non serve.** Non è usata da nessuna parte in `src/` e **non va
configurata da nessuna parte**: bypassa tutte le RLS, cioè ogni protezione dei dati del sito.

⚠️ **Il nome della chiave pubblica non combacia col dashboard Supabase.** Sul cloud il
dashboard la chiama `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato nuovo `sb_publishable_...`,
non più il JWT `eyJ...`), ma il codice legge `NEXT_PUBLIC_SUPABASE_ANON_KEY`: il valore nuovo va
messo **sotto il nostro nome**. Sbagliarlo è un guasto **silenzioso** — il sito compila e si
apre, semplicemente non parla col database.

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

Utile anche a chi **ha** Docker: è il modo per provare l'interfaccia contro i dati veri.

1. Serve un **progetto Supabase cloud** già creato (vedi Sezione 6). Chiedi le chiavi a chi lo gestisce
   o prendile da: dashboard Supabase → **Project Settings → API**.
2. Metti in `.env.local` i valori **cloud**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://<REF>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<publishable key cloud>"
   ```
3. (Solo per chi applica le migrazioni al cloud) collega la CLI e applica lo schema:
   ```bash
   npx supabase link --project-ref <REF>
   npx supabase db push
   ```
   > Se il DB cloud è già allineato, salta questo passo: ti basta avviare l'app.

### 💡 Meglio ancora: puntare al cloud SENZA toccare `.env.local`

Se `.env.local` è già configurato per Docker e vuoi solo **provare una cosa** contro i dati
veri, non scambiare i file: passa le variabili **inline**. Next dà la precedenza a ciò che
trova nell'ambiente rispetto a `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<REF>.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="<publishable key>" \
npm run dev
```

Le chiavi Turnstile restano quelle **di test** di `.env.local`, che validano sempre: in locale
va bene. Nessun file da rimettere a posto dopo, quindi nessun rischio di deployare un bundle
che punta a `127.0.0.1`.

**È la ricetta che conviene usare per ogni modifica di interfaccia**: il 2026-08-03 ha
smascherato tre difetti che `tsc`, `lint`, 119 test e build dichiaravano a posto. Il ciclo di
prova dura secondi invece dei minuti di un deploy.

⚠️ **A fine prova spegni il dev server**, altrimenti resta appeso sulla 3000 e il tentativo
dopo parte sulla 3001 senza che te ne accorga:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }
```

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

> Riscritta il 2026-08-04 col percorso **realmente seguito** nella Fase 1E, trappole incluse.

Solo se il progetto cloud non esiste ancora:

1. https://supabase.com → **New project** (regione **EU**), scegli una password DB.
   - Impostazioni usate: Data API **ON**, "expose new tables" ON (ininfluente: la migrazione
     `0004` imposta gli stessi grant), **"automatic RLS" OFF** — la `0002` attiva le RLS
     esplicitamente tabella per tabella, così il cloud combacia col locale già collaudato.
   - **Non** collegare GitHub: sarebbe una seconda via di modifica dello schema.
2. **Project Settings → API**: copia `Project URL` e la chiave **pubblica**.
   ⚠️ Il dashboard la chiama `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; noi la mettiamo sotto
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Sezione 3). **La `service_role` non serve e non va copiata.**
3. **Project Settings → General**: copia il **Reference ID**.
4. Applica lo schema: `npx supabase link --project-ref <REF>` poi `npx supabase db push`.

   🚨 **`db push` NON applica `supabase/seed.sql`.** Sul cloud nessuno è admin: bisogna prima
   registrarsi dall'app e **poi** promuoversi eseguendo a mano la `update` del seed nell'SQL
   Editor.

   ⚠️ **L'SQL Editor risponde "Success. No rows returned" anche quando la `update` non ha
   toccato niente.** Non è una conferma: verifica sempre con una `select` esplicita.

5. **Authentication → URL Configuration — da fare PRIMA di registrare il primo account.**
   - **Site URL:** l'URL del sito (es. quello di staging)
   - **Redirect URLs:** quell'URL con `/**` **e** `http://localhost:3000/**`

   🚨 Il motivo: il link di conferma è costruito come `${origin}/it/auth/callback`, ma Supabase
   lo onora **solo se sta nella allow-list**; altrimenti ripiega **in silenzio** sul Site URL,
   che su un progetto nuovo è `localhost:3000`. Il link arriva rotto e **hai bruciato una delle
   2 email/ora**.

6. ⚠️ **Sul cloud le email `@example.com` non funzionano.** In locale le intercettava Mailpit;
   qui la conferma deve arrivare a una casella vera, e il limite è **2 email di auth all'ora**
   (servizio di posta condiviso di Supabase).

7. **Template email:** di serie sono in inglese. Le copie italiane di riferimento sono in
   [`supabase/email-templates/`](../supabase/email-templates/) e vanno **incollate a mano** in
   *Authentication → Emails*. ⚠️ **Vivono nel dashboard, nessuna migrazione le applica:** chi
   modifica una delle due parti deve allineare l'altra.

8. **Turnstile:** vedi il piano di Fase 1A. **Google OAuth:** non configurato — il bottone resta
   nascosto finché `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` non vale `"true"`.

---

## 6-bis. Deploy su Netlify

**L'hosting è Netlify.** 🚨 **Cloudflare Workers non è utilizzabile con questo progetto:**
`@opennextjs/cloudflare` rifiuta il middleware Node di Next 16 (`proxy.ts`), che i Workers non
possono eseguire. **Vercel è escluso** perché il piano gratuito vieta l'uso commerciale, e il
sito è per un cliente. Netlify permette esplicitamente l'uso commerciale sul piano gratuito.

**Il deploy è la build su CI: parte dal push del branch.** Non esiste un comando di deploy da
locale.

1. Collega il sito Netlify al repo GitHub e scegli il **branch di produzione** (dev'essere
   quello che contiene `netlify.toml`).
2. Metti le variabili nel dashboard Netlify: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
   **Mai** `SUPABASE_SERVICE_ROLE_KEY`.
3. `git push` sul branch di produzione. Atteso nel log: **"1 edge function deployed"** (è il
   middleware Node avvolto da Netlify).
4. **Visibilità:** Netlify pubblica come *Private* per default e tutte le rotte rispondono 401.
   Va messa su **Public** perché il sito sia raggiungibile senza un account nel team. (La
   protezione con password non è sul piano gratuito.)

🚨 **Le `NEXT_PUBLIC_*` sono incorporate nel bundle alla BUILD, non lette a runtime.**
Cambiarle nel dashboard **non basta: serve un nuovo deploy.** È un guasto muto — il sito
continua a funzionare col valore vecchio.

⚠️ **La build Netlify non gira in locale su una macchina Windows con il progetto dentro
OneDrive:** `netlify build --offline` fallisce nel bundling Deno dell'edge function. Su Linux
(la CI) passa. Non perderci tempo: si verifica pushando.

⚠️ **Al cambio di dominio vanno aggiornati tre posti oltre al DNS**, e dimenticarne uno rompe
qualcosa in silenzio: gli **URL di redirect Supabase**, l'**hostname del widget Turnstile**, e
l'**URL assoluto del logo** nei template email (nei file **e** nel dashboard).

---

## 7. Risoluzione problemi

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| `npx supabase start` si blocca/fallisce | Docker non avviato | Avvia Docker Desktop, attendi "running", riprova |
| App parte ma niente auth/dati | `.env.local` mancante o chiavi errate | Ricontrolla i valori (Sezione 3/4) |
| Porte 54321-54324 occupate | Un altro stack Supabase attivo | `npx supabase stop` nel progetto che lo teneva su |
| Email di conferma non arrivano (locale) | Cerchi nella posta vera | In locale le email sono su Inbucket http://127.0.0.1:54324 |
| Migrazioni non applicate | Non hai eseguito il reset/push | `npx supabase db reset` (locale) o `db push` (cloud) |
| Sito online, ma non parla col database | chiave pubblica sotto il nome sbagliato (`..._PUBLISHABLE_KEY` invece di `..._ANON_KEY`) | Rinominala e **rifai il deploy** (Sezione 3 e 6-bis) |
| Cambio una `NEXT_PUBLIC_*` e non succede niente | è inlinata alla build | Rifai il deploy: salvarla non ricompila (Sezione 6-bis) |
| Il widget Turnstile non appare online | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` assente alla build, o hostname non registrato sul widget | Aggiungi la variabile / l'hostname, poi **redeploy** |
| Link di conferma email che porta a `localhost` | l'URL non è nella allow-list Supabase | *Authentication → URL Configuration* (Sezione 6, punto 5) |
| Il sito cloud risponde ma è "morto" da giorni | progetto Supabase free **in pausa** dopo 7 giorni di inattività | Riattivalo dal dashboard (~1 minuto) |
| `npm run build` fa 404/500 sulle pagine con form | l'hai lanciata mentre girava `next dev`: `.next` è corrotto | Killa il dev server, `rm -rf .next`, riavvia |

---

## 8. Checklist rapida "da zero a funzionante"

- [ ] Node ≥ 20, Git installati (`node -v`, `git --version`)
- [ ] *(modalità A)* Docker Desktop installato e avviato
- [ ] `git clone` + `cd` nella root annidata del progetto
- [ ] `npm install`
- [ ] `.env.local` creato con le chiavi (locali **o** cloud)
- [ ] *(modalità A)* `npx supabase start` + `npx supabase db reset`
- [ ] `npm run dev` → http://localhost:3000/it risponde
