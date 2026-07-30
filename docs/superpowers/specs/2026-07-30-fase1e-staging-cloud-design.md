# Fase 1E — Staging cloud — Design

> Spec approvata il **2026-07-30**. Segue la chiusura della Fase 1 (MVP).
> Non introduce funzionalità: rende raggiungibile fuori da Docker ciò che già esiste.

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

**A fine fase esiste** un URL `https://<nome>.<account>.workers.dev` che serve l'app
Next 16 reale, appoggiata a un progetto Supabase cloud in regione EU con le migrazioni
`0001`–`0010` applicate, Turnstile reale attivo su login e registrazione, `noindex` per i
motori di ricerca, contenuti demo presentabili e un collaudo mirato superato.

**Nessuna funzionalità nuova.** Un membro non vedrebbe una singola differenza rispetto al
locale. È una fase di infrastruttura: il valore è sapere che il codice regge fuori dal PC.

### Dentro

- Progetto Supabase cloud (EU) + push delle migrazioni `0001`–`0010`
- Adapter `@opennextjs/cloudflare` + deploy su Cloudflare Workers
- Chiavi Turnstile reali
- `noindex` sullo staging
- Bottone "Continua con Google" nascosto quando il provider non è configurato
- Contenuti demo realistici caricati dall'admin
- Push di `main` su `origin` (42 commit oggi solo locali)
- Collaudo dal vivo mirato (§6)

### Fuori (per scelta, non per dimenticanza)

- **Dominio proprio** — lo staging usa `workers.dev`
- **Google OAuth** — il redirect URI è legato al dominio: configurarlo su `workers.dev`
  sarebbe lavoro da rifare col dominio definitivo, per una funzione che su uno staging
  privato non userebbe nessuno
- **SMTP custom (Resend & co.)** — senza dominio verificato Resend in modalità test invia
  *solo* al titolare dell'account, cioè è **più** restrittivo del default Supabase
- **Contenuti legali** — i `[DA COMPILARE]` di `/privacy` e `/cookie` richiedono i dati
  reali del Titolare, che vanno chiesti al cliente
- **Debiti di sistema** — `revalidatePath`, pulizia orfani storage, `created_by` leggibile
  da anon
- **Fase 2 e successive**
- **CI/CD** (Workers Builds) — vedi §4, decisione D-3

## 3. Architettura target

```
Browser ──► Worker Cloudflare ──► Supabase cloud (EU)
            (Next 16 via OpenNext,   Postgres + Auth + Storage
             nodejs_compat)          RLS delle migrazioni 0001-0010
   │
   └──► challenges.cloudflare.com (widget Turnstile)
            ▲
            └── /siteverify, chiamato dal Worker
```

**File nuovi:**

| File | Contenuto | Tracciato in git |
|---|---|---|
| `wrangler.jsonc` | `main: ".open-next/worker.js"`, `compatibility_date: "2026-07-30"` (il minimo ammesso è `2024-09-23`), `compatibility_flags: ["nodejs_compat"]`, binding `assets` su `.open-next/assets` | sì |
| `open-next.config.ts` | `export default defineCloudflareConfig()` | sì |
| `.dev.vars` | variabili per la preview locale di wrangler | **no** — va aggiunta una riga a `.gitignore` |
| `src/app/robots.ts` | route handler Next 16 (**non** `public/robots.txt`, che non passa da i18n né dal build), `disallow: "/"` | sì (da rimuovere al go-live) |

**Nessun file esistente cambia per l'adapter.** In particolare `src/proxy.ts` è già
compatibile: usa solo `next-intl` e il refresh di sessione Supabase, nessuna API Node.
Verificato anche che in `src/` non esiste alcun `export const runtime`, import `node:` o
`require()`.

## 4. Decisioni di design (prese, da non ridiscutere)

**D-1 — Cloudflare Workers, non Cloudflare Pages.** `STATO-LAVORI.md` diceva "Cloudflare
Pages": per Next.js con SSR quello è il percorso legacy. Il percorso raccomandato e
supportato è Workers con `@opennextjs/cloudflare`, runtime Node.js (non edge). Next 16 è
fra le versioni supportate dall'adapter.

**D-2 — Niente R2, niente KV.** L'adapter non li richiede. Qui non servono perché
praticamente ogni pagina legge i cookie (sessione Supabase, `mcm_consent`) ed è quindi
dinamica: non esiste una cache incrementale da conservare. Gli statici li serve il binding
`assets`. *Conseguenza accettata:* ogni richiesta è SSR, nessuna pagina cachata al bordo.
*Effetto collaterale positivo:* R2 richiederebbe una carta registrata, così la fase resta a
costo e attrito zero.

