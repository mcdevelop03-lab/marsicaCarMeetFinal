# STATO LAVORI — Punto di ripartenza

> **Questo è il file da consultare per riprendere.** Ultima modifica: **2026-07-20**.
> Quando riprendi, dimmi: *"vai in docs/STATO-LAVORI.md e controlla da cosa ripartire"*.
> Viene aggiornato ogni volta che ci fermiamo con gli sviluppi.

## 🔖 Dove siamo

- 🔵 **IN CORSO: Fase 1C-1 — Eventi.** Branch **`feat/fase1c1-eventi`** (⚠️ **solo locale, non pushato**). **Task 1-7 su 10 completati** (ognuno con review indipendente). **Si riparte dal Task 8.**
- 🟢 **Fase 1B ✅ COMPLETATA** (1B-1 Profilo + 1B-2 Garage), collaudata, mergiata e **pushata** su `main`.
- **La Fase 1C è stata divisa in tre sotto-fasi** (come già fatto per la 1B): **1C-1 Eventi** *(in corso)* → **1C-2 RSVP** → **1C-3 Album foto**.
- **Piano 1C-1 (10 task, con tutto il codice dentro):** [`superpowers/plans/2026-07-15-fase1c1-eventi.md`](./superpowers/plans/2026-07-15-fase1c1-eventi.md) · **Spec:** [`superpowers/specs/2026-07-15-fase1c1-eventi-design.md`](./superpowers/specs/2026-07-15-fase1c1-eventi-design.md)
- **Piano 1B-2:** [`superpowers/plans/2026-07-13-fase1b2-garage.md`](./superpowers/plans/2026-07-13-fase1b2-garage.md) · **Spec:** [`superpowers/specs/2026-07-13-fase1b2-garage-design.md`](./superpowers/specs/2026-07-13-fase1b2-garage-design.md)
- **Piano 1B-1:** [`superpowers/plans/2026-07-10-fase1b1-profilo.md`](./superpowers/plans/2026-07-10-fase1b1-profilo.md)
- **Design/spec 1B-1:** [`superpowers/specs/2026-07-10-fase1b1-profilo-design.md`](./superpowers/specs/2026-07-10-fase1b1-profilo-design.md)

## ▶️ DA COSA RIPARTIRE: Fase 1C-1 — Eventi, **Task 8**

**Come ripartire:** *"Leggi docs/STATO-LAVORI.md e riprendi la Fase 1C-1 dal Task 8 del piano."*

**Brainstorming, spec e piano sono fatti e approvati.** Si esegue col metodo **subagent-driven**: un subagent implementa il task, un secondo lo rivede in modo indipendente, il controller verifica di persona le affermazioni chiave, **poi si chiede l'ok all'utente prima del task successivo**.

- **Branch:** `feat/fase1c1-eventi`. ⚠️ **Solo locale, non pushato.**
- **Ledger di avanzamento** (sopravvive alla perdita di contesto, è la mappa di recupero): [`../.superpowers/sdd/progress.md`](../.superpowers/sdd/progress.md). ⚠️ **Fidarsi del ledger e di `git log`, non della memoria della conversazione.** I task che risultano `complete` lì **non vanno rifatti**.

### I 10 task

| # | Task | Stato |
|---|---|---|
| 1 | Migrazione `0008` + tipi `Event` | ✅ `38fa545` |
| 2 | Logica pura (fuso/stato/slug) + **vitest** | ✅ `fdebd45` — 22/22 test |
| 3 | Date, validazione, stringhe | ✅ `a6bedb2` |
| 4 | Server action admin (crea/aggiorna/annulla/ripristina/elimina) | ✅ `0951d5b` |
| 5 | `EventForm` + `/admin/eventi/nuovo` | ✅ `30b61f7` |
| 6 | Elenco admin + azioni | ✅ `8dd7bd9` |
| 7 | `/admin/eventi/[id]/modifica` | ✅ `d85f5df` — 57/57 test |
| 8 | **`EventCard` + `/eventi` pubblica** | ⬅️ **si riparte da qui** |
| 9 | `/eventi/[slug]` dettaglio | — |
| 10 | Collaudo dal vivo e chiusura | — |

Dopo il Task 9 e prima del Task 10: **review finale whole-branch** (modello più capace) + **una sola wave di fix** con tutti i Minor accumulati nel ledger.

