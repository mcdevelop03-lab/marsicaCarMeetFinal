# Fase 1E — Staging cloud — Piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> 🚨 **RIALLINEATO IL 2026-08-04 — L'HOSTING È NETLIFY, NON CLOUDFLARE WORKERS.**
> Il piano fu scritto per Cloudflare Workers. Il **Task 0 è fallito al cancello**:
> `@opennextjs/cloudflare` **rifiuta** il middleware Node di Next 16, che questo progetto usa
> (vedi il Task 0 qui sotto, riscritto). L'hosting è stato riscelto con l'utente e la fase è
> proseguita su **Netlify**.
>
> **Come leggere questo file:** i task sono stati **eseguiti**, quindi le caselle non sono una
> lista di cose da fare ma il registro di ciò che è stato fatto. Dove il percorso reale ha
> divergiato dal previsto — Task 0, Task 6, e i tre task 9/10/11 aggiunti in corsa — il testo è
> stato riscritto sul percorso vero. **Non riesumare le istruzioni Cloudflare: sono conservate
> solo come motivo per cui quella strada non si ritenta.**

**Goal:** portare l'MVP già completo su uno staging cloud privato e raggiungibile
(`https://<nome>.netlify.app`), con Supabase cloud EU, Turnstile reale, `noindex` e
contenuti demo, così che il cliente possa provarlo da sé.

**Architecture:** **Netlify** serve Next 16 tramite `@netlify/plugin-nextjs`, che avvolge il
middleware Node (`proxy.ts`) in una edge function e l'SSR in una serverless function; gli
statici vanno sulla CDN. Nessuno store di cache aggiuntivo: ogni pagina legge i cookie ed è
dinamica. Il backend è un progetto Supabase cloud in regione EU con le migrazioni
`0001`–`0010`. **Il deploy è su CI: parte dal push del branch.** Approccio incrementale:
prima l'app **locale** contro il Supabase **cloud** (isola i guasti di configurazione DB),
poi il deploy (isola i guasti dell'hosting).

**Tech Stack:** Next.js 16.2.10, React 19.2.4, next-intl 4, Supabase (`@supabase/ssr`),
TailwindCSS 4, vitest 4, `@netlify/plugin-nextjs`.

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
- ⚠️ **La build dell'hosting NON gira su questa macchina** (bundling Deno dell'edge function,
  ipotesi `OneDrive`). Ogni verifica dell'hosting passa da un **push**. Per tutto il resto:
  dev server locale puntato al **Supabase cloud**, variabili inline (vedi in fondo).
- ⚠️ **Il verde non dice che funziona, dice che compila.** Tre volte in questa fase `tsc`,
  `lint`, 119 test e build erano tutti verdi mentre il comportamento era sbagliato. Ogni
  modifica di **UX** va provata dal vivo prima del push.

## Ordine dei task e scostamento dalla spec

La spec §6 elencava il `noindex` + gate Google **dopo** il deploy. Qui sono **prima**
(Task 5, deploy al Task 6) per due motivi: il primo deploy include già `noindex`, quindi non
esiste una finestra in cui i crawler possono indicizzare lo staging; e si evita un deploy in
più.

**Deviazioni successive, tutte dichiarate quando sono avvenute:**

1. **L'hosting è cambiato** (Task 0 fallito → Netlify). Conseguenza sull'ordine: il push su
   GitHub (Task 1) da messa-in-sicurezza è diventato **prerequisito tecnico** del deploy,
   perché la build è su CI. Il Task 2 (Supabase cloud) è stato anticipato prima della verifica
   del cancello Netlify: la build in CI ha bisogno delle `NEXT_PUBLIC_*` per compilare, e in
   caso di secondo fallimento il progetto Supabase non sarebbe stato lavoro sprecato.
2. **Il `noindex` è finito dopo il primo deploy, non prima.** Il sito era già stato deployato
   (in privato) e l'incognita prioritaria era che l'app *funzionasse*. Rischio della finestra
   trascurabile: un crawler raggiunge una pagina solo se qualcosa la collega, e quell'URL non
   era linkato da nessuna parte.
3. **Tre task aggiunti in corsa** (9, 10, 11), nati da rilievi dell'utente sullo staging.

## File Structure

| File | Responsabilità | Task |
|---|---|---|
| `netlify.toml` | **crea** — comando di build + `@netlify/plugin-nextjs` | 0 |
| `package.json` | **modifica** — dipendenza `@netlify/plugin-nextjs` | 0 |
| `.gitignore` | **modifica** — artefatti di build dell'adapter | 0 |
| `.env.local.example` | **modifica** — documenta `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` e annota che la service role key non serve all'app | 5 |
| `src/lib/auth/provider.ts` | **crea** — un'unica funzione pura `googleAuthAbilitato()`, testabile | 5 |
| `src/lib/auth/provider.test.ts` | **crea** — test della funzione pura | 5 |
| `src/app/[locale]/(public)/login/page.tsx` | **modifica** — riga 44: bottone Google dietro il gate | 5 |
| `src/app/[locale]/(public)/registrati/page.tsx` | **modifica** — riga 21: idem | 5 |
| `src/app/robots.ts` | **crea** — `disallow: "/"` per tutta la superficie dello staging | 5 |
| `docs/SETUP.md` | **modifica** — §6 riscritta col percorso reale + dev server contro il cloud + deploy | 8 |
| `docs/STATO-LAVORI.md` | **modifica** — punto di ripartenza post-1E | 8 |
| `docs/ROADMAP.md` | **modifica** — caselle 1C/1D (oggi vuote pur essendo fatte) + riga Fase 1E | 8 |
| `docs/superpowers/specs/2026-07-30-…-design.md` | **modifica** — riallineamento da Cloudflare a Netlify | 8 |
| questo file | **modifica** — idem | 8 |

