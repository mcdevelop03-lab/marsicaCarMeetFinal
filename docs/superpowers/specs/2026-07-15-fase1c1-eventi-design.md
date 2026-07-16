# Fase 1C-1 — Eventi · Design

> Spec approvata dall'utente il **2026-07-15**. Prima delle tre sotto-fasi della **1C**.

**Obiettivo:** il club pubblica i propri raduni e chiunque — anche senza login — può vederli; l'admin li crea e li gestisce dal pannello.

**Stack:** Next.js 16.2.10 (App Router) · React 19 · TypeScript · Tailwind 4 · next-intl (solo IT) · Supabase (`@supabase/ssr`) · zod.

**Requisiti coperti:** RF-20 (elenco pubblico con stato), RF-21 (dettaglio + link mappa esterna), RF-22 (solo admin scrive), RF-27 (tipi raduno/giro/sociale).

## Perché la 1C è divisa in tre

La Fase 1C della ROADMAP conteneva quattro pezzi indipendenti. Come già fatto per la 1B (spezzata in 1B-1 Profilo e 1B-2 Garage), si divide in tre sotto-fasi, ognuna con spec, piano e collaudo propri, ognuna che lascia il sito pubblicabile:

1. **1C-1 — Eventi** *(questa)*: elenco e dettaglio pubblici + CRUD admin.
2. **1C-2 — RSVP**: iscrizione, capienza, associazione auto del garage.
3. **1C-3 — Album foto**: media per-evento caricati dall'admin.

**Fuori scope in 1C-1:** qualsiasi iscrizione (1C-2), qualsiasi album (1C-3), la mappa interattiva (Fase 2), la lista partecipanti (RF-26, P1, Fase 2).

## Perimetro: rotte

| Rotta | Accesso | Contenuto |
|---|---|---|
| `/eventi` | 🌐 pubblico | **Prossimi** (data crescente) e sotto **Conclusi** (data decrescente) |
| `/eventi/[slug]` | 🌐 pubblico | Copertina, stato, tipo, date, luogo + link mappa, descrizione, capienza (se valorizzata) |
| `/admin/eventi` | 🔒 admin | Elenco di tutti gli eventi con stato e azioni |
| `/admin/eventi/nuovo` | 🔒 admin | Form di creazione |
| `/admin/eventi/[id]/modifica` | 🔒 admin | Form di modifica + Annulla/Ripristina + Elimina |

- Le rotte admin stanno nel route group **`(admin)`** già esistente (`src/app/[locale]/(admin)/admin/…`), che ha già il suo layout; si riusa **`requireAdmin()`** da `src/lib/auth` (esiste già, non va scritta).
- Le rotte pubbliche stanno in **`(public)`**: il segnaposto `src/app/[locale]/(public)/eventi/page.tsx` ("In arrivo") viene **sostituito**.
- **Niente paginazione** in 1C-1: un club ha pochi eventi. Si aggiunge quando il problema esiste davvero.

## Lo stato dell'evento è derivato dalle date

**Decisione:** lo stato mostrato (`imminente` / `in corso` / `concluso` / `annullato`) **si calcola dalle date a ogni render**; l'admin può solo **annullare**.

**Perché:** lo schema ha *sia* `status` *sia* `starts_at`/`ends_at` — due fonti di verità per la stessa cosa. Se lo stato fosse un campo da impostare a mano, un raduno di tre mesi fa resterebbe scritto "imminente" finché qualcuno non se ne ricorda, ed è una svista visibile sul sito pubblico. Le date invece sono sempre vere da sole. L'unico stato che le date **non** possono sapere è l'annullamento, e quello resta all'admin.

### Rappresentazione: si tiene la colonna `status` (approccio A)

Valutati tre approcci:

| | Approccio | Esito |
|---|---|---|
| **A** ✅ | Si tiene `status`, ci si scrive **solo** `'upcoming'` (= non annullato) o `'canceled'`. Il resto lo calcola una funzione TS. | **Scelto.** Zero churn di schema. I valori `'ongoing'`/`'completed'` dell'enum restano inutilizzati e un evento passato legge `'upcoming'` nel DB: si mitiga con un `comment on column` nella `0008`. |
| **B** | Migrazione con nuovo `canceled_at`, si smette di usare `status`. | Scartato: più onesto nello schema, ma cambia il DB per un guadagno estetico. |
| **C** | Vista SQL che calcola lo stato. | Scartato: macchinario inutile, filtriamo già per data. |

