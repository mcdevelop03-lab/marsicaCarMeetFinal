# Fase 1D — GDPR base (cookie banner + pagine privacy/cookie) — Design/Spec

> Data: **2026-07-28**. **Chiude la Fase 1 (MVP).** Precedenti: 1A, 1B, 1C.
> Requisiti di riferimento: **RF-60** (cookie banner con gestione consensi, P0), **RF-61** (pagine Privacy + Cookie Policy, P0/struttura). Flusso: **USER_FLOWS §10**. Decisioni: **D-146**, **D-172**, **D-173**.

## Obiettivo

Predisporre la conformità GDPR di base dell'MVP:
1. **Cookie banner** con gestione consensi (accetta / rifiuta / personalizza), che **blocca davvero** i contenuti di terze parti finché non c'è consenso.
2. **Pagine Privacy Policy e Cookie Policy** (struttura + bozza IT reale, testo legale definitivo in seguito).
3. **Link nel footer** (Privacy, Cookie, Preferenze cookie).

Il consenso ha **denti reali** su un solo punto oggi: gli **embed YouTube** delle pagine evento (unico contenuto di terze parti che imposta cookie). Google OAuth e Turnstile sono avviati dall'utente / di sicurezza; la sessione Supabase è essenziale.

## Decisioni prese in brainstorming (non ridiscuterle)

1. **Il consenso BLOCCA gli embed YouTube** finché l'utente non acconsente (vera gestione consensi, non solo informativa).
2. **Due categorie oneste**: **Necessari** (sempre attivi) + **Contenuti di terze parti** (toggle, gate YouTube). Niente categorie vuote (no analytics/marketing: non esistono).
3. **Pagine Privacy/Cookie = bozza IT reale** che riflette le pratiche vere, con **disclaimer "bozza non validata da un legale"** in cima. Dati del Titolare e trasferimenti extra-UE = placeholder marcati.
4. **Stato del consenso letto lato server** (cookie via `cookies()` nel root layout) e idratato nel provider → **nessun flash** del banner per chi ha già scelto.
5. **Nessun DB**: il consenso è un cookie first-party, non un dato personale da conservare server-side.

## Approccio scartato

- **Lettura solo client** del cookie (nel `useEffect` del provider): più semplice ma il banner / il placeholder video **lampeggia** a ogni caricamento prima dell'idratazione, anche per chi ha già acconsentito. Scartato per UX.
- **Registro consensi server-side / audit trail**: over-engineering per l'MVP; il cookie con `ts` (timestamp) è la traccia della scelta.

## Architettura

### Cookie di consenso

- Nome: **`mcm_consent`**. Valore JSON versionato: `{ "v": 1, "external": boolean, "ts": number }`.
  - `v`: versione dello schema (per migrazioni future, es. quando si aggiungerà `analytics`).
  - `external`: consenso ai contenuti di terze parti (YouTube). `necessary` è implicito (sempre `true`, non memorizzato).
  - `ts`: `Date.now()` al momento della scelta (traccia).
- Attributi: `path=/`, `max-age` ≈ 1 anno (`31536000`), `SameSite=Lax`. **Non** `HttpOnly` (deve essere leggibile/scrivibile dal client). Scritto dal client con `document.cookie`; letto lato server con `cookies()` di Next 16.
- **Assenza del cookie = "non ha ancora scelto"** → banner mostrato, embed bloccati.

### Logica pura — `src/lib/consent/consenso.ts`

```ts
export type Consent = { external: boolean; ts: number };
export const CONSENT_COOKIE = "mcm_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE = 31536000; // 1 anno in secondi

// Ritorna il consenso o null se il valore manca / è malformato / è di una versione
// ignota (→ "non ha ancora scelto", si ri-chiede). Non lancia mai.
export function parseConsent(cookieValue: string | undefined | null): Consent | null;

// Serializza il consenso nel valore JSON del cookie (senza gli attributi).
export function serializeConsent(consent: Consent): string;
```

**Testata con vitest** (`consenso.test.ts`): valore assente/`undefined` → null; JSON invalido → null; `v` diverso da `CONSENT_VERSION` → null; `external` mancante o non booleano → null; oggetto valido → `{external, ts}`; round-trip `parseConsent(serializeConsent(x))` conserva `external` e `ts`.