**D-3 — Deploy da locale con `wrangler`, non da CI.** Workers Builds aggiungerebbe un
secondo posto dove configurare le variabili di build — cioè un secondo posto dove
sbagliarle — proprio nella fase in cui si stanno isolando le cause dei guasti. La CI
diventa un task della fase pubblica. *Corollario:* il push di `main` resta comunque nello
scope, ma per mettere al sicuro i 42 commit locali, non come prerequisito tecnico.

**D-4 — Email: servizio Supabase di default.** Limiti accettati: **2 email di auth
all'ora**, e i nuovi progetti free non possono personalizzare i template (cambio Supabase
del 3 giugno 2026). I destinatari **non** sono ristretti. Su uno staging privato è
sufficiente; l'SMTP vero è un task della fase pubblica.

**D-5 — Conferma email resta attiva.** Disattivarla accorcerebbe il collaudo ma
significherebbe non collaudare il flusso vero, e dimenticarsi di riattivarla sarebbe un
buco di sicurezza.

**D-6 — Privatezza: `noindex` + URL non divulgato.** Nessuna infrastruttura aggiuntiva.
Chi indovinasse l'URL vedrebbe home ed eventi con dati demo: accettabile. Cloudflare Access
è stato scartato perché la documentazione è contraddittoria sulla sua applicabilità a
`workers.dev` senza un dominio su zona attiva, e perché stando davanti a tutto
complicherebbe il collaudo dei link di conferma email.

**D-7 — Approccio incrementale, una variabile alla volta.** Prima l'app **locale** contro
il Supabase **cloud** (ogni rottura è per forza configurazione cloud), poi il deploy su
Workers (ogni nuova rottura è per forza l'adapter). Bisezione pulita, al prezzo di un
passaggio in più. Nota: l'ordine inverso è **impossibile**, un Worker deployato non
raggiunge il Supabase in Docker sul PC.

**D-8 — Lo spike dell'adapter è il task zero.** È l'unica incognita tecnica reale della
fase e non richiede alcun account: va risolta prima che l'utente apra il primo account.

**D-9 — Il bottone Google si nasconde via variabile pubblica, non cancellando codice.** Il
gate è `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`: assente o diverso da `"true"` → il bottone
"Continua con Google" non viene renderizzato in `login/page.tsx` e `registrati/page.tsx`.
Nessuna riga di `signInWithGoogle` viene rimossa: alla fase pubblica basta valorizzare la
variabile. *Motivo:* oggi quel bottone è **incondizionato** e sullo staging darebbe errore.

## 5. Configurazione e segreti

Le variabili si dividono in due classi che **non** si configurano allo stesso modo:

| Variabile | Classe | Dove va |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | build-time, inlined nel bundle client | deve esistere **quando gira `opennextjs-cloudflare build`** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem | idem |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | idem | idem |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | idem | **assente sullo staging** (vedi D-9) |
| `TURNSTILE_SECRET_KEY` | runtime, solo server | `wrangler secret put` |
| `SUPABASE_SERVICE_ROLE_KEY` | **non usata dall'app** | **da nessuna parte** |

### Le tre trappole note

**(a) `NEXT_PUBLIC_*` e il guasto muto.** Quelle variabili vengono incorporate nel
JavaScript **al momento della build**. Se si configurano solo come segreti del Worker, la
build produce un bundle con `undefined` dentro e **non c'è nessun errore**: semplicemente
il widget Turnstile non appare e il client Supabase non si crea. Mitigazione: il criterio
di uscita del task Turnstile è letteralmente "il widget appare".

**(b) `SUPABASE_SERVICE_ROLE_KEY` non va spedita.** Verificato con grep: non è usata in
nessun punto di `src/`, esiste solo in `docs/` e `.env.local.example`. È la chiave che
bypassa **tutte** le RLS. Spedirla sul Worker per abitudine sarebbe il singolo peggior
rischio della fase.

**(c) Redirect URL di Supabase.** `site_url` e `additional_redirect_urls` devono includere
l'URL `workers.dev` con `/it/auth/callback` e il glob `**`, altrimenti la conferma email
non fa l'auto-login. È esattamente il bug #2 del collaudo di Fase 1A, e sul cloud si
ripresenta identico perché l'URL cambia.

⚠️ **Questi URL vanno cambiati due volte, non una.** Al task 3 l'app gira ancora su
`localhost:3000` contro il Supabase cloud, quindi `site_url` deve puntare a `localhost`; al
task 5, col deploy, passa all'URL `workers.dev`. Chi lo configura una volta sola si ritrova
la conferma email rotta in uno dei due passaggi e non capisce perché.

### Locale vs cloud

Lo sviluppo continua a puntare a Docker. `.env.local` va scambiato quando serve parlare col
cloud: i due set si tengono in file di appoggio **non tracciati** e lo swap va documentato
in `SETUP.md`.

### Cosa `db push` NON fa

**`db push` non applica `seed.sql`.** Sul cloud l'admin va promosso a mano dopo essersi
registrato, esattamente come in locale.

## 6. Sequenza dei task

| # | Task | Criterio di uscita |
|---|---|---|
| 0 | **Spike OpenNext**: adapter + `wrangler.jsonc` + `open-next.config.ts`, build e preview locale. **Nessun account toccato.** | `opennextjs-cloudflare build` completa e la preview serve la home **e** una pagina con server action, puntando ancora a Supabase Docker |
| 1 | Push di `main` su `origin` | `git status` up-to-date con `origin/main` |
| 2 | Progetto Supabase cloud (EU/Frankfurt) + `link` + `db push` | le 10 migrazioni risultano applicate; `pg_policies` combacia con il locale |
| 3 | **App locale → Supabase cloud** (swap `.env.local`) | registrazione + conferma email, promozione admin, una prova RLS, upload coi limiti dei bucket: tutto sul cloud, con frontend noto buono |
| 4 | Turnstile reale (chiavi + hostname registrato) | widget visibile, login passa, POST senza token respinto |
| 5 | Deploy su Workers + redirect URL Supabase aggiornati | la home risponde in HTTPS sull'URL `workers.dev` |
| 6 | `noindex` + bottone Google nascosto quando il provider non è configurato | `robots` nega tutto; le pagine auth non mostrano il bottone morto |
| 7 | Contenuti demo caricati dall'admin sullo staging | 2–3 eventi (uno futuro con RSVP aperto, uno concluso con album foto), 2–3 membri con auto in garage |
| 8 | Collaudo mirato + aggiornamento docs | §7 superata; `SETUP.md`, `STATO-LAVORI.md` e le caselle 1C/1D di `ROADMAP.md` allineati |

I task 2, 4 e parte del 5 richiedono azioni **manuali nel browser dell'utente** (creazione
account, chiavi, consensi): il ruolo dell'assistente lì è fornire un runbook passo-passo e
verificare gli esiti, non eseguire.

