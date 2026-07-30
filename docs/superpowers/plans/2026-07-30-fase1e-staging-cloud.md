# Fase 1E — Staging cloud — Piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** portare l'MVP già completo su uno staging cloud privato e raggiungibile
(`https://<nome>.<account>.workers.dev`), con Supabase cloud EU, Turnstile reale, `noindex` e
contenuti demo, così che il cliente possa provarlo da sé.

**Architecture:** Cloudflare Workers serve Next 16 tramite l'adapter
`@opennextjs/cloudflare` (runtime `nodejs_compat`, **nessun** bucket R2/KV perché ogni pagina
è dinamica); il backend è un progetto Supabase cloud in regione EU con le migrazioni
`0001`–`0010`. Deploy lanciato da locale con `wrangler`, non da CI. Approccio incrementale:
prima l'app **locale** contro il Supabase **cloud** (isola i guasti di configurazione DB),
poi il deploy (isola i guasti dell'adapter).

**Tech Stack:** Next.js 16.2.10, React 19.2.4, next-intl 4, Supabase (`@supabase/ssr`),
TailwindCSS 4, vitest 4, `@opennextjs/cloudflare`, `wrangler`.

**Spec:** [`../specs/2026-07-30-fase1e-staging-cloud-design.md`](../specs/2026-07-30-fase1e-staging-cloud-design.md)

**Branch:** `feat/fase1e-staging-cloud` (già creato, contiene il commit `260936f` della spec).

## Global Constraints

- **Next.js 16, non 15.** Prima di toccare qualunque API Next, leggere la guida in
  `node_modules/next/dist/docs/`. Convenzione `proxy.ts`, **non** `middleware.ts`.
- **Un commit per task**, messaggio in italiano, prefisso convenzionale (`chore(1e):`,
  `feat(1e):`, `docs(1e):`).
- **Dopo ogni task: fermarsi e chiedere all'utente** se proseguire.
- **Mai usare l'email dell'account** (`aidev3@goproject.it`). Admin di progetto:
  `mcdevelop03@gmail.com`. **Chiedere sempre conferma prima di usare qualsiasi email.**
- **Solo token di tema** per i colori; ogni stringa UI passa da next-intl (`src/messages/it.json`).
- **Non lanciare `npm run build` mentre gira `next dev`**: corrompe `.next` e manda in 404 le
  pagine con server action. Rimedio: killare il dev server, `rm -rf .next`, riavviare.
- **Verifiche standard a ogni task che tocca codice:** `npm test` (115 test), `npx tsc --noEmit`,
  `npm run lint`. Tutti verdi prima del commit.
- **`SUPABASE_SERVICE_ROLE_KEY` non va configurata da nessuna parte.** Non è usata in `src/`.
- **La conferma email resta ATTIVA** (spec D-5). Non disattivare "Confirm email" su Supabase
  per accorciare il collaudo: significherebbe non collaudare il flusso vero, e dimenticarsi
  di riattivarla sarebbe un buco di sicurezza. Il limite di 2 email/ora si aggira aspettando.
- **Wrangler ≥ 3.99.0.**

## Ordine dei task e scostamento dalla spec

La spec §6 elencava il `noindex` + gate Google **dopo** il deploy. Qui sono **prima**
(Task 5, deploy al Task 6) per due motivi: il primo deploy include già `noindex`, quindi non
esiste una finestra in cui i crawler possono indicizzare lo staging; e si evita un deploy in
più. Nessun'altra deviazione dalla spec.

## File Structure

| File | Responsabilità | Task |
|---|---|---|
| `wrangler.jsonc` | **crea** — configurazione del Worker: entry, flag di compatibilità, binding assets/self-reference/images | 0 |
| `open-next.config.ts` | **crea** — configurazione dell'adapter, una riga, nessuna cache override | 0 |
| `next.config.ts` | **modifica** — aggiunge `initOpenNextCloudflareForDev()` per la preview locale | 0 |
| `package.json` | **modifica** — dipendenze adapter/wrangler + script `preview`/`deploy`/`cf-typegen` | 0 |
| `.gitignore` | **modifica** — `.open-next`, `.dev.vars`, `cloudflare-env.d.ts` | 0 |
| `.dev.vars` | **crea, non tracciato** — `NEXTJS_ENV=development` per la preview locale | 0 |
| `.env.local.example` | **modifica** — documenta `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` e annota che la service role key non serve all'app | 5 |
| `src/lib/auth/provider.ts` | **crea** — un'unica funzione pura `googleAuthAbilitato()`, testabile | 5 |
| `src/lib/auth/provider.test.ts` | **crea** — test della funzione pura | 5 |
| `src/app/[locale]/(public)/login/page.tsx` | **modifica** — riga 44: bottone Google dietro il gate | 5 |
| `src/app/[locale]/(public)/registrati/page.tsx` | **modifica** — riga 21: idem | 5 |
| `src/app/robots.ts` | **crea** — `disallow: "/"` per tutta la superficie dello staging | 5 |
| `docs/SETUP.md` | **modifica** — §6 riscritta col percorso reale + swap `.env.local` locale/cloud + deploy | 8 |
| `docs/STATO-LAVORI.md` | **modifica** — punto di ripartenza post-1E | 8 |
| `docs/ROADMAP.md` | **modifica** — caselle 1C/1D (oggi vuote pur essendo fatte) + riga Fase 1E | 8 |

**Nessun file esistente cambia per l'adapter** oltre a `next.config.ts`. In particolare
`src/proxy.ts` è già compatibile (solo next-intl + refresh sessione, nessuna API Node) e
**non va toccato**.

---

## ⛔ Punto da confermare con l'utente PRIMA del Task 3

Sul cloud le email di conferma vanno a caselle **reali**: in locale le intercettava Mailpit,
quindi `membro.test@example.com` funzionava. Sul cloud **non funziona più**.

Servono due indirizzi raggiungibili. Proposta, che **non crea nessun account nuovo**:

- admin → `mcdevelop03@gmail.com` (già l'admin di progetto, già in `supabase/seed.sql`)
- membro → `mcdevelop03+membro@gmail.com` (alias Gmail col `+`: arriva nella stessa inbox)

**Questo va confermato dall'utente prima di iniziare il Task 3** (policy: chiedere sempre
conferma prima di usare qualsiasi email). Se rifiutata, l'utente indica due indirizzi
alternativi e il piano prosegue identico sostituendoli.

---

## Task 0: Spike dell'adapter OpenNext — nessun account, nessun costo

**Perché è il primo:** è l'unica incognita tecnica reale della fase. Se fallisce, tutto il
resto del piano cambia (piano B: Vercel) e l'utente non deve aver aperto neanche un account.

**Files:**
- Create: `wrangler.jsonc`
- Create: `open-next.config.ts`
- Create: `.dev.vars` (non tracciato)
- Modify: `next.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: niente (primo task)
- Produces: gli script npm `preview` e `deploy`, usati dal Task 6. Il nome del Worker
  scelto qui (`marsica-car-meet`) determina l'URL `workers.dev` e va riusato **identico**
  nel binding `WORKER_SELF_REFERENCE` e nei Task 4 e 6.

**Prerequisito d'ambiente:** Docker Desktop avviato e `npx supabase start` attivo (lo spike
punta ancora al Supabase **locale**), `.env.local` presente con le chiavi locali.

- [ ] **Step 1: Installare adapter e wrangler**

```bash
npm install @opennextjs/cloudflare@latest
npm install --save-dev wrangler@latest
```

- [ ] **Step 2: Verificare la versione di wrangler (minimo 3.99.0)**

```bash
npx wrangler --version
```

Atteso: una versione ≥ 3.99.0. Se inferiore, l'installazione non ha preso `@latest`: ripetere
lo Step 1.

- [ ] **Step 3: Creare `wrangler.jsonc`**

Nella root del progetto Next (`marsicaCarMeetFinal/marsicaCarMeetFinal/`).

Nota sui campi: `r2_buckets` è **volutamente assente** (decisione D-2 della spec: nessuna
cache incrementale, ogni pagina è dinamica). Il binding `images` è quello del template
ufficiale e serve a `next/image`, usato dal logo in `Header.tsx` e `MobileMenu.tsx`.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "marsica-car-meet",
  "compatibility_date": "2026-07-30",
  "compatibility_flags": [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "marsica-car-meet"
    }
  ],
  "images": {
    "binding": "IMAGES"
  }
}
```

- [ ] **Step 4: Creare `open-next.config.ts`**

Una riga, senza override della cache incrementale (niente R2).

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

- [ ] **Step 5: Aggiungere `initOpenNextCloudflareForDev()` a `next.config.ts`**

Va **in fondo** al file. Serve a far vedere i binding Cloudflare a `next dev`.

Contenuto finale completo del file:

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);