### Provider — `src/components/features/consent/ConsentProvider.tsx` (client)

Montato nel root layout dentro `NextIntlClientProvider`, riceve `initialConsent: Consent | null` letto lato server. Espone via React context:

```ts
type ConsentContext = {
  consent: Consent | null;      // null = non ha ancora scelto
  haScelto: boolean;            // consent !== null
  bannerAperto: boolean;        // true se banner/pannello visibile
  external: boolean;            // consent?.external ?? false
  acceptAll(): void;            // external=true, scrive cookie, chiude banner
  rejectAll(): void;            // external=false, scrive cookie, chiude banner
  setExternal(v: boolean): void;// salva external=v, scrive cookie, chiude banner
  riapriBanner(): void;         // riapre il banner/pannello (dal footer)
};
```

Ogni mutazione aggiorna lo **stato** (re-render immediato dei gate) **e** il **cookie** (`document.cookie = serializeConsent(...)` con gli attributi). `bannerAperto` iniziale = `initialConsent === null`.

### Lettura server nel root layout — `src/app/[locale]/layout.tsx`

```ts
import { cookies } from "next/headers";
// ...
const cookieStore = await cookies();
const initialConsent = parseConsent(cookieStore.get(CONSENT_COOKIE)?.value);
// ...
<NextIntlClientProvider>
  <ConsentProvider initialConsent={initialConsent}>
    <Header ... />
    <div ...>{children}</div>
    <Footer />
    <CookieBanner />
  </ConsentProvider>
</NextIntlClientProvider>
```

## Componenti e file

### Nuovi

- **`src/lib/consent/consenso.ts`** — logica pura (parse/serialize, costanti).
- **`src/lib/consent/consenso.test.ts`** — test vitest.
- **`src/components/features/consent/ConsentProvider.tsx`** — context provider (client) + hook `useConsent()`.
- **`src/components/features/consent/CookieBanner.tsx`** — banner (client): visibile se `bannerAperto`. Accetta / Rifiuta / Personalizza + pannello con toggle. Link a `/privacy` e `/cookie`.
- **`src/components/features/consent/VideoYouTube.tsx`** — gate del singolo video (client): iframe se `external`, altrimenti placeholder + "Attiva contenuti esterni" + "Guarda su YouTube".
- **`src/app/[locale]/(public)/privacy/page.tsx`** — Privacy Policy (server, statica, pubblica).
- **`src/app/[locale]/(public)/cookie/page.tsx`** — Cookie Policy (server, statica, pubblica).

### Modificati

- **`src/app/[locale]/layout.tsx`** — legge il cookie server-side, monta `ConsentProvider` + `CookieBanner`.
- **`src/components/layout/Footer.tsx`** — riga di link: Privacy · Cookie · **Preferenze cookie** (client, chiama `riapriBanner()`). *(Il footer diventa in parte client per il bottone "Preferenze cookie", oppure quel bottone è un piccolo componente client isolato dentro un footer che resta server — vedi nota implementativa.)*
- **`src/components/features/events/GalleryEvento.tsx`** — usa `<VideoYouTube …>` al posto dell'`<iframe>` inline per la sezione video (il resto invariato: griglia foto, lightbox, bottone Drive).
- **`src/messages/it.json`** — namespace `consent` (banner + gate), `privacy`, `cookiePolicy`, e voci footer.

## Flussi

### Primo accesso
`initialConsent === null` → `bannerAperto=true` → banner in basso (non bloccante). Gli embed YouTube mostrano il placeholder. L'utente sceglie → cookie scritto → banner chiuso → i gate si aggiornano senza reload. Alle visite successive il server legge il cookie → `bannerAperto=false`, niente flash.

### Gate YouTube (`VideoYouTube`)
- `external === true` → `<iframe src="https://www.youtube-nocookie.com/embed/{id}">` (come 1C-3).
- altrimenti → placeholder 16:9: testo + **"Attiva contenuti esterni"** (`setExternal(true)`, persiste, sblocca tutti i video) + **"Guarda su YouTube"** (`https://www.youtube.com/watch?v={id}`, `target=_blank rel=noopener noreferrer`).