### La regola, in un solo posto

Unica fonte di verità per lo stato mostrato: un helper TS puro (`src/lib/events/stato.ts`), testabile e usato sia dalle pagine pubbliche sia dall'admin.

```
annullato    se status = 'canceled'          (qualunque sia la data)
imminente    se adesso < starts_at
in corso     se starts_at <= adesso <= fineEffettiva
concluso     altrimenti
```

**`fineEffettiva`** = `ends_at` se valorizzata, **altrimenti la fine della giornata di `starts_at`**.

> **Perché la fine giornata:** `ends_at` è opzionale. Se in sua assenza l'evento diventasse "concluso" appena passata l'ora di inizio, un raduno delle 10:00 direbbe **"concluso" alle 10:01** con la gente ancora presente. Trattarlo come valido per tutta la giornata è il modo in cui si legge naturalmente *"il raduno del 12 luglio"*. **Decisione dell'utente, 2026-07-15.**

⚠️ **Due precisazioni obbligatorie, o l'implementazione sbaglia:**

1. **"Fine della giornata" = la mezzanotte SUCCESSIVA**, cioè le `00:00` del **giorno dopo** `starts_at` (equivalentemente: `starts_at` portato a inizio giornata **+ 1 giorno**). Non le `00:00` del giorno stesso — quella è l'*inizio* della giornata e darebbe il risultato opposto.
2. **Il giorno va calcolato nel fuso `Europe/Rome`**, non in UTC. Le colonne sono `timestamptz`, cioè istanti assoluti: per un raduno alle 23:00 italiane, la mezzanotte di Roma e quella UTC cadono in **giorni diversi**, e in UTC l'evento risulterebbe concluso mentre è ancora in corso. Il sito è italiano per un club italiano: il confine di giornata è quello di Roma.

Entrambe le regole vanno **verificate nel collaudo** con un evento serale senza `ends_at`.

**Conseguenza sullo schema:** con lo stato derivato dalle date, **`starts_at` diventa obbligatoria** (senza data non esiste uno stato). Oggi è nullable → la `0008` la rende `NOT NULL`. La tabella è vuota, nessun dato da migrare.

## Gli annullati futuri restano tra i Prossimi

Un evento **annullato ma con data futura** compare tra i **Prossimi**, con badge `ANNULLATO`: chi aveva in programma di venire **deve vederlo**. Passata la data, scende tra i Conclusi come gli altri.

Ne segue la regola di suddivisione della pagina pubblica:

- **Prossimi** = stato `imminente`, `in corso` **o** `annullato con data futura` → ordinati per `starts_at` **crescente**.
- **Conclusi** = tutto il resto → ordinati per `starts_at` **decrescente**.

## Migrazione `0008_events_setup.sql`

Fa quattro cose, tutte da chiudere **prima** di scrivere il codice (è la lezione di 0005/0006/0007: i difetti dei bucket si pagano dopo, in silenzio):

1. **Limiti e MIME su `event-covers` e `event-media`**: `file_size_limit = 2 MB`, `allowed_mime_types = jpeg/png/webp`. Si fissano **entrambi ora**, anche se `event-media` servirà solo in 1C-3, perché D-171 ha già stabilito che i video sono **link YouTube** e quindi quel bucket ospiterà **solo immagini**: la decisione è già presa, rimandarla significherebbe solo rischiare di dimenticarla.
2. **`events.cover_path text`** — nuova colonna, accanto a `cover_url`.
3. **`events.starts_at` → `NOT NULL`** (conseguenza dello stato derivato).
4. **`comment on column public.events.status`** che documenta la semantica scelta: si scrive solo `'upcoming'` (= non annullato) o `'canceled'`; `'ongoing'`/`'completed'` non si usano perché derivati dalle date.

