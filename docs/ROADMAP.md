# ROADMAP — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-07.
> Sequenza pensata per uno sviluppatore singolo: ogni fase produce qualcosa di usabile.
> Scelte di scope in [`DECISIONS.md`](./DECISIONS.md).

## Fase 0 — Fondamenta (nessuna funzionalità utente)

Obiettivo: base tecnica solida, responsive e ribrandizzata.

- [ ] Scaffold Next.js 15 (App Router, TypeScript).
- [ ] Integrazione TailwindCSS 4 e migrazione degli stili del mockup.
- [ ] Setup i18n (`next-intl`) con locale IT e struttura pronta per EN (Fase 3).
- [ ] Struttura cartelle professionale (route groups, `components/ui`, `components/features`, lib).
- [ ] Estrazione componenti UI condivisi + **colori su token** (vedi [CODE_ANALYSIS.md](./CODE_ANALYSIS.md)).
- [ ] Collegamento a Supabase (client/server) e variabili d'ambiente.
- [ ] Migrazione layout mockup: header, footer, navigazione (da `useState` a routing).
- [ ] Rebranding VELOCITY → Marsica Car Meet (logo utente, nome, testi reali, palette scuro+rosso).
- [ ] Rimozione dipendenze morte: `@google/genai`, `motion`, `express`, `dotenv` + residui AI Studio.
- [ ] Rimozione elementi da mockup: carrello, telemetria simulata, feed, chat.
- **Esito:** sito navigabile con pagine placeholder, responsive, bilingue di base.

## Fase 1 — MVP (community + eventi)

Obiettivo: primo prodotto realmente utile alla community.

- [ ] Schema DB: `profiles`, `vehicles`, `events`, `event_registrations`, `event_vehicles`, `event_media`.
- [ ] RLS su tutte le tabelle (pubblico: eventi + media; membri: profili/garage).
- [ ] Auth: registrazione + **conferma email**, login/logout, reset, **Google OAuth**, **Turnstile**, **2FA TOTP opzionale**.
- [ ] Profilo membro: visualizzazione e modifica (nome, tag, bio, paese, social), upload avatar.
- [ ] Garage: CRUD auto con upload foto (campi obbligatori/opzionali).
- [ ] Eventi: elenco e dettaglio pubblici (con link mappa esterna); tipi raduno/giro/sociale.
- [ ] Admin: creazione/gestione eventi + **upload album foto/video dell'evento**.
- [ ] RSVP con capienza + associazione auto all'evento.
- [ ] GDPR base: cookie banner + pagine privacy/cookie (struttura).
- [ ] Guardie di accesso (aree membro/admin).
- **Esito:** membri si registrano, gestiscono auto e partecipano ai raduni creati dall'Admin;
  l'Admin pubblica gli album foto dei raduni conclusi.

## Fase 2 — Contenuti & scoperta

Obiettivo: raccontare il club e facilitare la scoperta.

- [ ] News/blog: CMS admin, elenco e dettaglio articoli.
- [ ] Pagina **Gallery** aggregata (raccoglie gli album degli eventi) — opzionale.
- [ ] **Mappa interattiva** dei raduni (Leaflet + OpenStreetMap) con georeferenziazione eventi.
- [ ] Gestione utenti nel pannello admin (ruoli, sospensioni).
- [ ] Lista partecipanti/auto per evento (admin).
- [ ] Cancellazione account/dati (GDPR).
- [ ] Upload video diretto vs embed (decisione D-1).
- **Esito:** piattaforma ricca di contenuti, con mappa e gestione utenti.

## Fase 3 — Rifiniture & merch

Obiettivo: completare esperienza e preparare estensioni.

- [ ] Vetrina **Gadget** (schede + dettaglio + prezzo indicativo, **senza acquisto**).
- [ ] Traduzioni EN complete dell'interfaccia (attivazione locale `/en`).
- [ ] Pannello admin completo e rifinito.
- [ ] Predisposizione/attivazione ruolo Organizzatore.
- [ ] Ottimizzazioni SEO (sitemap, metadati, Open Graph).
- **Esito:** prodotto completo, bilingue, pronto alla crescita.

## Fase 4 — Estensioni future (backlog)

- [ ] Tesseramento / quota associativa.
- [ ] Notifiche (email/push).
- [ ] Funzioni AI (descrizioni, assistente).
- [ ] Commenti/discussioni sugli eventi.
- [ ] Contenuti multilingua (eventi/news tradotti).
- [ ] PWA / esperienza mobile avanzata.

> **Escluso in modo permanente:** e-commerce reale con pagamenti/carrello (D-161).
> **Già nell'MVP** (non più backlog): login con Google.

---

### Note sulla sequenza

- Le fasi sono **incrementali**: ognuna lascia il sito in uno stato pubblicabile.
- Le priorità (P0/P1/P2) in [`REQUIREMENTS.md`](./REQUIREMENTS.md) guidano l'ordine interno.
- La roadmap è modificabile: si aggiorna ad ogni decisione condivisa.
