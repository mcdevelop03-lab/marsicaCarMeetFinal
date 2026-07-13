# Spec — Fase 1B-2: Garage

> Data: **2026-07-13** · Branch: `feat/fase1b2-garage`
> Sotto-progetto conclusivo della **Fase 1B** (dopo 1B-1 Profilo). Riferimenti: [ROADMAP](../../ROADMAP.md), [DECISIONS](../../DECISIONS.md) D-122 e D-146.

## 1. Obiettivo

Dare a ogni membro un **garage**: le sue auto, con foto, che può creare, modificare ed eliminare. Il garage di un membro è **visibile in sola lettura** agli altri membri loggati (D-146: garage e profili sono riservati ai loggati, non pubblici).

## 2. Cosa c'è già (e non va rifatto)

- **Tabella `vehicles`** (migrazione `0001`): `id, owner_id, make, model, year, image_url (NOT NULL), category, description, specs jsonb, created_at`.
- **RLS su `vehicles`** (`0002`), già corretta: lettura per qualunque loggato; `insert`/`update` solo del proprietario; `delete` proprietario **o admin**.
- **GRANT** (`0004`): coprono tutte le tabelle presenti **e future**. Il bug più cattivo della Fase 1A qui non si ripresenta.
- **Bucket `vehicles`** (`0003`), pubblico in lettura, scrittura solo nella cartella `{uid}/`.

## 3. Migrazione `0007` — da fare PRIMA del codice

Il bucket `vehicles` ha **gli stessi due difetti** che in 1B-1 sono costati due bug. Vanno chiusi prima di scrivere l'upload, altrimenti li ritroviamo identici:

1. **Policy SELECT su `storage.objects` per `vehicles`.** La `0003` ha creato INSERT/UPDATE/DELETE ma **non** SELECT. Senza, `storage.list()`/`remove()` con la sessione utente non vedono nulla e la cancellazione delle foto **fallisce in silenzio**. È esattamente il bug della `0006` (che ha tappato il buco solo per `avatars`).
2. **Limite di dimensione e MIME sul bucket:** `file_size_limit = 2 MB`, `allowed_mime_types = image/jpeg, image/png, image/webp` — come la `0005` per gli avatar. È il **vincolo lato server**: il controllo nel browser serve solo a dare feedback.
3. **Nuova colonna `vehicles.image_path` (text, nullable).** Serve a sapere *quale file* cancellare quando si sostituisce la foto o si elimina l'auto.
   *Perché non basta il metodo degli avatar:* lì si elencava la cartella `{uid}/` e si teneva l'unico file, perché **l'avatar è uno solo per utente**. Con più auto per utente quell'invariante non esiste. L'alternativa sarebbe ricavare il path spezzettando l'URL pubblico: fragile. Una colonna in più rende la cancellazione **esatta**.
   È nullable perché le righe esistenti (nessuna, ma la colonna deve poter essere aggiunta a caldo) non ce l'hanno.

## 4. Compressione delle immagini (nuova utilità condivisa)

**Requisito dell'utente:** ogni foto caricata dev'essere compressa il più possibile, per non occupare spazio e per reggere il multi-foto delle sezioni future.

