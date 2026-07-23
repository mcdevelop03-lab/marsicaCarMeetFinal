# Fase 1C-2 — RSVP (iscrizioni ai raduni) · Design

> Spec approvata dall'utente il **2026-07-22**. Seconda delle tre sotto-fasi della **1C**.

**Obiettivo:** i membri si iscrivono ai raduni scegliendo quali auto del proprio garage portano; il sito rispetta la capienza del raduno e mostra a tutti quanti posti restano, ai loggati chi partecipa, all'admin gli strumenti per gestire la lista.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · next-intl (solo IT) · Supabase (`@supabase/ssr`) · zod · vitest (logica pura).

**Requisiti coperti:** RF-23 (il membro fa RSVP), RF-24 (RSVP bloccato a esaurimento posti), RF-25 (associazione di una o più auto del garage all'evento), RF-26 (l'admin vede l'elenco partecipanti e le auto iscritte — P1, coperto dal pannello admin inline). In più, oltre ai requisiti: il conteggio pubblico dei posti e la lista partecipanti visibile ai membri loggati.

## Cosa NON è in questa sotto-fase (YAGNI)

- **Lista d'attesa (`waitlist`).** RF-24 dice "bloccato a esaurimento posti", non "va in coda". La coda sarebbe un sottosistema intero (promozione automatica, notifiche). L'enum `registration_status` mantiene il valore `waitlist`, ma **non lo usiamo**.
- **Stato `canceled` sull'iscrizione.** La disdetta è un **hard delete** della riga (vedi sotto): senza coda né storico da conservare, uno stato "annullata" sarebbe complessità inutile.
- **Email/contatti fuori dal profilo.** L'admin vede solo dati già presenti in `profiles`; l'email (in `auth.users`) resta fuori.
- **Bypass della capienza da parte dell'admin.** Anche l'iscrizione manuale rispetta la capienza.
- **Notifiche, promemoria, export lista.** Fuori scope.

## Decisioni di prodotto (prese nel brainstorming, non ridiscuterle)

| # | Decisione | Nota |
|---|---|---|
| D-1 | L'iscrizione comprende **presenza + 0..N auto** del proprio garage | Le auto sono un di più; l'iscrizione vale anche senza |
| D-2 | Il contatore conta le **persone (posti)**, non le auto: **1 posto per iscrizione**, con o senza auto | La capienza limita le persone |
| D-3 | Il **conteggio** "X su Y posti" (o "X iscritti" se illimitata) è visibile a **tutti**, anche sloggati | Non svela CHI |
| D-4 | La **lista di chi partecipa** (nomi + auto) è visibile ai **loggati** | Vetrina delle auto |
| D-5 | A **posti esauriti** l'iscrizione è **bloccata** (niente coda) | Bottone disabilitato + messaggio |
| D-6 | Con **garage vuoto** si mostra l'invito "aggiungi un'auto", **ma l'iscrizione è permessa lo stesso** (passeggero) | Coerente con D-1 |
| D-7 | L'admin può **rimuovere** un iscritto, **iscrivere manualmente** un membro (con le sue auto), e **vedere i dati di profilo** degli iscritti | Rispetta la capienza |
| D-8 | La **disdetta** è un hard delete; le righe `event_vehicles` collegate spariscono in cascade | Nessuno stato `canceled` |
| D-9 | Si può fare RSVP solo se l'evento è **aperto**: non `annullato`, non `concluso` | Riusa `eConcluso` esistente |

## Lo schema esiste già

Nessuna nuova tabella. Da `0001_init_schema.sql`:

- `events.capacity int` (nullable) — **già impostabile** dall'admin nel form 1C-1 (`event.ts`: intero 1..10000, opzionale). `NULL` = **illimitato**.
- `event_registrations (id, event_id, user_id, status, created_at, unique(event_id, user_id))` — la `unique` impedisce già la doppia iscrizione.
- `event_vehicles (id, registration_id, vehicle_id, unique(registration_id, vehicle_id))` — tabella-ponte iscrizione ↔ veicolo.

Le RLS di partenza (`0002_rls_policies.sql`) sono il motivo di due nodi che questo design risolve:

1. **La capienza non è mostrabile.** `registrations_select_self_or_admin`: un membro vede **solo la propria** iscrizione → non può contare le altre.
2. **La capienza non è applicabile senza corsa.** `registrations_insert_self` controlla **solo** `user_id = auth.uid()`, **nessun** controllo di capienza → due utenti sull'ultimo posto passerebbero entrambi.

## Architettura: la via atomica (Approccio A)

Il cuore è che **l'unico modo di occupare un posto è una funzione `SECURITY DEFINER` che serializza i concorrenti con un lock di riga**. Valutati tre approcci:

| | Approccio | Esito |
|---|---|---|
| **A** ✅ | Funzione RPC atomica per l'iscrizione (lock `FOR UPDATE` sull'evento) + funzione aggregata per il conteggio pubblico + RLS allargate ai loggati per la lista | **Scelto.** La corsa è impossibile per costruzione; conteggio sempre fresco; una fonte di verità; stessa funzione per membro e admin. Costo: due funzioni SQL da scrivere e testare. |
| **B** | Colonna denormalizzata `events.going_count` mantenuta da trigger | Scartato: doppia fonte di verità (deriva possibile), e serve **comunque** il lock per la corsa → la complessità di A senza toglierne il grosso. |
| **C** | Conteggio + insert nella server action | Scartato: è **esattamente** la corsa da evitare. Due prenotazioni concorrenti passano entrambe. |

