# STATO LAVORI — Punto di ripartenza

> **Questo è il file da consultare per riprendere.** Ultima modifica: **2026-08-04**.
> Quando riprendi, dimmi: *"vai in docs/STATO-LAVORI.md e controlla da cosa ripartire"*.
> Viene aggiornato ogni volta che ci fermiamo con gli sviluppi.

## 🔖 Dove siamo

- 🎉 **FASE 1E — STAGING CLOUD: COMPLETATA e MERGIATA** su `main` (merge `e0a20c1`, 2026-08-04), **`main` pushato su origin**. **C'è un cliente che deve provare e approvare il sito**: è il motivo per cui esiste questa fase.
  - 🚨 **UNICA COSA RIMASTA, da fare sul dashboard Netlify: spostare il branch di produzione da `feat/fase1e-staging-cloud` a `main`.** Finché non è fatto, lo staging che il cliente guarda si aggiorna da un branch che nessuno toccherà più — e il guasto è **muto**: il sito continua a funzionare, semplicemente non riceve più niente. **Il branch NON è stato eliminato apposta**, per non spegnere lo staging: si elimina dopo lo spostamento. Spec: [`superpowers/specs/2026-07-30-fase1e-staging-cloud-design.md`](./superpowers/specs/2026-07-30-fase1e-staging-cloud-design.md) · Piano: [`superpowers/plans/2026-07-30-fase1e-staging-cloud.md`](./superpowers/plans/2026-07-30-fase1e-staging-cloud.md) · Ledger: [`../.superpowers/sdd/2026-07-30-fase1e-staging-cloud/progress.md`](../.superpowers/sdd/2026-07-30-fase1e-staging-cloud/progress.md).
  - ✅ **Spec e piano RIALLINEATI a Netlify (2026-08-04, `3e5c225`)** — non sono più obsoleti: si possono leggere. La storia Cloudflare è conservata **come motivo per cui quella strada non si ritenta**, non come istruzioni (quelle sono state rimosse). Riscritte anche `SETUP.md` §6 + la nuova §6-bis sul deploy, e `ROADMAP.md`, dove la Fase 1E non compariva affatto (`aabfb4a`).
    - Trovato strada facendo: `provider.ts` e `.env.local.example` avevano commenti che nominavano *"lo staging workers.dev"* — un hosting mai usato, finito nel codice perché il piano diceva così. Corretti. E `SETUP.md` **consigliava di mettere in `.env.local` la `SUPABASE_SERVICE_ROLE_KEY`**, cioè la chiave che bypassa tutte le RLS: tolta.
  - ✅ **Fatto:** `main` + branch **pushati su GitHub** (i 42 commit della Fase 1 non vivono più su un solo disco) · **progetto Supabase cloud** creato con le migrazioni `0001`–`0010` applicate e verificate · **sito Netlify deployato** · **`noindex` + bottone Google dietro flag** (commit `e4fa307`, 119 test, review indipendente con 0 rilievi).
  - ✅ **Sito su Public e verifica funzionale superata (2026-08-03):** `/` → `/it` **307** (il middleware Node gira davvero su Netlify), `/it`+`/it/eventi`+`/it/login`+`/it/privacy`+`/it/cookie` **200**, `/it/membri` → login (guardia auth viva), `/robots.txt` nega tutto, cookie banner 1D nel markup SSR, Supabase cloud vivo (non in pausa).
  - ✅ **Task 4 (Turnstile) completo e verificato (2026-08-03):** widget creato, variabili su Netlify, redeploy fatto. Il widget emette un token da 773 caratteri e un login con password errata risponde **"Credenziali non valide"** (non "Verifica anti-bot non superata") → la secret verifica davvero e **il server Netlify parla con Supabase cloud**. Login e registrazione sono vivi.
  - ✅ **Task 3 (collaudo auth/dati) completo (2026-08-03):** admin e membro registrati e confermati sul cloud, admin promosso via SQL e confermato anche dalla UI; **tutte le prove negative da anonimo superate** (scritture RLS respinte, profili invisibili, upload respinti sui 4 bucket).
  - ✅ **Task 7 (contenuti demo) completo (2026-08-03):** 3 eventi (2 futuri + 1 concluso con album di 2 foto e 1 video YouTube), profili con avatar per admin e membro, 3 auto in garage, **2 iscrizioni** al raduno di settembre. Caricato tutto **dalla UI**, quindi vale anche da collaudo: fuso corretto (10:00 italiane con server in UTC), compressione WebP, slug immutabile dopo il cambio data, gate GDPR verificato con un video vero (0 iframe e 0 richieste a YouTube senza consenso, `youtube-nocookie` dopo), e `profiles`/`vehicles` invisibili all'anonimo **anche da pieni**.
  - ✅ **Task 11 e 10 completi e verificati dal vivo (2026-08-03):** home con i prossimi raduni in vetrina (`68dad51`); feedback di caricamento in **quattro riprese**, tutte nate da rilievi dell'utente in collaudo — `loading.tsx` (`5cfbb16`), **fix del confine** (`1efdebd`, prima non compariva **mai**: 4,2 s di silenzio, ora **6-14 ms**), **schede solo dove ci sono schede + spinner altrove** (`4796938`), **stato "sto lavorando" sui bottoni** (`cf34331`), **velo di attesa a comparsa ritardata** sulle operazioni lente (`acc4633`).
    - ⚠️ **Lezione da ricordare:** in tutti e tre i casi `tsc`, `lint`, 119 test e build erano **verdi mentre il comportamento era sbagliato**. Il verde dice che compila, non che funziona: le modifiche di UX vanno provate su un dev server puntato al **Supabase cloud** prima del push.
  - ⏸️ **Dove ci si è fermati (2026-08-04):** restano **solo cose che richiedono te**. (1) **Task 9:** i due template email sono scritti (`633dff2`) ma vanno **incollati a mano nel dashboard** Supabase. (2) **Task 8, collaudo dal vivo:** serve una sessione loggata, quindi le password. La parte documentale del Task 8 è **fatta**.

