# TODO — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-08.
> Attività operative. Le fasi rimandano a [`ROADMAP.md`](./ROADMAP.md).

## ✅ Fatto

- [x] Fase 1 Discovery: raccolta requisiti e decisioni.
- [x] Fase 2 Documentazione: creazione cartella `/docs` con documenti ufficiali.
- [x] Fase 3 Analisi del codice → [`CODE_ANALYSIS.md`](./CODE_ANALYSIS.md).
- [x] **Fase 0 — Fondamenta** completata (2026-07-08) sul branch `feat/fase0-fondamenta`.
      Piano: [`superpowers/plans/2026-07-07-fase0-fondamenta.md`](./superpowers/plans/2026-07-07-fase0-fondamenta.md).

## 🔜 Prossimo passo immediato

- [ ] Iniziare il sotto-progetto **1B — Profilo + Garage** (view/edit profilo, avatar, CRUD auto + foto).

## ✅ Fase 0 — Fondamenta — COMPLETATA (2026-07-08)

> Realizzata su **Next.js 16** (il piano prevedeva 15). Build, lint, tsc verdi; verificata a runtime.

- [x] Inizializzato progetto Next.js 16 (App Router + TS + Turbopack).
- [x] TailwindCSS 4 con stile del mockup **su token** (`@theme`).
- [x] `next-intl` (**IT**, struttura pronta per EN) e struttura `[locale]`.
- [x] Struttura cartelle (`components/ui`, `components/layout`, lib, i18n, messages).
- [x] `components/ui` (Button, Card, Badge, Input, SectionHeading).
- [x] Client Supabase (browser/server) + env di esempio *(progetto Supabase reale da creare in Fase 1)*.
- [x] Header/footer/nav dal mockup al routing Next.
- [x] Rebranding VELOCITY → Marsica Car Meet (logo, testi, palette scuro+rosso).
- [x] Nessuna dipendenza morta (scaffold pulito).
- [x] Elementi mockup (carrello, telemetria, feed, chat) non riportati (partiti da zero).
- [x] Migrazione Next 16: `middleware.ts` → `proxy.ts`.

## 🚀 Fase 1 — MVP

### ✅ 1A — Backend + Auth — COMPLETATA (2026-07-09, branch `feat/fase1a-backend-auth`)

> 13 task. Collaudo e2e (browser + Mailpit + SQL) superato. Durante il collaudo sono
> emersi e corretti 7 bug (GRANT tabelle mancanti, allow-list redirect conferma,
> Turnstile render, config MFA + QR + errore UI). Build, lint, tsc verdi.

- [x] Migrazione SQL: `profiles`, `vehicles`, `events`, `event_registrations`, `event_vehicles`, `event_media` (+ **GRANT ruoli**).
- [x] Policy RLS per ogni tabella (pubblico: eventi + media; membri: profili/garage) — verificata su `vehicles`.
- [x] Seed primo utente admin (`mcdevelop03@gmail.com`).
- [x] Pagine registrati / login / reset password + **"Continua con Google"** *(OAuth reale rimandato al cloud)*.
- [x] **Conferma email** + **Cloudflare Turnstile** su registrati/login *(chiavi reali rimandate al cloud)*.
- [x] **2FA TOTP opzionale** (attivazione da `/impostazioni`) + enforcement AAL2 nelle guardie.
- [x] Trigger creazione `profile` alla registrazione.

### Database/Auth — resto Fase 1
- [ ] Tabella `gadgets` (Fase 5 Gadget) — rimandata.
- [ ] Pagina profilo (view + edit: nome, tag, bio, paese, social) e upload avatar. Visibile ai soli loggati. **[1B]**

### Garage
- [ ] Elenco auto proprie.
- [ ] Form aggiungi/modifica auto (marca/modello/anno/foto obbligatori; categoria/descrizione/specifiche opzionali) + upload foto.
- [ ] Eliminazione auto.
- [ ] Vista garage di un membro (sola lettura per gli altri membri loggati).

### Eventi
- [ ] Elenco eventi pubblico + filtri per stato.
- [ ] Pagina dettaglio evento (con luogo + link mappa esterna).
- [ ] Admin: CRUD evento + upload cover + tipi (raduno/giro/sociale).
- [ ] RSVP con controllo capienza.
- [ ] Associazione auto all'iscrizione.
- [ ] Admin: **upload album foto/video dell'evento** (post-raduno), pubblico.

### GDPR & guardie
- [ ] Cookie banner + gestione consensi.
- [ ] Pagine privacy/cookie (struttura).
- [ ] Middleware guardie aree membro/admin.

## 🎨 Rifiniture UI aperte (da affrontare più avanti)

- [ ] **Logo nell'header troppo piccolo/poco leggibile** (feedback utente 2026-07-08).
      Attualmente 40×40px in [`Header.tsx`](../src/components/layout/Header.tsx). Da rivedere
      dimensione/resa (il file `logo-white.png` è ~893KB, valutare anche una versione ottimizzata).

## 🗂️ Backlog (fasi successive)

Vedi [`ROADMAP.md`](./ROADMAP.md) Fasi 2–4: news, gallery aggregata, mappa interattiva,
gestione utenti, vetrina Gadget, traduzioni EN, notifiche, AI, ruolo Organizzatore.
*(E-commerce escluso in modo permanente — D-161.)*

## ❓ Decisioni aperte da chiudere

Scope MVP chiuso nella sessione 2026-07-07 → [`DECISIONS.md`](./DECISIONS.md). Restano:

- [x] ~~Payoff + headline~~ → **scelti** (default modificabili): "La community dei motori della Marsica" / "LA MARSICA CORRE INSIEME" (D-103).
- [x] ~~Logo~~ → **risolto**: `assets/logo-white.png` (trasparente, tema scuro) + `assets/logo-black.jpeg` (D-104).
- [ ] D-1: upload video diretto vs embed esterno (Fase 2).
- [ ] D-2: strategia contenuti multilingua (Fase 3).
- [ ] D-3: attivazione ruolo Organizzatore (Fase 3+).
- [x] ~~D-4: provider e-commerce~~ → **chiusa: nessun e-commerce, mai (D-161)**.
- [x] ~~Palette~~ → **confermata scuro + rosso/arancio (D-102)**.