> **Perché serve `cover_path` (punto 2):** la tabella ha solo `cover_url`. È **esattamente la lacuna che la `0007` ha dovuto colmare per `vehicles`**: per cancellare il file giusto quando si sostituisce o si elimina la copertina serve il **path** nello storage, e ricavarlo spezzettando l'URL pubblico è fragile. Per gli avatar bastava elencare la cartella e tenere l'unico file, ma quell'invariante qui non esiste. Meglio pagarlo ora, nella stessa migrazione, che scoprirlo dal collaudo.

> **Nota verificata il 2026-07-15:** a `event-covers`/`event-media` **non** manca la policy SELECT. La `0003` li protegge con una policy **`for all`**, che in Postgres copre anche la SELECT — a differenza di `avatars`/`vehicles`, che usavano comandi espliciti (`for insert`/`update`/`delete`) ed è per questo che servirono la `0006` e la `0007`. Qui i difetti sono **due su tre**: non aggiungere una policy SELECT, sarebbe un duplicato.

## Form admin

**Campi** (`*` = obbligatorio): titolo\*, tipo\* (raduno/giro/sociale), data e ora inizio\*, data e ora fine, luogo, link mappa, capienza, descrizione, copertina.

⚠️ **Le date passano da `<input type="datetime-local">`, che non ha fuso:** mostra e restituisce **ora locale** come `"2026-07-12T10:00"`. Passarla a `new Date()` la farebbe interpretare col fuso del **server**, che in produzione è **UTC**: il raduno finirebbe salvato con **due ore di anticipo**. La conversione a istante assoluto la fa `istanteDaOraItaliana()` (in `fuso.ts`, testata); la strada inversa, per riempire il form in modifica, è `perInputDatetime()`.

- La **capienza** in 1C-1 si limita a essere **salvata e mostrata** ("Capienza: 20 posti"). Viene *usata* per bloccare le iscrizioni solo in 1C-2.
- Il **link mappa** (`map_url`) è un URL esterno inserito dall'admin (D-134). Il campo `coords` **non si tocca**: serve alla mappa interattiva della Fase 2.
- Un form **unico** riusato da `nuovo` e `modifica`, come `VehicleForm` in 1B-2.

### Slug: generato dal titolo, poi immutabile

Alla **creazione** lo slug si genera dal titolo (`"Raduno d'estate"` → `raduno-d-estate`): minuscole, accenti rimossi, tutto ciò che non è lettera/numero diventa `-`, trattini multipli collassati e tolti alle estremità. Se lo slug è **già occupato**, si aggiunge un suffisso numerico crescente (`raduno-d-estate-2`, `-3`, …) finché è libero. **In modifica lo slug non cambia mai**, nemmeno correggendo il titolo.

> `events.slug` è `unique not null`: il controllo dei duplicati va fatto **rileggendo il DB**, e l'`insert` va comunque protetto dall'errore `23505` (unique_violation) — due creazioni simultanee con lo stesso titolo passerebbero entrambe il controllo preventivo. È lo stesso codice d'errore già gestito per il `tag` in `profilo/actions.ts`.

**Perché:** lo slug è l'URL che le persone si scambiano e che finisce sui motori di ricerca. Rigenerarlo a ogni modifica del titolo significherebbe che **correggere un refuso rompe tutti i link già condivisi**. Immutabile è la scelta che non tradisce nessuno; il costo è solo uno slug che può divergere da un titolo molto rimaneggiato — invisibile all'utente.

### Copertina: opzionale, con segnaposto

L'admin può pubblicare un evento **senza foto** (serve ad annunciare un raduno prima di avere un'immagine). Quando manca, la scheda mostra un **segnaposto grafico su token di tema** con il tipo di evento.

L'upload parte **al salvataggio**, non alla scelta del file — stessa scelta di `VehicleForm` (1B-2): un form abbandonato non deve lasciare file orfani nel bucket. Passa da **`comprimiImmagine()`** (`src/lib/images/compress.ts`), come ogni altro upload del progetto.