initOpenNextCloudflareForDev();
```

- [ ] **Step 6: Creare `.dev.vars`** (non tracciato)

```
NEXTJS_ENV=development
```

- [ ] **Step 7: Aggiornare `.gitignore`**

`.env*` **non** copre `.dev.vars`. Aggiungere in fondo al file:

```
# cloudflare / opennext
/.open-next/
.dev.vars
cloudflare-env.d.ts
```

- [ ] **Step 8: Aggiungere gli script a `package.json`**

Il blocco `scripts` diventa:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  },
```

- [ ] **Step 9: Verificare che tsc e lint restino verdi**

```bash
npx tsc --noEmit
npm run lint
npm test
```

Atteso: tutti e tre verdi, 115 test passati. `next.config.ts` è l'unico file di codice
toccato: se `tsc` protesta, l'import di `initOpenNextCloudflareForDev` è il sospetto.

- [ ] **Step 10: 🚦 IL CANCELLO — build dell'adapter**

⚠️ **Killare prima il dev server** (`next dev`): vedi Global Constraints.

```bash
rm -rf .next .open-next
npx opennextjs-cloudflare build
```

Atteso: build completa senza errori, e la cartella `.open-next/` contiene `worker.js` e
`assets/`.

**Se questo step fallisce:** NON proseguire col resto del piano. Raccogliere l'errore
completo, fermarsi e riferire all'utente. È lo scenario di rischio #1 della spec §8 → si
rivaluta l'hosting (piano B: Vercel).

- [ ] **Step 11: Preview locale — la home**

```bash
npx opennextjs-cloudflare preview
```

Aprire l'URL stampato (tipicamente `http://localhost:8788`) su `/it`.

Atteso: la home si carica, il logo è visibile, l'header mostra la navigazione. Il Supabase
puntato è ancora quello **locale in Docker**.

- [ ] **Step 12: Preview locale — una pagina con server action**

Questo è il vero criterio di uscita: le server action sono il meccanismo su cui poggia ogni
form del sito.

Sulla preview aprire `/it/login` e verificare **entrambe** le cose:
1. la pagina renderizza il form (quindi il render del server component funziona);
2. inviare il form con credenziali **volutamente sbagliate** (es. `nessuno@esempio.it` /
   `sbagliata`) e verificare che compaia il messaggio d'errore dell'app.

Atteso: appare il messaggio d'errore dell'applicazione. Un **404** o un **500** al submit
significa che le server action non passano dall'adapter → trattarlo come fallimento dello
Step 10 (fermarsi e riferire).

Nota: il widget Turnstile probabilmente **non** apparirà se `.env.local` non ha una site key
— è atteso e non è un fallimento dello spike. L'errore mostrato potrebbe essere
"Verifica anti-bot non superata" invece di "credenziali errate": va bene, dimostra comunque
che la server action è stata eseguita e ha risposto.

- [ ] **Step 13: Commit**

```bash
git add wrangler.jsonc open-next.config.ts next.config.ts package.json package-lock.json .gitignore
git commit -m "chore(1e): adapter @opennextjs/cloudflare + config Worker (spike verde)"
```

**Criterio di uscita del task:** `opennextjs-cloudflare build` completa **e** la preview
locale serve la home **e** esegue una server action rispondendo con un messaggio
dell'applicazione.

---

## Task 1: Mettere al sicuro `main` su origin

