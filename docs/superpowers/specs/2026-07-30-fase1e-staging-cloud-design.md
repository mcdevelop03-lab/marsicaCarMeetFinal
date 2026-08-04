# Fase 1E — Staging cloud — Design

> Spec approvata il **2026-07-30**. Segue la chiusura della Fase 1 (MVP).
> Non introduce funzionalità: rende raggiungibile fuori da Docker ciò che già esiste.
>
> ⚠️ **Riallineata il 2026-08-04: l'hosting è Netlify, non Cloudflare Workers.** La spec
> originale dava per buono `@opennextjs/cloudflare`; lo spike (Task 0) ha dimostrato che
> quell'adapter **rifiuta categoricamente** il middleware Node di Next 16, che questo progetto
> usa. Il rischio #1 della §8 si è materializzato, l'hosting è stato riscelto con l'utente e
> quel ramo è chiuso — vedi **D-1**. Le parti riscritte descrivono **ciò che è stato fatto
> davvero**, non ciò che si era previsto; dove la storia conta, è annotata.

## 0. Sintesi dell'esito (aggiunta il 2026-08-04)

Lo staging è **vivo, pieno e verificato**: `https://polite-moxie-8dc031.netlify.app`, servito
da Netlify a partire dal branch `feat/fase1e-staging-cloud`, appoggiato al progetto Supabase
cloud `ubvhdliqnkfknhlczcnj` (EU) con le migrazioni `0001`–`0010` applicate, Turnstile reale
attivo, `noindex`, e contenuti demo caricati dalla UI. Rispetto al piano originale la fase si
è allargata di **tre task** (9, 10, 11) nati da rilievi dell'utente in collaudo — vedi §6.

## 1. Perché questa fase esiste

L'MVP è completo e collaudato, ma vive **solo** dentro il PC dello sviluppatore: serve
Docker acceso, `npm run dev`, e un Postgres locale i cui dati **si azzerano a ogni
`db reset`**. Non esiste alcun indirizzo condivisibile.

C'è un **cliente finale che deve vedere e approvare il progetto**. Una demo guidata su
`localhost` sarebbe possibile ma fragile — Docker da avviare, la trappola documentata per
cui una `npm run build` lanciata mentre gira `next dev` corrompe `.next` e manda in 404
tutte le pagine con server action, e soprattutto **dati demo da ricostruire a mano ogni
volta**. Uno staging vivo elimina tutti e tre i problemi e permette al cliente di guardare
quando vuole lui.

Motivo tecnico indipendente dal cliente: i problemi del primo contatto col cloud
(adapter, HTTPS reale, cookie `Secure`, RLS con utenti veri, limiti dei bucket) non
spariscono rimandando. Diventano più costosi da diagnosticare, perché li si scopre con
fasi di codice nuovo impilate sopra e non si sa più a cosa attribuirli.

## 2. Obiettivo e confini

**A fine fase esiste** un URL `https://<nome>.netlify.app` che serve l'app
Next 16 reale, appoggiata a un progetto Supabase cloud in regione EU con le migrazioni
`0001`–`0010` applicate, Turnstile reale attivo su login e registrazione, `noindex` per i
motori di ricerca, contenuti demo presentabili e un collaudo mirato superato.

**Nessuna funzionalità nuova.** Un membro non vedrebbe una singola differenza rispetto al
locale. È una fase di infrastruttura: il valore è sapere che il codice regge fuori dal PC.

### Dentro

- Progetto Supabase cloud (EU) + push delle migrazioni `0001`–`0010`
- `@netlify/plugin-nextjs` + deploy su **Netlify**, build su CI a ogni push del branch
- Chiavi Turnstile reali
- `noindex` sullo staging
- Bottone "Continua con Google" nascosto quando il provider non è configurato
- Contenuti demo realistici caricati dall'admin
- Push di `main` su `origin` (42 commit oggi solo locali)
- Collaudo dal vivo mirato (§6)
- **Aggiunti in corsa (2026-08-03):** email di autenticazione in italiano, feedback di
  caricamento, prossimi raduni in home — vedi §6

