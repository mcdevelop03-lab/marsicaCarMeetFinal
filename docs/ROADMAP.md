# ROADMAP — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-06.
> Sequenza pensata per uno sviluppatore singolo: ogni fase produce qualcosa di usabile.

## Fase 0 — Fondamenta (nessuna funzionalità utente)

Obiettivo: base tecnica solida, responsive e ribrandizzata.

- [ ] Scaffold Next.js 15 (App Router, TypeScript).
- [ ] Integrazione TailwindCSS 4 e migrazione degli stili del mockup.
- [ ] Setup i18n (`next-intl`) con locale IT/EN e routing `/it` `/en`.
- [ ] Struttura cartelle professionale (route groups, components, lib).
- [ ] Collegamento a Supabase (client/server) e variabili d'ambiente.
- [ ] Migrazione layout mockup: header, footer, navigazione (da `useState` a routing).
- [ ] Rebranding VELOCITY → Marsica Car Meet (logo, nome, testi, palette confermata).
- [ ] Rimozione dipendenza AI/Gemini non necessaria.
- **Esito:** sito navigabile con pagine placeholder, responsive, bilingue di base.

## Fase 1 — MVP (community + eventi)

Obiettivo: primo prodotto realmente utile alla community.

- [ ] Schema DB: `profiles`, `vehicles`, `events`, `event_registrations`, `event_vehicles`.
- [ ] RLS su tutte le tabelle.
- [ ] Auth: registrazione, login, logout, reset password.
- [ ] Profilo membro: visualizzazione e modifica, upload avatar.
- [ ] Garage: CRUD auto con upload foto.
- [ ] Eventi: elenco e dettaglio pubblici.
- [ ] Admin: creazione/gestione eventi.
- [ ] RSVP con capienza + associazione auto all'evento.
- [ ] GDPR base: cookie banner + pagine privacy/cookie (struttura).
- [ ] Guardie di accesso (aree membro/admin).
- **Esito:** membri si registrano, gestiscono auto e partecipano ai raduni creati dall'Admin.

## Fase 2 — Contenuti & scoperta

Obiettivo: raccontare il club e facilitare la scoperta.

- [ ] News/blog: CMS admin, elenco e dettaglio articoli.
- [ ] Gallery foto/video con moderazione admin.
- [ ] Mappa raduni attivi (hotspot).
- [ ] Gestione utenti nel pannello admin (ruoli, sospensioni).
- [ ] Lista partecipanti/auto per evento (admin).
- [ ] Cancellazione account/dati (GDPR).
- **Esito:** piattaforma ricca di contenuti, con mappa e gestione utenti.

## Fase 3 — Rifiniture & merch

Obiettivo: completare esperienza e preparare estensioni.

- [ ] Vetrina merchandising (senza checkout).
- [ ] Traduzioni EN complete dell'interfaccia.
- [ ] Pannello admin completo e rifinito.
- [ ] Predisposizione/attivazione ruolo Organizzatore.
- [ ] Ottimizzazioni SEO (sitemap, metadati, Open Graph).
- **Esito:** prodotto completo, bilingue, pronto alla crescita.

## Fase 4 — Estensioni future (backlog)

- [ ] E-commerce reale con pagamenti.
- [ ] Tesseramento / quota associativa.
- [ ] Notifiche (email/push).
- [ ] Funzioni AI (descrizioni, assistente).
- [ ] Login social (Google).
- [ ] Commenti/discussioni sugli eventi.
- [ ] Contenuti multilingua (eventi/news tradotti).
- [ ] PWA / esperienza mobile avanzata.

---

### Note sulla sequenza

- Le fasi sono **incrementali**: ognuna lascia il sito in uno stato pubblicabile.
- Le priorità (P0/P1/P2) in [`REQUIREMENTS.md`](./REQUIREMENTS.md) guidano l'ordine interno.
- La roadmap è modificabile: si aggiorna ad ogni decisione condivisa.