### Migrazione `0009_rsvp.sql`

**a) Funzione di iscrizione atomica.**

```
iscriviti_evento(p_event_id uuid, p_vehicle_ids uuid[], p_user_id uuid default null)
  returns text            -- esito: 'ok' | 'esaurito' | 'annullato' | 'gia_iscritto' | 'evento_inesistente'
  language plpgsql
  security definer set search_path = public
```

Logica:
1. **Destinatario:** `target := coalesce(p_user_id, auth.uid())`. Se `target <> auth.uid()` → richiede `is_admin()` (altrimenti solleva errore: un membro non iscrive altri).
2. `select … from events where id = p_event_id for update` → **serializza i concorrenti** sullo stesso evento. Se nessuna riga → `'evento_inesistente'`.
3. Se `status = 'canceled'` → `'annullato'`.
4. Se già esiste una riga `event_registrations(event_id, user_id=target)` → `'gia_iscritto'` (idempotenza; la `unique` è la rete di sicurezza).
5. **Capienza:** se `capacity is not null` e `count(*) going >= capacity` → `'esaurito'`. Con `capacity is null` non è mai pieno.
6. **Proprietà auto:** ogni `p_vehicle_ids[i]` deve avere `owner_id = target`; altrimenti errore (la funzione bypassa le RLS, quindi il controllo lo fa lei). Array vuoto/`null` ammesso (iscrizione senza auto, D-1/D-6).
7. Insert in `event_registrations` (`status='going'`) + le righe `event_vehicles`. `return 'ok'`.

> **Nota fuso/concluso.** La funzione **non** controlla se l'evento è concluso (la matematica `Europe/Rome` vive solo in `src/lib/date/fuso.ts`, spec 1C-1 — non va duplicata in SQL). Il blocco "evento concluso" è **temporale, non soggetto a corsa**: lo applica la server action con `eConcluso` (TS). La RPC copre il solo caso a rischio-corsa (capienza) più i controlli banali (esistenza, annullato, proprietà). Un RSVP diretto a evento concluso è a **basso danno** ed è comunque filtrato dall'action.

**b) Funzione di conteggio pubblica.**

```
iscritti_per_eventi(p_event_ids uuid[])
  returns table(event_id uuid, iscritti int)
  language sql
  security definer set search_path = public
  stable
```

Ritorna **solo l'aggregato** (mai le righe). `grant execute` a `anon` **e** `authenticated`. Un round-trip serve il dettaglio e (se in futuro vorremo il badge sulle card) l'elenco. Risolve il **nodo 1** senza aprire le righe agli sloggati.

**c) RLS: ristrette e allargate al punto giusto.**