**Aggiunti dai task nati in corsa** *(sezione aggiunta il 2026-08-04)*:

| File | Responsabilità | Task |
|---|---|---|
| `supabase/email-templates/*.html` + `README.md` | **crea** — copia di riferimento dei template; ⚠️ **vivono nel dashboard, nessuna migrazione li applica** | 9 |
| `public/email-logo.png` | **crea** — logo bianco ridotto a 240px, **17,8 KB invece di 872** | 9 |
| `src/components/ui/PageSkeleton.tsx` | **crea** — scheletro a schede; in testa la spiegazione del confine (leggerla prima di toccare i `loading.tsx`) | 10 |
| `src/components/ui/PageSpinner.tsx` | **crea** — fallback per le rotte **non** a griglia | 10 |
| `src/app/[locale]/**/loading.tsx` | **crea** — **22 file**, uno per rotta, più quello in cima | 10 |
| `src/components/layout/NavPending.tsx` | **crea** — `useLinkStatus` nei link dell'header | 10 |
| `src/components/ui/Button.tsx` | **modifica** — prop `pending` (rotella + `aria-busy`), 18 bottoni collegati | 10 |
| `src/components/ui/OverlayAttesa.tsx` + `globals.css` | **crea/modifica** — velo a comparsa **ritardata dal CSS** | 10 |
| `src/lib/events/pubblici.ts` | **crea** — `COLONNE_PUBBLICHE` + tipo, una sola copia | 11 |
| `src/app/[locale]/(public)/page.tsx` | **modifica** — sezione "Prossimi raduni" | 11 |

**Nessun file esistente cambia per l'hosting.** In particolare `src/proxy.ts` **non va
toccato**: è il middleware Node, cioè il pezzo che ha deciso la scelta dell'host. Netlify lo
avvolge da sé in una edge function.

---

## ✅ Email degli account di prova — confermate dall'utente il 2026-07-30

Sul cloud le email di conferma vanno a caselle **reali**: in locale le intercettava Mailpit,
quindi `membro.test@example.com` funzionava. Sul cloud **non funziona più**.

Indirizzi **autorizzati dall'utente**, da usare per tutta la fase:

| Ruolo | Email |
|---|---|
| admin | `mcdevelop03@gmail.com` (già in `supabase/seed.sql`) |
| membro | `matteo050903@gmail.com` |

⚠️ **Non usare nessun altro indirizzo** senza chiedere. In particolare mai
`aidev3@goproject.it` (l'email dell'account).

Nota per il Task 8 Step 3 (terzo account per la prova di conferma email sul dominio nuovo):
**non** inventare un indirizzo. Usare un alias col `+` di uno dei due autorizzati — per
esempio `matteo050903+prova@gmail.com`, che arriva nella stessa inbox — o chiedere
all'utente.

---

## Task 0: Spike dell'hosting — nessun account, nessun costo

> 🔁 **Riscritto il 2026-08-04.** Questo task fu scritto come *"spike dell'adapter OpenNext"*
> per Cloudflare Workers, con 13 step di configurazione `wrangler`. **È fallito al cancello.**
> Qui resta il motivo del fallimento — che è la ragione per cui quella strada non si ritenta —
> e il percorso Netlify che l'ha sostituita. Le istruzioni Cloudflare sono state rimosse
> perché erano indicazioni operative su una strada chiusa: chi le seguisse rifarebbe l'errore.

**Perché è il primo:** è l'unica incognita tecnica reale della fase. Se fallisce, tutto il
resto del piano cambia e l'utente non deve aver aperto neanche un account.
**Questa scelta ha salvato la fase** — vedi sotto.

### ❌ Tentativo 1: Cloudflare Workers + `@opennextjs/cloudflare` — FALLITO

Commit `558ec32` (poi revertito da `1f50369`). Tutto verde fino al cancello: `tsc`, `lint`,
115/115 test, e perfino il `next build` interno dell'adapter (21 pagine statiche). Poi:

```
ERROR Node.js middleware is not currently supported.
Consider switching to Edge Middleware.
```

🚨 **La causa è architetturale, non locale, e non si aggira.** In Next 16 `proxy.ts` gira
**sempre** su runtime Node e non può essere spostato su edge; i Workers girano su `workerd`.
`@opennextjs/cloudflare@1.20.2` — l'ultima su npm — rifiuta la build appena rileva un
middleware Node. È l'issue Cloudflare `workers-sdk#13755` (*"Version Trap: between Next.js 16's
new Proxy architecture and OpenNext's current Cloudflare adapter"*). **Aggiornare Next non
risolve:** il peer dep era già soddisfatto, il rifiuto riguarda il middleware, non la versione.

**→ Non riprovare questa strada** finché l'adapter non dichiara il supporto al middleware Node.