### Fuori (per scelta, non per dimenticanza)

- **Dominio proprio** — lo staging usa il sottodominio `netlify.app` assegnato
- **Google OAuth** — il redirect URI è legato al dominio: configurarlo sull'host di staging
  sarebbe lavoro da rifare col dominio definitivo, per una funzione che su uno staging
  privato non userebbe nessuno
- **SMTP custom (Resend & co.)** — senza dominio verificato Resend in modalità test invia
  *solo* al titolare dell'account, cioè è **più** restrittivo del default Supabase
- **Contenuti legali** — i `[DA COMPILARE]` di `/privacy` e `/cookie` richiedono i dati
  reali del Titolare, che vanno chiesti al cliente
- **Debiti di sistema** — `revalidatePath`, pulizia orfani storage, `created_by` leggibile
  da anon
- **Fase 2 e successive**

> **Non più fuori:** la CI. Con Netlify la build **è** su CI per costruzione (si deploya
> pushando il branch), quindi la decisione D-3 è decaduta — vedi §4.

## 3. Architettura target

```
Browser ──► Netlify ────────────────► Supabase cloud (EU)
            Next 16 via                Postgres + Auth + Storage
            @netlify/plugin-nextjs     RLS delle migrazioni 0001-0010
            · 1 edge function = il middleware Node (proxy.ts)
            · 1 serverless function = SSR
            · statici serviti dalla CDN
   │
   └──► challenges.cloudflare.com (widget Turnstile)
            ▲
            └── /siteverify, chiamato dal server Netlify
```

**File nuovi:**

| File | Contenuto | Tracciato in git |
|---|---|---|
| `netlify.toml` | comando di build + `@netlify/plugin-nextjs` | sì |
| `src/app/robots.ts` | route handler Next 16 (**non** `public/robots.txt`, che non passa da i18n né dal build), `disallow: "/"` | sì (da rimuovere al go-live) |

**Nessun file esistente cambia per l'hosting.** In particolare `src/proxy.ts` **non va
toccato**: è il middleware Node di Next 16, ed è esattamente il pezzo che ha deciso la scelta
dell'host (D-1). Netlify lo avvolge in una edge function da sé, senza chiedere modifiche.

⚠️ **La build Netlify non gira su questa macchina.** `netlify build --offline` fallisce nel
bundling Deno dell'edge function del middleware (*"Could not load edge function"*). Ipotesi
principale, mai smentita: il progetto vive dentro `OneDrive\Desktop`, che blocca e virtualizza
i file — rottura nota per i bundler, e Deno è esattamente quel tipo di strumento. Su Linux (la
CI Netlify) **passa senza problemi**. Non perderci tempo: si verifica pushando.

## 4. Decisioni di design (prese, da non ridiscutere)

**D-1 — Netlify.** *(Riscritta il 2026-08-04. La versione originale diceva "Cloudflare
Workers, non Cloudflare Pages"; la storia sotto resta perché è il motivo per cui non si
ritenta quella strada.)*