## 7. Collaudo: cosa si prova e cosa no

Non si rifà la Fase 1. Si provano **solo** le cose che possono comportarsi diversamente
fuori da Docker:

- **Server action attraverso l'adapter** — è il meccanismo su cui poggia ogni form del sito
  (profilo, garage, eventi, RSVP). Se OpenNext sbaglia qualcosa, sbaglia qui.
- **Cookie su HTTPS reale** — sessione Supabase e `mcm_consent` col flag `Secure`, che in
  locale su `http` non è mai stato esercitato.
- **Conferma email col dominio nuovo** — trappola (c) di §5.
- **Limiti dei bucket sul cloud** — 2 MB e vincolo MIME sono nelle migrazioni, ma vanno
  visti respingere davvero.
- **Una prova negativa RLS** con utenti veri: un membro non modifica il profilo o il garage
  di un altro.
- **Gate GDPR YouTube** su HTTPS e **Turnstile** che respinge.

**Non** si riprovano logica pura, fuso orario e validazione: sono coperti dai 115 test e non
dipendono dall'ambiente.

## 8. Rischi e piani B

1. **Lo spike OpenNext fallisce.** Rischio più alto, mitigato mettendolo per primo. Piano B:
   Vercel (supporto first-party per Next 16, zero adapter; il piano Hobby gratuito vieta
   l'uso commerciale, zona grigia per un'associazione senza vendita). Costo: si riscrive §3,
   non il resto della fase.
2. **Il limite di 2 email/ora blocca il collaudo.** Si registrano gli account con calma. Se
   diventa un impiccio serio, su uno staging è legittimo confermare un account a mano via
   SQL.
3. **Pausa del progetto free dopo 7 giorni di inattività — tocca direttamente il cliente.**
   Se lui riapre il link dopo dieci giorni di silenzio trova il sito morto. Si riattiva dal
   dashboard in un minuto. *Decisione rimandata al task 8:* avvisare il cliente, oppure
   predisporre un ping programmato.
4. **`NEXT_PUBLIC_*` assenti al momento della build** → guasto muto. Vedi trappola (a).
5. **Costi: zero.** Tutto nei piani gratuiti; senza R2 non serve registrare una carta.

## 9. Da comunicare al cliente

`/privacy` e `/cookie` sono **dichiaratamente bozze** e contengono `[DA COMPILARE]` al posto
dei dati del Titolare (denominazione, sede, email), più un `[DA VERIFICARE]` sulle garanzie
di trasferimento extra-UE. È corretto che sia così — servono i suoi dati reali e una
validazione legale — ma è meglio anticiparglielo che lasciarglielo scoprire cliccando.

## 10. Cosa resta dopo, per il go-live pubblico

Dominio del club + DNS, contenuti legali reali, SMTP custom con template in italiano,
Google OAuth col redirect URI definitivo, rimozione del `noindex`, e la valutazione se
passare al piano Supabase Pro (niente pausa per inattività, backup).