Fatto d'ambiente emerso e ancora valido: `wrangler@4.86.0` richiede **Node ≥ 22**, il Node di
sistema qui è **20.19.3**. Irrilevante ora che l'hosting Cloudflare è abbandonato.

### 🔀 La scelta dell'hosting, tornata all'utente

Il rischio #1 della spec §8 si era materializzato. Vincolo dell'utente: **nessuna spesa finché
il cliente non approva** (dopo, le spese le sostiene il cliente).

- **Vercel — escluso dall'utente.** Il piano Hobby gratuito **vieta l'uso commerciale** nei
  termini, e questo sito è per un cliente.
- **Netlify — scelto.** Il piano Starter gratuito **permette esplicitamente l'uso commerciale**,
  e Netlify ha un adapter proprio per Next 16.
- **Fallback mai servito:** host Node puro (Render ~$7/mese, Railway ~$5/mese) che esegue
  `next start` senza alcun adapter — lì un'incompatibilità del genere è impossibile per
  costruzione. Ma costa, quindi viola il vincolo.

### ✅ Tentativo 2: Netlify — passato (in CI)

Commit `54e7ed4`: `netlify.toml` + `@netlify/plugin-nextjs@5.15.13`. Baseline riverificata,
115/115 test verdi.

**Il fatto che conta:** l'adapter Netlify **gestisce** il middleware Node invece di rifiutarlo.
La build genera `.netlify/edge-functions/___netlify-edge-handler-node-middleware/` che importa
`./server/node-middleware.js` e lo avvolge. Nessun rifiuto categorico.

⚠️ **In locale il cancello non si può verificare su questa macchina.** `next build` interno: OK.
Vendoring Deno: OK. Poi **fallisce il bundling Deno** di quell'edge function:
`Could not load edge function at '...___netlify-edge-handler-node-middleware.js'`, senza alcuna
diagnostica Deno sotto. **Non è causato da `--offline`** (il vendoring era riuscito).
**Ipotesi principale, mai smentita: il progetto vive dentro `OneDrive\Desktop`**, che blocca e
virtualizza i file — causa nota di rotture nei bundler, e Deno è esattamente quel tipo di
strumento. `netlify-cli build` **senza** `--offline` pretende un sito già collegato, quindi la
verifica locale completa non è possibile senza account.

**→ Verifica rinviata alla build su CI Netlify (Linux).** Conseguenza sull'ordine dei task:
serve un account Netlify + repo GitHub collegato, quindi **il Task 1 (push) diventa
prerequisito tecnico del deploy**, non solo messa in sicurezza.

### 🚦 IL CANCELLO — passato su CI ✅

Sito creato dall'utente: `polite-moxie-8dc031`, team `MatteoCaricolaDevelop`, branch di
produzione `feat/fase1e-staging-cloud` (**non** `main` — è lì che sta `netlify.toml`).

**Deploy summary: "1 edge function deployed"** — cioè esattamente l'artefatto che
`@opennextjs/cloudflare` si rifiutava di produrre. Più: 22 file caricati, 3 redirect, 1 header
rule, 1 function serverless.

**Conferma l'ipotesi OneDrive/Windows: il problema era la macchina, non il progetto.**
La prova definitiva è arrivata dopo, con la verifica funzionale: `/` risponde **307 → `/it`**,
cioè il middleware Node **gira davvero** in produzione.

