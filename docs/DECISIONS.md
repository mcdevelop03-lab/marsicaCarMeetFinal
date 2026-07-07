# DECISIONS — Registro decisioni di prodotto

> Documento vivo. Ultima modifica: 2026-07-07.
> Registro delle decisioni **di prodotto/scope** prese con l'utente. Le decisioni puramente
> **architetturali** restano in [ARCHITECTURE.md §11](./ARCHITECTURE.md). Ogni voce ha un ID
> stabile citabile dagli altri documenti.

## Sessione 2026-07-07 — Definizione scope MVP (post analisi codice)

Sessione decisionale seguita alla [Fase 3 — analisi del codice](./CODE_ANALYSIS.md). Obiettivo:
chiudere tutte le ambiguità prima del refactoring, per non rimettere mano dopo.

### Identità & design

| ID | Decisione | Motivazione |
|---|---|---|
| **D-101** | **Teniamo il look "racing" del mockup** (tema scuro, font display corsivo, accento rosso/arancio, griglia/carbon), ma **eliminiamo la narrativa "outlaw/corse clandestine"** (niente midnight/police/drift/LA). Contenuti reali della Marsica. | Il design è un punto di forza riusabile; la narrativa illegale non è adatta a un club reale. |
| **D-102** | **Palette:** confermato **scuro + rosso (`#FF3E00`)/arancio**, ma spostata su **token di tema puliti** (niente più colori hardcoded nei componenti). | Massimo riuso del design; rebranding futuro semplice. |
| **D-103** | **Nome confermato: "Marsica Car Meet".** **Payoff:** *"La community dei motori della Marsica"*. **Headline hero:** *"LA MARSICA CORRE INSIEME"*. Testi scelti come default (facilmente modificabili). Vedi §"Brand copy". | Chiaro e locale. |
| **D-104** | **Logo:** **fornito dall'utente**, badge circolare "MARSICA CAR MEET" + emblema, in **due varianti**: `assets/logo-white.png` (PNG trasparente, marchio bianco → tema scuro) e `assets/logo-black.jpeg` (sfondi chiari/favicon). Senza watermark. | **Risolto.** Un file vettoriale (SVG) resta un nice-to-have futuro. |

### Modello dati & funzioni "da gioco"

| ID | Decisione | Impatto |
|---|---|---|
| **D-111** | **Rimuovere tutta la gamification del pilota**: XP, livelli, trofei, rank, reputazione. Il profilo mostra **solo dati reali**. | Spariscono da `types.ts`: `DriverStats`, `Trophy`, `ActivityLog`, campi `level/xp`. |
| **D-112** | **Rimuovere la telemetria "live" del veicolo** (boost/RPM/temp/olio) e **i 3 simulatori `setInterval`** (telemetria garage, tachimetro/drift mappa, auto-reply chat). | Spariscono il campo `telemetry` e i timer; costo CPU azzerato. |
| **D-113** | **Tenere le specifiche statiche reali** dell'auto (potenza, peso, trazione, motore, 0-100) come **campi opzionali**. | `vehicles.specs` (jsonb) resta, non obbligatorio. |
| **D-114** | **Nessun concetto di "licenza/tessera"** nel profilo MVP (era estetica outlaw). Profilo semplice. | Rimuovere `license_type`/`license_status` da `profiles`. |

### Profilo, garage, eventi

| ID | Decisione | Note |
|---|---|---|
| **D-121** | **Profilo semplice:** nome, username/tag, avatar, bio, **paese/città della Marsica**, eventuali **link social**. Niente tesseramento/quote nell'MVP. | |
| **D-122** | **Garage: CRUD completo delle proprie auto** da parte del membro (foto incluse). Le auto altrui sono in **sola lettura**. | Cuore del "car meet". |
| **D-123** | **Scheda auto**: obbligatori **marca, modello, anno, foto**; opzionali **categoria, descrizione, specifiche tecniche**. | |
| **D-124** | **Eventi creati/modificati/eliminati solo dall'Admin.** I membri li **vedono** (elenco + dettaglio), non li modificano. | |
| **D-125** | **Iscrizione (RSVP) attiva:** il membro si iscrive a un evento **con controllo capienza** e **associa una o più auto** del garage. L'Admin vede iscritti e auto. | "Solo visualizzazione" valeva per la *modifica* dell'evento, non per l'iscrizione. |
| **D-126** | **Tipi di evento (MVP):** **Raduno statico**, **Giro/tour su strada**, **Cena/incontro sociale**. *(Niente track day/rally.)* | Enum `events.type`. |

### Community, contenuti, mappa

| ID | Decisione | Note |
|---|---|---|
| **D-131** | **Nessun feed sociale** (post/like/commenti). La home mostra i **prossimi eventi** (sola visualizzazione per i membri). | Rimuove la "community feed" del mockup. |
| **D-132** | **Chat "radio live" eliminata.** | Fuori scope; la community usa canali esterni. |
| **D-133** | **Gallery = album per-evento gestito dall'Admin.** A raduno concluso, **l'Admin carica foto/video** di quell'evento. **Niente upload dei membri, niente moderazione.** | Cambia `gallery_media` → media legati all'evento, senza `approved`. |
| **D-134** | **Mappa:** nell'MVP l'evento mostra **luogo + link a mappa esterna** (Google/OSM). La **pagina-mappa interattiva** con tutti i raduni arriva in **Fase 2**. | |
| **D-135** | **News/Blog:** confermato in **Fase 2**. | |