- `event_registrations`:
  - **DROP** `registrations_insert_self` → **l'unica via d'ingresso è la RPC** (nessun POST diretto può bypassare la capienza). Risolve il **nodo 2** anche contro chi chiama PostgREST a mano.
  - **Nuova** `registrations_select_authenticated` (`for select using (auth.uid() is not null)`) → i loggati leggono le iscrizioni per la lista "chi partecipa" (D-4). Sostituisce `registrations_select_self_or_admin` (che diventa ridondante).
  - `registrations_delete_self_or_admin` **resta** — la disdetta (self) e la rimozione (admin) sono `DELETE` diretti, senza corsa (D-7/D-8).
  - `registrations_update_self_or_admin`: non più necessaria (non aggiorniamo righe: si crea via RPC, si cancella via delete). La si **rimuove** per non lasciare superficie inutile.
- `event_vehicles`:
  - **SELECT allargata agli autenticati** (`event_vehicles_select` → `using(auth.uid() is not null)`) → i loggati vedono le auto altrui al raduno (D-4).
  - insert/delete **restano `self`** (`registration_id` appartiene a `auth.uid()`) → il membro gestisce le proprie auto; l'iscrizione manuale admin passa dalla RPC (definer), quindi non serve una policy admin qui.

**d) `grant execute`** sulle due funzioni ai ruoli giusti (`authenticated` per `iscriviti_evento`; `anon`+`authenticated` per `iscritti_per_eventi`).

## Logica di dominio pura (vitest)

Nuovo `src/lib/rsvp/capienza.ts`, nello stile di `stato.ts`/`slug.ts` — testabile in isolamento, senza DB:

- `postiRimasti(capacity: number | null, iscritti: number): number | null` — `null` = illimitato.
- `eEsaurito(capacity: number | null, iscritti: number): boolean` — `false` se `capacity` è `null`.
- `statoIscrizione(evento, iscritti, giaIscritto): 'aperto' | 'esaurito' | 'gia_iscritto' | 'concluso' | 'annullato'` — decide lo stato del bottone. **Riusa `eConcluso`** da `src/lib/events/stato.ts` (niente duplicazione del fuso) e `statoEvento` per l'annullamento.

Le pagine, il form e le action restano verificati **dal vivo** (come in 1C-1). `npm test` va aggiunto alle verifiche di ogni task.

## UI: perimetro

Tutta la superficie utente vive sul **dettaglio pubblico** `/eventi/[slug]` (nessuna rotta nuova): il pattern del progetto è **vista admin inline** in fondo alla stessa pagina pubblica.

### Membro (loggato) su `/eventi/[slug]`

Il blocco RSVP si comporta secondo `statoIscrizione`:

| Stato | Cosa vede |
|---|---|
| `aperto`, non iscritto | Bottone **"Partecipa"** → apre la scelta auto (multi-select 0..N dal proprio garage) → server action |
| `aperto`, non iscritto, **garage vuoto** | Invito "**Aggiungi un'auto al tuo garage**" con link a `/garage/nuova`, **ma "Partecipa senza auto" resta possibile** (D-6) |
| `gia_iscritto` | Riquadro "**Partecipi**" con le auto scelte + **"Disdici"** (conferma inline, stile garage) |
| `esaurito` | Bottone disabilitato + "**Posti esauriti**" |
| `concluso` / `annullato` | Nessun bottone |

- **Sloggato:** nessun bottone, solo invito ad accedere (il conteggio invece lo vede, D-3).
- **Modifica auto dopo l'iscrizione:** il membro può aggiungere/togliere auto dalla propria iscrizione (insert/delete diretti su `event_vehicles`, RLS `self`) — le auto non toccano la capienza. Micro-UI opzionale; se scomoda, ci si disdice e ci si re-iscrive.

### Conteggio + lista (tutti / loggati)

- **Conteggio** al posto della riga statica `capacity` di oggi (`<Users>`): "**X su Y posti**" o "**X iscritti**" (capienza illimitata), da `iscritti_per_eventi`. Visibile a **tutti** (D-3).
- **"Chi partecipa"**: elenco nomi (link al profilo `/membri/[tag]`) + auto portate, visibile ai **loggati** (D-4). Vuoto → "Nessun iscritto ancora".

### Admin inline (in fondo a `/eventi/[slug]`, gate `is_admin()`)