**Perché:** oggi 42 commit — tutta la Fase 1 — esistono su un solo disco. Costo zero,
rischio eliminato. Non è un prerequisito tecnico del deploy (D-3: si deploya con `wrangler`
da locale), è messa in sicurezza.

**Files:** nessuno.

**Interfaces:**
- Consumes: niente
- Produces: niente (nessun task successivo dipende da questo)

- [ ] **Step 1: Confermare quanti commit sono a rischio**

```bash
git rev-list --count origin/main..main
```

Atteso: `42` (o più, se nel frattempo sono stati fatti commit su `main`).

- [ ] **Step 2: Verificare che `main` non abbia modifiche non committate**

```bash
git status --short
```

Atteso: output vuoto (siamo su `feat/fase1e-staging-cloud`, l'albero deve essere pulito
dopo il Task 0).

- [ ] **Step 3: Push di `main`**

Si può fare dal branch corrente senza cambiare branch.

```bash
git push origin main
```

Se il push chiede credenziali: il remote è
`https://mcdevelop03-lab@github.com/mcdevelop03-lab/marsicaCarMeetFinal.git`, serve un
Personal Access Token GitHub come password. **Azione manuale dell'utente.**

- [ ] **Step 4: Verificare**

```bash
git rev-list --count origin/main..main
```

Atteso: `0`.

**Criterio di uscita:** `origin/main` e `main` puntano allo stesso commit.

---

## Task 2: Progetto Supabase cloud + migrazioni `0001`–`0010`

**Files:** nessun file del repo cambia. Tutto avviene sul dashboard Supabase e via CLI.

**Interfaces:**
- Consumes: niente
- Produces: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` del cloud, usate dai
  Task 3 e 6.

### Runbook manuale (utente, nel browser)

- [ ] **Step 1: Creare l'account e il progetto Supabase**

1. Andare su https://supabase.com e registrarsi (o accedere).
2. **New project**.
3. **Region: EU — Frankfurt (eu-central-1).** Non una region USA: il sito è italiano e la
   privacy policy dichiara il trattamento dati.
4. Scegliere una **password del database** e **salvarla in un gestore di password**: serve
   per `db push` e non è recuperabile in chiaro dopo.
5. Attendere il provisioning (qualche minuto).

- [ ] **Step 2: Raccogliere le chiavi**

Dal dashboard del progetto:
- **Project Settings → API** → copiare `Project URL` e la chiave **`anon` / public**.
- **Project Settings → General** → copiare il **Reference ID**.

⚠️ **NON copiare la `service_role` key.** Non serve all'app (verificato: non è usata in
`src/`) e bypassa tutte le RLS.

### Applicazione delle migrazioni (CLI)

- [ ] **Step 3: Collegare il progetto locale a quello cloud**

Dalla root del progetto Next:

```bash
npx supabase link --project-ref <REFERENCE_ID>
```

Chiederà la password del database salvata allo Step 1.

- [ ] **Step 4: Vedere cosa verrebbe applicato, prima di applicarlo**

```bash
npx supabase migration list
```

Atteso: le 10 migrazioni (`0001_init_schema` … `0010_event_media`) presenti in locale e
**assenti** sul remoto.

- [ ] **Step 5: Applicare le migrazioni al cloud**

```bash
npx supabase db push
```

- [ ] **Step 6: Verificare che tutte e 10 siano applicate**

```bash
npx supabase migration list
```

Atteso: tutte e 10 marcate come applicate **sia** in locale **sia** sul remoto.

- [ ] **Step 7: Verificare che le RLS siano davvero arrivate**

Nel dashboard Supabase → **SQL Editor**, eseguire:

```sql
select schemaname, tablename, policyname
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

Confrontare l'elenco con quello del locale (stesso comando su
`psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"`).

Atteso: **gli stessi nomi di policy**, senza mancanze. Se qualcosa manca, `db push` è andato
a metà: fermarsi e riferire.

- [ ] **Step 8: Verificare i limiti dei bucket**

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
```

Atteso: i bucket `avatars`, `vehicles`, `event-covers`, `event-media` con
`file_size_limit` = `2097152` (2 MB) e `allowed_mime_types` valorizzato con i soli tipi
immagine. Se `file_size_limit` è `null`, le migrazioni `0005`/`0007`/`0008`/`0010` non hanno
fatto effetto: fermarsi e riferire.

**Criterio di uscita:** 10 migrazioni applicate sul remoto, `pg_policies` combacia col
locale, limiti dei bucket valorizzati.

**Nota da ricordare:** `db push` **non applica `supabase/seed.sql`**. La promozione ad admin
si fa a mano nel Task 3.

---

## Task 3: App locale contro Supabase cloud — collaudo del blocco DB/auth

**Perché separato dal deploy:** qui il frontend è noto buono (girato in locale per tutta la
Fase 1). Quindi **ogni** guasto che emerge è per forza configurazione cloud. Dopo il deploy,
ogni nuovo guasto sarà per forza l'adapter. Bisezione pulita (D-7).

⛔ **Prima di iniziare: far confermare all'utente gli indirizzi email** (vedi il blocco
"Punto da confermare" più sopra). Il resto del task li assume come:
- admin → `mcdevelop03@gmail.com`
- membro → `mcdevelop03+membro@gmail.com`

**Files:** solo `.env.local` (non tracciato) e due file di appoggio non tracciati.

**Interfaces:**
- Consumes: URL e anon key del cloud (Task 2)
- Produces: un utente admin promosso e un utente membro sul cloud, riusati dai Task 4, 7, 8

- [ ] **Step 1: Salvare la configurazione Docker prima di sovrascriverla**

```bash
cp .env.local .env.local.docker
```

`.env.local.docker` è coperto da `.env*` in `.gitignore`, quindi non finisce in git.

- [ ] **Step 2: Scrivere `.env.local` con le chiavi cloud**

Sostituire i due valori Supabase, **lasciando invariate** le righe Turnstile (non ancora
configurate: il Task 4 le riempirà).

```
NEXT_PUBLIC_SUPABASE_URL="https://<REFERENCE_ID>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key del cloud>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
```

⚠️ **Nessuna riga `SUPABASE_SERVICE_ROLE_KEY`.**

- [ ] **Step 3: Salvare anche la copia cloud**

```bash
cp .env.local .env.local.cloud
```

Da qui in poi lo swap fra i due ambienti è `cp .env.local.docker .env.local` oppure
`cp .env.local.cloud .env.local`, seguito da un riavvio del dev server.

- [ ] **Step 4: Configurare gli URL di redirect per lo sviluppo locale**

⚠️ Questa configurazione va cambiata **due volte**: ora per `localhost`, e di nuovo nel
Task 6 per l'URL `workers.dev`. Configurarla una volta sola rompe la conferma email in uno
dei due passaggi, e il sintomo non dice perché. È il bug #2 del collaudo di Fase 1A.

Dashboard Supabase → **Authentication → URL Configuration**:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** aggiungere `http://localhost:3000/**`