### Accesso, ruoli, sicurezza

| ID | Decisione | Note |
|---|---|---|
| **D-141** | **Ruoli MVP: Membro + Admin.** Il ruolo **Organizzatore** resta **predisposto ma disattivo**. | Coerente con [USER_ROLES.md](./USER_ROLES.md). |
| **D-142** | **Registrazione aperta con conferma email obbligatoria.** | Massima crescita, minimo attrito. |
| **D-143** | **Anti-bot: Cloudflare Turnstile** (captcha invisibile, gratis) su registrazione e login + **conferma email** + limiti tentativi nativi. | È lo scudo reale contro i bot. |
| **D-144** | **2FA opzionale via app authenticator (TOTP)**, nativa Supabase. **Scartato il codice-2FA via email** (custom + dipendente dalla deliverability). | L'utente chiedeva più sicurezza + anti-bot: coperti da D-143 + TOTP. |
| **D-145** | **Login: email/password + Google (OAuth) già nell'MVP.** | Richiesta esplicita dell'utente (era previsto come futuro). |
| **D-146** | **Aree pubbliche (senza login):** **home**, **elenco/dettaglio eventi**, **foto/video degli eventi**. **Garage e profili dei membri sono riservati ai membri loggati.** | Impatta le policy RLS e la SEO. |

### Lingue

| ID | Decisione | Note |
|---|---|---|
| **D-151** | **Al lancio: solo Italiano.** Struttura i18n (`next-intl`, routing `/it`) **predisposta** per aggiungere l'**Inglese in Fase 3** senza rifare nulla. | Pubblico locale italiano; evita doppia traduzione durante lo sviluppo. |

### E-commerce / gadget

| ID | Decisione | Note |
|---|---|---|
| **D-161** | **Sezione "Gadget" = vetrina permanente senza acquisto.** Schede con foto, descrizione e **prezzo indicativo**, pagina di dettaglio. **Nessun carrello, nessun checkout — né ora né in futuro.** | **Chiude D-4** e **rimuove l'e-commerce dalla Fase 4.** Il carrello del mockup va **rimosso del tutto** (non solo disattivato). |

## Brand copy (bozza 2026-07-07)

Testi italiani che sostituiscono quelli "outlaw/inglese" del mockup. **Bozza modificabile** —
scelti per non bloccare la Fase 4. Da tradurre in EN in Fase 3.

| Slot (dov'era nel mockup) | Testo mockup (da sostituire) | Testo Marsica Car Meet |
|---|---|---|
| Nome / wordmark | VELOCITY | **Marsica Car Meet** |
| Payoff (sotto il logo, header/footer/meta) | "Outlaw Performance Platform" | **La community dei motori della Marsica** |
| Headline hero (home) | "IGNITE YOUR PASSION" | **LA MARSICA CORRE INSIEME** |
| Sottotitolo hero | (testo inglese lungo) | *Scopri i raduni, mostra la tua auto e vivi la passione dei motori in Marsica.* |
| Badge hero | "LIVE_STATUS // SEASON_04" | *(rimosso, o "PROSSIMI RADUNI")* |
| Voci di menu | Dashboard · Canyon Run · Garage Rig · Performance Shop · Active Radar Map | **Home · Eventi · Garage · Gadget** *(· Mappa in Fase 2)* |
| Banner "unisciti" (titolo) | "READY TO CLIP THE APEX?" | **PRONTO A UNIRTI AL RADUNO?** |
| Banner "unisciti" (CTA) | "Request Entry" | **Registrati** |
| Footer | coordinate LA · "© 2026 VELOCITY INC" · "System Status…" | **© 2026 Marsica Car Meet** *(via coordinate/testi finti)* |
| Etichetta membro | "VELOCITY S-MEMBER" / "Dominic T." | *(nome reale del membro loggato)* |

> Tono: italiano, community/territorio, ma con l'energia del look racing (maiuscolo/corsivo
> nei titoli). Niente riferimenti a corse illegali, polizia, drift score (D-101).

## Decisioni ereditate (sessioni precedenti)

Restano valide le decisioni architetturali del 2026-07-06/07 in [ARCHITECTURE.md §11](./ARCHITECTURE.md#11-registro-delle-decisioni-adr-sintetico): stack Next.js + Supabase, deploy Cloudflare Pages, Supabase free + keep-alive, R2 come opzione storage foto, GDPR da subito, rimozione dipendenza AI/Gemini.

## Decisioni ancora aperte

| ID | Tema | In attesa di |
|---|---|---|
| ~~D-A1~~ | ~~Testo payoff + headline~~ | **Scelti** (default modificabili): vedi D-103 / §Brand copy |
| ~~D-A2~~ | ~~File del logo~~ | **Risolto**: `logo-white.png` (trasparente) + `logo-black.jpeg` in `assets/` |
| D-A3 | D-1: upload video diretto vs solo embed esterno | Fase 2 |
| D-A4 | D-2: strategia contenuti multilingua (eventi tradotti) | Fase 3 |
| D-A5 | D-3: attivazione ruolo Organizzatore | Fase 3+ |