### Cose da sapere PRIMA di ripartire

- **Le date dell'evento sono validate a fondo (Task 4).** `eventSchema` respinge, con messaggi distinti: campo vuoto, **formato** diverso da `datetime-local` (`pippo`, secondi extra), **data inesistente nel calendario** (`31 febbraio`, mese 13, ora 25) e **anno fuori da 2000–2100**. Il controllo di calendario è un **round-trip** su `toISOString()`, non una tabella giorni-per-mese: gestisce i bisestili da sé (`2028-02-29` sì, `2026-02-29` e `1900-02-29` no) ed è coperto da test. **Non indebolirlo**: senza, `istanteDaOraItaliana()` o lancia `RangeError` (500) o salva in silenzio una data sbagliata.
- **Tre cose che solo il collaudo (Task 10) può dire**, segnalate dalla review del Task 5: che il cambio di `<Select>` e la scelta dal picker `datetime-local` emettano l'evento `input` (se non lo fanno, il bottone Salva **resta spento a form valido**, perché `checkValidity()` è ricalcolato su `onInput`); che l'indicatore del calendario di `datetime-local` sia visibile sul tema scuro (`Input.tsx` non lo stila); il doppio submit rapido durante l'upload.
- **Il progetto ora ha i test.** La Fase 1C-1 ha introdotto **vitest** (`npm test`), usato **solo per la logica pura**: `src/lib/date/fuso.ts`, `src/lib/events/stato.ts`, `src/lib/events/slug.ts`, `src/lib/validation/event.ts`. **50 test, tutti verdi.** Pagine, form e action restano verificati dal vivo. Aggiungere `npm test` alle verifiche di ogni task.
- **Lo stato dell'evento NON è un campo del DB:** lo calcola `statoEvento()` dalle date, a ogni render. Nella colonna `status` si scrive **solo** `'upcoming'` (= non annullato) o `'canceled'`; `'ongoing'`/`'completed'` non si usano mai (c'è un `comment on column` nel DB che lo dice).
- **Il fuso è la trappola di questa fase** — e ha morso davvero, vedi qui sotto. Le date sono istanti assoluti e il server in produzione gira in **UTC**, ma il club è italiano: tutta la matematica di `Europe/Rome` sta **solo** in `src/lib/date/fuso.ts` (`mezzanotteSuccessiva`, `istanteDaOraItaliana`), ed è coperta da test. **Non duplicarla altrove.** In particolare `<input type="datetime-local">` non ha fuso: l'ora va convertita con `istanteDaOraItaliana()`, mai con `new Date(valore)`.

- 🚨 **`istanteDaOraItaliana` calcola lo scarto DUE VOLTE, e non è un caso.** Con un solo passaggio, un evento delle **01:30 del 29 marzo arretrava di un'ora a ogni apri-e-salva** della pagina di modifica, anche senza toccare il campo (corruzione silenziosa; il bug è emerso nel Task 7, primo chiamante del ramo "modifica"). Due limiti sono **deliberati e blindati da test — non "correggerli"**:
  - **Ottobre, ora ripetuta:** il 25 ottobre le 02:30 italiane esistono **due volte**, quindi sia `00:30Z` sia `01:30Z` si presentano come input `"02:30"`. Un round-trip perfetto è **impossibile per definizione**: la stringa non porta l'informazione su quale occorrenza fosse. Collassano sulla seconda.
  - **Marzo, ora inesistente:** le 02:00–02:59 del 29 marzo **non esistono**, e per un'ora inesistente **non c'è nessun punto fisso**: l'iterazione **non converge**, oscilla con periodo 2. Fermarsi a due passaggi è la scelta giusta (manda avanti, alle 03:30 locali). ⚠️ **Un refactor "miglioriamolo con un `while` fino a convergenza" romperebbe tutto in silenzio, mandando gli orari all'indietro.** C'è un test apposta.
