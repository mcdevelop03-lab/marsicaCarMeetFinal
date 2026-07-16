# ARCHITECTURE — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-15.
> Ogni scelta architetturale va motivata e registrata qui. Decisioni di **prodotto/scope**
> in [DECISIONS.md](./DECISIONS.md).

## 1. Principi guida

1. **Semplicità gestibile da un solo sviluppatore** (affiancato dall'AI).
2. **Managed services** per ridurre il codice di backend e la manutenzione.
3. **Sicurezza a due livelli**: controllo server-side + Row Level Security nel DB.
4. **Modularità**: componenti riutilizzabili, responsabilità isolate, TypeScript.
5. **Pronto a crescere** da locale a regionale senza riscritture.
6. **Costo iniziale €0** con free tier; nessun lock-in critico.

## 2. Stack tecnologico

| Livello | Tecnologia | Motivazione |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + React 19 + TypeScript | Pagine SSR (SEO), Server Components, routing integrato, un solo codebase. |
| Styling | **TailwindCSS 4** | Riuso diretto del design del mockup. |
| i18n | **next-intl** | Routing per locale; IT al lancio, struttura pronta per EN (D-151). |
| Auth | **Supabase Auth** + **Google OAuth** + **MFA TOTP** | Registrazione/login/reset, Google, 2FA opzionale, ruoli (D-142/144/145). |
| Anti-bot | **Cloudflare Turnstile** | Captcha invisibile su registrazione/login, gratis, già su Cloudflare (D-143). |
| Database | **Supabase Postgres** | DB relazionale gestito, RLS integrata. |
| Storage | **Supabase Storage** | Avatar, foto auto, media gallery. |
| Icone/anim. | **lucide-react**, **motion** | Già usati nel mockup. |
| Deploy app | **Cloudflare Pages** | Gratis, uso commerciale consentito, scalabile. |
| Deploy backend | **Supabase (managed)** | Free tier con uso commerciale/produzione consentito. |

> **Nota deploy:** Vercel Hobby è escluso perché il suo free tier vieta l'uso commerciale;
> il progetto include una vetrina shop, quindi si è scelto Cloudflare Pages per evitare
> ambiguità legali. La scelta resta cambiabile.

## 3. Diagramma dei livelli

```
┌───────────────────────────────────────────────┐
│  BROWSER — React 19 UI, Tailwind, i18n (IT)    │
└───────────────────────┬───────────────────────┘
                        │ HTTP / RSC
┌───────────────────────▼───────────────────────┐
│  NEXT.JS (App Router) — Cloudflare Pages       │
│  • Pagine pubbliche SSR (SEO)                  │
│  • Server Components + Server Actions          │
│  • Middleware: sessione, ruoli, locale         │
│  • Route groups: (public) (auth) (admin)       │
└───────────────────────┬───────────────────────┘
                        │ @supabase/ssr (server + client)
┌───────────────────────▼───────────────────────┐
│  SUPABASE (managed backend)                    │
│  • Postgres (schema relazionale)               │
│  • Auth (email/password, sessioni)             │
│  • Storage (avatar, foto auto, gallery)        │
│  • Row Level Security (policy per tabella)     │
└────────────────────────────────────────────────┘
```

## 4. Struttura delle cartelle (target)

```
src/
  app/
    [locale]/
      (public)/
        page.tsx               # home
        eventi/                # elenco + [slug]
        news/                  # elenco + [slug]
        mappa/                 # Fase 2 (pagina-mappa dedicata)
        gadget/                # vetrina + [id] (nessun carrello)
        login/  registrati/
        privacy/  cookie/
      (auth)/
        dashboard/
        garage/                # elenco + nuovo/[id]
        profilo/  impostazioni/
      (admin)/
        admin/                 # eventi, news, gallery, utenti, contenuti
      layout.tsx
      not-found.tsx
    api/                       # route handler dove servono
  components/
    ui/                        # bottoni, card, input, badge (riutilizzabili)
    layout/                    # header, footer, nav, mobile-menu
    features/                  # eventi/ (incl. album media), garage/, gadget/, profilo/
  lib/
    supabase/                  # client.ts, server.ts, middleware.ts
    auth/                      # helper ruoli/permessi
    utils/
  i18n/                        # config + messaggi it.json / en.json
  types/                       # tipi condivisi (evoluzione di src/types.ts)
  styles/                      # global.css / tailwind
supabase/
  migrations/                  # schema SQL versionato
  seed.sql                     # dati iniziali (primo admin, ecc.)
docs/                          # questa documentazione
```

## 5. Modello dati (schema relazionale)

> Notazione: PK = chiave primaria, FK = chiave esterna. Campi indicativi, rifiniti in fase di implementazione.

### `profiles`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| name | text | |
| tag | text | handle univoco |
| avatar_url | text | Storage |
| role | enum(`member`,`organizer`,`admin`) | default `member`; `organizer` predisposto ma disattivo |
| bio | text | |
| town | text | paese/città della Marsica (D-121) |
| socials | jsonb | link social opzionali (D-121) |
| created_at | timestamptz | |

> Rimossi `license_type`/`license_status` e ogni campo di gamification (XP, livello, rank) — D-111, D-114.

### `vehicles`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → profiles | |
| make / model | text | obbligatori |
| year | int | obbligatorio |
| image_url | text | Storage — obbligatoria |
| category | text | opzionale (D-123) |
| description | text | opzionale (D-123) |
| specs | jsonb | opzionale: potenza, peso, trazione, motore, 0–100 (D-123) |
| created_at | timestamptz | |

> Rimosso il campo `telemetry` (boost/RPM/temp/olio): era una simulazione decorativa — D-112.

### `events`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| slug | text unique | URL leggibile |
| title / description | text | |
| location | text | |
| coords | jsonb / point | lat/lng per mappa |
| starts_at / ends_at | timestamptz | |
| capacity | int | posti massimi |
| status | enum(`upcoming`,`ongoing`,`completed`,`canceled`) | |
| type | enum(`raduno`,`giro`,`sociale`) | Raduno statico, Giro/tour, Cena/incontro (D-126) |
| map_url | text | link a mappa esterna per il luogo (D-134) |
| cover_url | text | Storage |
| created_by | uuid FK → profiles | solo Admin (D-124) |

### `event_registrations`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| event_id | uuid FK → events | |
| user_id | uuid FK → profiles | unique(event_id, user_id) |
| status | enum(`going`,`waitlist`,`canceled`) | |
| created_at | timestamptz | |

### `event_vehicles`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| registration_id | uuid FK → event_registrations | |
| vehicle_id | uuid FK → vehicles | auto portata all'evento |

### `posts` (news/blog) — *Fase 2*
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| slug | text unique | |
| title / body | text | |
| cover_url | text | |
| author_id | uuid FK → profiles | |
| status | enum(`draft`,`published`) | |
| published_at | timestamptz | |

### `event_media` — *Fase 1* (album per-evento, caricato dall'Admin)
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| event_id | uuid FK → events | **obbligatorio**: il media appartiene a un evento (D-133) |
| uploader_id | uuid FK → profiles | sempre un Admin |
| type | enum(`image`,`video`) | video anche via embed esterno |
| url | text | Storage o link esterno |
| caption | text | |

> Niente campo `approved`/moderazione: carica solo l'Admin, i media sono subito pubblici (D-133).
> *(Fase 2: eventuale pagina "Gallery" che aggrega gli `event_media` di tutti gli eventi.)*

### `gadgets` (vetrina, **nessun acquisto**) — *Fase 3*
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| name / tagline / description | text | |
| price | numeric | **solo visualizzazione** (prezzo indicativo) — nessun carrello/checkout (D-161) |
| image_url / gallery | text / jsonb | |
| category | text | |

> Nessuna tabella carrello/ordini: l'e-commerce è escluso in modo permanente (D-161).

### Mappa raduni — *Fase 2*
Nell'MVP il luogo dell'evento è un testo + `events.map_url` (link esterno). La **pagina-mappa
interattiva** di Fase 2 può usare direttamente gli `events` con coordinate (campo `coords`),
senza una tabella `hotspots` separata (D-134).

## 6. Sicurezza

### Accesso (D-142/143/144/145)
- **Registrazione libera** con **conferma email obbligatoria** (account inattivo finché non confermato).
- **Login**: email/password **e Google OAuth**.
- **Anti-bot**: **Cloudflare Turnstile** su registrazione e login + rate limiting nativo Supabase.
- **2FA opzionale**: MFA **TOTP** (app authenticator), attivabile dal singolo membro.

### Row Level Security
- RLS abilitata su tutte le tabelle.
- **Pubblico (anche non loggati)**: `events`, `event_media`, `posts` pubblicati, `gadgets` (D-146).
- **Solo membri loggati**: `profiles` e `vehicles` altrui (in sola lettura) — non pubblici (D-146).
- Scrittura ristretta: l'utente modifica solo le proprie risorse (`owner_id = auth.uid()`);
  eventi, `event_media` e news richiedono `profiles.role = 'admin'`.
- Doppio controllo: Server Actions/Route verificano il ruolo prima di chiamare il DB.

### Dati a riposo e cifratura (D-173/174)

**Nessuna cifratura a livello di colonna**: non si usa pgcrypto/pgsodium/Vault. Cosa protegge cosa:

| Dato | Come è protetto |
|---|---|
| **Password** | **Hash bcrypt** irreversibile, gestito da Supabase GoTrue in `auth.users.encrypted_password`. **Non la salviamo noi**: nel nostro schema non esiste alcuna colonna password. Nemmeno l'admin può leggerla — per questo l'unica via è il reset. |
| **Email** | **In chiaro**, per necessità funzionale: serve per cercare l'utente al login, **spedire** conferma e reset, e garantire l'unicità. Cifrarla non aggiungerebbe nulla (l'app dovrebbe comunque decifrarla per usarla); un hash renderebbe impossibile l'invio. |
| **`profiles` / `vehicles`** (nome, tag, bio, comune, social, dati auto) | **In chiaro.** Sono dati che il membro **pubblica volontariamente** in una community e **non sono dati particolari** ex art. 9 GDPR. |
| **Tutti** | **RLS + auth** (controllo d'accesso), **TLS** in transito, **cifratura del disco** lato piattaforma su Supabase Cloud (in locale è un volume Docker, non cifrato). |

Perché non cifrare le colonne: **romperebbe la ricerca `/membri`** (nessun `ILIKE` su testo cifrato) e le
predicate RLS, e introdurrebbe gestione delle chiavi — costo reale a fronte di beneficio quasi nullo su
dati già pubblici per scelta. **Da rivalutare** (D-174) se si raccoglieranno targa, indirizzo, telefono,
data di nascita, documenti o dati di pagamento: in quel caso cifratura mirata sulle singole colonne
(pgcrypto / Vault) oppure, preferibilmente, non raccoglierli.

### Upload e storage — regole permanenti

- **Ogni punto di upload immagini passa da `comprimiImmagine()`** (`src/lib/images/compress.ts`):
  resize a 1600px sul lato lungo + riscrittura **WebP nel browser**, prima dell'upload. Senza, una foto
  da telefono (3–7 MB) sfonda il limite di 2 MB del bucket e l'utente viene respinto per una foto legittima.
- **Ogni bucket nasce con `file_size_limit` + `allowed_mime_types` + policy SELECT.** Sono i tre difetti
  già pagati con le migrazioni **0005** (limiti `avatars`), **0006** (SELECT `avatars`) e **0007** (tutti e
  tre per `vehicles`): senza policy SELECT la cancellazione dei file **fallisce in silenzio** (`list()`/
  `remove()` non vedono nulla) e restano orfani pubblicamente scaricabili; i controlli nel browser sono
  solo feedback, non difesa.
- ⚠️ **Debito aperto:** i bucket **`event-covers`** ed **`event-media`** esistono dalla `0003` ma non hanno
  **né `file_size_limit` né `allowed_mime_types`**, e nessun codice li usa ancora. Vanno chiusi con una
  migrazione **prima** di scrivere il codice della Fase 1C.
  **Nota (verificata il 2026-07-15):** a differenza di `avatars`/`vehicles`, per questi due la **policy
  SELECT non manca**. La `0003` li protegge con una policy **`for all`**, che in Postgres copre anche la
  SELECT; `avatars`/`vehicles` usavano invece comandi espliciti (`for insert`/`update`/`delete`), ed è per
  questo che sono servite la `0006` e la `0007`. Sui bucket eventi mancano quindi **due** difetti su tre.
- ⚠️ **`comprimiImmagine()` gestisce solo immagini**: su un video `createImageBitmap` lancia e la funzione
  restituisce **l'originale intatto, in silenzio** (comportamento voluto). Con D-171 il problema non si
  presenta — i video sono link YouTube e `event-media` resta solo-immagini.

## 7. Internazionalizzazione

- `next-intl` con segmento `[locale]` nell'URL. **Al lancio solo `/it`** (D-151); l'infrastruttura
  per `/en` è predisposta e si attiva in Fase 3.
- File messaggi `i18n/it.json` (EN aggiunto in Fase 3).
- Contenuti dinamici (eventi, news): solo italiano; strategia multilingua dei contenuti
  (campi tradotti) valutata in Fase 3 (D-2).

## 8. Deploy & ambienti

| Ambiente | App | Backend |
|---|---|---|
| Sviluppo | `next dev` locale | progetto Supabase dev |
| Produzione | Cloudflare Pages | progetto Supabase prod |

- Variabili d'ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (solo server).
- Migrazioni DB versionate in `supabase/migrations/`.

## 9. Migrazione dal mockup (Vite → Next.js)

- I componenti React del mockup (`DashboardView`, `GarageView`, `ShopView`, ecc.) vengono
  riportati come componenti riutilizzabili sotto `components/features/`, previa estrazione di
  `components/ui/` condivisi e **spostamento dei colori sui token** (vedi [CODE_ANALYSIS.md](./CODE_ANALYSIS.md)).
- La navigazione a `useState` di `App.tsx` viene sostituita dal **routing di Next**.
- I dati finti di `data.ts` vengono sostituiti da query a Supabase.
- Si **rimuovono** carrello/checkout, telemetria simulata, feed e chat (D-161/112/131/132).
- Il design/stile Tailwind viene mantenuto e ribrandizzato (VELOCITY → Marsica Car Meet), con
  contenuti reali della Marsica al posto della narrativa outlaw (D-101).

## 10. Decisioni aperte / da confermare

| # | Tema | Stato |
|---|---|---|
| D-1 | Upload video diretto vs solo embed esterno | Rimandato a Fase 2 |
| D-2 | Strategia contenuti multilingua (eventi/news tradotti) | Da definire in Fase 3 |
| D-3 | Attivazione ruolo Organizzatore | Fase 3+ |
| ~~D-4~~ | ~~Provider e-commerce~~ | **CHIUSA (2026-07-07): nessun e-commerce, mai (D-161)** |
| D-5 | Testo slogan e file logo definitivo | In attesa dall'utente (D-A1, D-A2) |

## 11. Registro delle decisioni (ADR sintetico)

| Data | Decisione | Motivazione |
|---|---|---|
| 2026-07-06 | Stack Next.js + Supabase | Professionale e scalabile, gestibile da solo dev, requisiti (DB relazionale, auth+ruoli, storage) coperti da managed services. |
| 2026-07-06 | Deploy su Cloudflare Pages (no Vercel Hobby) | Uso commerciale consentito, evita zona grigia ToS di Vercel per la vetrina shop. |
| 2026-07-06 | i18n IT/EN dall'inizio | Struttura predisposta subito. *(Aggiornata da D-151: al lancio solo IT, EN in Fase 3.)* |
| 2026-07-06 | GDPR predisposto da subito | Raccolta dati personali di utenti UE. |
| 2026-07-06 | E-commerce come sola vetrina | Nessun pagamento al lancio. *(Rafforzata da D-161: nessun e-commerce mai, carrello rimosso.)* |
| 2026-07-06 | Rimozione dipendenza AI/Gemini | Non necessaria al lancio; reintroducibile in futuro. |
| 2026-07-07 | Restare su Supabase free + keep-alive settimanale invece di cambiare DB | Il requisito "sempre online" si risolve a €0 con un ping settimanale; cambiare DB farebbe perdere Auth+Storage integrati. |
| 2026-07-07 | Cloudflare R2 come opzione per lo storage foto (futuro) | 10 GB gratis + nessun costo di egress: rimanda l'upgrade a pagamento sul punto che stringe davvero (le immagini). |
| 2026-07-07 | **Scope MVP definito** (sessione decisionale) | Vedi [DECISIONS.md](./DECISIONS.md): via gamification/telemetria/feed/chat; gallery per-evento admin; RSVP con capienza+auto; ruoli member+admin; profili/garage riservati ai loggati. |
| 2026-07-07 | **Auth: Google + Turnstile + MFA TOTP** dal lancio, conferma email obbligatoria | Anti-bot reale (Turnstile) e 2FA nativa; scartato il codice-2FA via email (custom + deliverability) — D-143/144/145. |
| 2026-07-07 | **Italiano al lancio**, EN in Fase 3 | Pubblico locale italiano; struttura i18n comunque predisposta per non rifare nulla — D-151. |
| 2026-07-07 | **E-commerce escluso in modo permanente** | La sezione Gadget resta sola vetrina; carrello del mockup rimosso del tutto — D-161 (chiude D-4). |
| 2026-07-15 | **Compressione WebP nel browser su ogni upload immagine** + **ogni bucket nasce con limiti/MIME/policy SELECT** | Una foto da telefono (3–7 MB) sfonderebbe il limite di 2 MB; senza policy SELECT la cancellazione dei file fallisce **in silenzio**. Regole nate dalle migrazioni 0005/0006/0007 — vedi §6. Debito: a `event-covers`/`event-media` mancano **limiti e MIME** (la SELECT è già coperta dalla loro policy `for all`). |
| 2026-07-15 | **Media eventi: gallery nostra + video via link YouTube + link Drive per gli originali** | Un video 1080p da 1 minuto pesa 60–130 MB contro ~1 GB di free tier, e comprimerlo nel browser non è realistico. `event_media.url` supportava già un URL esterno: nessuna modifica di schema — D-171 (chiude D-A3). |
| 2026-07-15 | **Nessuna cifratura di colonna nel DB** | Password già hash bcrypt lato GoTrue, email in chiaro per necessità funzionale, resto dei dati pubblicati volontariamente e non particolari ex art. 9. Cifrare romperebbe ricerca e RLS — D-173; da rivalutare con dati sensibili (D-174). |

## 12. Costi e mantenimento

> **In una riga:** il progetto **parte e si mantiene a ~€0/mese**. La prima spesa reale è il **dominio (~10–15 €/anno)**; la prima spesa mensile ricorrente probabile è **Supabase Pro (~25 $/mese)**, ma scatta solo quando lo **storage delle foto** cresce, non subito.

### 12.1 Da dove derivano i costi

| Voce | Quando scatta | Costo indicativo | Obbligatoria? |
|---|---|---|---|
| Dominio (`.it`/`.com`) | Da subito, se si vuole un dominio proprio | ~10–15 €/anno (~1 €/mese) | Consigliata |
| Supabase Pro | Quando serve garanzia "sempre online" senza workaround, o si superano i limiti free | ~25 $/mese | No, all'inizio |
| Cloudflare Pages (app) | Solo con traffico enorme | 0 quasi sempre | No |
| Storage foto (oltre 1 GB) | Community attiva che carica molte immagini | Incluso in Supabase Pro, oppure R2 a parte | No, all'inizio |
| Email transazionali (conferme, reset) | Oltre il limite gratuito Supabase | 0 → pochi €/mese (es. Resend) | No |

### 12.2 Il nodo "sempre accessibile"

Sul **piano free di Supabase** un progetto viene messo in **pausa dopo 7 giorni di inattività totale** del database (i dati **non** vengono cancellati; il risveglio richiede ~30 s e si può fare dalla dashboard). Per un sito pubblico che deve stare online 24/7 questo è il punto critico, ma **si risolve a costo €0**:

- **Keep-alive settimanale**: un cron gratuito (GitHub Actions o Cron Trigger di Cloudflare) esegue una query leggera ogni pochi giorni → il timer di inattività non arriva mai a zero e il progetto non va mai in pausa.

Il piano **Pro ($25/mo)** elimina la pausa in modo nativo, ma **non è necessario** al lancio: con il keep-alive il free tier resta "sempre online".

### 12.3 Alternative di database valutate (luglio 2026)

Confronto per il requisito "sempre accessibile a costo minimo". Da tenere presente: Supabase fornisce **DB + Auth + Storage in un unico servizio**; un DB "puro" copre solo il database e richiede Auth e Storage separati.

| DB | Sempre raggiungibile | Storage gratis | Tipo | Auth + Storage inclusi | Note |
|---|---|---|---|---|---|
| **Supabase** (scelto) | Sì con keep-alive; altrimenti pausa dopo 7 gg | 500 MB DB + 1 GB file | Postgres | ✅ Sì | Pro $25/mo toglie la pausa |
| **Neon** | Sì (auto-suspend 5 min, si risveglia da solo <1 s) | 0.5 GB, 5 GB egress/mese | Postgres | ❌ Solo DB | Ottimo DB, ma si perderebbero Auth e Storage integrati |
| **Cloudflare D1 + R2** | Sì, sempre (edge, nessuna pausa) | 5 GB DB + 10 GB foto senza egress | SQLite | ❌ No Auth | Già su Cloudflare; ma SQLite (niente RLS) e Auth da aggiungere |
| PlanetScale | Sì | — | MySQL | ❌ | Free tier rimosso nel 2024, solo a pagamento |

**Decisione:** restare su **Supabase free + keep-alive**, senza cambiare DB. Cambiare database per il solo problema della pausa introdurrebbe più complessità (Auth e Storage da reimplementare) di quella che risolve.

### 12.4 Strategia per rimandare i costi il più possibile

1. **Lancio**: Supabase free + Cloudflare Pages + keep-alive settimanale → **€0/mese** (solo eventuale dominio).
2. **Crescita foto**: quando il free storage stringe, **spostare le immagini su Cloudflare R2** (10 GB gratis, **nessun costo di egress**: risparmio reale su un sito ricco di immagini) mantenendo Supabase per DB + Auth.
3. **Traffico/affidabilità**: passare a **Supabase Pro ($25/mo)** solo quando serve davvero (backup, niente pausa, più risorse) — a quel punto è una scelta, non un obbligo.

### 12.5 Costo dettagliato dello scenario "Supabase + R2" (luglio 2026)

Scenario di riferimento: Supabase per DB + Auth, **Cloudflare R2 solo per le foto**. Il timore tipico è il costo di accesso/traffico: con R2 la voce traffico è **azzerata**.

**Networking / traffico (egress):** **€0, sempre e senza limiti**. R2 non fa pagare il traffico in uscita verso gli utenti, indipendentemente da quante persone visitano il sito o quante immagini scaricano. È il motivo principale per cui conviene su un sito ricco di foto.

**Access (operazioni) e storage:**

| Voce | Cosa la genera | Gratis ogni mese | Oltre soglia |
|---|---|---|---|
| Egress (traffico in uscita) | Utenti che guardano le foto | **Illimitato** | **€0** |
| Class B (letture/GET) | Visualizzazione/download foto | 10 milioni/mese | $0.36 / milione |
| Class A (scritture/PUT/list) | Caricamento foto | 1 milione/mese | $4.50 / milione |
| Storage | Spazio occupato dai file | 10 GB-mese | $0.015 / GB-mese |

**Esempio, mese molto attivo:**

- 10.000 caricamenti foto → sotto 1 M Class A → **€0**
- 100.000 visite × ~10 foto = 1 M letture → sotto 10 M Class B → **€0**
- Traffico generato → **€0** (egress gratis)
- Superamento 10 GB solo con ~5.000 foto da 2 MB; a 50 GB totali: 40 GB × $0.015 = **~$0.60/mese**

**Conclusione:** con Supabase + R2 il costo di accesso/traffico è **€0**; oltre le soglie cresce **solo** lo storage (centesimi al GB), mai la parte di traffico. Con la **cache CDN di Cloudflare** davanti a R2 (gratuita, già disponibile essendo su Cloudflare) molte visualizzazioni sono servite dalla cache e non contano nemmeno come operazioni Class B.

> Fonte prezzi: [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/) — verificato luglio 2026.