### Revoca (footer → "Preferenze cookie")
`riapriBanner()` → banner riappare con lo stato attuale dei toggle; l'utente può togliere `external` → i video tornano placeholder senza reload.

## Contenuto delle pagine (bozza IT reale)

In cima a entrambe: **avviso** "Questa è una bozza non ancora validata da un legale; i testi definitivi verranno pubblicati in seguito."

**Privacy Policy** (`/privacy`): 1) Titolare del trattamento *(placeholder: nome + email)*; 2) Dati raccolti (email; profilo: nome, tag, bio, comune, social, avatar; garage: auto+foto; RSVP; media admin); 3) Finalità e basi giuridiche (servizio; sicurezza=legittimo interesse; consenso per terze parti); 4) Terze parti (Supabase, Google OAuth, Cloudflare Turnstile+Pages, YouTube su consenso, Google Drive con **caveat D-172**); 5) Conservazione e sicurezza (RLS+auth+TLS+cifratura disco; **niente cifratura colonna, D-173**, spiegato; password mai in chiaro, hash bcrypt); 6) Diritti (accesso, rettifica, **cancellazione: self-service in Fase 2, per ora su richiesta via email**); 7) Trasferimenti extra-UE *(placeholder da verificare)* + reclamo al Garante.

**Cookie Policy** (`/cookie`): cosa sono i cookie; tabella **Necessari** (sessione Supabase, `mcm_consent`, token Turnstile) + **Contenuti di terze parti su consenso** (YouTube); nessun analitico/marketing; gestione/revoca del consenso (link "Preferenze cookie", durata 1 anno).

## i18n

Tutte le stringhe (banner, gate, footer, **corpo delle policy**) via next-intl, namespace `consent` / `privacy` / `cookiePolicy` in `src/messages/it.json`. Verboso per le policy ma coerente con la regola del progetto (no stringhe hardcoded) e pronto per l'EN (Fase 3). Le policy possono usare liste di paragrafi keyati per sezione.

## Test

**Vitest (logica pura):** `parseConsent` / `serializeConsent` — vedi sopra (assente, JSON invalido, versione ignota, campi mancanti/non-booleani, round-trip).

**Collaudo dal vivo (a fine fase, lato utente):**
- Primo accesso → banner; dopo la scelta non riappare (niente flash: letto SSR).
- Accetta tutti → YouTube carica; Rifiuta → placeholder; Personalizza → toggle+salva.
- Footer "Preferenze cookie" → riapre, mostra stato, revoca → video tornano placeholder senza reload.
- "Attiva contenuti esterni" sul placeholder → carica + persiste + sblocca gli altri.
- "Guarda su YouTube" → nuova scheda.
- `/privacy` e `/cookie` visibili **da sloggato**, con disclaimer; link footer funzionanti.
- Persistenza del cookie tra reload/navigazione; `SameSite=Lax`.

**Standard:** `npm test` verde (coi nuovi test consenso), `tsc`/`lint`, `rm -rf .next && npm run build` verde (non mentre gira `next dev`).

## Da verificare nel piano (check, non buco di design)

- **Footer parzialmente client**: il bottone "Preferenze cookie" chiama un hook client (`useConsent`). Tenere il `Footer` server e isolare il bottone in un piccolo componente client (`PreferenzeCookieButton`), oppure rendere il footer client. Decidere nel piano (preferenza: bottone client isolato).
- **Hydration**: verificare che `bannerAperto` e il gate derivino entrambi da `initialConsent` al primo paint (nessun mismatch server/client).

## Fuori scope (non fare)

- Cancellazione account/dati **self-service** → Fase 2 (testo: "su richiesta via email").
- Testo legale **definitivo** e dati reali del Titolare → placeholder marcati.
- Cookie **analitici/marketing** → non esistono.
- **Registro consensi server-side / audit trail** → il cookie con `ts` è la traccia.
- Gate su **Google OAuth / Turnstile** → essenziali/sicurezza / avviati dall'utente.
- **Traduzioni EN** → Fase 3.
- Debiti ereditati da fasi precedenti (deferred-minor 1C-3, `revalidatePath`, orfani storage, `created_by`) → micro-fasi dedicate, non qui.
