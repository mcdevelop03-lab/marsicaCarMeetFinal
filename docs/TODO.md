# TODO — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-06.
> Attività operative. Le fasi rimandano a [`ROADMAP.md`](./ROADMAP.md).

## ✅ Fatto

- [x] Fase 1 Discovery: raccolta requisiti e decisioni.
- [x] Fase 2 Documentazione: creazione cartella `/docs` con documenti ufficiali.

## 🔜 Prossimo passo immediato

- [x] **Fase 3 — Analisi del codice esistente** → [`CODE_ANALYSIS.md`](./CODE_ANALYSIS.md):
      punti di forza, problemi, duplicazioni, struttura, componenti, performance,
      manutenibilità, possibilità di crescita. *(Nessuna modifica al codice.)*
- [ ] **Presentare l'analisi e attendere approvazione** prima della Fase 4 (Refactoring).

## 🏗️ Fase 0 — Fondamenta (dopo approvazione)

- [ ] Inizializzare progetto Next.js 15 (App Router + TS).
- [ ] Configurare TailwindCSS 4 e importare lo stile del mockup **spostando i colori su token**.
- [ ] Configurare `next-intl` (**IT** al lancio, struttura pronta per EN) e struttura `[locale]`.
- [ ] Creare struttura cartelle (route groups, `components/ui`, `components/features`, lib, i18n, types).
- [ ] Creare `components/ui` (Button, Card, Badge, Input, SectionHeading…) — vedi CODE_ANALYSIS §4.
- [ ] Creare progetto Supabase e configurare env.
- [ ] Migrare header/footer/nav dal mockup al routing Next.
- [ ] Rebranding VELOCITY → Marsica Car Meet (logo utente, testi reali, palette scuro+rosso).
- [ ] Rimuovere dipendenze morte: `@google/genai`, `motion`, `express`, `dotenv` + residui AI Studio.
- [ ] Rimuovere dal mockup: carrello, telemetria simulata, feed community, chat radio.

## 🚀 Fase 1 — MVP

### Database
- [ ] Migrazione SQL: `profiles`, `vehicles`, `events`, `event_registrations`, `event_vehicles`, `event_media`, `gadgets`.
- [ ] Policy RLS per ogni tabella (pubblico: eventi + media; membri: profili/garage).
- [ ] Seed primo utente admin.

### Auth & profilo
- [ ] Pagine registrati / login / reset password + **"Continua con Google"**.
- [ ] **Conferma email obbligatoria** + **Cloudflare Turnstile** su registrati/login.
- [ ] **2FA TOTP opzionale** (attivazione dal profilo).
- [ ] Trigger creazione `profile` alla registrazione.
- [ ] Pagina profilo (view + edit: nome, tag, bio, paese, social) e upload avatar. Visibile ai soli loggati.

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