- [ ] **Step 5: Avviare il dev server contro il cloud**

⚠️ Docker/Supabase locale può restare acceso o spento: ora è irrilevante, l'app punta al
cloud.

```bash
rm -rf .next
npm run dev
```

Aprire http://localhost:3000/it. Atteso: la home carica.

- [ ] **Step 6: Registrare l'account admin sul cloud**

Su `/it/registrati`: nome, email admin confermata dall'utente, password. Salvare la password
in un gestore.

⚠️ Turnstile: con la site key vuota il widget non appare, ma `verifyTurnstile` in
[`src/lib/turnstile.ts:2`](../../src/lib/turnstile.ts) fa `if (!token) return false` →
**la registrazione verrà respinta con "Verifica anti-bot non superata"**.

**Se succede, è atteso e non è un bug.** Due strade:
- **(a) consigliata:** saltare al Task 4 (Turnstile reale), poi tornare qui. Il Task 4 non
  dipende da questo step.
- **(b)** usare temporaneamente le chiavi di test pubbliche di Cloudflare, che passano
  sempre: site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
  Vanno rimosse al Task 4.

Registrare **prima** l'admin, poi attendere e registrare il membro: il limite è **2 email di
auth all'ora** (D-4).

- [ ] **Step 7: Confermare l'email e verificare l'auto-login**

Aprire la casella reale, cliccare il link di conferma.

Atteso: si torna sul sito **già autenticati** (la dashboard mostra il nome). Se invece si
finisce su una pagina di errore o al login, il problema sono i **Redirect URLs** dello
Step 4 — è esattamente il bug #2 di 1A.

- [ ] **Step 8: Promuovere l'admin (il seed NON è stato applicato)**

Dashboard Supabase → **SQL Editor**:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email = 'mcdevelop03@gmail.com';
```

Verificare:

```sql
select u.email, p.role from public.profiles p
join auth.users u on u.id = p.id;
```

Atteso: una riga con `role = 'admin'`.

- [ ] **Step 9: Verificare che i poteri admin funzionino**

Ricaricare il sito (serve un refresh perché il ruolo è letto lato server). Aprire `/it/eventi`.

Atteso: compare il pannello di gestione eventi dell'admin in fondo alla pagina (pattern
"vista admin inline": l'admin vede le sue sezioni nella stessa pagina pubblica).

- [ ] **Step 10: Registrare il secondo account (membro)**

Attendere che il limite di 2 email/ora lo consenta, poi registrare l'account membro con
l'indirizzo confermato dall'utente e confermarlo dalla stessa inbox.

Atteso: `role = 'member'` (default), nessun pannello admin su `/it/eventi`.

- [ ] **Step 11: Prova di upload col limite del bucket sul cloud**

Da loggato come membro: `/it/garage/nuova`, creare un'auto con una foto **grande (> 2 MB
originali)**.

Atteso: la compressione WebP nel browser la porta sotto i 2 MB e l'upload **riesce**. È la
prova che i limiti del bucket sul cloud sono attivi e che la compressione li rispetta.

- [ ] **Step 12: Prova negativa RLS con utenti veri**

Dashboard Supabase → **SQL Editor**, prendere i due `id` da `public.profiles`. Poi, **da
browser** loggato come membro, tentare di aprire il garage in modifica dell'altro utente:

```
http://localhost:3000/it/garage/<id-veicolo-dell-admin>/modifica
```

Atteso: **HTTP 404**. Se si apre il form, le RLS non sono arrivate: fermarsi e riferire.

- [ ] **Step 13: Nessun commit**

Questo task non tocca file tracciati. `git status --short` deve essere vuoto.

**Criterio di uscita:** due utenti reali sul cloud (uno admin), conferma email con auto-login
funzionante, un upload riuscito coi limiti del bucket, una prova negativa RLS a 404.

---

## Task 4: Turnstile reale

**Files:** solo `.env.local` e `.env.local.cloud` (non tracciati).

**Interfaces:**
- Consumes: niente dal codice
- Produces: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (build-time, serve al Task 6) e
  `TURNSTILE_SECRET_KEY` (runtime, diventa un secret del Worker al Task 6)

### Runbook manuale (utente, nel browser)

- [ ] **Step 1: Creare l'account Cloudflare**

https://dash.cloudflare.com/sign-up. È lo stesso account che servirà per Workers al Task 6:
crearne uno solo.

- [ ] **Step 2: Creare il widget Turnstile**

Dashboard Cloudflare → **Turnstile** → **Add widget**:
- **Widget name:** `marsica-car-meet-staging`
- **Hostnames:** aggiungere `localhost` **e** `marsica-car-meet.<tuo-subdominio>.workers.dev`

  Il secondo non esiste ancora (nasce al Task 6): registrarlo ora evita di tornare indietro.
  Se il subdominio dell'account non è ancora noto, aggiungere per ora solo `localhost` e
  **tornare qui al Task 6** ad aggiungere l'altro.
- **Widget mode:** `Managed`

Copiare **Site Key** e **Secret Key**.

- [ ] **Step 3: Scrivere le chiavi in `.env.local`**

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY="<site key reale>"
TURNSTILE_SECRET_KEY="<secret key reale>"
```

Se al Task 3 Step 6 si era usata la strada (b) con le chiavi di test, **sostituirle ora**.

