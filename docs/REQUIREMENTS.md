# REQUIREMENTS — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-06.

Legenda priorità: **P0** = necessario al lancio (MVP) · **P1** = importante, fase successiva ·
**P2** = desiderabile / futuro.

## 1. Requisiti funzionali

### 1.1 Autenticazione e account
| ID | Requisito | Priorità |
|---|---|---|
| RF-01 | Registrazione libera con email e password. | P0 |
| RF-02 | Login / logout. | P0 |
| RF-03 | Recupero password (reset via email). | P0 |
| RF-04 | Conferma email alla registrazione. | P1 |
| RF-05 | Login social (Google) — predisposto, attivabile in futuro. | P2 |

### 1.2 Profilo e garage
| ID | Requisito | Priorità |
|---|---|---|
| RF-10 | Ogni membro ha un profilo pubblico (nome, tag, avatar, bio). | P0 |
| RF-11 | Il membro gestisce il proprio "garage": aggiunge/modifica/elimina auto. | P0 |
| RF-12 | Ogni auto ha marca, modello, anno, classe, foto e specifiche. | P0 |
| RF-13 | Caricamento avatar e foto auto (storage). | P0 |

### 1.3 Eventi / raduni
| ID | Requisito | Priorità |
|---|---|---|
| RF-20 | Elenco eventi pubblici con stato (imminente/in corso/concluso). | P0 |
| RF-21 | Pagina dettaglio evento (descrizione, luogo, data, coordinate). | P0 |
| RF-22 | Solo Admin crea/modifica/elimina eventi. | P0 |
| RF-23 | Membro effettua RSVP (partecipa) a un evento. | P0 |
| RF-24 | Evento con **capienza massima**: RSVP bloccato a esaurimento posti. | P0 |
| RF-25 | Membro associa una o più auto del proprio garage all'evento. | P0 |
| RF-26 | Admin vede l'elenco partecipanti e le auto iscritte. | P1 |
| RF-27 | Commenti/discussione sotto l'evento. | P2 |

### 1.4 Contenuti
| ID | Requisito | Priorità |
|---|---|---|
| RF-30 | News/blog: Admin pubblica articoli/annunci. | P1 |
| RF-31 | Galleria foto/video dei raduni. | P1 |
| RF-32 | Moderazione dei contenuti caricati dagli utenti. | P1 |
| RF-33 | Mappa dei raduni attivi (hotspot con coordinate). | P1 |
| RF-34 | Vetrina merchandising (prodotti senza checkout). | P2 |

### 1.5 Amministrazione
| ID | Requisito | Priorità |
|---|---|---|
| RF-40 | Pannello admin per gestire eventi, news, gallery. | P0/P1 |
| RF-41 | Gestione utenti (visualizza, cambia ruolo, sospendi). | P1 |
| RF-42 | Assegnazione ruolo Organizzatore (futuro). | P2 |

### 1.6 Internazionalizzazione
| ID | Requisito | Priorità |
|---|---|---|
| RF-50 | Interfaccia disponibile in Italiano e Inglese. | P0 (struttura) / P1 (traduzioni EN complete) |
| RF-51 | Selettore lingua e routing per locale (`/it`, `/en`). | P0 |

### 1.7 Legale / GDPR
| ID | Requisito | Priorità |
|---|---|---|
| RF-60 | Cookie banner con gestione consensi. | P0 |
| RF-61 | Pagina Privacy Policy e Cookie Policy. | P0 (struttura) |
| RF-62 | Diritto di cancellazione account e dati. | P1 |

## 2. Requisiti non funzionali

| ID | Requisito |
|---|---|
| RNF-01 | **Responsive**: pienamente usabile da mobile, tablet e desktop. |
| RNF-02 | **Performance**: pagine pubbliche renderizzate server-side per SEO e velocità. |
| RNF-03 | **Sicurezza**: permessi applicati sia server-side sia a livello DB (Row Level Security). |
| RNF-04 | **Manutenibilità**: codice modulare, componenti riutilizzabili, tipizzato (TypeScript). |
| RNF-05 | **Scalabilità**: architettura che regge crescita da locale a regionale senza riscritture. |
| RNF-06 | **Costo**: avvio a costo €0 tramite free tier (Cloudflare Pages + Supabase). |
| RNF-07 | **Accessibilità**: contrasti, focus, alt text sulle immagini (livello base al lancio). |
| RNF-08 | **SEO**: URL leggibili, metadati, sitemap per pagine pubbliche. |
| RNF-09 | **Osservabilità**: log errori e monitoraggio base (fase successiva). |

## 3. Assunzioni

- Traffico iniziale basso (community locale) → free tier sufficienti.
- I video pesanti verranno inizialmente gestiti via embed esterni (es. YouTube) per non
  saturare lo storage; upload video diretto valutato in fase successiva.
- L'e-commerce reale (pagamenti) è fuori scope al lancio.

## 4. Fuori scope (al lancio)

- Pagamenti online / checkout.
- App mobile nativa.
- Funzioni AI.
- Tesseramento a pagamento.
- Notifiche push / email transazionali avanzate.