- **Lista iscritti** con dati di profilo (nome, tag, città, social, "iscritto il") + auto.
- **Rimuovi iscritto** (conferma inline → `DELETE`).
- **Iscrivi manualmente**: ricerca membro (come `/membri`, con escaping già collaudato) → 0..N auto **dal garage di quel membro** → stessa RPC con `p_user_id` (rispetta la capienza).

## Server action

File dedicato per le action RSVP (es. `src/app/[locale]/(public)/eventi/[slug]/actions.ts`). Ognuna richiama `requireUser`/`requireAdmin` per conto proprio (le action non hanno layout-gate — lezione 1C-1):

| Action | Chi | Fa |
|---|---|---|
| `iscriviti(eventId, vehicleIds)` | membro | gate `eConcluso`/annullato (TS) → `iscriviti_evento` → mappa l'esito in messaggio |
| `disdici(eventId)` | membro | `DELETE` self su `event_registrations` |
| `rimuoviIscritto(registrationId)` | admin | `DELETE` admin |
| `iscriviMembro(eventId, userId, vehicleIds)` | admin | `iscriviti_evento` con `p_user_id` |

- **`revalidatePath` nella forma corretta di Next 16** (`"/[locale]/eventi/[slug]", "page"`) — **non** si eredita il pattern sbagliato della 1C-1 (quel debito si salda a parte). La pagina dettaglio è comunque dinamica (legge cookie), ma il revalidate va scritto giusto da subito.
- **Validazione input** con zod (id uuid, array di uuid) prima di toccare il DB.

## Casi limite ed errori

- **Garage vuoto** → invito + "partecipa senza auto" (D-6).
- **Auto eliminata dopo l'iscrizione** → cascade `vehicles → event_vehicles`, la lista si accorcia da sé; l'iscrizione (il posto) resta.
- **Doppio submit** rapido su "Partecipa" → la `unique(event_id,user_id)` + l'esito `'gia_iscritto'` lo assorbono senza errore.
- **POST diretto** a `event_registrations` da non-admin → **respinto** (nessuna policy insert; unica via = RPC). È la prova negativa chiave del collaudo.
- **RSVP a evento annullato/concluso** via chiamata diretta → annullato bloccato dalla RPC, concluso dall'action.
- **Errore Supabase** (non "vuoto") → loggato e mostrato come errore, mai spacciato per "posti esauriti" o lista vuota (lezione 1B-2).

## Collaudo dal vivo (ambiente acceso)

Come da pratica del progetto: Docker + `npx supabase start` + `npm run dev` + browser (Playwright) + Mailpit + psql. Servono **admin + almeno 2 membri** con auto nei garage.

- **Auto-iscrizione** con auto e **senza** auto → riga in `event_registrations`, righe in `event_vehicles`, il conteggio sale.
- **Disdetta** → riga e `event_vehicles` via (0 orfani), conteggio scende.
- **Prova di corsa** sulla capienza: evento con `capacity=1`, due sessioni che premono "Partecipa" insieme → **una sola** passa, l'altra vede "posti esauriti". È la verifica del nodo 2.
- **Conteggio** "X su Y" visibile da **finestra anonima**; **lista iscritti** visibile **solo** da loggato.
- **Illimitato** (`capacity NULL`) → "X iscritti", mai "esaurito".
- **Poteri admin:** rimuovi iscritto; iscrivi manualmente un membro con le sue auto; l'iscrizione manuale **rispetta** la capienza.
- **Prove negative (RLS):** POST diretto a `event_registrations` da membro → **respinto**; capienza **non** bypassabile via PostgREST; un membro non può iscrivere un altro via RPC (`p_user_id` altrui senza `is_admin()` → errore); un anonimo non legge le righe delle iscrizioni (solo l'aggregato via funzione).
- **Standard:** `npm test` (nuovi test capienza verdi), `tsc`/`lint`, `rm -rf .next && npm run build` verde (non mentre gira `next dev`).

## Debiti espliciti NON toccati qui

- `revalidatePath` con path/​`type` corretti **ovunque** (garage/profilo/eventi) → micro-fase dedicata.
- Pulizia storage orfani (1B-2/1C-1) → lavoro unico dedicato.
- `created_by` degli eventi leggibile da anon via PostgREST → basso impatto, fix a parte.