- [ ] **Step 4: Allineare la copia cloud**

```bash
cp .env.local .env.local.cloud
```

- [ ] **Step 5: Riavviare il dev server**

Le `NEXT_PUBLIC_*` sono lette alla build: un dev server già avviato non le vede.

```bash
rm -rf .next
npm run dev
```

- [ ] **Step 6: Verificare che il widget appaia**

Aprire `/it/login`.

Atteso: sotto i campi compare il widget Turnstile ("Verifica che sei umano" o spunta
automatica). **Se non appare**, la site key non è arrivata al bundle client: controllare che
il nome della variabile sia esattamente `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e che il dev server
sia stato riavviato.

- [ ] **Step 7: Verificare che il login passi**

Login con l'account admin.

Atteso: si entra.

- [ ] **Step 8: Prova negativa — submit senza token**

Nella console del browser, su `/it/login`, rimuovere il token prima di inviare:

```javascript
document.querySelector('input[name="cf-turnstile-response"]').value = "";
```

Poi compilare e inviare il form.

Atteso: **"Verifica anti-bot non superata."** È la prova che la verifica lato server è viva e
non decorativa.

- [ ] **Step 9: Nessun commit**

Nessun file tracciato è cambiato.

**Criterio di uscita:** widget visibile, login riuscito, submit senza token respinto.

---

## Task 5: `noindex` + bottone Google dietro un flag

**Perché prima del deploy:** così il primo deploy è già `noindex` e non esiste una finestra
in cui i crawler possono indicizzare lo staging.

**Files:**
- Create: `src/lib/auth/provider.ts`
- Create: `src/lib/auth/provider.test.ts`
- Create: `src/app/robots.ts`
- Modify: `src/app/[locale]/(public)/login/page.tsx:44-46`
- Modify: `src/app/[locale]/(public)/registrati/page.tsx:21-23`
- Modify: `.env.local.example`

**Interfaces:**
- Consumes: niente
- Produces: `googleAuthAbilitato(): boolean` da `@/lib/auth/provider`, consumata dalle due
  pagine auth. Nessun altro task la usa.

**Perché una funzione pura in un file a parte:** il progetto usa vitest **solo per la logica
pura** (`src/lib/date/fuso.ts`, `src/lib/events/stato.ts`, …), mentre pagine e form si
verificano dal vivo. Estrarre il gate in una funzione pura lo rende testabile senza
introdurre un tipo di test che il progetto non usa.

- [ ] **Step 1: Scrivere il test che fallisce**

Create `src/lib/auth/provider.test.ts`:

```typescript
import { describe, expect, it, afterEach } from "vitest";
import { googleAuthAbilitato } from "./provider";

const originale = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;