**Criterio di uscita del task: soddisfatto.** L'hosting serve l'app **e** esegue le server
action (verificato al Task 4: un login con password errata risponde con un messaggio
dell'applicazione, non con un 404/500).

---

## Task 1: Mettere al sicuro `main` su origin

**Perché:** oggi 42 commit — tutta la Fase 1 — esistono su un solo disco. Costo zero,
rischio eliminato.

⚠️ **Promosso a prerequisito tecnico** (2026-08-04). Nella versione originale non lo era —
D-3 diceva che si sarebbe deployato da locale con `wrangler`. Col cambio a Netlify la build è
su **CI e parte dal push**, quindi senza questo task non esiste alcun deploy.

**Files:** nessuno.

**Interfaces:**
- Consumes: niente
- Produces: il repo su GitHub da cui Netlify costruisce (Task 0b/6)

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

**Indirizzi email** (già confermati dall'utente, vedi il blocco più sopra):
- admin → `mcdevelop03@gmail.com`
- membro → `matteo050903@gmail.com`

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

> 💡 **Superata il 2026-08-03 da una ricetta migliore.** Lo swap di file funziona ma è
> pericoloso: basta dimenticarlo per deployare un bundle che punta a `127.0.0.1`, o per credere
> di star provando il cloud mentre si parla con Docker. **Non serve scambiare niente:** Next dà
> la precedenza alle variabili già presenti nell'ambiente rispetto a `.env.local`, quindi
> bastano inline —
>
> ```bash
> NEXT_PUBLIC_SUPABASE_URL="https://<REFERENCE_ID>.supabase.co" \
> NEXT_PUBLIC_SUPABASE_ANON_KEY="<publishable key>" \
> npm run dev
> ```
>
> Le chiavi Turnstile restano quelle **di test** di `.env.local`, che validano sempre: in locale
> va bene. `.env.local` non si tocca mai, quindi non c'è niente da rimettere a posto dopo.
>
> ⚠️ **A fine prova spegni il dev server**, altrimenti resta appeso sulla 3000 e il tentativo
> dopo parte sulla 3001 senza che te ne accorga:
> `Get-NetTCPConnection -LocalPort 3000 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`

- [ ] **Step 4: Configurare gli URL di redirect per lo sviluppo locale**

⚠️ Questa configurazione va cambiata **due volte**: ora per `localhost`, e di nuovo nel
Task 6 per l'URL di staging. Configurarla una volta sola rompe la conferma email in uno
dei due passaggi, e il sintomo non dice perché. È il bug #2 del collaudo di Fase 1A.

**Configurazione finale, dopo entrambi i giri:** Site URL = l'host Netlify, Redirect URLs =
quell'host con `/**` **più** `http://localhost:3000/**` (non toglierlo: serve alla ricetta del
dev server contro il cloud).

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
- Produces: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (build-time) e `TURNSTILE_SECRET_KEY` (runtime),
  entrambe da mettere fra le variabili Netlify al Task 6

⚠️ **L'account Cloudflare serve ANCHE SE l'hosting è Netlify.** Turnstile è un servizio
Cloudflare e resta la nostra scelta anti-bot dalla Fase 1: le due cose sono indipendenti.

### Runbook manuale (utente, nel browser)

- [ ] **Step 1: Creare l'account Cloudflare**

https://dash.cloudflare.com/sign-up. Serve **solo** per Turnstile (l'hosting è Netlify).
Account usato: `mcdevelop03@gmail.com`.

- [ ] **Step 2: Creare il widget Turnstile**

Dashboard Cloudflare → **Turnstile** → **Add widget**:
- **Widget name:** `marsica-car-meet-staging`
- **Hostnames:** aggiungere `localhost` **e** l'host Netlify dello staging

  Il secondo può non esistere ancora: registrarlo appena è noto evita di tornare indietro.
  Senza l'hostname giusto **Cloudflare non emette alcun token** e il widget non carica.
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
// configurato per dominio: sullo staging non lo è, quindi il bottone "Continua con
// Google" va nascosto invece di mostrarne uno che dà errore.
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
# (non sullo staging). Assente o diverso da "true" = bottone nascosto.
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

## Task 6: Deploy su Netlify

> 🔁 **Riscritto il 2026-08-04.** Era *"Deploy su Cloudflare Workers"*, con `wrangler login`,
> `wrangler secret put` e `npm run deploy` da locale. Su Netlify **non si deploya da locale**:
> si deploya **pushando il branch**, e le variabili vivono nel dashboard.

**Files:** nessun file del repo cambia. Il deploy usa `netlify.toml` dal Task 0.

**Interfaces:**
- Consumes: repo su GitHub (Task 1); chiavi Supabase cloud (Task 2); chiavi Turnstile
  (Task 4); `robots.ts` e gate Google (Task 5)
- Produces: l'URL di staging, usato dai Task 7, 8, 9

- [x] **Step 1: Collegare il sito Netlify al repo GitHub** *(azione manuale dell'utente)*

Sito `polite-moxie-8dc031`, team `MatteoCaricolaDevelop`, account GitHub `mcdevelop03-lab`.

⚠️ **Branch di produzione: `feat/fase1e-staging-cloud`, non `main`.** È lì che vive
`netlify.toml`. **Da cambiare al merge di fine fase**, altrimenti lo staging resta appeso a un
branch che nessuno aggiorna più.

- [x] **Step 2: Impostare le variabili d'ambiente sul dashboard Netlify**

| Variabile | Nota |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ il valore è la chiave che **Supabase chiama** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_...`). Va messa **sotto il nostro nome**: il codice legge quello |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | pubblica per progettazione (finisce nel bundle) |
| `TURNSTILE_SECRET_KEY` | **incollata dall'utente direttamente sul dashboard**, mai passata dalla conversazione |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | **assente** sullo staging (spec D-9) |
| `SUPABASE_SERVICE_ROLE_KEY` | **da nessuna parte**: bypassa tutte le RLS |

🚨 **Le `NEXT_PUBLIC_*` sono incorporate nel bundle alla BUILD, non lette a runtime.**
Salvarle non basta: **serve un nuovo deploy**. Questo passo è costato un giro al Task 4 —
le chiavi Turnstile erano salvate ma il sito serviva ancora il bundle vecchio.

Il guasto è **muto**: col nome sbagliato o senza rebuild, il sito compila e si apre,
semplicemente non parla col database o non disegna il widget.

- [x] **Step 3: Deploy = push del branch**

```bash
git push origin feat/fase1e-staging-cloud
```

Netlify costruisce da sé. Atteso nel log: **"1 edge function deployed"** (il middleware Node)
+ la function serverless dell'SSR. Deploy **Published**.

⚠️ **Non si può anticipare in locale:** `netlify build --offline` fallisce su questa macchina
(vedi Task 0). Si verifica pushando.

- [x] **Step 4: Visibilità del sito — la pendenza che ha richiesto una decisione**

Netlify pubblica come **Private** per default: tutte le rotte rispondevano **HTTP 401** con
`<title>Login Redirect</title>`, rimandando ad `app.netlify.com/edge-access`. Non è un guasto
dell'app, è il controllo accessi di Netlify — ma **il cliente non sarebbe potuto entrare**
senza un account nel team, che è il contrario del motivo per cui lo staging esiste.

La *password protection* (link + password al cliente) sarebbe stata la soluzione ideale ma
**non è sul piano gratuito**. Restavano Private e Public → si è tornati al piano approvato
**D-6: Public + `noindex`**. Deploy Preview lasciate Private.

- [x] **Step 5: Aggiornare gli URL di redirect Supabase**

Dashboard Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://polite-moxie-8dc031.netlify.app`
- **Redirect URLs:** quell'host con `/**` — **lasciando** anche `http://localhost:3000/**`,
  così lo sviluppo locale contro il cloud continua a funzionare.

⚠️ **Va fatto PRIMA di registrare il primo account**, non dopo: il link di conferma è costruito
come `${origin}/it/auth/callback` in `auth/actions.ts:33`, ma Supabase lo onora solo se sta
nella allow-list, altrimenti ripiega **in silenzio** sul Site URL (`localhost:3000` su un
progetto nuovo) — e si è bruciata una delle 2 email/ora. È il bug #2 del collaudo 1A.

- [x] **Step 6: Registrare l'hostname sul widget Turnstile**

Hostname del widget: `polite-moxie-8dc031.netlify.app` **+** `localhost`. Senza, Cloudflare
non emette alcun token e il widget non carica.

- [x] **Step 7: Verifica funzionale dall'esterno** *(curl, nessun browser)*

| Prova | Esito |
|---|---|
| `/` | **307 → `/it`** — il **middleware Node gira**: è il punto su cui Cloudflare era fallita |
| `/it`, `/it/eventi`, `/it/login`, `/it/privacy`, `/it/cookie` | **200**, `<title>` corretti |
| `/it/membri` | **307 → `/it/login`** — la guardia `(auth)` è viva anche sul cloud |
| `/robots.txt` | `User-Agent: *` + `Disallow: /` — il `noindex` del Task 5 è in produzione |
| Cookie banner 1D | presente nel **markup SSR** |
| Supabase cloud | `rest/v1/events` e `auth/v1/health` → 401 senza apikey = progetto **vivo, non in pausa** |

⚠️ **Il logo non ha avuto problemi** (era il rischio previsto per il binding immagini di
Cloudflare): `next/image` funziona sull'adapter Netlify senza `unoptimized: true`.

- [x] **Step 8: Nessun commit** — nessun file tracciato è cambiato.

**Criterio di uscita:** la home risponde in HTTPS sull'URL di staging, le richieste dati vanno
al Supabase cloud, `/robots.txt` nega tutto, il sito è raggiungibile dal cliente. ✅


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

Sull'URL di staging, login con l'account admin del Task 3.

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

# I tre task aggiunti in corsa (2026-08-03)

> Non erano nel piano. Nascono da **rilievi dell'utente guardando lo staging**, cioè dalla cosa
> per cui lo staging esiste. Criterio con cui sono stati accettati: **il cliente lo vede?**
> Ordine di esecuzione: prima i due di codice (un solo deploy), poi quello che richiede il
> dashboard.

## Task 11: I prossimi raduni in home ✅ `68dad51`

**Il rilievo:** `(public)/page.tsx:22` aveva un `<Badge>Prossimi raduni</Badge>` **scritto a
mano nel JSX** (non passava nemmeno da i18n), residuo del mockup, che **annunciava una sezione
inesistente**. La home era hero + CTA, nient'altro. Invisibile finché il sito era vuoto; col
Task 7 il cliente atterra sulla home e non vede nessuno dei tre eventi.

**Scelte motivate, da non "correggere" per distrazione:**
- La sezione **sparisce** se non c'è nulla: una landing che annuncia "nessun raduno" è peggio
  di una che tace.
- Sparisce **anche in caso di errore** — ma l'errore **viene loggato**. Non diciamo "nessun
  raduno" al posto di "non lo so".
- Il filtro resta **in TS**, non in query: la regola della mezzanotte italiana vive in
  `eConcluso`, quindi un `limit` in SQL scarterebbe le righe sbagliate.
- `COLONNE_PUBBLICHE` + tipo estratti in `src/lib/events/pubblici.ts`: due copie della stessa
  lista sono due occasioni di aggiungere `created_by` per distrazione (mai `select('*')` sulle
  pagine pubbliche).

**Verificato sullo staging:** due schede con foto, in ordine di data, evento concluso escluso.

## Task 10: Feedback di caricamento ✅ (quattro riprese)

**Il rilievo:** navigazione lenta e **nessun** segnale, quindi si clicca più volte.
**Causa accertata, non ipotizzata:** `find src -name loading.tsx` → **nessun risultato**, e
ogni pagina è dinamica (legge i cookie di sessione).

**Onestà da mantenere col cliente:** parte della lentezza è il **cold start del piano gratuito**
e nessun `loading.tsx` la elimina. Quello che si elimina è il *silenzio*.

| # | Commit | Cosa |
|---|---|---|
| 1 | `5cfbb16` | `loading.tsx` a livello di `[locale]` + `NavPending` con `useLinkStatus` |
| 2 | `1efdebd` | 🚨 **il fix del confine** — vedi sotto |
| 3 | `4796938` | schede solo dove ci sono schede, spinner altrove |
| 4 | `cf34331` | stato "sto lavorando" sui bottoni |
| 5 | `acc4633` | velo di attesa a comparsa ritardata |

### 🚨 La ripresa 1 era SBAGLIATA, e tutto il verde diceva il contrario

Misurato pilotando il browser: il puntino compariva (quindi `useLinkStatus` funzionava) ma lo
**scheletro non compariva mai**, e la navigazione restava muta per **4,2 secondi**. Il problema
segnalato dall'utente era ancora intero — con `tsc`, `lint`, 119 test e build **tutti verdi**.

**Causa, letta nella guida "Ensuring instant navigations" di Next 16 e non dedotta:** in una
navigazione lato client Next ridisegna **solo ciò che sta sotto il layout condiviso** fra
partenza e destinazione. Un `loading.tsx` a livello di `[locale]` sta **sopra** quel layout,
quindi resta fuori dal ridisegno. Funzionava solo al primo caricamento — dove l'albero viene
reso tutto — ed è per questo che nell'HTML lo scheletro si vedeva: **un falso positivo che
sembrava conferma.**

> *"a Suspense boundary in the root layout covers everything on a page load, but for a client
> navigation the shared layout is the entry point. The root Suspense sits above it and has no
> effect."*

**Correzione:** un `loading.tsx` **per rotta** (22 file di una riga), più quello in cima che
resta valido per il primo caricamento. ⚠️ **Rotta nuova = suo `loading.tsx`**, altrimenti quella
pagina torna a caricare in silenzio — la spiegazione è in testa a `PageSkeleton`, dove la trova
chi tocca quel codice.

`unstable_instant` (l'altra strada indicata dai doc) **non è applicabile**: richiede
`cacheComponents`, che il progetto non abilita.

| Navigazione | Scheletro dopo | Totale |
|---|---|---|
| home → eventi | **14 ms** | 922 ms |
| eventi → home | **6 ms** | 801 ms |
| home → gadget | **6 ms** | 310 ms |

*Prima del fix: scheletro **mai**, 4,2 s di silenzio.*

**Effetto collaterale atteso, non un guasto:** il puntino di `NavPending` **non compare più** —
con il confine al posto giusto lo stato `pending` dura meno di un fotogramma. Tenuto lo stesso,
per il caso in cui il prefetch non ha fatto in tempo (rete lenta, link appena entrato in
viewport). **Non rimuoverlo pensando che sia codice morto senza prima riprovare su rete lenta.**

### Le riprese 3, 4 e 5 — due rilievi dell'utente, entrambi fondati

**3. Schede ovunque = bugia grafica.** L'utente si aspettava uno spinner e ha visto tre card
lampeggiare: lo stesso scheletro a griglia era usato su **tutte** le rotte, anche prima di
`/privacy`, del profilo e dei form. Ora il fallback segue la pagina, **classificata sul codice
e non a occhio** (contando le rotte con `grid gap`/`sm:grid-cols`): **schede** su home,
`/eventi`, `/garage`, `/membri`; **spinner** sulle altre 19. ⚠️ Verificato contando il markup
del fallback **a stili e script esclusi** — contarlo grezzo è un falso positivo, perché i nomi
delle classi compaiono anche nel CSS iniettato e nel payload RSC. `/it/privacy` e `/it/login`
non hanno **nessun** fallback: non fanno query, e un lampeggio inutile è peggio di niente.

**4. I form "restavano statici" premendo Salva.** `loading.tsx` copre i **cambi pagina**, non
l'invio di una **server action**. **La causa non era la mancanza di uno spinner, ma l'ambiguità
del segnale:** l'unico effetto era `disabled:opacity-40`, e i form spengono il Salva **anche a
campi mancanti** → "sto salvando" e "non hai finito di compilare" avevano lo stesso aspetto.
Ora `Button` accetta **`pending`**: piena opacità + rotella + `aria-busy`, restando `disabled`
(doppio invio impossibile). Verificato dal vivo: **10 ms dopo il clic** rotella presente,
`aria-busy="true"`, opacità `1`.

⚠️ **Regola da rispettare:** `pending` va **solo** ai bottoni che *avviano* un'azione (submit,
conferme, upload). Quelli che restano bloccati durante l'attesa — gli "Annulla" dei modali —
tengono `disabled`.

**5. Velo di attesa** (`OverlayAttesa`) sulle operazioni davvero lente: evento, auto, profilo,
avatar, album. ⚠️ **La comparsa è ritardata di 350 ms e il ritardo lo fa il CSS**
(`.velo-attesa` in `globals.css`), non un `setTimeout`. **Non "correggere" togliendo il
ritardo:** un velo che appare e sparisce in 200 ms è un lampo, e dà più fastidio del silenzio.
Misurato: opacità 0 fino a 349 ms, 1.00 a 526 ms; intercetta i clic **anche da trasparente**,
quindi il doppio invio è impossibile fin dal primo istante.

## Task 9: Email di autenticazione presentabili 🟡 `633dff2` — manca l'incollaggio

**Il rilievo:** oggi chi si registra riceve il template **inglese di serie** di Supabase, senza
logo e senza niente che ricordi il sito — sembra spam. Il cliente si registrerà davvero, quindi
quella email fa parte di ciò che valuta.

**Fatto:** due template HTML italiani coi colori del tema in `supabase/email-templates/` + un
README. `public/email-logo.png` = logo bianco ridotto a 240px, **17,8 KB invece di 872** (in una
email l'originale è improponibile).

🚨 **I template vivono nel DASHBOARD, non nel repo, e nessuna migrazione li applica.** La
cartella è la copia di riferimento: chi modifica una delle due parti deve allineare l'altra a
mano, altrimenti un ripristino del progetto Supabase riporta i template inglesi senza che
nessuno se ne accorga.

### 🚨 BLOCCATO — il presupposto del task era falso (2026-08-04)

**I template non si possono incollare.** Aperto il dashboard per applicarli, la pagina
*Authentication → Emails* risponde:

> *"Set up custom SMTP to edit templates. Emails will be sent using the default templates.
> Set up custom SMTP to edit their subject and body."*

Col mailer condiviso gratuito Supabase **impone i template di serie**: oggetto **e** corpo sono
bloccati.

⚠️ **Il vincolo era scritto nella spec (D-4) fin dal 2026-07-30** e non è stato letto: il task è
nato, il codice è stato scritto e committato (`633dff2`) dando per buono che il dashboard
lasciasse incollare, **senza che nessuno aprisse quella pagina**. Il 2026-08-04 la D-4 è stata
perfino *"corretta"* dichiarando falso ciò che era vero. **Stessa lezione del Task 10:** un
presupposto che nessuno ha osservato non è un fatto.

**Tre limitazioni, una sola causa.** Template bloccati + footer *"powered by Supabase"* + limite
di **2 email/ora** vengono tutti dal servizio di posta condiviso e **cadono insieme** con un
SMTP nostro. Non sono tre problemi da affrontare separatamente: è uno.

**I file non sono lavoro sprecato:** `supabase/email-templates/` è scritto, verificato (il logo
risponde 200 dal sito) e pronto. Si incolla nel momento in cui l'SMTP c'è.

### ➡️ DECISIONE PRESA (2026-08-04): il task esce dalla 1E e confluisce nel go-live

**Scelta dell'utente: rimandare.** Il Task 9 non si chiude in questa fase; diventa parte del
task **SMTP custom** del go-live, dove ci sarà anche il dominio vero.

**Perché è la scelta giusta e non una resa:**
- Configurare un SMTP adesso significherebbe configurarlo **due volte**: senza il dominio del
  club servirebbe un provider con mittente singolo verificato, e col dominio si rifarebbe tutto.
- Il vincolo Resend (invia solo al titolare senza dominio verificato) rende la strada rapida
  inutilizzabile proprio per lo scopo che avrebbe: far provare il sito **al cliente**.
- Le tre limitazioni cadono **insieme** con l'SMTP: farlo una volta sola, e bene, al momento
  giusto.

**Costo accettato, da dire al cliente:** chi si registra sullo staging riceve l'**email inglese
di serie** di Supabase, col footer "powered by Supabase". È brutta, ma funziona: il link di
conferma porta dove deve.

**Cosa NON si perde:** i template sono scritti, verificati (logo 200 dal sito) e committati.
Al go-live si incollano e basta.

- [ ] **Step 1 (al go-live, quando ci sarà l'SMTP).** Dashboard Supabase →
  *Authentication → Emails*: incollare
  `conferma-registrazione.html` in **Confirm signup** e `reset-password.html` in
  **Reset password**, e mettere gli oggetti in italiano:
  - Confirm signup → `Conferma il tuo indirizzo — Marsica Car Meet`
  - Reset password → `Reimposta la password — Marsica Car Meet`
- [ ] **Step 2 — prova vera, aperta DA TELEFONO.** È lì che si vedono i disastri di
  impaginazione, non nell'anteprima del dashboard.

⚠️ **HTML da email, non da sito:** tabelle e stili in linea, niente flexbox, niente grid,
niente CSS esterno. Sembra codice del 2005 ed è voluto: è ciò che Outlook e Gmail rendono in
modo affidabile. E il **logo è un URL assoluto** — al cambio di dominio va aggiornato in
entrambi i file **e** nel dashboard.

---

## Task 8: Collaudo mirato + allineamento della documentazione

**Files:**
- Modify: `docs/SETUP.md`
- Modify: `docs/STATO-LAVORI.md`
- Modify: `docs/ROADMAP.md`
- Modify: la spec di questa fase e **questo file** *(aggiunto: il riallineamento da Cloudflare
  a Netlify)*

**Interfaces:**
- Consumes: tutto quanto sopra
- Produces: il punto di ripartenza per la prossima sessione

**Cosa si collauda:** solo ciò che può comportarsi diversamente fuori da Docker. **Non** si
riprovano logica pura, fuso orario e validazione: coperti dai 119 test e indipendenti
dall'ambiente.

⚠️ **Aggiunto dopo il 2026-08-03:** vanno guardate dal vivo **da loggato** anche le cose
introdotte dal Task 10, che non si sono potute provare senza le password. Sono nello Step 8-bis.

### Collaudo (tutto sull'URL di staging)

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
diretta che lo Step 5 del Task 6 (Site URL/Redirect URLs) è corretto.

⚠️ Attenzione al limite di 2 email/ora: se al Task 7 sono già partite email, attendere.

💡 **Da fare INSIEME al Task 9 Step 2:** è la stessa email. Una sola registrazione prova sia il
redirect sia il template nuovo — e va **aperta da telefono**.

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

- [ ] **Step 7-bis: Le cose del Task 10 che si vedono solo da loggato** *(aggiunto 2026-08-04)*

Sono le uniche modifiche di UX mai provate **con una sessione vera**. Le prime tre riprese del
Task 10 sono state verificate dal vivo; queste no, perché richiedono le password.

1. **Velo di attesa dove l'attesa è reale:** creare un evento con una **foto grossa** → il velo
   **deve** comparire (soglia 350 ms).
2. **Velo dove l'attesa NON è reale:** salvare il profilo senza cambiare l'avatar →
   **probabilmente non deve comparire**, è troppo veloce. Se comparisse e sparisse in un lampo,
   il comportamento è giusto ma la soglia è tarata male: **non togliere il ritardo**, alzarlo.
3. **Rotella nei bottoni** delle azioni admin (annulla/ripristina/elimina evento) e dell'**RSVP**
   (partecipa/disdici): 18 bottoni collegati, questi sono i meno esercitati.

Atteso: opacità piena + rotella + `aria-busy="true"` sul bottone premuto, e nessun doppio invio
possibile.

- [ ] **Step 8: Decidere cosa fare della pausa a 7 giorni**

Un progetto Supabase free si mette in pausa dopo **7 giorni di inattività**: se il cliente
riapre il link dopo dieci giorni di silenzio, trova il sito morto (si riattiva dal dashboard
in un minuto).

**Chiedere all'utente** quale strada preferisce e annotare la scelta in `STATO-LAVORI.md`:
(a) avvisare il cliente e riattivare a mano prima delle demo; (b) predisporre un ping
programmato; (c) valutare il piano Pro. Non implementare nulla senza risposta.

### Documentazione

- [x] **Step 8-bis: Riallineare spec e piano da Cloudflare a Netlify** *(2026-08-04)*

Erano il pezzo di documentazione più fuorviante del progetto: descrivevano un hosting che non
si usa. Rifatti: spec §0/§2/§3/§4/§5/§6/§7/§8/§10 e, qui, intestazione, vincoli, Task 0, Task 1,
Task 6, più i tre task nati in corsa che non erano documentati in nessun piano.

- [ ] **Step 9: Riscrivere `docs/SETUP.md` §6**

Sostituire la §6 attuale (5 righe generiche) con il percorso reale seguito: creazione
progetto EU, `link`, `db push`, la nota che **`db push` non applica `seed.sql`**, la
configurazione degli URL di redirect (**prima** di registrare il primo account), la ricetta del
**dev server locale contro il Supabase cloud** con variabili inline, e una §6-bis sul deploy
Netlify (push del branch, variabili sul dashboard, e l'avvertenza che le `NEXT_PUBLIC_*` sono
build-time e richiedono un rebuild).

⚠️ **Non documentare lo swap `.env.local.docker` / `.env.local.cloud`**: era la ricetta
prevista, ma non è quella adottata — le variabili si passano inline e `.env.local` non si tocca.

- [ ] **Step 10: Allineare `docs/ROADMAP.md`**

1. ~~Spuntare le caselle `[1C]` e `[1D]`~~ — **già fatto il 2026-08-03.**
2. Correggere "Lista partecipanti/auto per evento (admin)" in Fase 2: è **già fatta** nella
   1C-2 (`AdminIscritti`).
3. Aggiungere una riga per la **Fase 1E** con esito e URL dello staging.
4. Verificare che la scheda **onboarding post-registrazione** rimandata alla Fase 2 ci sia.

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

🚨 **Subito dopo il merge: cambiare il branch di produzione su Netlify da
`feat/fase1e-staging-cloud` a `main`.** Altrimenti lo staging che il cliente sta guardando
resta appeso a un branch che nessuno aggiorna più — e il guasto è muto: il sito continua a
funzionare, semplicemente non riceve più niente.

**Criterio di uscita:** i collaudi passati (o i bug emersi corretti con commit dedicati), la
documentazione allineata, branch mergiato, `main` pushato, branch di produzione Netlify
aggiornato.

---

## Cosa resta dopo, per il go-live pubblico

Dominio del club + DNS, contenuti legali reali (i `[DA COMPILARE]` con i dati del Titolare,
da chiedere al cliente), **SMTP custom** (che porta via anche il footer "powered by Supabase" e
il limite di 2 email/ora), Google OAuth col redirect URI definitivo (e
`NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"`, che essendo build-time richiede un **rebuild**, non un
toggle), **rimozione di `src/app/robots.ts`**, e la valutazione del piano Supabase Pro (niente
pausa per inattività, backup).

⚠️ **La CI non è più un lavoro da fare:** con Netlify c'è già, il deploy parte dal push.

⚠️ **Il cambio di dominio tocca tre posti oltre al DNS**, e dimenticarne uno rompe qualcosa in
silenzio: gli **URL di redirect Supabase**, l'**hostname del widget Turnstile**, e l'**URL
assoluto del logo** nei template email (nei due file **e** nel dashboard).