> Precisazione: le foto **non stanno nel database**, stanno nello Storage (il DB tiene solo l'URL). Il problema — spazio e banda — resta identico.

**`src/lib/images/compress.ts`** — nessuna libreria nuova: il browser sa già ridimensionare e ricomprimere (`createImageBitmap` + `<canvas>` + `toBlob`).

```
comprimiImmagine(file: File): Promise<File>
```
- **Ridimensiona** a un lato lungo massimo di **1600 px** (le foto più piccole non vengono ingrandite).
- **Riscrive in WebP**, qualità di partenza **0.82**. A parità di resa pesa molto meno di un JPEG: una foto da telefono di ~4 MB scende tipicamente **sotto i 300 KB**.
- Se il risultato supera **500 KB**, riprova con qualità 0.7 e poi 0.6.
- **Non peggiora mai**: se il file compresso risultasse più grande dell'originale, si carica l'originale.
- Se il browser **non riesce a decodificare** l'immagine (`createImageBitmap` lancia), si ricade sull'originale: sarà il limite del bucket a fare da rete di sicurezza.

La compressione è **solo lato client** — un client ostile può aggirarla, ed è per questo che il limite di 2 MB e il vincolo MIME stanno **sul bucket**, dove non si aggirano.

**Usata da entrambi:** `VehicleForm` (nuovo) e **`AvatarUploader` (già esistente, va modificato)**. Anche gli avatar smettono così di occupare fino a 2 MB l'uno. L'upload dell'avatar va **ricollaudato** in questa fase, essendo codice già collaudato che stiamo toccando.

## 5. Quando parte l'upload (e perché non "alla scelta del file")

`AvatarUploader` carica il file **appena lo scegli**. Per le auto **non va bene**: `image_url` è `NOT NULL`, quindi la foto verrebbe caricata prima che la riga esista e, se l'utente abbandona il modulo, il file resta **orfano per sempre** nel bucket.

Quindi, nel `VehicleForm`, la foto si carica **al salvataggio**:
1. il modulo tiene il `File` in memoria e mostra un'anteprima locale;
2. al submit (modulo già valido: il bottone è disabilitato finché non lo è, come da convenzione del progetto) il client **comprime** e **carica** su `vehicles/{uid}/…`;
3. poi chiama la server action passando il **path**.

Un file orfano può nascere solo se l'action fallisce *dopo* l'upload: finestra stretta, non la norma.

## 6. Server action (`garage/actions.ts`)

- `creaVeicolo(...)` · `aggiornaVeicolo(...)` · `eliminaVeicolo(id)`.
- **Difesa in profondità:** il `path` arriva dal client, quindi ogni action verifica che cominci con `{uid}/` (come già fa `setAvatar`).
- **Proprietà:** `aggiornaVeicolo`/`eliminaVeicolo` verificano che l'auto sia dell'utente. La RLS lo impedisce comunque, ma l'errore va restituito in modo pulito, non come fallimento generico.
- **Sostituzione foto** → cancella il vecchio file usando `image_path`. **Eliminazione auto** → cancella la riga **e** il suo file.
- ⚠️ **Trappola nota (vedi STATO-LAVORI §1B-2):** queste action **non rileggono dal DAL memoizzato** un dato appena scritto. Usano `requireUser()` per l'identità (sempre sicuro) e query fresche con `createClient()` per il resto.
- Al termine: `revalidatePath`.

## 7. Rotte e UI

| Rotta | Cosa |
|---|---|
| **`/garage`** (spostata da `(public)` a `(auth)`) | **Il mio garage**: griglia di schede + "Aggiungi auto". Se vuoto, un invito ad aggiungere la prima auto. |
| **`/garage/nuova`** | Modulo di creazione. |
| **`/garage/[id]/modifica`** | Modulo di modifica. **404 se l'auto non è mia** (non ci si affida alla sola RLS). |
| **`/membri/[tag]`** | Il segnaposto "In arrivo" lascia il posto alla **griglia delle auto del membro, in sola lettura**. |

- **Eliminazione:** conferma **in linea a due passi** (Elimina → "Sei sicuro?" · Conferma · Annulla), lo stesso schema introdotto nel 2FA. Nessun componente modale nuovo.
- **Pagine dedicate**, non modali: stesso impianto di `/profilo` (server component + server action), già collaudato.

**Campi del modulo**
- **Obbligatori:** marca (2–40), modello (1–40), anno (1900 – anno corrente + 1), **foto**.
  - La foto è obbligatoria **in creazione**. **In modifica è facoltativa**: se non se ne carica una nuova si tiene quella esistente (e `image_url`/`image_path` restano invariati). Un'auto senza foto non può mai esistere, coerentemente col `NOT NULL` di `image_url`.
- **Opzionali:** categoria (**elenco chiuso**: Sportiva · Classica · Elaborata · Off-road · Daily · Altro), descrizione (max 500).
- **Specifiche opzionali** (dentro `specs` jsonb, nessuna migrazione): **potenza** (CV, intero), **cilindrata** (cc, intero), **cambio** (manuale/automatico), **alimentazione** (benzina/diesel/GPL/metano/ibrida/elettrica).
- Elenco chiuso **nel codice** (costante + zod in `src/lib/validation/vehicle.ts`), non enum nel DB: aggiungere una categoria resta una modifica di codice, non una migrazione.

**Nuovi file**
`src/lib/images/compress.ts` · `src/lib/validation/vehicle.ts` · `src/app/[locale]/(auth)/garage/{page.tsx, actions.ts, nuova/page.tsx, [id]/modifica/page.tsx}` · `src/components/features/garage/{VehicleForm.tsx, VehicleCard.tsx, DeleteVehicleButton.tsx}`.
**Modificati:** `AvatarUploader.tsx` (compressione), `membri/[tag]/page.tsx` (griglia al posto del segnaposto), `src/messages/it.json`.
**Rimosso:** `src/app/[locale]/(public)/garage/`.

## 8. Fuori scope

- **Galleria multi-foto** per auto (una foto per auto; la galleria è una fase a sé, quando il garage sarà in uso).
- **Pagina di dettaglio** della singola auto: le schede mostrano tutto.
- Filtri/ricerca per categoria; collegamento auto ↔ eventi (è **1C**).

## 9. Debito noto che questa fase NON risolve

Un **admin** può cancellare l'auto di un altro (glielo consente `vehicles_delete_owner_or_admin`), ma **non il file** nello storage: le policy dello storage limitano ciascuno alla propria cartella `{uid}/`. Il file resterebbe orfano nel bucket. Va annotato come follow-up; risolverlo pulito richiede una policy admin sullo storage o una funzione `SECURITY DEFINER`.

## 10. Collaudo

1. **Creazione:** nuova auto con foto → compare in `/garage`; nel bucket c'è **un** file, in `vehicles/{uid}/`; la riga ha `image_url` e `image_path`.
2. **Compressione (la prova che conta):** caricare una foto **grande** (≥ 3 MB) e verificare nel bucket che il file salvato sia **WebP e molto più piccolo** (< 500 KB), con lato lungo ≤ 1600 px.
3. **Sostituzione foto:** modificare l'auto con una nuova foto → nel bucket resta **un solo** file (il vecchio è stato cancellato: prova che la policy SELECT della `0007` funziona — senza, fallirebbe in silenzio).
4. **Eliminazione:** conferma a due passi → la riga sparisce **e** il file pure.
5. **Sola lettura:** da un secondo account, `/membri/[tag]` mostra le auto dell'altro senza comandi di modifica; `/garage/[id]/modifica` di un'auto altrui dà **404**.
6. **RLS dal vivo:** con la sessione di un altro utente, un `update`/`delete` diretto su un veicolo non proprio deve fallire.
7. **Avatar (regressione):** l'upload dell'avatar continua a funzionare, e ora produce un WebP compresso.
8. **Storage negativo:** file > 2 MB o MIME non ammesso → respinti dal bucket (HTTP 400) anche aggirando il client.
9. `tsc` / `lint` / `build` verdi.