afterEach(() => {
  if (originale === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;
  else process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = originale;
});

describe("googleAuthAbilitato", () => {
  it("è disabilitato quando la variabile è assente (caso staging)", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;
    expect(googleAuthAbilitato()).toBe(false);
  });

  it("è abilitato solo con il valore esatto \"true\"", () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "true";
    expect(googleAuthAbilitato()).toBe(true);
  });

  it("è disabilitato con la stringa vuota", () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "";
    expect(googleAuthAbilitato()).toBe(false);
  });

  it("non si fa ingannare da \"false\", \"0\" o \"TRUE\"", () => {
    for (const valore of ["false", "0", "TRUE", "yes"]) {
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = valore;
      expect(googleAuthAbilitato()).toBe(false);
    }
  });
});
```

Il quarto caso non è pedanteria: un confronto scritto male (`Boolean(valore)`) rende
`"false"` un valore **vero**, cioè accende il bottone rotto esattamente quando si voleva
spegnerlo.

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

```bash
npx vitest run src/lib/auth/provider.test.ts
```

Atteso: FAIL — non risolve `./provider`.

- [ ] **Step 3: Implementare la funzione**

Create `src/lib/auth/provider.ts`:

```typescript
// Il login con Google esiste nel codice (signInWithGoogle) ma il provider OAuth va
// configurato per dominio: sullo staging workers.dev non lo è, quindi il bottone
// "Continua con Google" va nascosto invece di mostrarne uno che dà errore.
// Alla fase pubblica basta valorizzare la variabile: nessun codice da riscrivere.
export function googleAuthAbilitato(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

```bash
npx vitest run src/lib/auth/provider.test.ts
```

Atteso: PASS, 4 test.

- [ ] **Step 5: Mettere il bottone dietro il gate in `login/page.tsx`**

Aggiungere l'import dopo la riga 11:

```typescript
import { googleAuthAbilitato } from "@/lib/auth/provider";
```

Sostituire le righe 44-46:

```tsx
            <form action={signInWithGoogle}>
              <Button variant="outline" type="submit" className="w-full">{t("google")}</Button>
            </form>
```

con:

```tsx
            {googleAuthAbilitato() && (
              <form action={signInWithGoogle}>
                <Button variant="outline" type="submit" className="w-full">{t("google")}</Button>
              </form>
            )}
```

`signInWithGoogle` resta importato e usato: nessun codice morto, nessun errore di lint.

- [ ] **Step 6: Stesso gate in `registrati/page.tsx`**

Aggiungere l'import dopo la riga 9:

```typescript
import { googleAuthAbilitato } from "@/lib/auth/provider";
```

Sostituire le righe 21-23:

```tsx
            <form action={signInWithGoogle}>
              <Button variant="outline" type="submit" className="w-full">{t("google")}</Button>
            </form>
```

con:

```tsx
            {googleAuthAbilitato() && (
              <form action={signInWithGoogle}>
                <Button variant="outline" type="submit" className="w-full">{t("google")}</Button>
              </form>
            )}
```

- [ ] **Step 7: Creare `src/app/robots.ts`**

Va nella **root** di `src/app/`, non dentro `[locale]`: `robots.txt` non è localizzato.
Non viene intercettato da `src/proxy.ts` perché il matcher esclude i path con un punto
(`.*\\..*`).

```typescript
import type { MetadataRoute } from "next";

// Staging: nessun motore di ricerca deve indicizzare questo ambiente (contenuti demo e
// policy legali ancora in bozza). DA RIMUOVERE al go-live pubblico.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
```

- [ ] **Step 8: Documentare la variabile in `.env.local.example`**

Contenuto finale del file:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR-ANON-KEY"
# NOTA: SUPABASE_SERVICE_ROLE_KEY non è usata da nessuna parte in src/ e NON va
# configurata in produzione: bypassa tutte le RLS.

# Cloudflare Turnstile (anti-bot, Fase 1)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""

# Login con Google: "true" solo dove il provider OAuth è configurato davvero
# (non sullo staging workers.dev). Assente o diverso da "true" = bottone nascosto.
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=""
```

- [ ] **Step 9: Verifiche complete**

```bash
npm test
npx tsc --noEmit
npm run lint
```

Atteso: **119 test** verdi (115 + i 4 nuovi), tsc e lint puliti.

- [ ] **Step 10: Verifica dal vivo in locale**

Con il dev server attivo e `.env.local` **senza** `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`:

1. `/it/login` e `/it/registrati` → il bottone "Continua con Google" **non c'è**, il resto
   della pagina è intatto (link "Password dimenticata", "Non hai un account").
2. `http://localhost:3000/robots.txt` → risponde con `User-Agent: *` e `Disallow: /`.
3. Controprova: aggiungere `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"` a `.env.local`,
   riavviare il dev server, ricaricare `/it/login` → il bottone **riappare**. Poi
   **rimuovere di nuovo** il valore e riavviare.

La controprova conta: senza, non si distingue "il gate funziona" da "ho rotto il render".

- [ ] **Step 11: Commit**

```bash
git add src/lib/auth/provider.ts src/lib/auth/provider.test.ts src/app/robots.ts \
  "src/app/[locale]/(public)/login/page.tsx" \
  "src/app/[locale]/(public)/registrati/page.tsx" \
  .env.local.example
git commit -m "feat(1e): noindex sullo staging + bottone Google dietro NEXT_PUBLIC_GOOGLE_AUTH_ENABLED"
```

**Criterio di uscita:** 119 test verdi; `/robots.txt` nega tutto; il bottone Google è assente
senza il flag e presente con il flag.

---

## Task 6: Deploy su Cloudflare Workers

**Files:** nessun file del repo cambia. Il deploy usa `wrangler.jsonc` dal Task 0.

**Interfaces:**
- Consumes: script `deploy` e nome Worker `marsica-car-meet` (Task 0); chiavi Supabase cloud
  (Task 2); chiavi Turnstile (Task 4); `robots.ts` e gate Google (Task 5)
- Produces: l'URL `workers.dev` dello staging, usato dai Task 7 e 8

- [ ] **Step 1: Autenticare wrangler**

```bash
npx wrangler login
```

Apre il browser per autorizzare l'account Cloudflare creato al Task 4. **Azione manuale.**

- [ ] **Step 2: Verificare a quale account si è connessi**

```bash
npx wrangler whoami
```

Atteso: l'email dell'account Cloudflare e l'Account ID.

- [ ] **Step 3: Assicurarsi che `.env.local` contenga la configurazione CLOUD**

⚠️ **Il punto più delicato di tutta la fase.** Le tre `NEXT_PUBLIC_*` vengono **incorporate
nel bundle JavaScript al momento della build**. Se al momento del `deploy` `.env.local`
contiene le chiavi **Docker**, il Worker verrà pubblicato puntando a `127.0.0.1:54321` — e
il sintomo sarà un sito che carica ma non fa login, senza alcun errore chiaro.

```bash
cp .env.local.cloud .env.local
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```

Atteso: l'URL `https://<REFERENCE_ID>.supabase.co`, **non** `127.0.0.1`.

- [ ] **Step 4: Caricare il secret runtime sul Worker**

`TURNSTILE_SECRET_KEY` è letta a runtime dal server, quindi va come secret del Worker (non
serve alla build).

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Incollare la secret key del Task 4 quando richiesto.

Nota: al primo deploy il Worker potrebbe non esistere ancora e il comando può fallire. In tal
caso eseguire prima lo Step 5, poi ripetere questo, poi rifare lo Step 5.

- [ ] **Step 5: Build e deploy**

⚠️ Killare prima il dev server.

```bash
rm -rf .next .open-next
npm run deploy
```

Atteso: wrangler stampa l'URL pubblicato, tipo
`https://marsica-car-meet.<subdominio>.workers.dev`. **Annotarlo:** serve negli step
seguenti e nei Task 7 e 8.

- [ ] **Step 6: Verificare che il secret sia sul Worker**

```bash
npx wrangler secret list
```

Atteso: una voce `TURNSTILE_SECRET_KEY`. Se manca, tornare allo Step 4 e ripetere il deploy.

- [ ] **Step 7: Aggiornare gli URL di redirect Supabase — il secondo dei due giri**

Dashboard Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://marsica-car-meet.<subdominio>.workers.dev`
- **Redirect URLs:** aggiungere
  `https://marsica-car-meet.<subdominio>.workers.dev/**` — **lasciando** anche
  `http://localhost:3000/**`, così lo sviluppo locale contro il cloud continua a funzionare.

- [ ] **Step 8: Registrare l'hostname su Turnstile, se non già fatto**

Se al Task 4 Step 2 il subdominio `workers.dev` non era noto, aggiungerlo ora al widget
Turnstile. Senza, il widget si rifiuta di caricare sul dominio nuovo.

- [ ] **Step 9: Prima verifica — la home in HTTPS**

Aprire l'URL `workers.dev` su `/it`.

Atteso: la home carica in HTTPS, il logo si vede, l'header è a posto.

**Se il logo è rotto** (e solo il logo): è l'unica immagine che passa da `next/image`
(`Header.tsx:42`, più `MobileMenu.tsx`), quindi il sospetto è il binding `IMAGES` del
Worker. Rimedio, che non costa nulla perché si tratta di un PNG di pochi KB — aggiungere a
`next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  images: { unoptimized: true },
};
```

Poi rifare build e deploy. Nessun'altra immagine del sito è interessata: le foto di auto ed
eventi sono `<img>` che puntano allo Storage Supabase, già compresse in WebP dal client.

- [ ] **Step 10: Verificare che punti al Supabase cloud e non a localhost**

Aprire `/it/eventi` sullo staging.

Atteso: si vedono gli eventi presenti sul **cloud** (probabilmente nessuno: l'album demo
arriva al Task 7). Nella tab **Network** del browser le richieste devono andare a
`<REFERENCE_ID>.supabase.co`, **mai** a `127.0.0.1`. Se vanno a `127.0.0.1`, lo Step 3 è
stato saltato: ripetere build e deploy.

- [ ] **Step 11: Verificare `robots.txt` sullo staging**

Aprire `https://marsica-car-meet.<subdominio>.workers.dev/robots.txt`.

Atteso: `User-Agent: *` e `Disallow: /`.

- [ ] **Step 12: Nessun commit**

Nessun file tracciato è cambiato.

**Criterio di uscita:** la home risponde in HTTPS sull'URL `workers.dev`, le richieste dati
vanno al Supabase cloud, `/robots.txt` nega tutto, il secret Turnstile è sul Worker.

---

## Task 7: Contenuti demo

**Perché è un task e non un dettaglio:** il cliente giudica ciò che vede. Un sito
tecnicamente perfetto e visivamente vuoto viene giudicato vuoto. Sullo staging i contenuti si
caricano **una volta** e restano (a differenza del locale, dove `db reset` li cancella).

**Files:** nessuno. Tutto dall'interfaccia dello staging, come farebbe l'admin.

**Interfaces:**
- Consumes: URL dello staging (Task 6), utenti admin e membro (Task 3)
- Produces: dati demo usati dal collaudo del Task 8

**Prerequisito:** servono immagini realistiche di auto. Se l'utente non ne ha, il task si
fa con quel che c'è e si annota il debito — meglio poche foto vere che nessun contenuto.

- [ ] **Step 1: Loggarsi come admin sullo staging**

Sull'URL `workers.dev`, login con l'account admin del Task 3.

Atteso: il login riesce **attraverso l'adapter** — è già mezza prova del Task 8.

- [ ] **Step 2: Creare un raduno futuro con RSVP aperto**

Dal pannello admin in fondo a `/it/eventi`: titolo realistico, data **futura** (es. un mese
avanti), luogo nella Marsica, tipo raduno, **capienza valorizzata** (es. 30) e una foto di
copertina.

La capienza serve: senza, il conteggio mostra "X iscritti" invece di "X su Y posti", e la
seconda forma è quella che vale la pena far vedere.

Atteso: l'evento compare fra i **Prossimi raduni**.

- [ ] **Step 3: Creare un raduno concluso**

Stesso pannello, data **passata**, con copertina.

Atteso: compare fra i **Conclusi**, con `opacity-50`.

- [ ] **Step 4: Caricare un album sul raduno concluso**

Sul dettaglio dell'evento concluso: caricare **3-4 foto** (l'upload le comprime in WebP da
sé) e aggiungere **un video YouTube** tramite link.

