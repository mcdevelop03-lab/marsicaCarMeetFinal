# ROADMAP — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-08-03.
> Sequenza pensata per uno sviluppatore singolo: ogni fase produce qualcosa di usabile.
> Scelte di scope in [`DECISIONS.md`](./DECISIONS.md).

## Fase 0 — Fondamenta (nessuna funzionalità utente) — ✅ COMPLETATA (2026-07-08)

Obiettivo: base tecnica solida, responsive e ribrandizzata.
Implementata sul branch `feat/fase0-fondamenta` (Next.js **16**, non 15).

- [x] Scaffold Next.js 16 (App Router, TypeScript, Turbopack).
- [x] Integrazione TailwindCSS 4 e migrazione degli stili del mockup (token `@theme`).
- [x] Setup i18n (`next-intl`) con locale IT e struttura pronta per EN (Fase 3).
- [x] Struttura cartelle professionale (`[locale]`, `components/ui`, `components/layout`, `lib`, `i18n`, `messages`).
- [x] Estrazione componenti UI condivisi + **colori su token** (vedi [CODE_ANALYSIS.md](./CODE_ANALYSIS.md)).
- [x] Collegamento a Supabase (client/server) e variabili d'ambiente (`.env.local.example`).
- [x] Migrazione layout mockup: header, footer, navigazione (da `useState` a routing).
- [x] Rebranding VELOCITY → Marsica Car Meet (logo utente, nome, testi reali, palette scuro+rosso).
- [x] Rimozione dipendenze morte: `@google/genai`, `motion`, `express`, `dotenv` + residui AI Studio (scaffold pulito).
- [x] Rimozione elementi da mockup: carrello, telemetria simulata, feed, chat (partiti da zero).
- [x] **Note Next 16:** migrato `middleware.ts` → `proxy.ts` (convenzione deprecata in Next 16).
- **Esito:** ✅ sito navigabile con pagine placeholder, responsive, bilingue di base. Verificato a runtime (`/`→`/it`, home, placeholder, 404, logo).

## Fase 1 — MVP (community + eventi)

Obiettivo: primo prodotto realmente utile alla community. Suddivisa in sotto-progetti **1A** (Backend+Auth), **1B** (Profilo+Garage), **1C** (Eventi+RSVP+media), **1D** (GDPR+rifinitura).

- [x] **[1A]** Schema DB: `profiles`, `vehicles`, `events`, `event_registrations`, `event_vehicles`, `event_media`.
- [x] **[1A]** RLS su tutte le tabelle (pubblico: eventi + media; membri: profili/garage) — inclusi i GRANT di tabella.
- [x] **[1A]** Auth: registrazione + **conferma email**, login/logout, reset, **2FA TOTP**, guardie AAL2. *(Google OAuth + Turnstile reali: solo codice, config cloud rimandata.)*
- [x] **[1B-1]** Profilo membro: visualizzazione e modifica (nome, tag, bio, paese, social), upload avatar. *(2026-07-12)*
- [x] **[1B-2]** Garage: CRUD auto con upload foto (campi obbligatori/opzionali). *(2026-07-15 — con compressione WebP nel browser, migrazione `0007`)*
- [x] **[1C-1]** Eventi: elenco e dettaglio pubblici (con link mappa esterna); tipi raduno/giro/sociale. *(2026-07-21 — migrazione `0008`)*
- [x] **[1C-3]** Admin: creazione/gestione eventi + **album foto dell'evento** (video = link YouTube, D-171). *(2026-07-28 — migrazione `0010`)*
- [x] **[1C-2]** RSVP con capienza + associazione auto all'evento. *(2026-07-23 — migrazione `0009`, capienza race-free via `iscriviti_evento`)*
- [x] **[1D]** GDPR base: cookie banner + pagine privacy/cookie (struttura). *(2026-07-29 — gate sugli embed YouTube, nessuna migrazione)*
- [x] **[1A]** Guardie di accesso (aree membro/admin).
- **Esito:** membri si registrano, gestiscono auto e partecipano ai raduni creati dall'Admin;
  l'Admin pubblica gli album foto dei raduni conclusi.

## Fase 2 — Contenuti & scoperta

Obiettivo: raccontare il club e facilitare la scoperta.

- [ ] **Onboarding post-registrazione** (proposta dell'utente, 2026-08-03). Oggi dopo la conferma email si atterra su `/it/dashboard` ([`auth/callback/route.ts`](../src/app/[locale]/(public)/auth/callback/route.ts)) e nessuno invita l'utente a completare il profilo o ad aggiungere un'auto — su un sito di motori è proprio il dato che serve. **Direzione consigliata:** atterraggio su `/it/profilo` + **riquadro di benvenuto in cima alla pagina** (non modale) che sparisce quando il profilo è completo, con CTA "Completa il profilo" e "Aggiungi la tua auto". ⚠️ **Pop-up sconsigliato:** c'è già il banner cookie come overlay (due sovrapposti sono sgradevoli), sui telefoni i modali sono ostili, e il progetto ha un pattern di sezioni **inline** con cui un modale stona. **Richiede brainstorming + spec + piano**: è una funzionalità, non una rifinitura. La sola riga che cambia l'atterraggio da `/dashboard` a `/profilo` si può anticipare, ma da sola non è l'onboarding.
- [ ] News/blog: CMS admin, elenco e dettaglio articoli.
- [ ] Pagina **Gallery** aggregata (raccoglie gli album degli eventi) — opzionale.
- [ ] **Mappa interattiva** dei raduni (Leaflet + OpenStreetMap) con georeferenziazione eventi.
- [ ] Gestione utenti nel pannello admin (ruoli, sospensioni).
- [ ] Lista partecipanti/auto per evento (admin).
- [ ] Cancellazione account/dati (GDPR).
- [x] ~~Upload video diretto vs embed (decisione D-1)~~ → **deciso in anticipo (D-171, 2026-07-15): solo embed esterno**, link YouTube. Niente upload video, né ora né in Fase 2.
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