- **Il Task 1 ha fatto `npx supabase db reset`:** le utenze locali sono **azzerate**. Per il collaudo (Task 10) servono **DUE account** (registrarli e confermarli da Mailpit su http://127.0.0.1:54324) e l'admin va ripromosso rieseguendo la `update` di `supabase/seed.sql`.
- **Migrazione `0008` già applicata e verificata:** limiti 2 MB + MIME su `event-covers` **e** `event-media`, colonna `events.cover_path`, `events.starts_at` ora `NOT NULL`, commento su `status`.
- **Ai bucket eventi NON manca la policy SELECT** (a differenza di `avatars`/`vehicles`): la `0003` li protegge con una policy **`for all`**, che in Postgres copre anche la SELECT. Non aggiungerne una: sarebbe un duplicato.
- **Le RLS degli eventi ci sono già** dalla `0002` (`events_select_public` = lettura pubblica anche da sloggati, `events_admin_write` = solo admin). Il layout `(admin)` chiama già `requireAdmin()`, **ma le server action non sono coperte da un layout**: ognuna deve richiamarlo per conto proprio.

### 🔧 Micro-fase da fare (emersa dalla review del Task 4): `revalidatePath`

**Tutte** le chiamate del progetto passano un path che **non combacia con la struttura dei file di route**: si scrive `revalidatePath("/admin/eventi")`, ma il doc di Next 16 (`node_modules/next/dist/docs/.../revalidatePath.md`, righe 26 e 81) dice che il path è la **struttura dei file**, non l'URL, e che **con un segmento dinamico il parametro `type` è obbligatorio**. La forma corretta è `revalidatePath("/[locale]/admin/eventi", "page")`.

Oggi il difetto è **mascherato**: in Next 16 una server action rinfresca comunque le pagine già visitate — comportamento che il doc stesso dichiara **"temporary"**. Il pattern sbagliato è ovunque (`garage/actions.ts:74,145,184`, profilo, eventi): **va corretto in un colpo solo, in una micro-fase dedicata, con collaudo dal vivo della cache.** Non farlo dentro un task della 1C-1.

**Quanto brucia, precisamente** (chiarito dalla review del Task 6): l'**elenco admin non dipende da quel meccanismo**. È una pagina dinamica — `createClient()` legge i cookie — quindi non esiste nessun render cachato lato server da invalidare, e il `router.refresh()` che `EventAdminActions` chiama dopo ogni azione la rifà da sé. Il debito morde sulla **superficie pubblica `/eventi`**, non sul pannello.

### 🗑️ Pulizia dello storage — debito di sistema (deciso: NON si patcha a pezzi)

Il bucket `event-covers` accumula file orfani in tre casi, tutti scoperti dalla review del Task 5: **(a)** riselezionare lo stesso file dal disco dopo un submit fallito (l'input crea una nuova istanza `File`, quindi il riuso del path non scatta), **(b)** cambiare foto dopo un submit fallito (il path precedente non viene mai rimosso), **(c)** upload riuscito e creazione poi abbandonata. Il caso comune — **ritentativo dopo un errore del server** — è invece **chiuso**: un `useRef` ricorda `{file, path}` e lo riusa senza ricaricare.

**Decisione:** chiuderne una sola darebbe una falsa sensazione di completezza. Va affrontato **insieme al debito storage di 1B-2** (l'admin che cancella l'auto altrui lascia il file nel bucket), in un lavoro unico con una strategia vera — `remove()` sul path sostituito, oppure una funzione `SECURITY DEFINER` di pulizia.

### ⚠️ Minor già noti, da sistemare nella wave finale (non bloccanti)

0. **Task 7** — `garage/[id]/modifica/page.tsx` ha la struttura **identica** alla pagina di modifica dell'evento ma **non** ha ricevuto il fix `22P02`: un id veicolo malformato mostra ancora "Riprova più tardi" con HTTP 200 invece di un 404. Le due pagine gemelle ora divergono.
0. **Task 5** — il blocco di upload immagine è alla **terza copia** quasi identica (`EventForm`, `VehicleForm`, `AvatarUploader`): `labelClass`/`hintClass`, `MIME_AMMESSI`, `ESTENSIONI`, gli stati `file`/`anteprima`/`errore`/`caricando`, `onFileChange` e il markup del picker. Candidato a un hook `useUploadImmagine(bucket)` + un `<ImagePicker>`; `URL.createObjectURL` non è mai revocato in nessuna delle tre. Inoltre: `comprimiImmagine` restituisce l'**originale** se `createImageBitmap` fallisce o se il WebP non migliora, quindi in quel ramo un file >2 MB viene respinto dal bucket e l'utente vede solo il generico `uploadFailed`, mentre la stringa `coverRules` promette che "viene compressa automaticamente".
0. **Task 4** — `annullaEvento`/`ripristinaEvento` non distinguono "fatto" da "id inesistente" (un `update` che non colpisce righe non è un errore Supabase: la UI mostra successo); copertina orfana se l'insert fallisce dopo l'upload del client; `coverPath` preso grezzo dal `FormData` senza validazione; `aggiornamento: Record<string, unknown>` disattiva il type-check dei nomi di colonna.

1. **`fuso.test.ts`, test "usa il giorno ITALIANO, non quello UTC"** — con l'input `2026-07-12T21:30:00Z` il giorno italiano (23:30 del 12) e quello UTC (12) **coincidono**: il test non discrimina davvero, e la proprietà "usa il giorno italiano" **oggi non è coperta**. Fix: usare `2026-07-12T22:30:00Z` (a Roma è già il 13), atteso `"2026-07-13T22:00:00.000Z"`. *(È un difetto del piano, non dell'implementer.)*
2. **Commenti che citano `src/lib/events/stato.ts`** in `database.ts` e nel **commento SQL persistito nel DB**: se un giorno quella funzione venisse rinominata, va aggiornato anche il commento dentro Postgres.
3. **`eventSchema`**: con `starts_at` vuoto scatta anche il `refine` "fine dopo inizio". Impatto nullo (la action mostra solo `issues[0]`, il campo è `required`). Nessun fix necessario.

### Decisioni di design della 1C-1 (già prese, non ridiscuterle)

- **Stato derivato dalle date**; l'admin può solo **annullare**. Senza `ends_at`, l'evento resta "in corso" **fino a fine giornata italiana** (mezzanotte successiva) — così un raduno delle 10:00 non risulta "concluso" alle 10:01.
- **Pagina pubblica unica:** "Prossimi raduni" e sotto "Conclusi". Un **annullato con data futura resta fra i Prossimi**, con badge `ANNULLATO`: chi doveva venire deve vederlo.
- **Copertina facoltativa**, con segnaposto grafico che mostra il tipo di evento.
- **Slug generato dal titolo alla creazione e poi immutabile:** correggere il titolo non deve rompere i link già condivisi.
- **Annullare è l'azione normale; eliminare è possibile solo se l'evento è vuoto** (niente iscritti né foto): le foreign key sono `on delete cascade` e si porterebbero via iscrizioni e album.
- **Path della copertina piatto** (`{uuid}.webp`), non `{uid}/` né `{event-id}/`: in creazione l'evento non ha ancora un id, e `cover_path` registra comunque il file esatto.

## ✅ Esito Fase 1B-1 — Profilo (2026-07-12)

Rotte aggiunte (tutte sotto `(auth)`): **`/profilo`** (mio, modificabile + upload avatar), **`/membri`** (ricerca per nome/tag, `?q=`), **`/membri/[tag]`** (profilo altrui in sola lettura, con icone social e link "Torna ai membri"). **Avatar nell'header** accanto al menu, link a `/profilo`. Migrazioni nuove: **`0005`** (limiti 2 MB + MIME sul bucket `avatars`), **`0006`** (policy SELECT sullo storage, senza cui la pulizia degli avatar orfani non funzionava).

**Collaudo (tutto verde):** RLS profiles (un utente non modifica il profilo altrui né si promuove admin), storage negativo (cartella altrui / MIME non ammesso / file >2 MB tutti respinti HTTP 400), pulizia avatar (dopo 2 upload resta 1 solo file), escaping ricerca contro PostgREST reale (jolly `%`/`_` neutralizzati, filtro `.or()` non spezzabile), build/lint/tsc verdi. Review finale (opus): **pronto per il merge, 0 Critical**.

**5 bug/rifiniture emersi dal collaudo dal vivo, corretti (commit dedicati):**
1. `fix(profilo)` — **attributo `pattern` HTML ignorato**: il browser lo compila col flag `v`, dove il trattino in classe di caratteri va escapato (`[a-z0-9._\-]+`); senza escape la regex non compila e la spec impone di **ignorare l'attributo in silenzio**, quindi il tag accettava le maiuscole.
2. `fix(db)` — **policy SELECT mancante sul bucket `avatars`**: `storage.list()` tornava sempre `[]` e la pulizia dei file orfani non cancellava nulla (avatar vecchi accumulati nel bucket pubblico). Migrazione `0006`.
3. `feat(ui)` — **bordo rosso sui campi invalidi** (`user-invalid`): con 9 campi il solo submit disabilitato non diceva quale bloccava il salvataggio.
4. `fix(profilo)` — testo del tag riscritto: "minuscole, numeri…" si leggeva come elenco di caratteri ammessi, non come obbligo. Ora "deve essere tutto minuscolo".
5. `feat(membri)` — link "Torna ai membri" (Link vero, conserva `?q=`) su richiesta utente.

**Debito noto (follow-up, non bloccante):**
- Messaggi zod hardcoded in italiano + `locale:"it"` fisso in alcune redirect → da sistemare in Fase 3 (inglese).
- **Icone social marchi:** `lucide-react` v1 le ha rimosse; i path SVG sono vendorizzati da Simple Icons (CC0) in `src/components/ui/icons/SocialIcon.tsx`.

## ✅ Esito micro-fase — Memoizzazione dell'autenticazione (2026-07-13)

Debito **saldato**. Spec: [`superpowers/specs/2026-07-13-memoizzazione-auth-design.md`](./superpowers/specs/2026-07-13-memoizzazione-auth-design.md) · Piano: [`superpowers/plans/2026-07-13-memoizzazione-auth.md`](./superpowers/plans/2026-07-13-memoizzazione-auth.md)

Un solo file toccato (`src/lib/auth/index.ts`), nessuna migrazione, nessuna call-site modificata:
1. `getUser` e `getProfile` avvolte in **`cache()` di React** (dedup per render pass).
2. **`getProfile` ora passa dalla `getUser()` memoizzata** invece di chiamare `supabase.auth.getUser()` per conto suo. Era il punto decisivo: senza, i due `getProfile` avrebbero continuato a fare un round-trip GoTrue ciascuno anche con `getUser` cachata.
3. Il controllo AAL estratto in una **`getAal()`** memoizzata. `requireUser` **non** è memoizzabile: fa `redirect()`, che funziona lanciando un'eccezione.
4. Contatore **dev-only** (`traccia`) permanente: se una fase futura rompe la deduplica, il log del dev server lo mostra subito.

**Numeri misurati** su `/it/profilo` (baseline riprodotta rimettendo temporaneamente la vecchia implementazione, non stimata):

| una richiesta | getUser | getProfile | getAal |
|---|---|---|---|
| prima | **3** | **2** | 1 |
| dopo | **1** | **1** | 1 |
| dopo, con 2FA attivo (AAL2) | **1** | **1** | 1 |

**Collaudo (tutto verde):** salvataggio profilo + upload avatar → dopo `revalidatePath` header e dashboard mostrano i dati **nuovi** (nessuna lettura stantia: è il test diretto della trappola qui sotto); pulizia avatar orfani ancora funzionante; guardia `(auth)`, login/logout, pannello admin; **enforcement 2FA** attivato davvero via TOTP (con sola password → `/it/login?mfa=1`, poi sfida MFA → dashboard), che è il percorso passante dalla nuova `getAal()`. `tsc`/`lint`/`build` verdi.

> ⚠️ La trappola delle **letture stantie nelle server action** che questa micro-fase introduce è documentata nella sezione di ripartenza di 1B-2 (sotto) e in un commento in testa a `src/lib/auth/index.ts`.

## ✅ Esito micro-fase — Rifiniture: stato 2FA + errori Supabase (2026-07-13)

Due debiti **saldati**. Spec: [`superpowers/specs/2026-07-13-rifiniture-2fa-errori-design.md`](./superpowers/specs/2026-07-13-rifiniture-2fa-errori-design.md) · Piano: [`superpowers/plans/2026-07-13-rifiniture-2fa-errori.md`](./superpowers/plans/2026-07-13-rifiniture-2fa-errori.md)

**Tema A — Impostazioni riflette il 2FA reale.** `TwoFactorSetup` è un componente client e partiva da stato vuoto: la pagina mostrava "Attiva 2FA" **anche a 2FA attivo**, e premere quel bottone creava **un secondo fattore a ogni clic**; la disattivazione dalla UI **non esisteva** (`unenrollTotp` era codice morto, come la stringa `disable2fa`) — chi attivava il 2FA restava senza via d'uscita. Ora la fonte di verità è il server: `impostazioni/page.tsx` legge `listFactors()` (solo i `verified`) e passa `attivo` al componente, che dopo enroll/disattivazione fa `router.refresh()`. `unenrollTotp()` **non accetta più il `factorId` dal client** (lo cerca lato server fra i fattori della sessione) e non chiede un codice TOTP: chi è su quella pagina col 2FA attivo è per forza già in **AAL2**. `enrollTotp()` ripulisce i fattori non verificati residui.

**Tema B — errori Supabase non più silenziati.** In `membri/` un guasto veniva spacciato per "Nessun membro trovato" o per un **404**. Ora l'errore si logga e la UI lo distingue dal vuoto; `notFound()` resta solo per "query riuscita, nessuna riga". Stesso `console.error` aggiunto in `getProfile()`, origine del pattern.

**Collaudo (tutto verde):** 3 clic su "Attiva 2FA" → **1 solo** fattore, non 3; dopo il reload la pagina dice "2FA attiva" (prima diceva "Attiva 2FA"); Annulla non tocca il fattore, Conferma lo rimuove (0 fattori nel DB) e la pagina si aggiorna da sé. Per il Tema B il guasto è stato simulato **revocando `SELECT` su `profiles`** (il PostgREST fermo produce un *blocco*, non un errore: non è quel percorso): `/membri` mostra "Impossibile caricare i dati", `/membri/[tag]` non è più un 404, entrambi loggano il codice `42501`; ripristinato il GRANT tutto torna normale e un tag inesistente dà ancora **HTTP 404**. `tsc`/`lint`/`build` verdi.

## ✅ Esito Fase 1B-2 — Garage (2026-07-15) — chiude la Fase 1B

**Cosa fa:** ogni membro ha un garage di auto (con foto) che può creare, modificare ed eliminare; il garage altrui è visibile in **sola lettura** agli altri loggati.

**Rotte aggiunte (tutte sotto `(auth)`):** **`/garage`** (il mio garage, griglia di schede con Modifica/Elimina), **`/garage/nuova`** (creazione), **`/garage/[id]/modifica`** (404 se l'auto non è tua). Il **garage del membro** è ora mostrato in sola lettura in **`/membri/[tag]`** (al posto del vecchio segnaposto "in arrivo"). Rimosso il segnaposto pubblico `(public)/garage`: la voce "Garage" dell'header ora punta alla rotta `(auth)` (da sloggato → login).

**Migrazione `0007_vehicles_storage.sql`:** chiude sul bucket `vehicles` gli stessi due difetti già pagati per `avatars` in 1B-1 — **policy SELECT `vehicles_select_own`** (senza, la cancellazione delle foto falliva in silenzio) + **limite 2 MB e vincolo MIME** — e aggiunge la colonna **`vehicles.image_path`** per cancellare il file giusto.

**Compressione immagini (richiesta utente):** utilità condivisa `src/lib/images/compress.ts` — ogni foto è ridotta a 1600px di lato lungo e riscritta in **WebP dal browser** prima dell'upload (nessuna libreria). Usata sia dal `VehicleForm` sia dall'avatar (regressione verificata). L'upload dell'auto parte **al salvataggio** (non alla scelta del file), perché `image_url` è `NOT NULL` e caricare prima seminerebbe orfani.

**Collaudo dal vivo (tutto verde, 2026-07-15, browser via Playwright + Mailpit + psql), 2 account (admin `mcdevelop03@gmail.com` + membro `membro.test@example.com`):**
1. **Creazione:** riga con `image_path` valorizzato, `specs` jsonb corretto, 1 file in `{uid}/`.
2. **Compressione:** foto realistica **6.75 MB → WebP 158 KB** (−98%); il MIME salvato è sempre `image/webp` (con rumore puro incomprimibile 3.44 MB → 756 KB, comunque WebP e −78%: caso peggiore di test).
3. **Sostituzione foto:** il conteggio file **non cresce** — la vecchia foto è cancellata (prova che la policy SELECT della `0007` funziona), nuovo `image_path` aggiornato.
4. **Eliminazione:** conferma in-linea a due passi; **Annulla** non tocca nulla, **Conferma** rimuove riga **e** file (0 orfani).
5. **Sola lettura e guardie:** dal 2° account il garage del 1° si vede **senza** Modifica/Elimina; `/garage/[id-altrui]/modifica` → **HTTP 404**; il proprio `/garage` mostra solo le proprie auto; da **sloggato** `/garage` → login.
6. **RLS dal vivo:** con la sessione del 2° utente, `UPDATE`/`DELETE` via PostgREST su un veicolo altrui → **0 righe** (auto integra).
7. **Storage negativo:** upload nel bucket `vehicles` di file >2 MB → **413**, MIME `application/pdf` → **415**, cartella di un altro utente → **403** (RLS).
8. **Regressione avatar:** foto profilo grande → salvata come **WebP 158 KB**, un solo file (nessun orfano).
9. **Build:** `rm -rf .next && npm run build` **verde** (`tsc`/`lint` verdi a ogni task).

**Debito noto (follow-up, non bloccante):** un **admin** può cancellare l'auto altrui (policy `vehicles_delete_owner_or_admin` sulla tabella) ma **non il file** nello storage — le policy dello storage limitano ciascuno alla propria cartella `{uid}/`, quindi resta un **file orfano** nel bucket. Fix possibile: policy admin sullo storage o funzione `SECURITY DEFINER` per la pulizia.

## 🧪 Esito collaudo 1A (Task 13) — 2026-07-09

Collaudo e2e dal vivo (browser via Playwright + Mailpit + SQL). **Tutto verde:**
registrazione→conferma email→auto-login, login/logout, guardie, admin, 2FA (attivazione+enforcement AAL2+codice errato), RLS `vehicles`, reset password. Build/lint/tsc verdi.

**7 bug trovati e corretti durante il collaudo** (commit dedicati sul branch):
1. `fix(db)` — **GRANT di tabella mancanti** per i ruoli Supabase: ogni accesso dati via sessione utente falliva (`getProfile` null → admin inaccessibile, dashboard senza nome). Migrazione `0004_grants.sql`.
2. `fix(auth)` — allow-list redirect + host: `additional_redirect_urls` non ammetteva `/it/auth/callback` → niente auto-login dopo la conferma. Allineato `site_url` a `localhost` + glob `**`.
3. `fix(auth)` — **Turnstile** render esplicito (il widget non partiva: "preloaded but not used").
4. `fix(2fa)` — **config MFA TOTP disabilitata** (`enroll/verify_enabled=false`) + **QR** rotto con `next/image` (SVG data-URI) + errore UI non mostrato nello stato iniziale.

## 🎨 Rifiniture UI/UX post-1A — 2026-07-09 (su `main`, pushate)

Dopo la chiusura di 1A, migliorie all'interfaccia auth e alla navigazione (non nuove fasi):
- **Pagine auth a card**: login/registrati/reset avvolte in `AuthShell` (card centrata su sfondo "racing": griglia + alone rosso), campi/bottoni full-width.
- **Validazione live** (`ValidatedInput`): hint sotto email (formato) e password (min 8), spariscono quando validi.
- **Submit disabilitato** finché il form non è valido (validazione nativa) + stile disabled.
- **Vista successo**: dopo registrazione/reset resta solo il messaggio (form e footer nascosti).
- **Link "Clicca qui per accedere"** dopo l'aggiornamento password.
- **Fix menu hamburger**: reso fratello dell'header (era compresso dal `backdrop-filter`).
- **Navigazione da loggato**: `Dashboard`/`Impostazioni`/`Logout` nel menu (o `Accedi` da sloggato). `isAuthenticated` passato dal layout.

> **Avatar profilo accanto al menu**: ✅ **fatto in Fase 1B-1** (display nell'header + upload da `/profilo`).

## 🔮 Cosa aspetta le prossime sotto-fasi (1C-2 e 1C-3)

**1C-2 — RSVP.** Prima di progettarla vanno affrontati **due nodi già individuati leggendo le RLS**, che cambiano il design:

1. **La capienza non è mostrabile con le RLS attuali.** La policy è `registrations_select_self_or_admin`: un membro vede **solo la propria** iscrizione, quindi **non può contare le altre** → non possiamo scrivere *"restano 8 posti su 20"* senza una via dedicata (funzione `SECURITY DEFINER`, contatore denormalizzato, o modifica delle RLS).
2. **La capienza non è applicabile senza corsa.** `registrations_insert_self` controlla **solo** `user_id = auth.uid()`: **nessun controllo di capienza**. Se lo si mettesse nella server action, **due utenti che prenotano insieme l'ultimo posto passerebbero entrambi**. Va risolto a livello DB.

Nota: l'enum `registration_status` include `waitlist`, ma **RF-24 dice "RSVP bloccato a esaurimento posti"**, non "va in lista d'attesa". La lista d'attesa sarebbe un sottosistema intero (promozione automatica, notifiche): probabilmente **YAGNI**, da confermare nel brainstorming.

**1C-3 — Album foto.** Il bucket `event-media` è **già configurato** dalla `0008` (2 MB, solo immagini). Per D-171 i **video sono link YouTube**, quindi quel bucket ospita **solo foto** e la compressione WebP esistente copre tutto. Lì avrà senso il path `{event-id}/`, perché le foto sono molte e si caricano su un evento già esistente.

## 🔧 Come rimettere in moto l'ambiente

Dalla root del progetto Next (`marsicaCarMeetFinal/marsicaCarMeetFinal/`):
1. Avvia **Docker Desktop** e attendi "running".
2. `npx supabase start` (dati nel volume Docker). Se serve pulito: `npx supabase db reset` (riapplica migrazioni 0001–0004 + seed).
3. `npm run dev` → **http://localhost:3000/it** (usa `localhost`, non `127.0.0.1`: l'HMR dev è legato a localhost e le email puntano lì).
4. Casella email locale = **Mailpit** su http://127.0.0.1:54324 (API: `/api/v1/messages`).
5. `.env.local` presente (gitignored); se manca vedi [`SETUP.md`](./SETUP.md).

Per promuovere un utente ad admin dopo la registrazione: rieseguire la `update` in `supabase/seed.sql` (il seed promuove solo se l'utente esiste già).

**Credenziali di test locali (volatili — si azzerano con `db reset`):** admin `mcdevelop03@gmail.com` / `Marsica2026!` (2FA disattivo). Da loggato, il **2FA** si attiva da **Impostazioni** (link nel menu/header, non serve più digitare l'URL).

> ⚠️ **Trappola: non lanciare `npm run build` mentre gira `next dev`.** Corrompe `.next` (il manifest delle server action) e tutte le pagine con `<form action={serverAction}>` iniziano a dare 404/500. **Rimedio:** killare il dev server, `rm -rf .next`, riavviare.

## 📌 Decisioni e regole permanenti (non dimenticare)

- **Email:** MAI usare l'email dell'account (`aidev3@goproject.it`). Admin di seed = **`mcdevelop03@gmail.com`**. Chiedere sempre conferma prima di usare qualsiasi email.
- **Ritmo:** dopo ogni task completato (con review), **fermarsi e chiedere** se proseguire.
- **Stop = aggiornare questo file** col punto di ripartenza.
- **Next.js 16** (non 15): consultare `node_modules/next/dist/docs/` prima di toccare API Next; convenzione `proxy.ts` (non `middleware.ts`).
- **Solo token di tema** per i colori; stringhe UI via next-intl (IT).

## 🐞 Note aperte (non bloccanti)

- ✅ **Reset password con 2FA attivo — RISOLTO e collaudato (2026-07-09).** GoTrue esige AAL2 per cambiare password con MFA attivo: ora il link di recovery porta alla sfida MFA e, dopo la verifica, si torna alla pagina di reset (`/it/reset-password/aggiorna`, spostata fuori dal gruppo AAL2) per impostare la nuova password. Commit `fix(auth): reset password funzionante con 2FA attivo`.
- **Google OAuth / Turnstile reali + progetto Supabase cloud** da configurare (solo codice presente; guida in [`SETUP.md`](./SETUP.md) §6).
- ✅ **Impostazioni non rifletteva il 2FA attivo — RISOLTO e collaudato (2026-07-13).** Vedi l'esito della micro-fase di rifinitura.
- Logo header troppo piccolo (feedback 2026-07-08).
- Messaggi di validazione zod hardcoded in italiano + prefisso `/it/` fisso in alcune redirect → sistemare con l'inglese (Fase 3).
- In dev l'app va usata su `localhost:3000` (su `127.0.0.1:3000` l'HMR e il caricamento di script esterni falliscono: artefatto solo-dev).
