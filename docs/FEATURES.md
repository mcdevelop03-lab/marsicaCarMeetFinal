# FEATURES — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-06.
> Le funzionalità sono etichettate per fase (vedi [`ROADMAP.md`](./ROADMAP.md)).

## 1. Autenticazione & Account — *Fase 1*

- Registrazione libera (email + password).
- Login / logout, sessione persistente.
- Reset password via email.
- Conferma email (Fase 1/2).
- Predisposizione login Google (Fase futura).

## 2. Profilo Membro — *Fase 1*

- Profilo pubblico: nome, tag/handle, avatar, bio, licenza (richiamo estetico del mockup).
- Modifica dati profilo e caricamento avatar.
- Statistiche opzionali (es. numero raduni, badge) — riuso dell'estetica del mockup,
  con valori reali derivati dal DB.

## 3. Garage Auto — *Fase 1*

- Elenco delle proprie auto (vista "Garage" del mockup).
- Aggiunta auto: marca, modello, anno, classe, foto, specifiche (potenza, peso, trazione,
  motore, 0–100).
- Modifica ed eliminazione delle proprie auto.
- Caricamento foto auto (storage).
- Vista pubblica del garage di un membro (sola lettura per gli altri).

## 4. Eventi / Raduni — *Fase 1*

- **Elenco eventi** con stato: imminente, in corso, concluso, annullato.
- **Dettaglio evento**: descrizione, luogo, coordinate, data/ora, tipologia, cover image,
  capienza e posti disponibili.
- **Creazione/gestione eventi (solo Admin)**: form completo, upload cover, gestione stato.
- **RSVP**: il membro conferma la partecipazione; blocco automatico al raggiungimento
  della capienza.
- **Auto all'evento**: il membro associa una o più auto del proprio garage all'iscrizione.
- **Lista partecipanti** (Admin): elenco membri iscritti e auto presenti.
- *(Fase futura)* Commenti/discussione sotto l'evento.

## 5. News / Blog — *Fase 2*

- Pubblicazione articoli e annunci da parte dell'Admin (CMS interno).
- Elenco news e pagina dettaglio articolo.
- Copertina, autore, data, stato bozza/pubblicato.

## 6. Galleria Foto/Video — *Fase 2*

- Galleria dei raduni (foto e video).
- Upload da parte dei membri con **moderazione admin** prima della pubblicazione.
- Associazione opzionale di un media a un evento.
- Video: inizialmente via embed esterno (YouTube/link) per contenere lo storage;
  upload diretto valutato in seguito.

## 7. Mappa Raduni Attivi — *Fase 2*

- Mappa con gli hotspot/luoghi dei raduni (vista "Radar Map" del mockup).
- Stato hotspot (attivo, affollato, tranquillo) e numero partecipanti.
- Collegamento dall'hotspot al dettaglio evento.

## 8. Vetrina Merchandising — *Fase 3*

- Catalogo prodotti/gadget del club (riuso della vista "Shop" del mockup).
- Dettaglio prodotto (galleria, descrizione, specifiche).
- **Nessun checkout/pagamento**: eventuale ordine tramite contatto.
- Il carrello del mockup viene mantenuto come componente ma disattivato/riconvertito.

## 9. Pannello Amministrativo — *Fase 1→3*

- Gestione eventi (Fase 1).
- Gestione news e gallery (Fase 2).
- Gestione utenti: elenco, cambio ruolo, sospensione (Fase 2).
- Moderazione contenuti (Fase 2).
- Attivazione ruolo Organizzatore (Fase 3+).

## 10. Internazionalizzazione (IT/EN) — *Fase 0→3*

- Struttura i18n e routing per locale dall'inizio (Fase 0).
- Contenuti UI in italiano al lancio; traduzioni inglesi completate progressivamente.
- Selettore lingua nell'header/footer.

## 11. Privacy & GDPR — *Fase 1*

- Cookie banner con gestione consensi.
- Pagine Privacy Policy e Cookie Policy (struttura da subito; testi legali definitivi in seguito).
- Cancellazione account e dati su richiesta (Fase 2).

## 12. Funzionalità future (backlog) — *Fase 4+*

- E-commerce reale con pagamenti (es. Stripe).
- Tesseramento/quota associativa.
- Notifiche (email/push).
- Funzioni AI (descrizioni auto, assistente).
- Ruolo Organizzatore attivo con eventi propri.
- App mobile (PWA o nativa).