- 🎉 **FASE 1 (MVP) COMPLETA** — 1A ✅ · 1B ✅ · 1C ✅ · 1D ✅. Tutto mergiato su `main`. ✅ **`main` è pushato su GitHub** dalla Fase 1E (l'avvertenza "solo locale" che si legge nelle righe storiche qui sotto **non vale più**).
- 🟢 **Fase 1D ✅ COMPLETATA** (GDPR base) — **chiude la Fase 1.** Implementazione subagent-driven (Task 1-5, tutti rivisti con esito pulito) + **review finale whole-branch (opus): "Ready to merge: With fixes"** → **fix wave `531adc7`** (2 Important) → **re-review del fix wave: entrambi ADDRESSED, 0 nuove rotture** → **collaudo dal vivo superato (2026-07-29, 0 bug)** → **mergiata su `main`** (merge `173d864`), branch `feat/fase1d-gdpr` eliminato. **Nessun DB, nessuna migrazione.** **Cosa fa:** cookie banner con gestione consensi che **blocca gli embed YouTube** fino al consenso (`VideoYouTube` gate), due categorie (Necessari + Contenuti di terze parti), pagine `/privacy` e `/cookie` (bozza IT + disclaimer), footer con "Preferenze cookie". Consenso in cookie first-party `mcm_consent` letto lato server (no flash). **115 test**, `tsc`/`lint`/**build pulita** verdi. Spec: [`superpowers/specs/2026-07-28-fase1d-gdpr-design.md`](./superpowers/specs/2026-07-28-fase1d-gdpr-design.md) · Piano: [`superpowers/plans/2026-07-28-fase1d-gdpr.md`](./superpowers/plans/2026-07-28-fase1d-gdpr.md).
  - **Il collaudo ha coperto:** banner presente senza cookie e Accetta/Rifiuta/Personalizza che scrivono `mcm_consent` corretto; **parità GDPR verificata sugli stili computati** (Accetta e Rifiuta identici, Personalizza ghost); **no flash** (con consenso salvato il banner **non è nel markup SSR**); **prova dell'Important #1 dal vivo** (`mcm_consent` = `%`, `%E0%A4%A`, JSON rotto, versione 999 → **HTTP 200 col banner, mai 500**); **gate YouTube** a consenso negato → **0 iframe nel DOM e 0 richieste** a youtube-nocookie/ytimg nel Network, poi "Attiva contenuti esterni" monta l'iframe e il video carica davvero; con **2 video** un solo clic li sblocca **entrambi** (contesto condiviso); "Guarda su YouTube" → `youtube.com/watch` con `target=_blank` + `rel="noopener noreferrer"`; **revoca dal footer** → iframe smontati con **marcatore JS ancora vivo = nessun reload**; `/privacy` e `/cookie` **da anonimo** (richiesta senza alcun cookie) → 200, `<title>` corretto, disclaimer in cima, e la cookie policy elenca onestamente `mcm_consent`/sessione Supabase/Turnstile.
- 🟢 **Fase 1C-3 ✅ COMPLETATA** (Album foto) — **chiude la Fase 1C.** Implementazione subagent-driven (5 task) + **review finale whole-branch (opus, 0 Critical, 0 Important, "Ready to merge: Yes")** + wave di fix (2 minor) + **collaudo dal vivo superato (2026-07-28, 0 bug)** → **mergiata su `main`** (merge `bb09b87`), branch `feat/fase1c3-album` eliminato. Migrazione `0010` applicata. Album media per-evento (foto WebP nel bucket + video **link YouTube** incorporati + link **Drive** opzionale), caricato **solo dall'admin a raduno concluso**, pubblico. Il collaudo ha coperto: gate concluso (UI + **server**, con client stantio su evento reso futuro → insert bloccato), **upload batch** (foto3-grande 4.1MB → 186KB WebP, sotto i 2MB del bucket, `storage_path` per-evento), lightbox (Esc/frecce), video (URL canonico da `youtu.be?t=`, embed `youtube-nocookie` che carica, non-YouTube respinto), link Drive (`javascript:` respinto dal vincolo http/https, https ok, svuotamento), elimina (video → solo riga; foto → riga+file, **0 orfani**), gallery pubblica **da sloggato**, **prove negative** (anon insert → 401, membro insert → 403, upload storage → 400 RLS, >2MB → 413, MIME → 415, **notEmpty** su evento con media). **103 test**, `tsc`/`lint`/`build` verdi. Spec: [`superpowers/specs/2026-07-28-fase1c3-album-foto-design.md`](./superpowers/specs/2026-07-28-fase1c3-album-foto-design.md) · Piano: [`superpowers/plans/2026-07-28-fase1c3-album-foto.md`](./superpowers/plans/2026-07-28-fase1c3-album-foto.md). ⚠️ **`main` è solo locale, non pushato.**
- 🟢 **Fase 1C-2 ✅ COMPLETATA** (RSVP). Implementazione (7 task subagent-driven) + review finale whole-branch (opus, 0 Critical) + **collaudo dal vivo superato (2026-07-23, 0 bug)** → **mergiata su `main`**, branch `feat/fase1c2-rsvp` eliminato. Il collaudo ha coperto: auto-iscrizione con/senza auto + disdetta (0 orfani), **prova di corsa `capacity=1` (2 RPC concorrenti × 3 round → sempre 1 sola riga)**, conteggio anon "X su Y" + illimitato "X iscritti", lista iscritti solo ai loggati, poteri admin (iscrizione manuale, rimozione, evento pieno → "Posti esauriti"), **5 prove negative RLS** (POST diretto reg → 403, RPC `p_user_id`/auto altrui → 403, anon righe → `[]` ma aggregato OK, **buco `event_vehicles` chiuso** → 403 con controprova 201). Migrazione `0009` applicata. `pg_policies` esatte, **91 test**, `tsc`/`lint`/`next build` verdi. ⚠️ **`main` è solo locale, non pushato.**
- 🟢 **Fase 1C-1 ✅ COMPLETATA** (Eventi). Implementazione + review finale + wave di fix + **collaudo dal vivo superato** (2026-07-21) + migliorie UX dal collaudo → **mergiata e pushata su `main`** (fino a `c461499`), branch `feat/fase1c1-eventi` eliminato. **76/76 test verdi.** Il collaudo ha coperto: UI (crea/modifica/annulla/ripristina/elimina + toast + modale + gate admin + copertina + stato/data) e sicurezza (RLS member/anon/admin, storage 2 MB+MIME, 404 slug). Migliorie committate: pannello gestione dentro `/eventi` per l'admin, "torna indietro" con conferma, rifiniture form, toast su tutte le azioni, conferme in modale, fix CTA home. Ledger: [`../.superpowers/sdd/progress.md`](../.superpowers/sdd/progress.md).
- 🟢 **Fase 1B ✅ COMPLETATA** (1B-1 Profilo + 1B-2 Garage), collaudata, mergiata e **pushata** su `main`.
- 🟢 **Fase 1C ✅ COMPLETATA** — tutte e tre le sotto-fasi chiuse e mergiate: **1C-1 Eventi** ✅ → **1C-2 RSVP** ✅ → **1C-3 Album foto** ✅.
- **Piano 1C-1 (10 task, con tutto il codice dentro):** [`superpowers/plans/2026-07-15-fase1c1-eventi.md`](./superpowers/plans/2026-07-15-fase1c1-eventi.md) · **Spec:** [`superpowers/specs/2026-07-15-fase1c1-eventi-design.md`](./superpowers/specs/2026-07-15-fase1c1-eventi-design.md)
- **Piano 1B-2:** [`superpowers/plans/2026-07-13-fase1b2-garage.md`](./superpowers/plans/2026-07-13-fase1b2-garage.md) · **Spec:** [`superpowers/specs/2026-07-13-fase1b2-garage-design.md`](./superpowers/specs/2026-07-13-fase1b2-garage-design.md)
- **Piano 1B-1:** [`superpowers/plans/2026-07-10-fase1b1-profilo.md`](./superpowers/plans/2026-07-10-fase1b1-profilo.md)
- **Design/spec 1B-1:** [`superpowers/specs/2026-07-10-fase1b1-profilo-design.md`](./superpowers/specs/2026-07-10-fase1b1-profilo-design.md)

## ▶️ DA COSA RIPARTIRE: **la 1E è chiusa — si decide come mostrare il sito al cliente**

**Come ripartire:** *"Leggi docs/STATO-LAVORI.md: la Fase 1E è chiusa, resta da spostare il branch di produzione Netlify e decidere il passo dopo."*

> **Lo staging è vivo, pieno, collaudato e mergiato.** Sito: `https://polite-moxie-8dc031.netlify.app`
> `main` è su GitHub (`e0a20c1`), albero pulito, `tsc`/`lint`/**119 test** verdi sul risultato del merge.

### 🚨 Il primo passo, prima di qualunque altra cosa

**Sul dashboard Netlify: *Site configuration → Build & deploy → Branch to deploy* → cambiare da
`feat/fase1e-staging-cloud` a `main`.** Poi si può eliminare il branch, in locale e su origin.

Finché non è fatto, ogni lavoro futuro mergiato su `main` **non arriverà sullo staging** e nessun
errore lo segnalerà.

### Come si è arrivati qui

1. ➡️ **Task 9 — USCITO DALLA FASE, non è più da fare qui (2026-08-04).** I template **non si possono incollare**: col servizio di posta gratuito Supabase impone quelli di serie (*"Set up custom SMTP to edit templates… to edit their subject and body"* — oggetto **e** corpo bloccati). **Decisione dell'utente: rimandare al go-live**, dove c'è già il task SMTP e ci sarà il dominio vero.
   - **I file non sono sprecati:** `supabase/email-templates/` è scritto, verificato (logo 200 dal sito) e pronto: si incolla appena c'è l'SMTP.
   - **Tre limitazioni, una sola causa:** template bloccati + footer "powered by Supabase" + limite di 2 email/ora vengono tutti dal mailer condiviso e **cadono insieme**. Si fa una volta sola, col dominio.
   - ⚠️ **Da dire al cliente:** chi si registra sullo staging riceve l'email di conferma **inglese di serie**. Brutta ma funzionante.
   - ⚠️ **Perché è successo, da non ripetere:** i template sono stati scritti dando per buono che si potessero incollare, **senza aprire prima quella pagina** — e il vincolo era perfino scritto nella spec (D-4). **Prima di scrivere codice che dipende da una schermata, aprire la schermata.**
2. ✅ **Task 8 — COLLAUDO DAL VIVO SUPERATO (2026-08-04).** Eseguito sullo staging vero con sessione admin, **0 bug bloccanti**. Contenuti demo tutti ripristinati e verificati riga per riga. Dettaglio completo nel ledger; in sintesi:
   - **Da anonimo:** middleware, pagine pubbliche, `robots.txt`, banner cookie SSR, Turnstile, gate GDPR (0 iframe), home coi 2 raduni futuri.
   - **Da loggato:** 4 server action riuscite; rotella a **51 ms** con `aria-busy` e opacità 1; **velo di attesa opacità 0 fino a 349 ms, 1.00 a 616 ms** (soglia CSS esatta); regola `pending` rispettata (Conferma sì, Annulla no); logout pulito.
   - **6 prove negative RLS, ognuna con controprova.** ⭐ **Il fix `2052d8d` è finalmente verificato dal vivo:** auto altrui sulla propria iscrizione → **403**, mentre la propria → **201**.
   - ⚠️ **Una previsione di questo file era sbagliata:** il velo sul salvataggio profilo **compare** (l'operazione dura ~950 ms sul piano gratuito). Non è un difetto.
3. ✅ **Merge fatto (2026-08-04, `e0a20c1`)** e `main` pushato. Verifiche verdi sul risultato del merge. **Branch non eliminato di proposito**: è ancora quello di produzione su Netlify (vedi il riquadro rosso sopra).

### Le tre strade davanti, ora che la 1E è chiusa

1. **Mostrare il sito al cliente** e raccogliere il suo giudizio. ⚠️ Da dirgli prima: le pagine legali sono **dichiaratamente bozze** coi `[DA COMPILARE]`, e l'email di conferma è quella **inglese di serie**. ⚠️ E il progetto Supabase gratuito **si mette in pausa dopo 7 giorni di inattività**: se lo apre dopo dieci giorni trova il sito morto (si riattiva dal dashboard in un minuto). **Decisione ancora da prendere.**
2. **Go-live pubblico** — dominio, contenuti legali reali (servono i dati del Titolare, da chiedere al cliente), **SMTP** (che porta con sé i template email dell'ex Task 9), Google OAuth, rimozione di `robots.ts`, e i due debiti del collaudo.
3. **Fase 2** — onboarding post-registrazione, news/blog, mappa dei raduni, gestione utenti, cancellazione account (promessa nella privacy della 1D).

### 🔎 Due rilievi dal collaudo — debiti, non blocchi

- **Le rotte protette rispondono 200, non più 307.** Regressione del `loading.tsx` per rotta del Task 10: il confine Suspense manda in strada l'intestazione HTTP prima che il server component esegua `redirect()`. **Misurato, non dedotto: 0 tracce di dati protetti** nel corpo di tutte e sei le rotte, e nel browser vero il redirect avviene. La barriera è RLS + `requireAdmin`, intatta. Unica conseguenza: **senza JavaScript** si resterebbe sullo scheletro invece di finire al login.
- **Il cookie di sessione Supabase non ha il flag `Secure`.** Non è una nostra omissione: `@supabase/ssr@0.12.0` non lo mette fra i default (verificato nel sorgente del pacchetto); il nostro `mcm_consent` invece ce l'ha. **Oggi è coperto da HSTS** (`max-age=31536000; includeSubDomains; preload`) + `http` → 301. ⚠️ **Da guardare al go-live**, quando il dominio nuovo non sarà in preload list: fix da due righe, `cookieOptions: { secure: true }` in [`server.ts`](../src/lib/supabase/server.ts), condizionato all'ambiente per non rompere lo sviluppo in `http`.

### ✅ Già fatto il 2026-08-03 (non rifarlo)

**Sito su Public + verifica funzionale superata:** `/` → `/it` **307** (prova che il middleware Node gira, il pezzo su cui Cloudflare è fallita); `/it`, `/it/eventi`, `/it/login`, `/it/privacy`, `/it/cookie` **200**; `/it/membri` → `/it/login` (guardia `(auth)` viva sul cloud); `/robots.txt` = `Disallow: /`; cookie banner 1D nel markup SSR.

**Task 4 (Turnstile) chiuso e verificato:** widget `marsica-car-meet-staging`, variabili su Netlify, redeploy fatto. Il widget emette un **token da 773 caratteri** (site key e hostname validi) e un login con password errata risponde **"Credenziali non valide"** invece di "Verifica anti-bot non superata" → la secret verifica davvero il token, e di conseguenza **il server Netlify parla con Supabase cloud**.

**Task 3 (collaudo auth/dati) chiuso:** URL di redirect configurate su Supabase **prima** di registrarsi (altrimenti il link di conferma punta a `localhost` e si brucia una delle 2 email/ora); admin `mcdevelop03@gmail.com` e membro `matteo050903@gmail.com` registrati e confermati; admin promosso via SQL e verificato **anche dalla UI**. Prove negative da anonimo **tutte superate**: `POST` su `events`/`profiles`/`event_registrations` → 401 `42501`; `profiles`/`vehicles`/`event_registrations` in lettura → `[]`; upload sui 4 bucket → 403; `storage list` → `[]`; `iscritti_per_eventi` → 200.

⚠️ **Due cose da non scambiare per guasti:**
- L'iframe di challenge Cloudflare logga righe `%c%d font-size:0;...` come *error* in console. È suo debug interno.
- L'**SQL Editor di Supabase dice "Success. No rows returned" anche quando la `update` non ha toccato niente**: non è una conferma. Verificare sempre con una `select`.

**Task 7 (contenuti demo) chiuso:** 3 eventi (Alba Fucens 13 set con capienza 40 e **2 iscritti**, Altopiano delle Rocche 4 ott senza capienza né ora di fine, Castello Piccolomini 11 lug **concluso** con 2 foto e 1 video), profili con avatar per admin e membro, 3 auto. Caricato **dalla UI**, quindi vale anche da collaudo. ⚠️ **Trappola di percorso:** in creazione non si può datare un evento nel passato, in **modifica** sì → l'evento concluso è stato creato con data futura e poi spostato indietro.

**Task 11 e 10 (home e feedback di caricamento) chiusi**, dettaglio nel ledger. In sintesi: la home mostra i prossimi raduni; ogni rotta ha il suo `loading.tsx`; schede dove ci sono schede e spinner altrove; i bottoni hanno lo stato "sto lavorando"; le operazioni lente coprono lo schermo con un velo dopo 350 ms.

**Falso allarme già chiarito:** l'host Supabase **non** compare nei chunk JS della pagina di login, ed è corretto — il client browser è importato solo da `AvatarUploader`/`VehicleForm`/`EventForm`/`AdminMedia` (pagine autenticate); login e registrazione passano da server action e parlano con Supabase dal server. Non riaprire questa indagine.

### 🔧 Provare l'interfaccia in locale contro il database CLOUD

La ricetta che il 2026-08-03 ha smascherato **tre** difetti che `tsc`, `lint`, 119 test e build
dichiaravano a posto. Non serve Docker né Supabase locale: si passano le variabili **inline**,
così `.env.local` (che punta al locale) **non va toccato**.

```bash
NEXT_PUBLIC_SUPABASE_URL="https://ubvhdliqnkfknhlczcnj.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="<publishable key, dal dashboard o dalle variabili Netlify>" \
npm run dev
```

Next dà la precedenza alle variabili già presenti nell'ambiente rispetto a `.env.local`.
Le chiavi Turnstile restano quelle **di test** di `.env.local`, che validano sempre: in locale
va bene. Ciclo di prova da secondi invece che da minuti di deploy.

⚠️ **A fine prova spegni il server**, altrimenti resta appeso sulla 3000 e il tentativo dopo
parte sulla 3001 senza che te ne accorga:
`Get-NetTCPConnection -LocalPort 3000 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`

### ⚠️ Il ledger di fase NON è su GitHub

`.superpowers/sdd/.gitignore` contiene `*`: il registro dettagliato
([`../.superpowers/sdd/2026-07-30-fase1e-staging-cloud/progress.md`](../.superpowers/sdd/2026-07-30-fase1e-staging-cloud/progress.md))
**vive solo su questo disco**. Questo file invece è in git. Conseguenza pratica: **tutto ciò
che serve a lavorare deve stare qui dentro**; nel ledger resta il ragionamento esteso, prezioso
ma non indispensabile. Se un giorno si cambia macchina o il disco si guasta, il ledger si perde
senza preavviso.

### Coordinate dello staging (nessun segreto qui dentro)

| Cosa | Valore |
|---|---|
| Sito Netlify | `polite-moxie-8dc031` · `https://polite-moxie-8dc031.netlify.app` |
| Team Netlify | `MatteoCaricolaDevelop` (account GitHub `mcdevelop03-lab`) |
| Branch di produzione | **`feat/fase1e-staging-cloud`** (non `main`) — è lì che sta `netlify.toml` |
| Supabase URL | `https://ubvhdliqnkfknhlczcnj.supabase.co` |
| Supabase Reference ID | `ubvhdliqnkfknhlczcnj` |
| Chiave Supabase | formato nuovo `sb_publishable_...` (pubblica per progettazione) |
| Turnstile widget | `marsica-car-meet-staging` (account Cloudflare `mcdevelop03@gmail.com`) · hostname `polite-moxie-8dc031.netlify.app` + `localhost` · mode `Managed` |
| Turnstile **site key** | `0x4AAAAAAEFGzaPemdBugJn1` (pubblica per progettazione: finisce nel bundle del browser) |
| Email admin | `mcdevelop03@gmail.com` |
| Email membro | `matteo050903@gmail.com` (autorizzata dall'utente il 2026-07-30) |

### ⚠️ Trappole scoperte oggi — non ripercorrerle

- 🚨 **Cloudflare Workers è un vicolo cieco per questo progetto.** `@opennextjs/cloudflare` **rifiuta** il middleware Node di Next 16: `proxy.ts` gira sempre su runtime Node e i Workers girano su `workerd`. Errore: *"Node.js middleware is not currently supported"*. È l'issue Cloudflare `workers-sdk#13755`. Aggiornare Next non risolve. **Non riprovare questa strada** finché l'adapter non dichiara il supporto.
- 🚨 **Vercel è escluso per scelta dell'utente:** il piano Hobby gratuito **vieta l'uso commerciale** nei termini, e il sito è per un cliente. Netlify invece **permette esplicitamente l'uso commerciale** sul piano gratuito: è per questo che è stato scelto.
- 🚨 **La build Netlify non gira in locale su questa macchina.** `netlify build --offline` fallisce nel bundling Deno dell'edge function del middleware (*"Could not load edge function"*). **Ipotesi: il progetto vive dentro `OneDrive\Desktop`**, che blocca e virtualizza i file. Su Linux (CI Netlify) **passa senza problemi**. Non perdere tempo a debuggarlo in locale: si verifica pushando.
- ⚠️ **Il nome della variabile della chiave Supabase non combacia.** Il dashboard Supabase la chiama `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, ma il codice legge **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**. Il valore nuovo funziona (verificato sul campo), ma va messo **sotto il nostro nome**. Sbagliarlo produce un guasto **silenzioso**: il sito compila e si apre, semplicemente non parla col database.
- ⚠️ **Le `NEXT_PUBLIC_*` sono incorporate nel bundle alla BUILD**, non lette a runtime. Cambiarle su Netlify richiede un **nuovo deploy**, non basta salvarle.
- ⚠️ **`db push` NON applica `supabase/seed.sql`.** Sul cloud l'admin va promosso a mano con la `update` del seed, dopo che si è registrato.
- ⚠️ **Sul cloud le email `@example.com` non funzionano più.** In locale le intercettava Mailpit; sul cloud la conferma deve arrivare a una casella vera. E il limite è **2 email di auth all'ora** (servizio email di default di Supabase, scelta D-4).
- ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` non è usata in `src/`** e **non va configurata da nessuna parte**: bypassa tutte le RLS.
- ⚠️ **Il progetto Supabase gratuito si mette in pausa dopo 7 giorni di inattività.** Se il cliente riapre il link dopo dieci giorni trova il sito morto (si riattiva dal dashboard in un minuto). Decisione su come gestirlo ancora da prendere.

### 💡 Osservazioni dell'utente dal collaudo del 2026-08-03

Tre segnalazioni guardando lo staging. Le prime due sono diventate **Task 9 e 10 della 1E** (sopra); la terza è rimandata di proposito.

- 🧭 **Velo di attesa (`OverlayAttesa`), 2026-08-03.** Pannello a schermo intero con rotella e messaggio, collegato dove l'attesa è reale: evento (creazione/modifica), auto, profilo, avatar, album. ⚠️ **La comparsa è ritardata di 350 ms e il ritardo lo fa il CSS** (`.velo-attesa` in `globals.css`), non un `setTimeout`: sotto la soglia non si vede nulla e il segnale resta la rotella nel bottone. **Non "correggere" togliendo il ritardo:** un velo che appare e sparisce in 200 ms è un lampo, e dà più fastidio del silenzio. Misurato: opacità 0 fino a 349 ms, 1.00 a 526 ms; intercetta i clic anche da trasparente, quindi il doppio invio è impossibile fin dal primo istante. Sull'album il messaggio è il contatore "3 di 12", perché il velo copre quello sotto al bottone.
- 🧭 **Regola introdotta il 2026-08-03, da rispettare:** `Button` ha una prop **`pending`** che va **solo** ai bottoni che *avviano* un'azione (submit, conferme, upload). Quelli che restano bloccati durante l'attesa — gli "Annulla" dei modali — tengono `disabled`. Motivo: `disabled` da solo è ambiguo, perché i form spengono il Salva anche a campi mancanti. E ogni rotta nuova vuole il suo **`loading.tsx`**, altrimenti quella pagina torna a caricare in silenzio (spiegazione in testa a `PageSkeleton`); le schede di `PageSkeleton` solo per le rotte a griglia, `PageSpinner` per tutte le altre.
- **Errori di form senza motivo, sotto il campo → da fare.** Emerso creando i contenuti demo: con una data d'inizio nel passato il browser marca il campo invalido, `Input` mette il bordo rosso e il Salva si spegne, ma l'unico testo è la riga generica `requiredHint` in fondo al form — **il motivo non lo dice nessuno**. Il browser ha già la spiegazione pronta in `validationMessage`: va stampata **sotto il campo** che l'ha causata. Riguarda **tutti i form** (passano tutti dallo stesso `Input`), non solo `EventForm`. **Urgenza onesta:** lo incontra l'**admin**, non il cliente che naviga — quindi non blocca l'approvazione, ma è il genere di cosa che fa arrendere chi dovrà gestire il sito.
- **Non si può creare un evento con data passata → decisione da rivedere.** In creazione `EventForm` stringe il `min` dell'inizio ad "adesso" ([`EventForm.tsx:76`](../src/components/features/events/EventForm.tsx)); in **modifica** no, il minimo torna al `2000-01-01` assoluto perché un evento passato dev'essere modificabile. Conseguenza: per avere un evento concluso (che è il presupposto dell'**album foto**) bisogna crearlo nel futuro e **poi** modificarlo all'indietro — un giro che nessuno indovina. Ma **caricare a posteriori i raduni già fatti, con i loro album, è un caso d'uso normale per un club**. `eventSchema` accetta già qualunque data fra 2000 e 2100, quindi il divieto vive solo nel `min` del client. **Da decidere:** toglierlo in creazione (e lasciare che sia l'admin a sapere cosa fa) oppure tenerlo con una spiegazione esplicita. Non toccato ora per non allargare la 1E.
- **Onboarding post-registrazione → rimandato alla Fase 2** (scheda completa in [`ROADMAP.md`](./ROADMAP.md)). L'utente proponeva un pop-up sul profilo; **sconsigliato**: c'è già il banner cookie come overlay, sui telefoni i modali sono ostili e il progetto usa sezioni **inline**. Direzione consigliata: atterraggio su `/it/profilo` (oggi è `/it/dashboard`, in [`auth/callback/route.ts`](../src/app/[locale]/(public)/auth/callback/route.ts)) + riquadro di benvenuto non modale che sparisce a profilo completo. **Non è una rifinitura: serve brainstorming + spec + piano.**

### Le altre strade, quando la 1E sarà chiusa

1. **Go-live pubblico** — dominio del club, contenuti legali reali (i `[DA COMPILARE]` con i dati del Titolare, da chiedere al cliente), SMTP vero, Google OAuth, rimozione di `src/app/robots.ts`.
2. **Fase 2** — news/blog, mappa interattiva dei raduni, gestione utenti admin, cancellazione account (promessa nella privacy policy della 1D). Vedi `docs/ROADMAP.md`.
3. **Micro-fase debiti** — `revalidatePath` e la **pulizia orfani storage**, che sono di sistema e toccano più fasi.

**Deferred-minor 1D NON bloccanti (follow-up):** banner senza `role`/`aria-live`/focus management; il banner riaperto dal footer non ha una X di chiusura (si chiude solo riscegliendo); `title="video"` dell'iframe non passa da i18n; `Stored` type/array-guard cosmetici. **Contenuti da completare:** i `[DA COMPILARE]` nelle policy (denominazione, sede, email del Titolare) e la validazione legale dei testi — oggi entrambe le pagine dichiarano onestamente di essere una bozza.

> ℹ️ **Note ambiente (2026-07-29):** Docker + Supabase locale accesi; dev server su **localhost:3000**. Admin `mcdevelop03@gmail.com` / `Marsica2026!`; membro `membro2.test@example.com` / `Membro2026!`. Evento concluso con media: `prova-primo-evento` (2 foto + 1 video). Dati di test **locali volatili** (spariscono con `db reset`).

**Debiti/follow-up NON bloccanti ereditati (micro-fasi dedicate):**
- Da 1E (collaudo 2026-08-04): **rotte protette a 200 invece di 307** (effetto del `loading.tsx` per rotta — nessuna fuga di dati, redirect vivo nel browser); **cookie di sessione Supabase senza `Secure`** (default della libreria, oggi coperto da HSTS — **da chiudere al go-live**).
- Da 1C-3: `Modal onClose` inline; hidden `<input type=file>` non `disabled`; `alt=""` thumbnail; lightbox senza `aria-label`/focus/scroll-lock; due `import type` accorpabili; map `mediaAdmin`/`mediaGallery` duplicata; anti-orfano batch non copre il ramo `throw`.
- Di sistema: `revalidatePath` (path non combacianti), **pulizia orfani storage di sistema**, `created_by` degli eventi leggibile da anon via PostgREST.

<!-- ─────────── STORICO ─────────── -->
<!-- Da qui in giù: esiti delle fasi già chiuse, decisioni di design da non ridiscutere e checklist di collaudo passate. Consultazione, non lavoro da fare. -->

## 📓 Storico — Fase 1C-2 (RSVP), architettura e trappole

> ⚠️ **Sezione storica.** La 1C-2 è **chiusa e mergiata**: il branch `feat/fase1c2-rsvp` non esiste più. Resta qui per le decisioni di architettura e le trappole da non reintrodurre.

**Metodo:** subagent-driven (implementer → reviewer indipendente → fix → verifica di persona del controller), stesso della 1C-1. **Branch partiva da `c461499` (= `main`, chiusura 1C-1).**

### I 7 task di codice (tutti completi e rivisti)

| # | Task | Commit(s) | Esito review |
|---|---|---|---|
| 1 | Migrazione `0009_rsvp.sql` (funzioni + RLS + grant) | `15d5e3f` + fix `8444ab6` | 2 Critical corretti (vedi sotto) |
| 2 | Tipi + logica pura `capienza.ts` + vitest | `ec34cb3` + fix `5452ede` | 1 Important (test discriminanti) |
| 3 | Server action RSVP (self+admin+ricerca) + i18n | `95dbe4f` | ✅ Approved |
| 4 | `RsvpBox` (partecipa/disdici, scelta auto) | `d1db04b` | ✅ Approved |
| 5 | Dettaglio evento (conteggio + montaggio + `Partecipanti`) | `911fb16` + fix `c4f81ff` | 2 Important (errori loggati) |
| 6 | Pannello admin iscritti + rimuovi | `80f88c6` + fix `4546a5c` | 1 Important (fuso data) |
| 7 | Iscrizione manuale admin | `28585e9` | ✅ Approved |
| — | **Review finale whole-branch (opus)** + fix | `2052d8d` | 0 Critical, 1 Important corretto |
| — | STATO-LAVORI (questo file) | `525454c` | — |

**Verifica offline (rifatta a fine branch): `tsc` + `lint` + `next build` + `npm test` (91/91) TUTTI VERDI.** Ledger completo: [`../.superpowers/sdd/progress.md`](../.superpowers/sdd/progress.md) (fidarsi del ledger e di `git log`, non della memoria).

### File toccati

- **Nuovi:** `supabase/migrations/0009_rsvp.sql`; `src/lib/rsvp/capienza.ts` (+`.test.ts`); `src/app/[locale]/(public)/eventi/[slug]/actions.ts`; `src/components/features/events/{RsvpBox,Partecipanti,AdminIscritti}.tsx`.
- **Modificati:** `src/types/database.ts` (tipi `RegistrationStatus`/`EventRegistration`/`RsvpEsito`); `src/app/[locale]/(public)/eventi/[slug]/page.tsx`; `src/messages/it.json` (namespace `rsvp`).

### Architettura (le decisioni prese, non ridiscuterle)

- **Nessuna nuova tabella:** `event_registrations`/`event_vehicles`/`events.capacity` esistevano già. La capienza conta **le persone (1 posto a iscrizione)**, non le auto.
- **La capienza è race-free per costruzione:** l'**unica** via per occupare un posto è la funzione `SECURITY DEFINER` **`iscriviti_evento`**, che fa `SELECT … FOR UPDATE` sulla riga dell'evento **prima** di contare e inserire → due iscrizioni concorrenti si serializzano. L'**insert diretto in `event_registrations` è stato RIMOSSO dalle RLS** (nessuna policy insert): non è bypassabile via PostgREST. Stessa funzione per il self e per l'admin (`p_user_id`).
- **Conteggio pubblico** via funzione aggregata `iscritti_per_eventi` (`SECURITY DEFINER STABLE`, grant a `anon`+`authenticated`): espone **solo il numero**, mai le righe → l'anon vede "X su Y posti" senza sapere chi.
- **Lista partecipanti ai loggati:** SELECT su `event_registrations`/`event_vehicles` **allargata agli autenticati** (nella `0009`).
- **Disdetta = hard delete** (niente stato `canceled`, niente waitlist: YAGNI). Auto facoltative (0..N); garage vuoto → si può "Partecipare senza auto".
- **RSVP solo se evento aperto:** il gate "concluso" è in **TS** (`eConcluso`, il fuso vive solo in `src/lib/date/fuso.ts`); la RPC copre solo i casi a rischio-corsa (capienza) + annullato.

### ⚠️ Trappole/fix già affrontati (non reintrodurli)

- 🚨 **`iscriviti_evento` — bypass auth chiuso (fix `8444ab6`):** l'identity check usa **`is distinct from auth.uid()`** (non `<>`: con `auth.uid()` NULL il `<>` dà NULL → l'eccezione non scattava, un anon poteva iscrivere una vittima). **Non toccare questo punto: è l'unica barriera reale.**
  - ⚠️ **Correzione misurata sul cloud il 2026-08-03.** Questa nota diceva anche che il `revoke execute … from public` della `0009` impedisce ad `anon` di chiamare la funzione. **È falso.** Una chiamata anonima **esegue il corpo** e viene respinta dall'eccezione interna (`28000 "non autenticato"`), non da un `42501 permission denied`; `proacl` mostra `anon=X/postgres`. La revoca a `PUBLIC` **non rimuove i grant che i singoli ruoli hanno in proprio** (qui arrivano dai default privileges sulle funzioni). Quindi **non indebolire il controllo interno pensando che la revoca faccia da rete**: non la fa. Follow-up non bloccante: aggiungere un `revoke execute … from anon` esplicito.
- **`event_vehicles_insert` irrobustita (fix `2052d8d`, dalla review finale):** ora richiede **anche** `owner_id = auth.uid()` sul veicolo, non solo la proprietà della registrazione (prima un membro poteva attaccare l'auto di un altro via PostgREST, e sarebbe comparsa sotto il suo nome nella lista). Da **verificare dal vivo** come prova negativa.
- **Errori Supabase mai confusi col vuoto:** conteggio e query garage in `page.tsx` loggano l'errore (fix `c4f81ff`); la data "iscritto il" usa `formattaDataBreve` (fuso Roma), non `toLocaleDateString` (fix `4546a5c`).
- **La nested select di `page.tsx` prende `town`/`socials` di proposito:** li usa il pannello admin. Non rimuoverli.

### ✅ Collaudo 1C-2: superato il 2026-07-23 (0 bug), migrazione `0009` applicata, fase mergiata

### 📓 Storico — checklist del collaudo 1C-1 (superata il 2026-07-21)

**Tutto il codice è scritto e rivisto** (Task 1-9 + review finale whole-branch + wave di fix). Resta **solo il collaudo dal vivo**, che richiede l'ambiente acceso (Docker + `npx supabase start` + `npm run dev` + browser + Mailpit + psql) — vedi "Come rimettere in moto l'ambiente" più sotto. ⚠️ **Il Task 1 ha fatto `db reset`: le utenze locali sono azzerate.** Servono **due account** (registrarli e confermarli da Mailpit) e l'admin va ripromosso rieseguendo la `update` di `supabase/seed.sql`.

### ✅ Checklist di collaudo del Task 10 (raccolta task per task)

**Percorsi funzionali (admin):** creare un evento (con e senza copertina) → riga in `events`, `cover_path` valorizzato, 1 file nel bucket; modificarlo → i `defaultValue` del form si popolano, lo slug **non cambia** cambiando il titolo, salvare senza toccare la foto la conserva, sostituirla non lascia più di 1 file; annullare → badge `ANNULLATO`, resta fra i Prossimi se futuro; ripristinare; eliminare un evento **vuoto** (riga + file via) e verificare che l'eliminazione di uno **con iscritti/foto** sia rifiutata con `notEmpty`.

**Le trappole che solo il browser può confermare:**
1. **Il bottone Salva del form si abilita?** `checkValidity()` è ricalcolato su `onInput`: se il cambio di `<Select>` o la scelta dal picker `datetime-local` **non emettono `input`**, il bottone **resta spento a form valido**. È la trappola numero uno del Task 5.
2. **L'ora è giusta a cavallo del cambio di ora legale?** Crea/modifica un evento delle **01:30 del 29 marzo** e uno del **25 ottobre**: l'ora salvata e rimostrata **non deve spostarsi** (il bug che ha morso nel Task 7). Verifica anche il round-trip col Postgres reale (formato `timestamptz` con/senza frazione).
3. **L'indicatore del calendario di `datetime-local`** è visibile sul tema scuro? (`Input.tsx` non lo stila.)
4. **Doppio submit rapido** durante l'upload della copertina.

**Superficie pubblica:** aprire `/eventi` **da sloggato** (finestra anonima) → si vede; **prossimi ordinati crescenti, conclusi decrescenti**; un **annullato passato** deve stare fra i **Conclusi** (non in cima ai Prossimi — era il Critical del Task 8); le `<img>` caricano le cover dal bucket pubblico; `opacity-50` sui conclusi; griglia responsive. Dettaglio `/eventi/[slug]`: slug inesistente → **404**; un evento con **mappa ma senza luogo** mostra comunque il link (fix della wave finale).

**Prove negative (sicurezza):**
- **POST diretto** alle server action da **non-admin** e da **sloggato** → respinto (redirect + RLS).
- `/admin/eventi/[id]/modifica` con **id malformato** → **404** (non "riprova più tardi").
- Un **anonimo** non deve poter leggere `created_by` degli eventi (le pagine pubbliche non lo selezionano; confermare che le RLS lo proteggano davvero).
- Upload su `event-covers` di file **>2 MB** e **MIME non ammesso** → respinti dal bucket.

**Cache:** dopo che un admin crea/annulla un evento, un **visitatore anonimo** vede la modifica su `/eventi` al reload (la pagina è dinamica → il debito `revalidatePath` non la tocca, ma va **confermato dal vivo**).

**Verifiche standard:** `npm test` (76 verdi), `tsc`/`lint`, e `rm -rf .next && npm run build` **verde** (ma **non** mentre gira `next dev`).

> **A collaudo finito:** correggere i bug emersi (commit dedicati), poi **chiudere la fase** con `superpowers:finishing-a-development-branch` (merge/PR). Solo allora la 1C-1 è completa e si può passare alla **1C-2 (RSVP)** — che ha già due nodi di design noti, vedi "Cosa aspetta le prossime sotto-fasi".

**Brainstorming, spec e piano sono fatti e approvati.** Si esegue col metodo **subagent-driven**: un subagent implementa il task, un secondo lo rivede in modo indipendente, il controller verifica di persona le affermazioni chiave, **poi si chiede l'ok all'utente prima del task successivo**.

- **Branch:** `feat/fase1c1-eventi`. ⚠️ **Solo locale, non pushato.**
- **Ledger di avanzamento** (sopravvive alla perdita di contesto, è la mappa di recupero): [`../.superpowers/sdd/progress.md`](../.superpowers/sdd/progress.md). ⚠️ **Fidarsi del ledger e di `git log`, non della memoria della conversazione.** I task che risultano `complete` lì **non vanno rifatti**.

### I 10 task

| # | Task | Stato |
|---|---|---|
| 1 | Migrazione `0008` + tipi `Event` | ✅ `38fa545` |
| 2 | Logica pura (fuso/stato/slug) + **vitest** | ✅ `fdebd45` — 22/22 test |
| 3 | Date, validazione, stringhe | ✅ `a6bedb2` |
| 4 | Server action admin (crea/aggiorna/annulla/ripristina/elimina) | ✅ `0951d5b` |
| 5 | `EventForm` + `/admin/eventi/nuovo` | ✅ `30b61f7` |
| 6 | Elenco admin + azioni | ✅ `8dd7bd9` |
| 7 | `/admin/eventi/[id]/modifica` | ✅ `d85f5df` — 57/57 test |
| 8 | `EventCard` + `/eventi` pubblica | ✅ `c0bbd21` — 65/65 test |
| 9 | `/eventi/[slug]` dettaglio | ✅ `572dbdc` |
| — | Review finale whole-branch + wave di fix | ✅ `eef9245` — 76/76 test |
| 10 | **Collaudo dal vivo e chiusura** | ✅ superato il 2026-07-21 (7 bug corretti) |

Dopo il Task 9 e prima del Task 10: **review finale whole-branch** (modello più capace) + **una sola wave di fix** con tutti i Minor accumulati nel ledger.

### Cose da sapere PRIMA di ripartire

- **Le date dell'evento sono validate a fondo (Task 4).** `eventSchema` respinge, con messaggi distinti: campo vuoto, **formato** diverso da `datetime-local` (`pippo`, secondi extra), **data inesistente nel calendario** (`31 febbraio`, mese 13, ora 25) e **anno fuori da 2000–2100**. Il controllo di calendario è un **round-trip** su `toISOString()`, non una tabella giorni-per-mese: gestisce i bisestili da sé (`2028-02-29` sì, `2026-02-29` e `1900-02-29` no) ed è coperto da test. **Non indebolirlo**: senza, `istanteDaOraItaliana()` o lancia `RangeError` (500) o salva in silenzio una data sbagliata.
- **Tre cose che solo il collaudo (Task 10) può dire**, segnalate dalla review del Task 5: che il cambio di `<Select>` e la scelta dal picker `datetime-local` emettano l'evento `input` (se non lo fanno, il bottone Salva **resta spento a form valido**, perché `checkValidity()` è ricalcolato su `onInput`); che l'indicatore del calendario di `datetime-local` sia visibile sul tema scuro (`Input.tsx` non lo stila); il doppio submit rapido durante l'upload.
- **Il progetto ora ha i test.** La Fase 1C-1 ha introdotto **vitest** (`npm test`), usato **solo per la logica pura**: `src/lib/date/fuso.ts`, `src/lib/events/stato.ts`, `src/lib/events/slug.ts`, `src/lib/validation/event.ts`. **76 test, tutti verdi.** Pagine, form e action restano verificati dal vivo. Aggiungere `npm test` alle verifiche di ogni task.
- **Lo stato dell'evento NON è un campo del DB:** lo calcola `statoEvento()` dalle date, a ogni render. Nella colonna `status` si scrive **solo** `'upcoming'` (= non annullato) o `'canceled'`; `'ongoing'`/`'completed'` non si usano mai (c'è un `comment on column` nel DB che lo dice).
- ⚠️ **`statoEvento()` ritorna `'annullato'` PRIMA di guardare le date** (l'annullamento vince sempre, e il badge `ANNULLATO` deve restare anche a data passata). Quindi **non usare `statoEvento(e) !== 'concluso'` per dire "è ancora un prossimo raduno"**: un annullato non diventa mai `'concluso'` e resterebbe fra i Prossimi in eterno (era il Critical del Task 8). Per la sola domanda "è finito?" c'è **`eConcluso(e)`** in `src/lib/events/stato.ts`, che ignora l'annullamento e guarda solo la data. `statoEvento` per il badge, `eConcluso` per la partizione.
- ⚠️ **Ordinare le date per istante, non per stringa:** `starts_at.localeCompare(...)` è **sbagliato** (PostgREST include la frazione di secondo solo quando è ≠ 0, e gli offset possono differire). Usare `new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()`.
- ⚠️ **Pagine pubbliche: mai `select('*')` su `events`.** La lettura è pubblica anche per gli sloggati, e `*` consegnerebbe `created_by` (FK ai profili, che il progetto tiene privato). Elencare solo le colonne che servono.
- **Il fuso è la trappola di questa fase** — e ha morso davvero, vedi qui sotto. Le date sono istanti assoluti e il server in produzione gira in **UTC**, ma il club è italiano: tutta la matematica di `Europe/Rome` sta **solo** in `src/lib/date/fuso.ts` (`mezzanotteSuccessiva`, `istanteDaOraItaliana`), ed è coperta da test. **Non duplicarla altrove.** In particolare `<input type="datetime-local">` non ha fuso: l'ora va convertita con `istanteDaOraItaliana()`, mai con `new Date(valore)`.

- 🚨 **`istanteDaOraItaliana` calcola lo scarto DUE VOLTE, e non è un caso.** Con un solo passaggio, un evento delle **01:30 del 29 marzo arretrava di un'ora a ogni apri-e-salva** della pagina di modifica, anche senza toccare il campo (corruzione silenziosa; il bug è emerso nel Task 7, primo chiamante del ramo "modifica"). Due limiti sono **deliberati e blindati da test — non "correggerli"**:
  - **Ottobre, ora ripetuta:** il 25 ottobre le 02:30 italiane esistono **due volte**, quindi sia `00:30Z` sia `01:30Z` si presentano come input `"02:30"`. Un round-trip perfetto è **impossibile per definizione**: la stringa non porta l'informazione su quale occorrenza fosse. Collassano sulla seconda.
  - **Marzo, ora inesistente:** le 02:00–02:59 del 29 marzo **non esistono**, e per un'ora inesistente **non c'è nessun punto fisso**: l'iterazione **non converge**, oscilla con periodo 2. Fermarsi a due passaggi è la scelta giusta (manda avanti, alle 03:30 locali). ⚠️ **Un refactor "miglioriamolo con un `while` fino a convergenza" romperebbe tutto in silenzio, mandando gli orari all'indietro.** C'è un test apposta.
- **Il Task 1 ha fatto `npx supabase db reset`:** le utenze locali sono **azzerate**. Per il collaudo (Task 10) servono **DUE account** (registrarli e confermarli da Mailpit su http://127.0.0.1:54324) e l'admin va ripromosso rieseguendo la `update` di `supabase/seed.sql`.
- **Migrazione `0008` già applicata e verificata:** limiti 2 MB + MIME su `event-covers` **e** `event-media`, colonna `events.cover_path`, `events.starts_at` ora `NOT NULL`, commento su `status`.
- **Ai bucket eventi NON manca la policy SELECT** (a differenza di `avatars`/`vehicles`): la `0003` li protegge con una policy **`for all`**, che in Postgres copre anche la SELECT. Non aggiungerne una: sarebbe un duplicato.
- **Le RLS degli eventi ci sono già** dalla `0002` (`events_select_public` = lettura pubblica anche da sloggati, `events_admin_write` = solo admin). Il layout `(admin)` chiama già `requireAdmin()`, **ma le server action non sono coperte da un layout**: ognuna deve richiamarlo per conto proprio.

### 🔧 Micro-fase da fare (emersa dalla review del Task 4): `revalidatePath`

**Tutte** le chiamate del progetto passano un path che **non combacia con la struttura dei file di route**: si scrive `revalidatePath("/admin/eventi")`, ma il doc di Next 16 (`node_modules/next/dist/docs/.../revalidatePath.md`, righe 26 e 81) dice che il path è la **struttura dei file**, non l'URL, e che **con un segmento dinamico il parametro `type` è obbligatorio**. La forma corretta è `revalidatePath("/[locale]/admin/eventi", "page")`.

Oggi il difetto è **mascherato**: in Next 16 una server action rinfresca comunque le pagine già visitate — comportamento che il doc stesso dichiara **"temporary"**. Il pattern sbagliato è ovunque (`garage/actions.ts:74,145,184`, profilo, eventi): **va corretto in un colpo solo, in una micro-fase dedicata, con collaudo dal vivo della cache.** Non farlo dentro un task della 1C-1.

**Quanto brucia, precisamente** (chiarito dalla review del Task 6): l'**elenco admin non dipende da quel meccanismo**. È una pagina dinamica — `createClient()` legge i cookie — quindi non esiste nessun render cachato lato server da invalidare, e il `router.refresh()` che `EventAdminActions` chiama dopo ogni azione la rifà da sé. Il debito morde sulla **superficie pubblica `/eventi`**, non sul pannello.

### 🔒 `created_by` degli eventi leggibile da un anonimo (debito, basso impatto)

Emerso dalle prove di sicurezza del collaudo (2026-07-21). Un anonimo può leggere `events.created_by` (l'UUID del profilo admin) via **PostgREST diretto** (`GET /rest/v1/events?select=created_by`): le RLS filtrano le **righe** (`events_select_public` è `using(true)`), **non le colonne**, quindi la protezione di quel campo è **solo applicativa** (la pagina `/eventi` fa una `select` esplicita che lo esclude). L'anonimo **non** accede comunque alla tabella `profiles` (protetta): trapela solo un UUID opaco, non i dati del profilo. **Non bloccante.** Fix possibile: revocare il `SELECT` su `created_by` ai ruoli `anon`/`authenticated`, oppure una vista pubblica che lo esclude.

### 🗑️ Pulizia dello storage — debito di sistema (deciso: NON si patcha a pezzi)

Il bucket `event-covers` accumula file orfani in tre casi, tutti scoperti dalla review del Task 5: **(a)** riselezionare lo stesso file dal disco dopo un submit fallito (l'input crea una nuova istanza `File`, quindi il riuso del path non scatta), **(b)** cambiare foto dopo un submit fallito (il path precedente non viene mai rimosso), **(c)** upload riuscito e creazione poi abbandonata. Il caso comune — **ritentativo dopo un errore del server** — è invece **chiuso**: un `useRef` ricorda `{file, path}` e lo riusa senza ricaricare.

**Decisione:** chiuderne una sola darebbe una falsa sensazione di completezza. Va affrontato **insieme al debito storage di 1B-2** (l'admin che cancella l'auto altrui lascia il file nel bucket), in un lavoro unico con una strategia vera — `remove()` sul path sostituito, oppure una funzione `SECURITY DEFINER` di pulizia.

### ⚠️ Minor già noti, da sistemare nella wave finale (non bloccanti)

0. **Task 9** — **`generateMetadata` manca** sul dettaglio `/eventi/[slug]`: è una pagina pubblica e condivisibile (lo slug immutabile serve proprio a condividere il link), ma senza di essa `<title>` e Open Graph restano generici — un link su WhatsApp/social esce senza titolo, data né copertina. Inoltre il blocco `Link` "Torna agli eventi" è duplicato verbatim fra ramo d'errore e ramo di successo (cosmetico).
0. **Task 7** — `garage/[id]/modifica/page.tsx` ha la struttura **identica** alla pagina di modifica dell'evento ma **non** ha ricevuto il fix `22P02`: un id veicolo malformato mostra ancora "Riprova più tardi" con HTTP 200 invece di un 404. Le due pagine gemelle ora divergono.
0. **Task 5** — il blocco di upload immagine è alla **terza copia** quasi identica (`EventForm`, `VehicleForm`, `AvatarUploader`): `labelClass`/`hintClass`, `MIME_AMMESSI`, `ESTENSIONI`, gli stati `file`/`anteprima`/`errore`/`caricando`, `onFileChange` e il markup del picker. Candidato a un hook `useUploadImmagine(bucket)` + un `<ImagePicker>`; `URL.createObjectURL` non è mai revocato in nessuna delle tre. Inoltre: `comprimiImmagine` restituisce l'**originale** se `createImageBitmap` fallisce o se il WebP non migliora, quindi in quel ramo un file >2 MB viene respinto dal bucket e l'utente vede solo il generico `uploadFailed`, mentre la stringa `coverRules` promette che "viene compressa automaticamente".
0. **Task 4** — `annullaEvento`/`ripristinaEvento` non distinguono "fatto" da "id inesistente" (un `update` che non colpisce righe non è un errore Supabase: la UI mostra successo); copertina orfana se l'insert fallisce dopo l'upload del client; `coverPath` preso grezzo dal `FormData` senza validazione; `aggiornamento: Record<string, unknown>` disattiva il type-check dei nomi di colonna.

1. **`fuso.test.ts`, test "usa il giorno ITALIANO, non quello UTC"** — con l'input `2026-07-12T21:30:00Z` il giorno italiano (23:30 del 12) e quello UTC (12) **coincidono**: il test non discrimina davvero, e la proprietà "usa il giorno italiano" **oggi non è coperta**. Fix: usare `2026-07-12T22:30:00Z` (a Roma è già il 13), atteso `"2026-07-13T22:00:00.000Z"`. *(È un difetto del piano, non dell'implementer.)*
2. **Commenti che citano `src/lib/events/stato.ts`** in `database.ts` e nel **commento SQL persistito nel DB**: se un giorno quella funzione venisse rinominata, va aggiornato anche il commento dentro Postgres.
3. **`eventSchema`**: con `starts_at` vuoto scatta anche il `refine` "fine dopo inizio". Impatto nullo (la action mostra solo `issues[0]`, il campo è `required`). Nessun fix necessario.

### Decisioni di design della 1C-1 (già prese, non ridiscuterle)

- **Stato derivato dalle date**; l'admin può solo **annullare**. Senza `ends_at`, l'evento resta "in corso" **fino a fine giornata italiana** (mezzanotte successiva) — così un raduno delle 10:00 non risulta "concluso" alle 10:01.
- **Pagina pubblica unica:** "Prossimi raduni" e sotto "Conclusi". Un **annullato con data futura resta fra i Prossimi**, con badge `ANNULLATO`: chi doveva venire deve vederlo.
- **Copertina facoltativa**, con segnaposto grafico che mostra il tipo di evento.
- **Slug generato dal titolo alla creazione e poi immutabile:** correggere il titolo non deve rompere i link già condivisi.
- **Annullare è l'azione normale; eliminare è possibile solo se l'evento è vuoto** (niente iscritti né foto): le foreign key sono `on delete cascade` e si porterebbero via iscrizioni e album.
- **Path della copertina piatto** (`{uuid}.webp`), non `{uid}/` né `{event-id}/`: in creazione l'evento non ha ancora un id, e `cover_path` registra comunque il file esatto.

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

## ✅ Esito micro-fase — Memoizzazione dell'autenticazione (2026-07-13)

Debito **saldato**. Spec: [`superpowers/specs/2026-07-13-memoizzazione-auth-design.md`](./superpowers/specs/2026-07-13-memoizzazione-auth-design.md) · Piano: [`superpowers/plans/2026-07-13-memoizzazione-auth.md`](./superpowers/plans/2026-07-13-memoizzazione-auth.md)

Un solo file toccato (`src/lib/auth/index.ts`), nessuna migrazione, nessuna call-site modificata:
1. `getUser` e `getProfile` avvolte in **`cache()` di React** (dedup per render pass).
2. **`getProfile` ora passa dalla `getUser()` memoizzata** invece di chiamare `supabase.auth.getUser()` per conto suo. Era il punto decisivo: senza, i due `getProfile` avrebbero continuato a fare un round-trip GoTrue ciascuno anche con `getUser` cachata.
3. Il controllo AAL estratto in una **`getAal()`** memoizzata. `requireUser` **non** è memoizzabile: fa `redirect()`, che funziona lanciando un'eccezione.
4. Contatore **dev-only** (`traccia`) permanente: se una fase futura rompe la deduplica, il log del dev server lo mostra subito.

**Numeri misurati** su `/it/profilo` (baseline riprodotta rimettendo temporaneamente la vecchia implementazione, non stimata):

| una richiesta | getUser | getProfile | getAal |
|---|---|---|---|
| prima | **3** | **2** | 1 |
| dopo | **1** | **1** | 1 |
| dopo, con 2FA attivo (AAL2) | **1** | **1** | 1 |

**Collaudo (tutto verde):** salvataggio profilo + upload avatar → dopo `revalidatePath` header e dashboard mostrano i dati **nuovi** (nessuna lettura stantia: è il test diretto della trappola qui sotto); pulizia avatar orfani ancora funzionante; guardia `(auth)`, login/logout, pannello admin; **enforcement 2FA** attivato davvero via TOTP (con sola password → `/it/login?mfa=1`, poi sfida MFA → dashboard), che è il percorso passante dalla nuova `getAal()`. `tsc`/`lint`/`build` verdi.

> ⚠️ La trappola delle **letture stantie nelle server action** che questa micro-fase introduce è documentata nella sezione di ripartenza di 1B-2 (sotto) e in un commento in testa a `src/lib/auth/index.ts`.

## ✅ Esito micro-fase — Rifiniture: stato 2FA + errori Supabase (2026-07-13)

Due debiti **saldati**. Spec: [`superpowers/specs/2026-07-13-rifiniture-2fa-errori-design.md`](./superpowers/specs/2026-07-13-rifiniture-2fa-errori-design.md) · Piano: [`superpowers/plans/2026-07-13-rifiniture-2fa-errori.md`](./superpowers/plans/2026-07-13-rifiniture-2fa-errori.md)

**Tema A — Impostazioni riflette il 2FA reale.** `TwoFactorSetup` è un componente client e partiva da stato vuoto: la pagina mostrava "Attiva 2FA" **anche a 2FA attivo**, e premere quel bottone creava **un secondo fattore a ogni clic**; la disattivazione dalla UI **non esisteva** (`unenrollTotp` era codice morto, come la stringa `disable2fa`) — chi attivava il 2FA restava senza via d'uscita. Ora la fonte di verità è il server: `impostazioni/page.tsx` legge `listFactors()` (solo i `verified`) e passa `attivo` al componente, che dopo enroll/disattivazione fa `router.refresh()`. `unenrollTotp()` **non accetta più il `factorId` dal client** (lo cerca lato server fra i fattori della sessione) e non chiede un codice TOTP: chi è su quella pagina col 2FA attivo è per forza già in **AAL2**. `enrollTotp()` ripulisce i fattori non verificati residui.

**Tema B — errori Supabase non più silenziati.** In `membri/` un guasto veniva spacciato per "Nessun membro trovato" o per un **404**. Ora l'errore si logga e la UI lo distingue dal vuoto; `notFound()` resta solo per "query riuscita, nessuna riga". Stesso `console.error` aggiunto in `getProfile()`, origine del pattern.

**Collaudo (tutto verde):** 3 clic su "Attiva 2FA" → **1 solo** fattore, non 3; dopo il reload la pagina dice "2FA attiva" (prima diceva "Attiva 2FA"); Annulla non tocca il fattore, Conferma lo rimuove (0 fattori nel DB) e la pagina si aggiorna da sé. Per il Tema B il guasto è stato simulato **revocando `SELECT` su `profiles`** (il PostgREST fermo produce un *blocco*, non un errore: non è quel percorso): `/membri` mostra "Impossibile caricare i dati", `/membri/[tag]` non è più un 404, entrambi loggano il codice `42501`; ripristinato il GRANT tutto torna normale e un tag inesistente dà ancora **HTTP 404**. `tsc`/`lint`/`build` verdi.

## ✅ Esito Fase 1B-2 — Garage (2026-07-15) — chiude la Fase 1B

**Cosa fa:** ogni membro ha un garage di auto (con foto) che può creare, modificare ed eliminare; il garage altrui è visibile in **sola lettura** agli altri loggati.

**Rotte aggiunte (tutte sotto `(auth)`):** **`/garage`** (il mio garage, griglia di schede con Modifica/Elimina), **`/garage/nuova`** (creazione), **`/garage/[id]/modifica`** (404 se l'auto non è tua). Il **garage del membro** è ora mostrato in sola lettura in **`/membri/[tag]`** (al posto del vecchio segnaposto "in arrivo"). Rimosso il segnaposto pubblico `(public)/garage`: la voce "Garage" dell'header ora punta alla rotta `(auth)` (da sloggato → login).

**Migrazione `0007_vehicles_storage.sql`:** chiude sul bucket `vehicles` gli stessi due difetti già pagati per `avatars` in 1B-1 — **policy SELECT `vehicles_select_own`** (senza, la cancellazione delle foto falliva in silenzio) + **limite 2 MB e vincolo MIME** — e aggiunge la colonna **`vehicles.image_path`** per cancellare il file giusto.

**Compressione immagini (richiesta utente):** utilità condivisa `src/lib/images/compress.ts` — ogni foto è ridotta a 1600px di lato lungo e riscritta in **WebP dal browser** prima dell'upload (nessuna libreria). Usata sia dal `VehicleForm` sia dall'avatar (regressione verificata). L'upload dell'auto parte **al salvataggio** (non alla scelta del file), perché `image_url` è `NOT NULL` e caricare prima seminerebbe orfani.

**Collaudo dal vivo (tutto verde, 2026-07-15, browser via Playwright + Mailpit + psql), 2 account (admin `mcdevelop03@gmail.com` + membro `membro.test@example.com`):**
1. **Creazione:** riga con `image_path` valorizzato, `specs` jsonb corretto, 1 file in `{uid}/`.
2. **Compressione:** foto realistica **6.75 MB → WebP 158 KB** (−98%); il MIME salvato è sempre `image/webp` (con rumore puro incomprimibile 3.44 MB → 756 KB, comunque WebP e −78%: caso peggiore di test).
3. **Sostituzione foto:** il conteggio file **non cresce** — la vecchia foto è cancellata (prova che la policy SELECT della `0007` funziona), nuovo `image_path` aggiornato.
4. **Eliminazione:** conferma in-linea a due passi; **Annulla** non tocca nulla, **Conferma** rimuove riga **e** file (0 orfani).
5. **Sola lettura e guardie:** dal 2° account il garage del 1° si vede **senza** Modifica/Elimina; `/garage/[id-altrui]/modifica` → **HTTP 404**; il proprio `/garage` mostra solo le proprie auto; da **sloggato** `/garage` → login.
6. **RLS dal vivo:** con la sessione del 2° utente, `UPDATE`/`DELETE` via PostgREST su un veicolo altrui → **0 righe** (auto integra).
7. **Storage negativo:** upload nel bucket `vehicles` di file >2 MB → **413**, MIME `application/pdf` → **415**, cartella di un altro utente → **403** (RLS).
8. **Regressione avatar:** foto profilo grande → salvata come **WebP 158 KB**, un solo file (nessun orfano).
9. **Build:** `rm -rf .next && npm run build` **verde** (`tsc`/`lint` verdi a ogni task).

**Debito noto (follow-up, non bloccante):** un **admin** può cancellare l'auto altrui (policy `vehicles_delete_owner_or_admin` sulla tabella) ma **non il file** nello storage — le policy dello storage limitano ciascuno alla propria cartella `{uid}/`, quindi resta un **file orfano** nel bucket. Fix possibile: policy admin sullo storage o funzione `SECURITY DEFINER` per la pulizia.

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

## 🔮 Cosa aspetta le prossime sotto-fasi (1C-2 e 1C-3)

**1C-2 — RSVP.** Prima di progettarla vanno affrontati **due nodi già individuati leggendo le RLS**, che cambiano il design:

1. **La capienza non è mostrabile con le RLS attuali.** La policy è `registrations_select_self_or_admin`: un membro vede **solo la propria** iscrizione, quindi **non può contare le altre** → non possiamo scrivere *"restano 8 posti su 20"* senza una via dedicata (funzione `SECURITY DEFINER`, contatore denormalizzato, o modifica delle RLS).
2. **La capienza non è applicabile senza corsa.** `registrations_insert_self` controlla **solo** `user_id = auth.uid()`: **nessun controllo di capienza**. Se lo si mettesse nella server action, **due utenti che prenotano insieme l'ultimo posto passerebbero entrambi**. Va risolto a livello DB.

Nota: l'enum `registration_status` include `waitlist`, ma **RF-24 dice "RSVP bloccato a esaurimento posti"**, non "va in lista d'attesa". La lista d'attesa sarebbe un sottosistema intero (promozione automatica, notifiche): probabilmente **YAGNI**, da confermare nel brainstorming.

**1C-3 — Album foto.** Il bucket `event-media` è **già configurato** dalla `0008` (2 MB, solo immagini). Per D-171 i **video sono link YouTube**, quindi quel bucket ospita **solo foto** e la compressione WebP esistente copre tutto. Lì avrà senso il path `{event-id}/`, perché le foto sono molte e si caricano su un evento già esistente.

## 🔧 Come rimettere in moto l'ambiente

Dalla root del progetto Next (`marsicaCarMeetFinal/marsicaCarMeetFinal/`):
1. Avvia **Docker Desktop** e attendi "running".
2. `npx supabase start` (dati nel volume Docker). Se serve pulito: `npx supabase db reset` (riapplica migrazioni 0001–0004 + seed).
3. `npm run dev` → **http://localhost:3000/it** (usa `localhost`, non `127.0.0.1`: l'HMR dev è legato a localhost e le email puntano lì).
4. Casella email locale = **Mailpit** su http://127.0.0.1:54324 (API: `/api/v1/messages`).
5. `.env.local` presente (gitignored); se manca vedi [`SETUP.md`](./SETUP.md).

Per promuovere un utente ad admin dopo la registrazione: rieseguire la `update` in `supabase/seed.sql` (il seed promuove solo se l'utente esiste già).

**Credenziali di test locali (volatili — si azzerano con `db reset`):** admin `mcdevelop03@gmail.com` / `Marsica2026!` (2FA disattivo). Da loggato, il **2FA** si attiva da **Impostazioni** (link nel menu/header, non serve più digitare l'URL).

> ⚠️ **Trappola: non lanciare `npm run build` mentre gira `next dev`.** Corrompe `.next` (il manifest delle server action) e tutte le pagine con `<form action={serverAction}>` iniziano a dare 404/500. **Rimedio:** killare il dev server, `rm -rf .next`, riavviare.

## 📌 Decisioni e regole permanenti (non dimenticare)

- **Email:** MAI usare l'email dell'account (`aidev3@goproject.it`). Admin di seed = **`mcdevelop03@gmail.com`**. Chiedere sempre conferma prima di usare qualsiasi email.
- **Ritmo:** dopo ogni task completato (con review), **fermarsi e chiedere** se proseguire.
- **Stop = aggiornare questo file** col punto di ripartenza.
- **Next.js 16** (non 15): consultare `node_modules/next/dist/docs/` prima di toccare API Next; convenzione `proxy.ts` (non `middleware.ts`).
- **Solo token di tema** per i colori; stringhe UI via next-intl (IT).

## 🐞 Note aperte (non bloccanti)

- ✅ **Reset password con 2FA attivo — RISOLTO e collaudato (2026-07-09).** GoTrue esige AAL2 per cambiare password con MFA attivo: ora il link di recovery porta alla sfida MFA e, dopo la verifica, si torna alla pagina di reset (`/it/reset-password/aggiorna`, spostata fuori dal gruppo AAL2) per impostare la nuova password. Commit `fix(auth): reset password funzionante con 2FA attivo`.
- **Google OAuth / Turnstile reali + progetto Supabase cloud** da configurare (solo codice presente; guida in [`SETUP.md`](./SETUP.md) §6).
- ✅ **Impostazioni non rifletteva il 2FA attivo — RISOLTO e collaudato (2026-07-13).** Vedi l'esito della micro-fase di rifinitura.
- Logo header troppo piccolo (feedback 2026-07-08).
- Messaggi di validazione zod hardcoded in italiano + prefisso `/it/` fisso in alcune redirect → sistemare con l'inglese (Fase 3).
- In dev l'app va usata su `localhost:3000` (su `127.0.0.1:3000` l'HMR e il caricamento di script esterni falliscono: artefatto solo-dev).