Atteso: la gallery mostra le foto, il lightbox si apre, il video appare **bloccato** dal gate
GDPR finché non si dà il consenso.

- [ ] **Step 5: Popolare il garage del membro**

Logout, login come membro, `/it/garage/nuova`: **due auto** con foto e specifiche compilate.

- [ ] **Step 6: Iscrivere il membro al raduno futuro**

Da `/it/eventi/<slug-del-raduno-futuro>`: partecipare, associando una delle due auto.

Atteso: il conteggio diventa "1 su 30 posti" e il membro compare nella lista partecipanti.

- [ ] **Step 7: Completare il profilo del membro**

`/it/profilo`: nome, tag, bio, paese, avatar.

Atteso: l'avatar compare nell'header; il membro è cercabile da `/it/membri`.

- [ ] **Step 8: Guardare lo staging con gli occhi del cliente**

Aprire lo staging in una **finestra anonima** (da sloggato) e percorrere: home → `/it/eventi`
→ il raduno futuro → il raduno concluso con l'album → `/it/privacy`.

Atteso: nessuna pagina vuota, nessuna immagine rotta, nessun testo segnaposto **a parte** i
`[DA COMPILARE]` delle policy legali, che sono attesi e vanno segnalati al cliente (§9 della
spec).

- [ ] **Step 9: Nessun commit**

**Criterio di uscita:** due eventi (uno futuro con capienza e un'iscrizione, uno concluso con
album e video), un membro con profilo completo e due auto, e un giro da anonimo senza pagine
vuote.

---

## Task 8: Collaudo mirato + allineamento della documentazione

**Files:**
- Modify: `docs/SETUP.md`
- Modify: `docs/STATO-LAVORI.md`
- Modify: `docs/ROADMAP.md`

**Interfaces:**
- Consumes: tutto quanto sopra
- Produces: il punto di ripartenza per la prossima sessione

**Cosa si collauda:** solo ciò che può comportarsi diversamente fuori da Docker. **Non** si
riprovano logica pura, fuso orario e validazione: coperti dai 119 test e indipendenti
dall'ambiente.

### Collaudo (tutto sull'URL `workers.dev`)

- [ ] **Step 1: Server action attraverso l'adapter**

È il meccanismo su cui poggia ogni form del sito. Provare **quattro** superfici diverse,
perché una sola non dimostra niente sulle altre:
1. login (già fatto al Task 7 Step 1);
2. salvataggio del **profilo** (cambiare la bio e salvare);
3. creazione di un'**auto** in garage;
4. **RSVP** su un evento (disdire e re-iscriversi).

Atteso: tutte e quattro riescono, con i toast di conferma. Un 404 o 500 al submit è un
guasto dell'adapter → fermarsi e riferire.

- [ ] **Step 2: Cookie su HTTPS reale**

In locale su `http` il flag `Secure` non è mai stato esercitato davvero.

Da loggato, aprire i DevTools → **Application → Cookies**.

Atteso: il cookie di sessione Supabase e `mcm_consent` presenti, **entrambi con `Secure`**.

- [ ] **Step 3: Conferma email col dominio nuovo**