**Sostituzione e pulizia**, identiche ad `aggiornaVeicolo` (1B-2): si carica il nuovo file, si aggiorna la riga e **solo dopo** si cancella il vecchio, leggendo il path da `cover_path`. L'ordine conta: cancellare prima e poi fallire l'update lascerebbe l'evento con un'immagine rotta. Un file orfano residuo **non** è un errore per l'utente (l'evento è salvo e corretto) ma **va loggato**, altrimenti una pulizia rotta è indistinguibile dal silenzio. Stessa pulizia all'eliminazione dell'evento.

Il path è **`{uuid}.webp`**, piatto nella radice del bucket.

⚠️ **Non** replica lo schema `{uid}/` di avatar e auto: lì la cartella per-utente *è* la regola di sicurezza (`(storage.foldername(name))[1] = auth.uid()`), mentre qui scrive **solo l'admin** e `event_covers_admin_write` verifica `is_admin()`, **non** la cartella. Di conseguenza le action **non** devono copiare il controllo `path.startsWith(user.id)` del garage: sarebbe sbagliato e bloccherebbe tutto.

**Perché piatto e non `{event-id}/`:** in creazione l'upload avviene **prima** dell'`insert`, quindi l'id dell'evento **non esiste ancora**. Raggruppare per evento richiederebbe di inventare una cartella alla creazione e di usarne un'altra in modifica — cioè copertine dello stesso evento sparse in cartelle diverse, il peggio dei due mondi. Dato che `cover_path` registra il file esatto e la copertina è **una sola per evento**, la cartella non aggiungerebbe nulla. (Diverso sarà `event-media` in 1C-3: lì le foto sono molte e si caricano su un evento **già esistente**, quindi `{event-id}/` avrà senso.)

### Annulla / Ripristina / Elimina

- **Annulla** è l'azione normale: mette `status = 'canceled'`, l'evento resta visibile con badge `ANNULLATO`. **Ripristina** rimette `'upcoming'`.
- **Elimina** è consentito **solo se l'evento non ha né iscritti né foto**. Il controllo sta nella server action, con conferma in-linea a due passi (lo schema di `DeleteVehicleButton`).

**Perché:** in `0001` le foreign key sono `on delete cascade`, quindi eliminare un evento **si porta via iscrizioni e album**. Un raduno annullato per pioggia e un evento creato per sbaglio sono casi opposti: annullare conserva la storia, eliminare la distrugge. Vincolando l'eliminazione agli eventi vuoti si correggono gli errori senza poter cancellare la storia di un raduno.

## Sicurezza

- **RLS: già a posto, non si tocca nulla.** `events_select_public` (lettura pubblica, D-146) e `events_admin_write` (`for all` con `is_admin()`) esistono dalla `0002`. Lo storage ha `event_covers_admin_write` dalla `0003`.
- **Doppio controllo** come prescrive ARCHITECTURE §6: ogni server action chiama `requireAdmin()` prima di toccare il DB — non ci si affida alla sola RLS.
- **Errore ≠ 404** (lezione della micro-fase "errori Supabase silenziati"): su `/eventi/[slug]`, `notFound()` **solo** per "query riuscita, nessuna riga"; un guasto si logga e mostra un messaggio d'errore.
- ⚠️ **Trappola letture stantie** (micro-fase memoizzazione): nelle server action l'identità si legge con `requireUser()`/`requireAdmin()`; per rileggere un dato appena scritto serve una query fresca con `createClient()`, mai il DAL memoizzato.

## Componenti nuovi