🚨 **Cloudflare Workers è un vicolo cieco per questo progetto, e non per un difetto di
configurazione.** `@opennextjs/cloudflare@1.20.2` (l'ultima su npm) **rifiuta la build**
quando rileva un middleware Node: `ERROR Node.js middleware is not currently supported.
Consider switching to Edge Middleware.` In Next 16 `proxy.ts` gira **sempre** su runtime Node
e non può essere spostato su edge; i Workers girano su `workerd`. È l'issue Cloudflare
`workers-sdk#13755`. Aggiornare Next non risolve: il rifiuto riguarda il middleware, non la
versione. **Non riprovare finché l'adapter non dichiara il supporto.**

**Vercel è escluso per scelta dell'utente:** il piano Hobby gratuito **vieta l'uso
commerciale** nei termini, e questo sito è per un cliente. Il vincolo dell'utente è *nessuna
spesa finché il cliente non approva*.

**Netlify soddisfa entrambi i vincoli:** il piano Starter gratuito **permette esplicitamente
l'uso commerciale**, e `@netlify/plugin-nextjs` **gestisce** il middleware Node invece di
rifiutarlo — la build genera `.netlify/edge-functions/___netlify-edge-handler-node-middleware/`
che importa `./server/node-middleware.js` e lo avvolge. **Verificato sul campo, non dedotto:**
il deploy summary dice "1 edge function deployed" e `/` risponde **307 → `/it`** in produzione,
cioè il middleware gira davvero.

*Fallback mai servito, da tenere in tasca:* un host Node puro (Render, Railway) che esegue
`next start` senza alcun adapter — lì un'incompatibilità del genere è impossibile per
costruzione. Ma costa, quindi violerebbe il vincolo "gratis fino all'approvazione".

**D-2 — Nessuno store di cache aggiuntivo.** *(Era "niente R2, niente KV"; la sostanza non
cambia con Netlify.)* Praticamente ogni pagina legge i cookie (sessione Supabase,
`mcm_consent`) ed è quindi dinamica: non esiste una cache incrementale da conservare. Gli
statici li serve la CDN di Netlify. *Conseguenza accettata:* ogni richiesta è SSR, nessuna
pagina cachata al bordo — e sul piano gratuito questo si somma al **cold start**, che è parte
della lentezza percepita e che nessun `loading.tsx` elimina (onestà da mantenere col cliente).

**D-3 — DECADUTA: si deploya da CI.** *(L'originale diceva "deploy da locale con `wrangler`,
non da CI", per non avere un secondo posto dove sbagliare le variabili.)* Con Netlify la scelta
non esiste: il deploy parte dal push del branch, quindi la build **è** su CI. Le variabili
vivono in un posto solo (il dashboard Netlify), il che elimina il rischio che D-3 voleva
evitare. **Corollario che ha cambiato l'ordine dei task:** il push di `main`/branch su GitHub
da messa-in-sicurezza è diventato **prerequisito tecnico del deploy**.

⚠️ **Il branch di produzione su Netlify è `feat/fase1e-staging-cloud`, non `main`** — è lì che
vive `netlify.toml`. Al merge di fine fase va cambiato, altrimenti lo staging resta appeso a un
branch che nessuno aggiorna più.

**D-4 — Email: servizio Supabase di default.** Limite accettato: **2 email di auth all'ora**.
I destinatari **non** sono ristretti. Su uno staging privato è sufficiente; l'SMTP vero è un
task della fase pubblica.

🚨 **Questa decisione ha un costo che era scritto qui fin dall'inizio e che è stato ignorato:
col mailer condiviso i template NON sono personalizzabili.** Misurato sul dashboard il
2026-08-04, pagina *Authentication → Emails*: *"Set up custom SMTP to edit templates. Emails
will be sent using the default templates. Set up custom SMTP to edit their subject and body."*
Oggetto e corpo sono **bloccati**, non solo scomodi.

**Storia di un errore, da non ripetere.** Il 2026-08-03 il **Task 9** è nato per rendere
presentabile l'email di conferma, e i due template sono stati scritti dando per buono che si
potessero incollare nel dashboard — **senza che nessuno aprisse quella pagina prima di scrivere
il codice**. Il 2026-08-04, riallineando la documentazione, questa D-4 è stata perfino
*"corretta"* dichiarando **falso ciò che era vero**. L'errore è emerso solo quando l'utente ha
aperto il dashboard per incollare. **È la stessa lezione del Task 10:** un presupposto che
nessuno ha osservato non è un fatto, per quanto sia plausibile e per quanto codice ci sia già
costruito sopra.

Restano non rimovibili, dalla stessa causa: il footer *"powered by Supabase"* e il limite di
2 email/ora. **Tutte e tre le limitazioni cadono insieme, e solo con un SMTP nostro.**

**D-5 — Conferma email resta attiva.** Disattivarla accorcerebbe il collaudo ma
significherebbe non collaudare il flusso vero, e dimenticarsi di riattivarla sarebbe un
buco di sicurezza.

**D-6 — Privatezza: `noindex` + URL non divulgato.** Nessuna infrastruttura aggiuntiva.
Chi indovinasse l'URL vedrebbe home ed eventi con dati demo: accettabile.

**Confermata sul campo, dopo aver provato l'alternativa.** Netlify pubblica i siti come
**Private** per default: tutte le rotte rispondevano **401** rimandando ad `edge-access`, cioè
il cliente non sarebbe potuto entrare senza un account nel team — inaccettabile, visto che è il
motivo per cui lo staging esiste. La *password protection* (link + password al cliente, che
sarebbe stata ideale) **non è sul piano gratuito**. Restavano Private e Public → si è tornati a
D-6, con la visibilità su **Public**. Le Deploy Preview restano Private.

**D-7 — Approccio incrementale, una variabile alla volta.** Prima l'app **locale** contro
il Supabase **cloud** (ogni rottura è per forza configurazione cloud), poi il deploy (ogni
nuova rottura è per forza l'hosting). Bisezione pulita, al prezzo di un passaggio in più.
Nota: l'ordine inverso è **impossibile**, un sito deployato non raggiunge il Supabase in Docker
sul PC.

*Ha pagato due volte.* La stessa idea, applicata alla UX, è diventata la ricetta che il
2026-08-03 ha smascherato **tre** difetti che `tsc`, `lint`, 119 test e build dichiaravano a
posto: dev server locale puntato al **Supabase cloud** (variabili inline, `.env.local` non
toccato) e navigazione pilotata dal browser. Ciclo di prova da secondi invece che da minuti di
deploy. **Il verde non dice che funziona, dice che compila.**

**D-8 — Lo spike dell'hosting è il task zero.** È l'unica incognita tecnica reale della
fase e non richiede alcun account: va risolta prima che l'utente apra il primo account.

**Questa decisione ha salvato la fase.** Lo spike è fallito (D-1) prima che l'utente avesse
aperto un solo account Cloudflare: il costo del cambio di hosting è stato un revert e uno
spike nuovo, non la riscrittura di una fase già configurata.

**D-9 — Il bottone Google si nasconde via variabile pubblica, non cancellando codice.** Il
gate è `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`: assente o diverso da `"true"` → il bottone
"Continua con Google" non viene renderizzato in `login/page.tsx` e `registrati/page.tsx`.
Nessuna riga di `signInWithGoogle` viene rimossa: alla fase pubblica basta valorizzare la
variabile. *Motivo:* oggi quel bottone è **incondizionato** e sullo staging darebbe errore.

## 5. Configurazione e segreti

Le variabili si dividono in due classi che **non** si configurano allo stesso modo:

| Variabile | Classe | Dove va |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | build-time, inlined nel bundle client | variabili d'ambiente **Netlify** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem | idem |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | idem | idem |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | idem | **assente sullo staging** (vedi D-9) |
| `TURNSTILE_SECRET_KEY` | runtime, solo server | variabili d'ambiente Netlify |
| `SUPABASE_SERVICE_ROLE_KEY` | **non usata dall'app** | **da nessuna parte** |

⚠️ **Il nome della chiave Supabase non combacia, e sbagliarlo è un guasto silenzioso.** Il
dashboard Supabase la chiama `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; il codice legge
**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**. Il valore nuovo (formato `sb_publishable_...`, non più il
JWT `eyJ...`) funziona — verificato sul campo — ma va messo **sotto il nostro nome**. Col nome
sbagliato il sito compila e si apre, semplicemente non parla col database.

### Le tre trappole note

**(a) `NEXT_PUBLIC_*` e il guasto muto.** Quelle variabili vengono incorporate nel
JavaScript **al momento della build**. Se si configurano solo come variabili di runtime, la
build produce un bundle con `undefined` dentro e **non c'è nessun errore**: semplicemente
il widget Turnstile non appare e il client Supabase non si crea. Mitigazione: il criterio
di uscita del task Turnstile è letteralmente "il widget appare".

⚠️ **Corollario specifico di Netlify, costato un giro:** cambiare una `NEXT_PUBLIC_*` nel
dashboard **non basta**, serve un **nuovo deploy**. Salvare la variabile non ricompila niente.

**(b) `SUPABASE_SERVICE_ROLE_KEY` non va spedita.** Verificato con grep: non è usata in
nessun punto di `src/`, esiste solo in `docs/` e `.env.local.example`. È la chiave che
bypassa **tutte** le RLS. Spedirla sul Worker per abitudine sarebbe il singolo peggior
rischio della fase.

**(c) Redirect URL di Supabase.** `site_url` e `additional_redirect_urls` devono includere
l'URL dello staging con `/it/auth/callback` e il glob `**`, altrimenti la conferma email
non fa l'auto-login. È esattamente il bug #2 del collaudo di Fase 1A, e sul cloud si
ripresenta identico perché l'URL cambia.

**Il meccanismo, misurato:** il link di conferma è costruito come `${origin}/it/auth/callback`
in `auth/actions.ts:33`, ma Supabase lo onora **solo se sta nella sua allow-list**; altrimenti
ripiega **in silenzio** sul Site URL, che su un progetto nuovo è `http://localhost:3000`.
Configurazione finale: Site URL = l'host di staging, Redirect URLs = quell'host con `/**`
**più** `http://localhost:3000/**`, per non rompere lo sviluppo locale.

⚠️ **Va configurato PRIMA di registrare il primo account**, non dopo: sbagliarlo brucia una
delle 2 email/ora su un link che punta a `localhost`.

### Locale vs cloud

Lo sviluppo continua a puntare a Docker. **Non serve però scambiare `.env.local`** per parlare
col cloud, come diceva la versione originale: basta passare le variabili **inline** al dev
server, perché Next dà la precedenza all'ambiente su `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<REFERENCE_ID>.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="<publishable key>" \
npm run dev
```

Le chiavi Turnstile restano quelle **di test** di `.env.local`, che validano sempre: in locale
va bene. Nessun file da scambiare, nessun rischio di dimenticare `.env.local` puntato al posto
sbagliato.

### Cosa `db push` NON fa

**`db push` non applica `seed.sql`.** Sul cloud l'admin va promosso a mano dopo essersi
registrato, esattamente come in locale.

## 6. Sequenza dei task

*(Tabella riscritta il 2026-08-04 con la numerazione realmente eseguita e i tre task aggiunti
in corsa. La numerazione del **piano** differisce da quella originale della spec: il `noindex`
+ gate Google è stato anticipato prima del deploy, per non lasciare finestre di indicizzazione
e per risparmiare un deploy.)*

| # | Task | Criterio di uscita | Stato |
|---|---|---|---|
| 0 | **Spike dell'hosting.** **Nessun account toccato.** | la build dell'adapter completa e la preview serve la home **e** una pagina con server action | ❌ **fallito su Cloudflare** (D-1) → rifatto su Netlify, ✅ passato in CI |
| 1 | Push di `main` e del branch su `origin` | `git rev-list --count` = 0 su entrambi | ✅ |
| 2 | Progetto Supabase cloud (EU) + `link` + `db push` | le 10 migrazioni applicate; `pg_policies` combacia col locale (26 policy) | ✅ |
| 3 | **App → Supabase cloud**, collaudo del blocco DB/auth | registrazione + conferma email, promozione admin, prove RLS negative, limiti dei bucket | ✅ |
| 4 | Turnstile reale (chiavi + hostname registrato) | widget visibile e **la secret verifica davvero** | ✅ |
| 5 | `noindex` + bottone Google dietro un flag | `robots` nega tutto; le pagine auth non mostrano il bottone morto | ✅ `e4fa307` |
| 6 | Deploy su Netlify + redirect URL Supabase aggiornati | la home risponde in HTTPS sull'URL di staging | ✅ |
| 7 | Contenuti demo caricati **dalla UI** dall'admin | 3 eventi (futuro con RSVP, futuro senza capienza, concluso con album), profili con avatar, auto in garage | ✅ |
| 9 | **Email di autenticazione presentabili** *(aggiunto)* | i due template italiani sono nel dashboard e una prova vera arriva leggibile **da telefono** | ➡️ **USCITO DALLA FASE** (2026-08-04): bloccato dal mailer condiviso (D-4), **confluito nel task SMTP del go-live**. I file `633dff2` restano pronti |
| 10 | **Feedback di caricamento** *(aggiunto)* | scheletro/spinner a ogni cambio pagina, stato "sto lavorando" sui bottoni | ✅ in 4 riprese, l'ultima `acc4633` |
| 11 | **Prossimi raduni in home** *(aggiunto)* | la home mostra fino a 3 eventi futuri | ✅ `68dad51` |
| 8 | Collaudo mirato + allineamento docs | §7 superata; spec, piano, `SETUP.md`, `STATO-LAVORI.md`, `ROADMAP.md` allineati | 🟡 in corso |

I task 2, 4, 6 e parte del 9 richiedono azioni **manuali nel browser dell'utente** (creazione
account, chiavi, consensi, incollaggio dei template): il ruolo dell'assistente lì è fornire un
runbook passo-passo e verificare gli esiti, non eseguire.

### Perché la fase si è allargata di tre task

Nascono tutti e tre da **rilievi dell'utente guardando lo staging**, cioè dalla cosa per cui lo
staging esiste. Il criterio con cui sono stati accettati: *il cliente lo vede?*

- **Task 9** — chi si registra riceve oggi il template inglese di serie di Supabase. Il cliente
  si registrerà davvero, quindi quella email fa parte di ciò che valuta.
- **Task 10** — navigazione lenta e **nessun** segnale di caricamento, quindi si clicca più
  volte. Causa accertata e non ipotizzata: `find src -name loading.tsx` → nessun risultato.
- **Task 11** — la home aveva un `<Badge>Prossimi raduni</Badge>` scritto a mano nel JSX che
  **annunciava una sezione inesistente**. Invisibile finché il sito era vuoto.

**Rimandato di proposito:** l'onboarding post-registrazione → Fase 2. Non è una rifinitura,
è una funzionalità: serve brainstorming + spec + piano.

## 7. Collaudo: cosa si prova e cosa no

Non si rifà la Fase 1. Si provano **solo** le cose che possono comportarsi diversamente
fuori da Docker:

- **Server action attraverso l'adapter** — è il meccanismo su cui poggia ogni form del sito
  (profilo, garage, eventi, RSVP). Se l'adapter sbaglia qualcosa, sbaglia qui.
- **Cookie su HTTPS reale** — sessione Supabase e `mcm_consent` col flag `Secure`, che in
  locale su `http` non è mai stato esercitato.
- **Conferma email col dominio nuovo** — trappola (c) di §5.
- **Limiti dei bucket sul cloud** — 2 MB e vincolo MIME sono nelle migrazioni, ma vanno
  visti respingere davvero.
- **Una prova negativa RLS** con utenti veri: un membro non modifica il profilo o il garage
  di un altro.
- **Gate GDPR YouTube** su HTTPS e **Turnstile** che respinge.

**Non** si riprovano logica pura, fuso orario e validazione: sono coperti dai 119 test e non
dipendono dall'ambiente.

⚠️ **Aggiunta dopo il 2026-08-03, pagata tre volte:** il collaudo deve coprire anche le
**modifiche di UX** introdotte in corsa (Task 10). `tsc`, `lint`, 119 test e build erano
**tutti verdi mentre il comportamento era sbagliato** — lo scheletro di caricamento non
compariva *mai*, e nessuna verifica offline poteva dirlo. Le modifiche di UX si provano su un
dev server puntato al Supabase cloud, prima del push.

## 8. Rischi e piani B

*(Aggiornata il 2026-08-04 con l'esito reale di ciascun rischio.)*

1. **Lo spike dell'adapter fallisce.** Rischio più alto, mitigato mettendolo per primo.
   🚨 **SI È MATERIALIZZATO** — vedi D-1. Il piano B previsto era Vercel; l'utente l'ha
   **escluso** (uso commerciale vietato dal piano Hobby, e qui c'è un cliente vero) e si è
   scelta **Netlify**, che l'uso commerciale lo permette esplicitamente. Costo reale: un
   revert, uno spike nuovo, e la riscrittura di §3-§4 — **non** il resto della fase. La
   mitigazione ha funzionato esattamente come sperato.
2. **Il limite di 2 email/ora blocca il collaudo.** Si registrano gli account con calma. Se
   diventa un impiccio serio, su uno staging è legittimo confermare un account a mano via
   SQL. *Esito: mai diventato bloccante, ma ha reso critico configurare le redirect URL*
   **prima** *di registrarsi — trappola (c).*
3. **Pausa del progetto free dopo 7 giorni di inattività — tocca direttamente il cliente.**
   Se lui riapre il link dopo dieci giorni di silenzio trova il sito morto. Si riattiva dal
   dashboard in un minuto. ⏳ **Decisione ancora da prendere** (task 8): avvisare il cliente
   e riattivare a mano prima delle demo, un ping programmato, o il piano Pro.
4. **`NEXT_PUBLIC_*` assenti al momento della build** → guasto muto. Vedi trappola (a).
   *Esito: si è presentato in forma attenuata al task 4 — le variabili Turnstile erano salvate
   ma non ricompilate. Diagnosticato in un minuto perché il criterio di uscita era osservabile
   ("il widget appare"), non deducibile.*
5. **Costi: zero.** Rispettato: tutto nei piani gratuiti, nessuna carta registrata.
6. **Rischio non previsto, emerso: la build non gira in locale.** Il bundling Deno
   dell'edge function fallisce su questa macchina (ipotesi `OneDrive`), quindi **ogni verifica
   dell'hosting passa da un push**. Mitigazione trovata: per tutto ciò che non è
   specificamente l'hosting, il dev server locale contro il Supabase cloud (D-7).

## 9. Da comunicare al cliente

`/privacy` e `/cookie` sono **dichiaratamente bozze** e contengono `[DA COMPILARE]` al posto
dei dati del Titolare (denominazione, sede, email), più un `[DA VERIFICARE]` sulle garanzie
di trasferimento extra-UE. È corretto che sia così — servono i suoi dati reali e una
validazione legale — ma è meglio anticiparglielo che lasciarglielo scoprire cliccando.

## 10. Cosa resta dopo, per il go-live pubblico

Dominio del club + DNS, contenuti legali reali, Google OAuth col redirect URI definitivo,
rimozione del `noindex`, e la valutazione se passare al piano Supabase Pro (niente pausa per
inattività, backup).

**SMTP custom — è diventato un task che porta con sé il Task 9.** Non è più solo "togliere il
footer": sblocca **tre cose in un colpo** che oggi non si possono avere separatamente —

1. il footer *"powered by Supabase"* sparisce;
2. il limite di **2 email di auth all'ora** cade;
3. **i template italiani già scritti** in `supabase/email-templates/` diventano applicabili
   (oggi il dashboard li rifiuta, D-4).

⚠️ **Vincolo sulla scelta del provider:** senza un dominio verificato, **Resend in modalità test
invia solo al titolare dell'account** — inutile per far provare il sito a qualcun altro. Se
l'SMTP si configura **prima** che il dominio del club esista, serve un provider che permetta di
verificare un **singolo indirizzo mittente**. Col dominio, il vincolo sparisce.

⚠️ **Tre cose legate al dominio, che al cambio vanno toccate insieme** o restano appese
all'indirizzo di staging: gli **URL di redirect Supabase** (trappola (c)), l'**hostname del
widget Turnstile**, e l'**URL assoluto del logo nei template email** — che va cambiato in
`supabase/email-templates/` **e** nel dashboard, perché nelle email non esistono percorsi
relativi.

⚠️ **`NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` è inlinata a build-time:** al go-live servirà un
**rebuild**, non un toggle.