Registrare un **terzo** account usa-e-getta con un altro alias dell'indirizzo confermato
dall'utente, e confermarlo.

Atteso: il link di conferma porta sullo staging e si finisce **già autenticati**. È la prova
diretta che lo Step 7 del Task 6 (Site URL/Redirect URLs) è corretto.

⚠️ Attenzione al limite di 2 email/ora: se al Task 7 sono già partite email, attendere.

- [ ] **Step 4: Limiti dei bucket sul cloud, prova negativa**

Serve un file che **arrivi al bucket sopra i 2 MB**, cioè che sfugga alla compressione WebP
del client. La leva è documentata: `comprimiImmagine` **restituisce l'originale** se
`createImageBitmap` fallisce (vedi `STATO-LAVORI.md`, Minor del Task 5 di 1C-1). Quindi un
file che *non è* un'immagine vera, ma ha estensione `.png` e pesa più di 2 MB, passa
inalterato e viene respinto dal bucket.

Preparare il file (dalla shell, sulla macchina locale):

```bash
head -c 3145728 /dev/urandom > "$TMPDIR/finto-grande.png"
```

Su Windows/PowerShell:

```powershell
$b = New-Object byte[] 3145728
(New-Object Random).NextBytes($b)
[IO.File]::WriteAllBytes("$env:TEMP\finto-grande.png", $b)
```

Poi, da loggato sullo staging, sceglierlo come **avatar** su `/it/profilo` e salvare.

Atteso: l'upload è **respinto** — errore `413` (Payload Too Large) nella tab Network, e la UI
mostra il messaggio di upload fallito. Se invece riesce, il `file_size_limit` del bucket non è
attivo sul cloud → tornare al Task 2 Step 8.

⚠️ Se il salvataggio riesce, **rimettere subito un avatar vero**: siamo su contenuti che il
cliente vedrà.

- [ ] **Step 5: Prova negativa RLS con utenti veri**

Da loggato come membro, aprire l'URL di modifica di un'auto **dell'admin**:
`https://<staging>/it/garage/<id-veicolo-admin>/modifica`.

Atteso: **HTTP 404**.

- [ ] **Step 6: Gate GDPR YouTube su HTTPS**

In finestra anonima, aprire il raduno concluso con il video e **rifiutare** i cookie di terze
parti.

Atteso: **zero iframe** nel DOM e **zero richieste** a `youtube-nocookie`/`ytimg` nella tab
Network. Poi "Attiva contenuti esterni" → l'iframe si monta e il video carica davvero.

- [ ] **Step 7: Turnstile reale che respinge**

Su `/it/login` dello staging, azzerare il token e inviare:

```javascript
document.querySelector('input[name="cf-turnstile-response"]').value = "";
```

Atteso: **"Verifica anti-bot non superata."**

- [ ] **Step 8: Decidere cosa fare della pausa a 7 giorni**

Un progetto Supabase free si mette in pausa dopo **7 giorni di inattività**: se il cliente
riapre il link dopo dieci giorni di silenzio, trova il sito morto (si riattiva dal dashboard
in un minuto).

**Chiedere all'utente** quale strada preferisce e annotare la scelta in `STATO-LAVORI.md`:
(a) avvisare il cliente e riattivare a mano prima delle demo; (b) predisporre un ping
programmato; (c) valutare il piano Pro. Non implementare nulla senza risposta.

### Documentazione

- [ ] **Step 9: Riscrivere `docs/SETUP.md` §6**

Sostituire la §6 attuale (5 righe generiche) con il percorso reale seguito: creazione
progetto EU, `link`, `db push`, la nota che **`db push` non applica `seed.sql`**, i due giri
di configurazione degli URL di redirect, lo swap `.env.local.docker` / `.env.local.cloud`, e
una §6-bis sul deploy (`npm run deploy`, `wrangler secret put`, e l'avvertenza che le
`NEXT_PUBLIC_*` sono build-time).

- [ ] **Step 10: Allineare `docs/ROADMAP.md`**

Due cose:
1. Spuntare le caselle `[1C]` (righe 34-36) e `[1D]` (riga 37): sono complete da giorni ma
   il file le mostra ancora vuote.
2. Correggere "Lista partecipanti/auto per evento (admin)" in Fase 2 (riga 50): è **già
   fatta** nella 1C-2 (`AdminIscritti`).
3. Aggiungere una riga per la **Fase 1E** con esito e URL dello staging.

- [ ] **Step 11: Riscrivere il punto di ripartenza in `docs/STATO-LAVORI.md`**

Aggiornare la data, la sezione "Dove siamo" (Fase 1E completata, URL dello staging, cosa
resta per il go-live pubblico: dominio, contenuti legali, SMTP, Google OAuth, rimozione
`noindex`, CI), la scelta fatta allo Step 8 sulla pausa, e la nota che `main` **è** pushato.

- [ ] **Step 12: Verifiche finali**

```bash
npm test
npx tsc --noEmit
npm run lint
```

Atteso: 119 test verdi, tsc e lint puliti.

- [ ] **Step 13: Commit**

```bash
git add docs/SETUP.md docs/STATO-LAVORI.md docs/ROADMAP.md
git commit -m "docs(1e): SETUP con percorso cloud reale, ROADMAP allineata, STATO-LAVORI post-staging"
```

- [ ] **Step 14: Chiusura del branch**

Usare la skill `superpowers:finishing-a-development-branch` per merge/PR di
`feat/fase1e-staging-cloud` su `main`, e pushare `main`.

**Criterio di uscita:** i sette collaudi passati (o i bug emersi corretti con commit
dedicati), i tre documenti allineati, branch mergiato, `main` pushato.

---

## Cosa resta dopo, per il go-live pubblico

Dominio del club + DNS, contenuti legali reali (i `[DA COMPILARE]` con i dati del Titolare,
da chiedere al cliente), SMTP custom con template in italiano, Google OAuth col redirect URI
definitivo (e `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"`), **rimozione di
`src/app/robots.ts`**, CI via Workers Builds, e la valutazione del piano Supabase Pro
(niente pausa per inattività, backup).
