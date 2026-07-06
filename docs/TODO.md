# TODO — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-06.
> Attività operative. Le fasi rimandano a [`ROADMAP.md`](./ROADMAP.md).

## ✅ Fatto

- [x] Fase 1 Discovery: raccolta requisiti e decisioni.
- [x] Fase 2 Documentazione: creazione cartella `/docs` con documenti ufficiali.

## 🔜 Prossimo passo immediato

- [ ] **Fase 3 — Analisi del codice esistente** (in corso/da presentare):
      punti di forza, problemi, duplicazioni, struttura, componenti, performance,
      manutenibilità, possibilità di crescita. *(Nessuna modifica al codice.)*
- [ ] Attendere approvazione utente prima della Fase 4 (Refactoring).

## 🏗️ Fase 0 — Fondamenta (dopo approvazione)

- [ ] Inizializzare progetto Next.js 15 (App Router + TS).
- [ ] Configurare TailwindCSS 4 e importare lo stile del mockup.
- [ ] Configurare `next-intl` (IT/EN) e struttura `[locale]`.
- [ ] Creare struttura cartelle (route groups, components, lib, i18n, types).
- [ ] Creare progetto Supabase e configurare env.
- [ ] Migrare header/footer/nav dal mockup al routing Next.
- [ ] Rebranding VELOCITY → Marsica Car Meet.
- [ ] Rimuovere dipendenza `@google/genai`.

## 🚀 Fase 1 — MVP

### Database
- [ ] Migrazione SQL: `profiles`, `vehicles`, `events`, `event_registrations`, `event_vehicles`.
- [ ] Policy RLS per ogni tabella.
- [ ] Seed primo utente admin.

### Auth & profilo
- [ ] Pagine registrati / login / reset password.
- [ ] Trigger creazione `profile` alla registrazione.
- [ ] Pagina profilo (view + edit) e upload avatar.

### Garage
- [ ] Elenco auto proprie.
- [ ] Form aggiungi/modifica auto + upload foto.
- [ ] Eliminazione auto.
- [ ] Vista pubblica garage di un membro.

### Eventi
- [ ] Elenco eventi pubblico + filtri per stato.
- [ ] Pagina dettaglio evento.
- [ ] Admin: CRUD evento + upload cover.
- [ ] RSVP con controllo capienza.
- [ ] Associazione auto all'iscrizione.

### GDPR & guardie
- [ ] Cookie banner + gestione consensi.
- [ ] Pagine privacy/cookie (struttura).
- [ ] Middleware guardie aree membro/admin.

## 🗂️ Backlog (fasi successive)

Vedi [`ROADMAP.md`](./ROADMAP.md) Fasi 2–4: news, gallery, mappa, gestione utenti,
merch, traduzioni EN, e-commerce, notifiche, AI, ruolo Organizzatore.

## ❓ Decisioni aperte da chiudere

- [ ] D-1: upload video diretto vs embed esterno (Fase 2).
- [ ] D-2: strategia contenuti multilingua (Fase 2).
- [ ] D-3: attivazione ruolo Organizzatore (Fase 3+).
- [ ] D-4: provider e-commerce (Fase 4).
- [ ] Confermare palette/logo definitivi del rebranding.