| File | Ruolo |
|---|---|
| `src/lib/events/stato.ts` | `statoEvento(event, now?)` → l'unica fonte di verità dello stato. Funzione pura, **coperta da test**. Il parametro `now` iniettabile serve proprio a renderla testabile. |
| `src/lib/date/fuso.ts` | Tutta la matematica del fuso italiano, in un posto solo, **coperta da test**: `mezzanotteSuccessiva(d)` (confine di giornata, ora legale inclusa) e `istanteDaOraItaliana(v)` (`"2026-07-12T10:00"` dall'input → istante ISO assoluto). |
| `src/lib/events/slug.ts` | `slugDa(titolo)` → generazione dello slug. Pura, **coperta da test**. La gestione dei duplicati vive nella action (richiede il DB). |
| `src/lib/date/format.ts` | Formattazione date in it-IT (`Intl.DateTimeFormat`). **Oggi non esiste nulla del genere** nel progetto. |
| `src/lib/validation/event.ts` | Schema zod dell'evento. |
| `src/components/features/events/EventCard.tsx` | Scheda evento, riusata dalla lista pubblica e dall'admin. |
| `src/components/features/events/EventForm.tsx` | Form unico creazione/modifica (client). |
| `src/app/[locale]/(admin)/admin/eventi/actions.ts` | Server action: crea / aggiorna / annulla / ripristina / elimina. |

## Vincoli globali (dal progetto)

- **Colori solo da token**; **stringhe UI solo via next-intl** (`src/messages/it.json`), mai hardcoded.
- **Immagini utente con `<img>` semplice** + `eslint-disable-next-line @next/next/no-img-element` (il progetto non configura `remotePatterns`).
- **`useRouter`/`Link`/`redirect` da `@/i18n/navigation`**, mai da `next/navigation`.
- **Test automatici: solo sulla logica pura.** Questa fase introduce **vitest** (unica dipendenza di sviluppo) e lo usa **esclusivamente** per `statoEvento()` e la generazione dello slug. Tutto il resto — pagine, form, action — resta verificato come sempre: `tsc` + `lint` + `build` + collaudo dal vivo. **Decisione dell'utente, 2026-07-15**, che aggiorna la convenzione "niente test automatici" delle fasi 1A/1B.
  **Perché proprio qui:** `statoEvento()` è una funzione pura ma con la logica più insidiosa della fase (confine di giornata + fuso + ora legale). Dal vivo si verificherebbe solo costruendo eventi con date ad arte, e il caso dell'**ora legale non sarebbe verificabile affatto**; con un test è questione di secondi. Le pagine, al contrario, si collaudano bene dal vivo e non giustificano l'infrastruttura.
- **Lint pulito**: zero errori e zero warning.
- ⚠️ **Non lanciare `npm run build` mentre gira `next dev`**: corrompe `.next`.
- **Next.js 16** (non 15): consultare `node_modules/next/dist/docs/` prima di toccare API Next.

## Collaudo (criteri di accettazione)

1. **Stato derivato:** creando eventi con date nel passato/presente/futuro, i badge dicono il vero senza alcun intervento manuale.
2. **Fine giornata + fuso (la prova che conta):** un evento **serale senza `ends_at`** (es. oggi alle 23:00 italiane) deve risultare **"in corso"**, non "concluso" — è il caso che smaschera sia la mezzanotte presa dal verso sbagliato sia il calcolo in UTC invece che `Europe/Rome`. Il giorno dopo lo stesso evento è "concluso".
3. **Annullato futuro** compare tra i Prossimi con badge `ANNULLATO`; dopo la data scende tra i Conclusi.
4. **Slug immutabile:** modificando il titolo di un evento, l'URL **non cambia** e il vecchio link continua a funzionare. Due eventi con lo **stesso titolo** ottengono slug diversi (suffisso numerico).
5. **Copertina:** un evento senza foto mostra il segnaposto; con foto, il file nel bucket è **WebP compresso**. Un form abbandonato **non** lascia file nel bucket.
6. **Bucket (0008):** upload > 2 MB → respinto; MIME non ammesso → respinto.
7. **Pulizia copertina:** sostituendo la copertina di un evento il numero di file nel bucket **non cresce** (il vecchio è cancellato via `cover_path`); eliminando l'evento sparisce anche il file.
8. **Accesso:** da sloggato `/eventi` e `/eventi/[slug]` **funzionano**; `/admin/eventi` rimanda al login; da membro non-admin `/admin/eventi` rimanda alla dashboard.
9. **RLS dal vivo:** con la sessione di un membro non-admin, `insert`/`update` su `events` via PostgREST → respinti.
10. **Eliminazione:** consentita su evento vuoto; l'annullamento conserva l'evento.
11. **Errore ≠ 404:** slug inesistente → **404**; guasto simulato → messaggio d'errore, **non** un 404.
12. `tsc` / `lint` / `build` / `npm test` verdi.
