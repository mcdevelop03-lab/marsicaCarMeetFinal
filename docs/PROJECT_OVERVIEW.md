# PROJECT OVERVIEW — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-07.
> Ogni decisione importante aggiorna questo file. Registro decisioni di prodotto: [DECISIONS.md](./DECISIONS.md).

## 1. Cos'è

**Marsica Car Meet** è una piattaforma web per la community di appassionati d'auto
della **Marsica** (Abruzzo). Permette ai membri di scoprire e partecipare ai raduni,
gestire il proprio profilo e il proprio "garage" di auto, e (in fasi successive) consultare
news e le gallerie fotografiche dei raduni.

Il progetto nasce da un mockup grafico ("VELOCITY") creato con Google Stitch e
convertito in codice con Google AI Studio. **Il mockup fornisce esclusivamente lo stile
visivo e le pagine di partenza**; il brand diventa *Marsica Car Meet* e l'architettura
viene ricostruita in modo professionale e scalabile.

## 2. Obiettivi

- Dare alla community un punto di riferimento digitale unico e curato.
- Semplificare l'organizzazione e la partecipazione ai raduni (RSVP, posti, auto).
- Valorizzare i membri e le loro auto (profili + garage).
- Raccontare la vita del club (news, gallerie foto/video).
- Partire piccoli e locali ma con **fondamenta pronte a crescere**.

## 3. Cosa NON è (per ora)

- **Non** è un'app mobile da pubblicare sugli store: è una piattaforma web da browser
  (responsive, usabile anche da smartphone).
- **Non** è un e-commerce: la sezione **Gadget** è una **vetrina permanente** con scheda di
  dettaglio e prezzo indicativo, **senza carrello né checkout — né ora né in futuro** (D-161).
- **Non** include funzioni di intelligenza artificiale al lancio (la dipendenza Gemini
  del mockup viene rimossa; eventuale reintroduzione futura).

## 4. Pubblico di riferimento

| Segmento | Descrizione |
|---|---|
| Appassionati / partecipanti | Membri che cercano raduni, mostrano le proprie auto, fanno RSVP. |
| Amministratori | Staff del club: creano eventi, pubblicano news, moderano contenuti e gestiscono utenti. |
| Organizzatori *(futuro)* | Ruolo predisposto ma disattivato al lancio: gli eventi li crea l'Admin. |
| Visitatori | Utenti non registrati che consultano i contenuti pubblici. |

## 5. Scala e ambizione

- **Fase attuale:** locale (Marsica), poche centinaia di utenti.
- **Priorità:** pragmatismo, costi bassi (free tier), architettura pulita.
- **Ambizione:** l'architettura deve reggere una crescita regionale senza riscritture.

## 6. Vincoli e scelte principali

| Ambito | Decisione |
|---|---|
| Team di sviluppo | Sviluppatore singolo affiancato dall'AI → stack semplice e integrato. |
| Lingue | **Italiano al lancio**; struttura i18n predisposta per l'**Inglese** (Fase 3) — D-151. |
| Registrazione | **Libera** con **conferma email** obbligatoria; anti-bot **Cloudflare Turnstile** (D-142, D-143). |
| Accesso | **Email/password + Google** dal lancio; **2FA opzionale** via app authenticator (D-144, D-145). |
| GDPR / Privacy | Predisposto **fin da subito** (cookie banner, privacy policy, consensi). |
| Budget | Contenuto → soluzioni gestite con free tier. |
| Deploy | **Cloudflare Pages** (gratis, uso commerciale consentito). Vercel Hobby escluso per vincoli ToS commerciali. |

## 7. Stack tecnologico (sintesi)

- **Frontend/Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** TailwindCSS 4 (riuso del design del mockup)
- **i18n:** `next-intl` (IT al lancio, struttura pronta per EN)
- **Backend / DB / Auth / Storage:** Supabase (Postgres, Auth, Storage, Row Level Security)
- **Deploy:** Cloudflare Pages (app) + Supabase (managed backend)

Dettagli in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## 8. Documenti collegati

- [`REQUIREMENTS.md`](./REQUIREMENTS.md) — requisiti funzionali e non funzionali
- [`USER_ROLES.md`](./USER_ROLES.md) — ruoli e matrice permessi
- [`FEATURES.md`](./FEATURES.md) — funzionalità dettagliate
- [`USER_FLOWS.md`](./USER_FLOWS.md) — flussi utente principali
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architettura tecnica e modello dati
- [`CODE_ANALYSIS.md`](./CODE_ANALYSIS.md) — analisi del codice esistente (mockup)
- [`DECISIONS.md`](./DECISIONS.md) — registro decisioni di prodotto
- [`ROADMAP.md`](./ROADMAP.md) — fasi di sviluppo
- [`TODO.md`](./TODO.md) — attività operative
