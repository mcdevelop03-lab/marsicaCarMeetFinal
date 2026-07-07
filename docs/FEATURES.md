# FEATURES — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-07.
> Le funzionalità sono etichettate per fase (vedi [`ROADMAP.md`](./ROADMAP.md)).
> Scelte di scope in [`DECISIONS.md`](./DECISIONS.md).

## 1. Autenticazione & Account — *Fase 1*

- Registrazione libera (email + password) con **conferma email obbligatoria**.
- **Login con Google** (OAuth) dal lancio.
- Login / logout, sessione persistente; reset password via email.
- **Anti-bot Cloudflare Turnstile** su registrazione e login (D-143).
- **2FA opzionale** via app authenticator (TOTP), attivabile dal membro (D-144).

## 2. Profilo Membro — *Fase 1*

- Profilo: nome, tag/handle, avatar, bio, **paese/città della Marsica**, eventuali **link social**.
- Modifica dati profilo e caricamento avatar.
- **Niente gamification** (XP, livelli, trofei, rank) e **niente "licenza/tessera"** (D-111, D-114).
- Visibile **ai soli membri loggati** (non pubblico ai non registrati — D-146).

## 3. Garage Auto — *Fase 1*

- Elenco delle proprie auto (vista "Garage" del mockup, senza telemetria simulata — D-112).
- Aggiunta auto: **marca, modello, anno, foto** (obbligatori); **categoria, descrizione,
  specifiche** (potenza, peso, trazione, motore, 0–100) **opzionali** (D-123).
- Modifica ed eliminazione delle proprie auto.
- Caricamento foto auto (storage).
- Garage di un membro visibile **agli altri membri loggati** in sola lettura (D-146).

## 4. Eventi / Raduni — *Fase 1*

- **Elenco eventi** (pubblico) con stato: imminente, in corso, concluso, annullato.
- **Tipi di evento**: Raduno statico, Giro/tour su strada, Cena/incontro sociale (D-126).
- **Dettaglio evento**: descrizione, luogo (con **link a mappa esterna** — D-134), data/ora,
  tipologia, cover image, capienza e posti disponibili.
- **Creazione/gestione eventi (solo Admin)**: form completo, upload cover, gestione stato.
- **RSVP**: il membro conferma la partecipazione; blocco automatico al raggiungimento
  della capienza.
- **Auto all'evento**: il membro associa una o più auto del proprio garage all'iscrizione.
- **Lista partecipanti** (Admin): elenco membri iscritti e auto presenti.
- **Album foto/video dell'evento**: a raduno concluso l'**Admin** carica i media, che
  diventano **pubblici** nella pagina evento (D-133).

## 5. News / Blog — *Fase 2*

- Pubblicazione articoli e annunci da parte dell'Admin (CMS interno).
- Elenco news e pagina dettaglio articolo.
- Copertina, autore, data, stato bozza/pubblicato.

## 6. Album Foto/Video degli eventi — *Fase 1*

- **Non** una gallery pubblica con upload dei membri: è un **album per-evento** (vedi §4).
- **Carica solo l'Admin**, a raduno concluso; **niente moderazione** (D-133).
- Video: inizialmente via embed esterno (YouTube/link) per contenere lo storage;
  upload diretto valutato in seguito (D-1, Fase 2).
- *(Fase 2)* eventuale pagina "Gallery" che aggrega gli album di tutti gli eventi.

## 7. Mappa Raduni — *MVP: link · pagina dedicata Fase 2*

- **MVP:** il dettaglio evento mostra il **luogo con link/embed a una mappa esterna**
  (Google/OSM) — nessuna mappa custom (D-134).
- **Fase 2:** pagina-mappa interattiva (es. Leaflet + OpenStreetMap) con tutti i raduni
  georeferenziati e collegamento al dettaglio evento.

## 8. Vetrina Gadget — *Fase 3*

- Catalogo gadget del club (riuso della vista "Shop" del mockup, ribattezzata **Gadget**).
- Dettaglio gadget (galleria, descrizione, **prezzo indicativo**).
- **Nessun carrello, nessun checkout, nessun pagamento — mai** (D-161).
- Il **carrello del mockup viene rimosso del tutto** (non solo disattivato).

## 9. Pannello Amministrativo — *Fase 1→3*

- Gestione eventi + **upload album foto/video dell'evento** (Fase 1).
- Gestione news (Fase 2).
- Gestione utenti: elenco, cambio ruolo, sospensione (Fase 2).
- Attivazione ruolo Organizzatore (Fase 3+).

## 10. Internazionalizzazione — *struttura Fase 0, EN in Fase 3*

- Struttura i18n e routing per locale (`/it`) predisposti dall'inizio (Fase 0).
- **Al lancio solo Italiano** (D-151); traduzioni inglesi completate in Fase 3.
- Selettore lingua predisposto, visibile quando l'EN sarà attivo.

## 11. Privacy & GDPR — *Fase 1*

- Cookie banner con gestione consensi.
- Pagine Privacy Policy e Cookie Policy (struttura da subito; testi legali definitivi in seguito).
- Cancellazione account e dati su richiesta (Fase 2).

## 12. Funzionalità future (backlog) — *Fase 4+*

- Tesseramento/quota associativa.
- Notifiche (email/push).
- Funzioni AI (descrizioni auto, assistente).
- Ruolo Organizzatore attivo con eventi propri.
- Traduzioni EN complete e contenuti multilingua.
- App mobile (PWA o nativa).

> **Escluso in modo permanente:** e-commerce/pagamenti/carrello (D-161). La sezione Gadget
> resta una vetrina senza acquisto.
