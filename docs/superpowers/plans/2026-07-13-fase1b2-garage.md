# Fase 1B-2 — Garage · Piano di implementazione

> **Per chi esegue:** **un task alla volta**, **un commit per task**, **fermarsi a chiedere** prima del successivo (workflow del progetto).

**Obiettivo:** ogni membro ha un garage di auto (con foto) che può creare, modificare ed eliminare; il garage altrui è visibile in sola lettura agli altri loggati.

**Architettura:** stesso impianto di `/profilo` (server component + server action + form client con validazione nativa). Le foto vanno nello Storage (`vehicles/{uid}/…`), **compresse dal browser** prima dell'upload; il DB tiene URL **e** path del file, così la cancellazione è esatta.

**Stack:** Next.js 16.2.10 (App Router) · React 19 · TypeScript · Tailwind 4 · next-intl (solo IT) · Supabase (`@supabase/ssr`) · zod.

**Spec:** [`../specs/2026-07-13-fase1b2-garage-design.md`](../specs/2026-07-13-fase1b2-garage-design.md) · **Branch:** `feat/fase1b2-garage`

## Vincoli globali

- **Colori solo da token** di tema; **stringhe UI solo via next-intl** (`src/messages/it.json`), mai testo hardcoded nei componenti.
- **Immagini utente con `<img>` semplice** (+ `eslint-disable-next-line @next/next/no-img-element`), **non** `next/image`: il progetto non configura `remotePatterns` e usa già questa convenzione (vedi `src/components/ui/Avatar.tsx`).
- **`useRouter`/`Link`/`redirect` da `@/i18n/navigation`**, mai da `next/navigation`.
- **Niente test automatici:** il progetto non ha infrastruttura di test (`package.json` → solo `dev`/`build`/`start`/`lint`). Verifica = `tsc` + `lint` + `build` + collaudo dal vivo (Task 9).
- **Lint pulito:** zero errori **e zero warning** (`no-unused-vars` scatta anche sugli argomenti con prefisso `_`).
- ⚠️ **Trappola letture stantie:** nelle server action **non** rileggere dal DAL memoizzato (`getProfile`) un dato appena scritto. Identità con `requireUser()` (sempre sicuro); per il resto query fresche con `createClient()`.
- ⚠️ **Trappola build:** non lanciare `npm run build` mentre gira `next dev` — corrompe `.next` (manifest delle server action) e le pagine con form danno 404/500. Rimedio: killare il dev, `rm -rf .next`, ripartire.
- **Difesa in profondità:** il `path` della foto arriva dal client → ogni action verifica che cominci con `{uid}/` (come già fa `setAvatar`).

---

## Task 1 — Migrazione `0007` e tipo `Vehicle`

Chiude sul bucket `vehicles` **gli stessi due difetti già pagati in 1B-1** (policy SELECT mancante → cancellazione che fallisce in silenzio; nessun limite di dimensione/MIME), e aggiunge la colonna che rende esatta la cancellazione del file.

**File:**
- Crea: `supabase/migrations/0007_vehicles_storage.sql`
- Modifica: `src/types/database.ts` (in fondo)

**Interfacce prodotte:** tipo `Vehicle`, `VehicleSpecs` (usati da tutti i task successivi).

- [ ] **Passo 1: creare `supabase/migrations/0007_vehicles_storage.sql`**

```sql
-- 1) Policy SELECT sullo storage per il bucket `vehicles`.
-- La 0003 ha creato INSERT/UPDATE/DELETE ma NON la SELECT. Su `storage.objects`
-- la RLS è attiva: senza policy di lettura, `list()` e `remove()` chiamati con la
-- sessione dell'utente non vedono nulla e la cancellazione delle foto FALLISCE IN
-- SILENZIO. È lo stesso bug che la 0006 ha corretto per `avatars`.
-- Il bucket è public=true, quindi la lettura anonima via URL pubblico passa da
-- un'altra strada: qui si abilita solo la propria cartella `{uid}/`.
create policy "vehicles_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2) Vincoli lato server sul bucket (non aggirabili dal client, che comprime e
-- controlla solo per dare feedback immediato). Come la 0005 per `avatars`.
update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'vehicles';

-- 3) Path del file nello storage, accanto all'URL pubblico.
-- Serve a sapere QUALE file cancellare quando si sostituisce la foto o si elimina
-- l'auto. Per gli avatar bastava elencare la cartella e tenere l'unico file, perché
-- l'avatar è uno solo per utente; con più auto per utente quell'invariante non
-- esiste, e ricavare il path spezzettando l'URL pubblico sarebbe fragile.
alter table public.vehicles add column if not exists image_path text;
```

- [ ] **Passo 2: applicare la migrazione**

```bash
npx supabase db reset
```
Atteso: le migrazioni `0001`–`0007` vengono riapplicate senza errori (il reset ricrea il DB da zero: le credenziali di test vanno ricreate registrandosi di nuovo, come da `docs/STATO-LAVORI.md`).

- [ ] **Passo 3: verificare che la migrazione abbia fatto quello che dice**

```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select id, file_size_limit, allowed_mime_types from storage.buckets where id in ('avatars','vehicles');"
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select policyname from pg_policies where schemaname='storage' and policyname like 'vehicles%';"
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "\d public.vehicles" | grep image_path
```
Atteso: `vehicles` con `file_size_limit = 2097152` e i tre MIME; fra le policy compare **`vehicles_select_own`**; la colonna `image_path` esiste.

- [ ] **Passo 4: aggiungere i tipi in fondo a `src/types/database.ts`**

```ts
export const VEHICLE_CATEGORIES = [
  "sportiva",
  "classica",
  "elaborata",
  "offroad",
  "daily",
  "altro",
] as const;
export const GEARBOXES = ["manuale", "automatico"] as const;
export const FUELS = ["benzina", "diesel", "gpl", "metano", "ibrida", "elettrica"] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];
export type Gearbox = (typeof GEARBOXES)[number];
export type Fuel = (typeof FUELS)[number];

// Specifiche opzionali, salvate nella colonna `specs` (jsonb): nessuna migrazione.
export type VehicleSpecs = {
  potenza?: number; // CV
  cilindrata?: number; // cc
  cambio?: Gearbox;
  alimentazione?: Fuel;
};

export type Vehicle = {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  image_url: string;
  image_path: string | null; // colonna aggiunta dalla migrazione 0007
  category: VehicleCategory | null;
  description: string | null;
  specs: VehicleSpecs;
  created_at: string;
};
```

- [ ] **Passo 5: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add supabase/migrations/0007_vehicles_storage.sql src/types/database.ts
git commit -m "feat(db): migrazione 0007 - policy SELECT storage, limiti e image_path per vehicles"
```

**⏸ Fermarsi e chiedere prima del Task 2.**

---

## Task 2 — Compressione delle immagini (utilità condivisa) + avatar

**File:**
- Crea: `src/lib/images/compress.ts`
- Modifica: `src/components/features/profile/AvatarUploader.tsx`

**Interfacce prodotte:** `comprimiImmagine(file: File): Promise<File>` — usata anche dal `VehicleForm` (Task 5).

- [ ] **Passo 1: creare `src/lib/images/compress.ts`**

```ts
// Compressione lato client, senza librerie: il browser sa già ridimensionare e
// ricomprimere (createImageBitmap + canvas + toBlob).
//
// È solo un'ottimizzazione: un client ostile può aggirarla. Il limite di 2 MB e i
// MIME ammessi stanno sul BUCKET (migrazioni 0005 e 0007), dove non si aggirano.

const LATO_MAX = 1600; // px sul lato lungo
const TARGET_BYTES = 500 * 1024; // sotto questa soglia ci si ferma
const QUALITA = [0.82, 0.7, 0.6];

/**
 * Ridimensiona a un lato lungo massimo di 1600px e riscrive in WebP.
 * Una foto da telefono (~4 MB) scende tipicamente sotto i 300 KB.
 *
 * Non peggiora mai: se il risultato fosse più grande dell'originale, torna
 * l'originale. Se il browser non sa decodificare il file, torna l'originale
 * (sarà il bucket a respingerlo, se non ammesso).
 */
export async function comprimiImmagine(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scala = Math.min(1, LATO_MAX / Math.max(bitmap.width, bitmap.height));
  const larghezza = Math.round(bitmap.width * scala);
  const altezza = Math.round(bitmap.height * scala);

  const canvas = document.createElement("canvas");
  canvas.width = larghezza;
  canvas.height = altezza;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, larghezza, altezza);
  bitmap.close();

  let migliore: Blob | null = null;
  for (const qualita of QUALITA) {
    const blob = await new Promise<Blob | null>((risolvi) =>
      canvas.toBlob(risolvi, "image/webp", qualita),
    );
    if (!blob) continue;
    migliore = blob;
    if (blob.size <= TARGET_BYTES) break;
  }

  if (!migliore || migliore.size >= file.size) return file;

  const nome = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([migliore], nome, { type: "image/webp" });
}
```

- [ ] **Passo 2: usare la compressione in `AvatarUploader.tsx`**

Nel file, aggiungere l'import:

```ts
import { comprimiImmagine } from "@/lib/images/compress";
```

e sostituire il corpo di `onFileChange` (dal controllo del tipo fino all'upload) con:

```ts
    setError(null);
    if (!EXTENSIONS[file.type]) return setError(t("avatarType"));

    setUploading(true);
    // Si comprime PRIMA di controllare la dimensione: una foto da telefono di 4 MB
    // è perfettamente accettabile una volta ridotta, e respingerla sarebbe assurdo.
    const daCaricare = await comprimiImmagine(file);
    if (daCaricare.size > MAX_BYTES) {
      setUploading(false);
      return setError(t("avatarSize"));
    }

    // Il nome cambia a ogni caricamento: niente cache stantia del browser.
    const estensione = EXTENSIONS[daCaricare.type] ?? "webp";
    const path = `${userId}/avatar-${Date.now()}.${estensione}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, daCaricare, { contentType: daCaricare.type });
    setUploading(false);
    if (uploadError) return setError(t("avatarUploadFailed"));
```

Il resto della funzione (`startTransition` con `setAvatar(path)`) resta invariato.

- [ ] **Passo 3: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lib/images/compress.ts src/components/features/profile/AvatarUploader.tsx
git commit -m "feat(images): compressione WebP prima dell'upload, condivisa con l'avatar"
```

**⏸ Fermarsi e chiedere prima del Task 3.**

---

## Task 3 — Validazione del veicolo e componente `Select`

**File:**
- Crea: `src/lib/validation/vehicle.ts`
- Crea: `src/components/ui/Select.tsx`
- Modifica: `src/messages/it.json` (nuova sezione `garage`)

**Interfacce:**
- Consuma: `VEHICLE_CATEGORIES`, `GEARBOXES`, `FUELS`, `VehicleSpecs` da `@/types/database` (Task 1).
- Produce: `vehicleSchema`, `VehicleInput`, `ANNO_MIN`, `ANNO_MAX`, `specsDa(input)`; componente `<Select>`.

- [ ] **Passo 1: creare `src/lib/validation/vehicle.ts`**

```ts
import * as z from "zod";
import { VEHICLE_CATEGORIES, GEARBOXES, FUELS, type VehicleSpecs } from "@/types/database";

export const ANNO_MIN = 1900;
export const ANNO_MAX = new Date().getFullYear() + 1;

// I campi non obbligatori arrivano dal form come "": vanno trattati come "assenti",
// altrimenti enum e minimi scatterebbero su un campo lasciato vuoto.
// (Stesso accorgimento di `src/lib/validation/profile.ts`.)
const vuotoAUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const interoOpzionale = (max: number, messaggio: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().int().min(1, messaggio).max(max, messaggio).optional(),
  );

export const vehicleSchema = z.object({
  make: z
    .string()
    .trim()
    .min(2, "Marca troppo corta (minimo 2 caratteri)")
    .max(40, "Marca troppo lunga (massimo 40 caratteri)"),
  model: z
    .string()
    .trim()
    .min(1, "Il modello è obbligatorio")
    .max(40, "Modello troppo lungo (massimo 40 caratteri)"),
  year: z.coerce
    .number()
    .int()
    .min(ANNO_MIN, `Anno non valido (dal ${ANNO_MIN})`)
    .max(ANNO_MAX, `Anno non valido (fino al ${ANNO_MAX})`),
  category: z.preprocess(vuotoAUndefined, z.enum(VEHICLE_CATEGORIES).optional()),
  description: z.preprocess(
    vuotoAUndefined,
    z.string().trim().max(500, "Descrizione troppo lunga (massimo 500 caratteri)").optional(),
  ),
  potenza: interoOpzionale(2000, "Potenza non valida (1–2000 CV)"),
  cilindrata: interoOpzionale(10000, "Cilindrata non valida (1–10000 cc)"),
  cambio: z.preprocess(vuotoAUndefined, z.enum(GEARBOXES).optional()),
  alimentazione: z.preprocess(vuotoAUndefined, z.enum(FUELS).optional()),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

/** Le quattro specifiche opzionali, pronte per la colonna `specs` (jsonb). */
export function specsDa(input: VehicleInput): VehicleSpecs {
  const specs: VehicleSpecs = {};
  if (input.potenza !== undefined) specs.potenza = input.potenza;
  if (input.cilindrata !== undefined) specs.cilindrata = input.cilindrata;
  if (input.cambio !== undefined) specs.cambio = input.cambio;
  if (input.alimentazione !== undefined) specs.alimentazione = input.alimentazione;
  return specs;
}
```

- [ ] **Passo 2: creare `src/components/ui/Select.tsx`**

Stesse classi di `Input.tsx`, così i due campi stanno in riga senza stonare.

```tsx
import { SelectHTMLAttributes } from "react";

export default function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-3 py-2.5 bg-surface-dim border border-white/10 hover:border-white/20 focus:border-accent-red/50 user-invalid:border-accent-red text-xs font-mono text-white focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
```

- [ ] **Passo 3: aggiungere la sezione `garage` in `src/messages/it.json`**

Inserire dopo la sezione `members` (attenzione alla virgola):

```json
  "garage": {
    "title": "Il mio garage",
    "memberTitle": "Garage",
    "add": "Aggiungi auto",
    "empty": "Non hai ancora aggiunto nessuna auto.",
    "emptyOther": "Questo membro non ha ancora aggiunto nessuna auto.",
    "newTitle": "Nuova auto",
    "editTitle": "Modifica auto",
    "photo": "Foto",
    "photoRules": "JPG, PNG o WebP · viene compressa automaticamente",
    "photoChoose": "Scegli foto",
    "photoRequired": "La foto è obbligatoria",
    "photoType": "Formato non ammesso: usa JPG, PNG o WebP.",
    "uploadFailed": "Caricamento della foto non riuscito. Riprova.",
    "make": "Marca",
    "model": "Modello",
    "year": "Anno",
    "category": "Categoria",
    "categoryNone": "Nessuna",
    "description": "Descrizione",
    "descriptionCount": "{count}/500",
    "specsTitle": "Specifiche",
    "power": "Potenza (CV)",
    "displacement": "Cilindrata (cc)",
    "gearbox": "Cambio",
    "fuel": "Alimentazione",
    "notSpecified": "Non specificato",
    "save": "Salva",
    "saved": "Auto salvata.",
    "edit": "Modifica",
    "delete": "Elimina",
    "confirmDelete": "Sei sicuro? L'auto e la sua foto verranno eliminate.",
    "confirm": "Conferma",
    "cancel": "Annulla",
    "notYours": "Questa auto non è tua.",
    "genericError": "Qualcosa è andato storto. Riprova.",
    "cat_sportiva": "Sportiva",
    "cat_classica": "Classica",
    "cat_elaborata": "Elaborata",
    "cat_offroad": "Off-road",
    "cat_daily": "Daily",
    "cat_altro": "Altro",
    "gear_manuale": "Manuale",
    "gear_automatico": "Automatico",
    "fuel_benzina": "Benzina",
    "fuel_diesel": "Diesel",
    "fuel_gpl": "GPL",
    "fuel_metano": "Metano",
    "fuel_ibrida": "Ibrida",
    "fuel_elettrica": "Elettrica"
  }
```

- [ ] **Passo 4: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lib/validation/vehicle.ts src/components/ui/Select.tsx src/messages/it.json
git commit -m "feat(garage): schema di validazione del veicolo, Select e stringhe"
```

**⏸ Fermarsi e chiedere prima del Task 4.**

---

## Task 4 — Server action del garage

**File:**
- Crea: `src/app/[locale]/(auth)/garage/actions.ts`

**Interfacce:**
- Consuma: `requireUser` da `@/lib/auth`; `vehicleSchema`, `specsDa` (Task 3); `Vehicle` (Task 1).
- Produce:
  - `type VehicleState = { error?: string }`
  - `creaVeicolo(state: VehicleState, formData: FormData): Promise<VehicleState>`
  - `aggiornaVeicolo(id: string, state: VehicleState, formData: FormData): Promise<VehicleState>` (l'`id` va legato con `.bind(null, id)`)
  - `eliminaVeicolo(id: string): Promise<{ error?: string }>`

- [ ] **Passo 1: creare `src/app/[locale]/(auth)/garage/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { specsDa, vehicleSchema } from "@/lib/validation/vehicle";

const BUCKET = "vehicles";

export type VehicleState = { error?: string };

/**
 * ⚠️ Nota sulla memoizzazione (vedi docs/STATO-LAVORI.md, sezione 1B-2):
 * `cache()` di React vive UN RENDER PASS e una server action gira PRIMA del render
 * che essa stessa innesca con `revalidatePath`. Qui non si rilegge mai un dato
 * appena scritto passando dal DAL memoizzato: l'identità arriva da `requireUser()`
 * (sempre sicura: l'utente non cambia dentro una richiesta) e tutto il resto sono
 * query fresche fatte con `createClient()`.
 */

function campiDa(formData: FormData) {
  const testo = (chiave: string) => String(formData.get(chiave) ?? "");
  return {
    make: testo("make"),
    model: testo("model"),
    year: testo("year"),
    category: testo("category"),
    description: testo("description"),
    potenza: testo("potenza"),
    cilindrata: testo("cilindrata"),
    cambio: testo("cambio"),
    alimentazione: testo("alimentazione"),
  };
}

export async function creaVeicolo(
  _state: VehicleState,
  formData: FormData,
): Promise<VehicleState> {
  const t = await getTranslations("garage");
  const user = await requireUser();

  const parsed = vehicleSchema.safeParse(campiDa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const path = String(formData.get("imagePath") ?? "");
  if (!path) return { error: t("photoRequired") };
  // Difesa in profondità: `path` arriva dal client e finisce dritto nel DB.
  // Le policy dello storage consentono la scrittura solo in `{uid}/`, ma qui non
  // ci fidiamo comunque di un valore che non abbiamo generato noi.
  if (!path.startsWith(`${user.id}/`)) return { error: t("genericError") };

  const supabase = await createClient();
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { make, model, year, category, description } = parsed.data;
  const { error } = await supabase.from("vehicles").insert({
    owner_id: user.id,
    make,
    model,
    year,
    image_url: urlData.publicUrl,
    image_path: path,
    category: category ?? null,
    description: description ?? null,
    specs: specsDa(parsed.data),
  });
  if (error) {
    console.error("creaVeicolo: insert non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/garage");
  redirect({ href: "/garage", locale: "it" });
  // Il `redirect` di next-intl NON è tipizzato `never` (si vede da `requireUser` in
  // `src/lib/auth/index.ts`, che dopo il redirect deve usare `user!`): senza questo
  // return, TypeScript si lamenta che non tutti i rami restituiscono un valore.
  // La riga non viene mai eseguita.
  return {};
}

export async function aggiornaVeicolo(
  id: string,
  _state: VehicleState,
  formData: FormData,
): Promise<VehicleState> {
  const t = await getTranslations("garage");
  const user = await requireUser();

  const parsed = vehicleSchema.safeParse(campiDa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // La RLS impedirebbe comunque di toccare l'auto altrui, ma un errore generico di
  // policy è indistinguibile da un guasto: qui si controlla e si risponde chiaro.
  const { data: esistente, error: letturaError } = await supabase
    .from("vehicles")
    .select("id, owner_id, image_path")
    .eq("id", id)
    .maybeSingle();
  if (letturaError) {
    console.error("aggiornaVeicolo: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!esistente || esistente.owner_id !== user.id) return { error: t("notYours") };

  // La foto è facoltativa in modifica: senza nuovo path si tiene quella esistente.
  const nuovoPath = String(formData.get("imagePath") ?? "");
  if (nuovoPath && !nuovoPath.startsWith(`${user.id}/`)) return { error: t("genericError") };

  const { make, model, year, category, description } = parsed.data;
  const aggiornamento: Record<string, unknown> = {
    make,
    model,
    year,
    category: category ?? null,
    description: description ?? null,
    specs: specsDa(parsed.data),
  };
  if (nuovoPath) {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(nuovoPath);
    aggiornamento.image_url = urlData.publicUrl;
    aggiornamento.image_path = nuovoPath;
  }

  const { error } = await supabase.from("vehicles").update(aggiornamento).eq("id", id);
  if (error) {
    console.error("aggiornaVeicolo: update non riuscita", error);
    return { error: t("genericError") };
  }

  // Solo ORA il vecchio file è sostituibile: se lo avessimo cancellato prima e
  // l'update fosse fallito, l'auto sarebbe rimasta con un URL rotto.
  if (nuovoPath && esistente.image_path && esistente.image_path !== nuovoPath) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove([esistente.image_path]);
    // Un orfano nel bucket non è un errore per l'utente: l'auto è salva e corretta.
    // Ma va tracciato, altrimenti una pulizia rotta è indistinguibile dal silenzio.
    // (Richiede la policy `vehicles_select_own` della migrazione 0007.)
    if (removeError) console.error("aggiornaVeicolo: vecchia foto non rimossa", removeError);
  }

  revalidatePath("/garage");
  redirect({ href: "/garage", locale: "it" });
  // Come in `creaVeicolo`: il `redirect` di next-intl non è tipizzato `never`,
  // quindi serve un return che TypeScript possa vedere. Mai eseguito.
  return {};
}

export async function eliminaVeicolo(id: string): Promise<{ error?: string }> {
  const t = await getTranslations("garage");
  const user = await requireUser();

  const supabase = await createClient();
  const { data: esistente, error: letturaError } = await supabase
    .from("vehicles")
    .select("id, owner_id, image_path")
    .eq("id", id)
    .maybeSingle();
  if (letturaError) {
    console.error("eliminaVeicolo: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!esistente || esistente.owner_id !== user.id) return { error: t("notYours") };

  // Prima la riga, poi il file: se cancellassimo il file per primo e la delete
  // fallisse, resterebbe un'auto con la foto rotta. Al contrario, il peggio che
  // può capitare è un file orfano — brutto, ma innocuo, e viene loggato.
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) {
    console.error("eliminaVeicolo: delete non riuscita", error);
    return { error: t("genericError") };
  }

  if (esistente.image_path) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove([esistente.image_path]);
    if (removeError) console.error("eliminaVeicolo: foto non rimossa", removeError);
  }

  revalidatePath("/garage");
  return {};
}
```

- [ ] **Passo 2: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add "src/app/[locale]/(auth)/garage/actions.ts"
git commit -m "feat(garage): server action crea/aggiorna/elimina veicolo"
```

**⏸ Fermarsi e chiedere prima del Task 5.**

---

## Task 5 — `VehicleForm` e pagina `/garage/nuova`

**File:**
- Crea: `src/components/features/garage/VehicleForm.tsx`
- Crea: `src/app/[locale]/(auth)/garage/nuova/page.tsx`

**Interfacce:**
- Consuma: `comprimiImmagine` (Task 2); `ANNO_MIN`/`ANNO_MAX` (Task 3); `Select` (Task 3); `VehicleState`, `creaVeicolo` (Task 4); `Vehicle` (Task 1).
- Produce: `<VehicleForm action={…} userId={…} vehicle={…}/>` — `vehicle` assente = creazione.

- [ ] **Passo 1: creare `src/components/features/garage/VehicleForm.tsx`**

L'upload parte **al salvataggio**, non alla scelta del file: `image_url` è `NOT NULL`, quindi caricare prima che la riga esista seminerebbe file orfani a ogni modulo abbandonato.

```tsx
"use client";
import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { comprimiImmagine } from "@/lib/images/compress";
import { createClient } from "@/lib/supabase/client";
import { ANNO_MAX, ANNO_MIN } from "@/lib/validation/vehicle";
import type { VehicleState } from "@/app/[locale]/(auth)/garage/actions";
import {
  FUELS,
  GEARBOXES,
  VEHICLE_CATEGORIES,
  type Vehicle,
} from "@/types/database";

const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/60";
const hintClass = "block font-mono text-[11px] text-white/40";
const MIME_AMMESSI = ["image/jpeg", "image/png", "image/webp"];
const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function VehicleForm({
  action,
  userId,
  vehicle,
}: {
  action: (state: VehicleState, formData: FormData) => Promise<VehicleState>;
  userId: string;
  vehicle?: Vehicle;
}) {
  const t = useTranslations("garage");
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [anteprima, setAnteprima] = useState<string | null>(vehicle?.image_url ?? null);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(false);

  // Come in ProfileForm: il submit resta spento finché la validazione nativa non
  // è soddisfatta. In creazione serve anche la foto, che il browser non convalida.
  const [valid, setValid] = useState(false);
  const revalidate = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(revalidate, []);
  const [descLength, setDescLength] = useState((vehicle?.description ?? "").length);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const scelto = event.target.files?.[0];
    event.target.value = ""; // permette di riselezionare lo stesso file
    if (!scelto) return;
    setErrore(null);
    if (!MIME_AMMESSI.includes(scelto.type)) return setErrore(t("photoType"));
    setFile(scelto);
    setAnteprima(URL.createObjectURL(scelto));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrore(null);

    // In creazione la foto è obbligatoria; in modifica, se non se ne sceglie una
    // nuova, si tiene quella esistente e non si carica nulla.
    if (!vehicle && !file) return setErrore(t("photoRequired"));

    if (file) {
      setCaricando(true);
      const daCaricare = await comprimiImmagine(file);
      const estensione = ESTENSIONI[daCaricare.type] ?? "webp";
      const path = `${userId}/${crypto.randomUUID()}.${estensione}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("vehicles")
        .upload(path, daCaricare, { contentType: daCaricare.type });
      setCaricando(false);
      if (error) return setErrore(t("uploadFailed"));
      formData.set("imagePath", path);
    }

    startTransition(() => formAction(formData));
  }

  const busy = caricando || pending;

  return (
    <form ref={formRef} onSubmit={onSubmit} onInput={revalidate} className="space-y-6">
      <div className="space-y-2">
        <span className={labelClass}>{t("photo")}</span>
        {anteprima && (
          // Foto utente con <img>: il progetto non configura `remotePatterns`
          // (stessa scelta di Avatar.tsx).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anteprima}
            alt=""
            className="h-48 w-full max-w-sm border border-white/10 object-cover"
          />
        )}
        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputFileRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Camera size={14} />
          {t("photoChoose")}
        </Button>
        <span className={hintClass}>{t("photoRules")}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("make")}</span>
          <Input name="make" defaultValue={vehicle?.make ?? ""} required minLength={2} maxLength={40} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("model")}</span>
          <Input name="model" defaultValue={vehicle?.model ?? ""} required minLength={1} maxLength={40} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("year")}</span>
          <Input
            name="year"
            type="number"
            defaultValue={vehicle?.year ?? ""}
            required
            min={ANNO_MIN}
            max={ANNO_MAX}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className={labelClass}>{t("category")}</span>
        <Select name="category" defaultValue={vehicle?.category ?? ""}>
          <option value="">{t("categoryNone")}</option>
          {VEHICLE_CATEGORIES.map((categoria) => (
            <option key={categoria} value={categoria}>
              {t(`cat_${categoria}`)}
            </option>
          ))}
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className={labelClass}>{t("description")}</span>
        <Textarea
          name="description"
          rows={4}
          maxLength={500}
          defaultValue={vehicle?.description ?? ""}
          onChange={(e) => setDescLength(e.target.value.length)}
        />
        <span className={hintClass}>{t("descriptionCount", { count: descLength })}</span>
      </label>

      <div className="space-y-3">
        <h3 className={labelClass}>{t("specsTitle")}</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className={labelClass}>{t("power")}</span>
            <Input name="potenza" type="number" min={1} max={2000} defaultValue={vehicle?.specs?.potenza ?? ""} />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t("displacement")}</span>
            <Input
              name="cilindrata"
              type="number"
              min={1}
              max={10000}
              defaultValue={vehicle?.specs?.cilindrata ?? ""}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t("gearbox")}</span>
            <Select name="cambio" defaultValue={vehicle?.specs?.cambio ?? ""}>
              <option value="">{t("notSpecified")}</option>
              {GEARBOXES.map((cambio) => (
                <option key={cambio} value={cambio}>
                  {t(`gear_${cambio}`)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t("fuel")}</span>
            <Select name="alimentazione" defaultValue={vehicle?.specs?.alimentazione ?? ""}>
              <option value="">{t("notSpecified")}</option>
              {FUELS.map((alimentazione) => (
                <option key={alimentazione} value={alimentazione}>
                  {t(`fuel_${alimentazione}`)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      {errore && <p className="font-mono text-xs text-accent-red">{errore}</p>}
      {state.error && <p className="font-mono text-xs text-accent-red">{state.error}</p>}

      <Button type="submit" disabled={busy || !valid}>
        {t("save")}
      </Button>
    </form>
  );
}
```

- [ ] **Passo 2: creare `src/app/[locale]/(auth)/garage/nuova/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import VehicleForm from "@/components/features/garage/VehicleForm";
import { requireUser } from "@/lib/auth";
import { creaVeicolo } from "../actions";

export default async function NuovaAutoPage() {
  const t = await getTranslations("garage");
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <SectionHeading>{t("newTitle")}</SectionHeading>
      <Card className="p-6">
        <VehicleForm action={creaVeicolo} userId={user.id} />
      </Card>
    </div>
  );
}
```

- [ ] **Passo 3: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add src/components/features/garage/VehicleForm.tsx "src/app/[locale]/(auth)/garage/nuova/page.tsx"
git commit -m "feat(garage): modulo dell'auto e pagina di creazione"
```

**⏸ Fermarsi e chiedere prima del Task 6.**

---

## Task 6 — `/garage` (il mio garage), `VehicleCard`, `DeleteVehicleButton`

**File:**
- Crea: `src/components/features/garage/VehicleCard.tsx`
- Crea: `src/components/features/garage/DeleteVehicleButton.tsx`
- Crea: `src/app/[locale]/(auth)/garage/page.tsx`
- **Elimina:** `src/app/[locale]/(public)/garage/page.tsx` (e la cartella)

**Interfacce:**
- Consuma: `eliminaVeicolo` (Task 4); `Vehicle` (Task 1).
- Produce: `<VehicleCard vehicle={…} owner={true|false}/>` — riusata in `/membri/[tag]` (Task 8).

- [ ] **Passo 1: creare `src/components/features/garage/DeleteVehicleButton.tsx`**

Conferma **in linea a due passi**, lo stesso schema del 2FA: nessun componente modale nuovo.

```tsx
"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { eliminaVeicolo } from "@/app/[locale]/(auth)/garage/actions";

export default function DeleteVehicleButton({ id }: { id: string }) {
  const t = useTranslations("garage");
  const router = useRouter();
  const [conferma, setConferma] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function elimina() {
    startTransition(async () => {
      const r = await eliminaVeicolo(id);
      if (r.error) {
        setConferma(false);
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  if (!conferma) {
    return (
      <div className="space-y-2">
        {errore && <p className="font-mono text-[11px] text-accent-red">{errore}</p>}
        <Button type="button" variant="ghost" onClick={() => setConferma(true)}>
          {t("delete")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] text-white/60">{t("confirmDelete")}</p>
      <div className="flex gap-2">
        <Button type="button" onClick={elimina} disabled={pending}>
          {t("confirm")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setConferma(false)} disabled={pending}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Passo 2: creare `src/components/features/garage/VehicleCard.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import DeleteVehicleButton from "./DeleteVehicleButton";
import type { Vehicle } from "@/types/database";

export default async function VehicleCard({
  vehicle,
  owner = false,
}: {
  vehicle: Vehicle;
  owner?: boolean;
}) {
  const t = await getTranslations("garage");

  // Riga compatta delle specifiche: si mostrano solo quelle valorizzate.
  const specs: string[] = [];
  if (vehicle.specs?.potenza) specs.push(`${vehicle.specs.potenza} CV`);
  if (vehicle.specs?.cilindrata) specs.push(`${vehicle.specs.cilindrata} cc`);
  if (vehicle.specs?.cambio) specs.push(t(`gear_${vehicle.specs.cambio}`));
  if (vehicle.specs?.alimentazione) specs.push(t(`fuel_${vehicle.specs.alimentazione}`));

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Foto utente con <img>: il progetto non configura `remotePatterns`
          (stessa scelta di Avatar.tsx). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={vehicle.image_url} alt="" className="h-48 w-full object-cover" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display font-black italic uppercase tracking-tighter text-white">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="font-mono text-[11px] text-white/40">{vehicle.year}</p>
          </div>
          {vehicle.category && <Badge tone="accent">{t(`cat_${vehicle.category}`)}</Badge>}
        </div>

        {specs.length > 0 && (
          <p className="font-mono text-[11px] text-white/60">{specs.join(" · ")}</p>
        )}

        {vehicle.description && (
          <p className="line-clamp-3 text-sm text-white/70">{vehicle.description}</p>
        )}

        {owner && (
          <div className="mt-auto flex items-center gap-3 pt-2">
            <Link
              href={`/garage/${vehicle.id}/modifica`}
              className="font-mono text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:text-white"
            >
              {t("edit")}
            </Link>
            <DeleteVehicleButton id={vehicle.id} />
          </div>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Passo 3: creare `src/app/[locale]/(auth)/garage/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import VehicleCard from "@/components/features/garage/VehicleCard";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types/database";

export default async function GaragePage() {
  const t = await getTranslations("garage");
  const user = await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Un guasto non deve travestirsi da garage vuoto (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) console.error("Garage: lettura dei veicoli non riuscita", error);
  const vehicles = (data ?? []) as Vehicle[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <SectionHeading>{t("title")}</SectionHeading>
        <Link href="/garage/nuova">
          <Button className="flex items-center gap-2">
            <Plus size={14} />
            {t("add")}
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="font-mono text-xs text-accent-red">{t("genericError")}</p>
      ) : vehicles.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} owner />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Passo 4: eliminare il vecchio segnaposto pubblico**

```bash
rm -rf "src/app/[locale]/(public)/garage"
```
La voce "Garage" nell'header punta a `/garage`, che ora è servita dal gruppo `(auth)`: da sloggato la guardia rimanda al login, com'è giusto (D-146: il garage è riservato ai membri).

- [ ] **Passo 5: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add -A src/components/features/garage "src/app/[locale]/(auth)/garage" "src/app/[locale]/(public)"
git commit -m "feat(garage): il mio garage sotto (auth), schede auto e cancellazione"
```

**⏸ Fermarsi e chiedere prima del Task 7.**

---

## Task 7 — Pagina di modifica `/garage/[id]/modifica`

**File:**
- Crea: `src/app/[locale]/(auth)/garage/[id]/modifica/page.tsx`

**Interfacce:** consuma `aggiornaVeicolo` (Task 4, da legare con `.bind(null, id)`), `VehicleForm` (Task 5), `Vehicle` (Task 1).

- [ ] **Passo 1: creare la pagina**

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import VehicleForm from "@/components/features/garage/VehicleForm";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types/database";
import { aggiornaVeicolo } from "../../actions";

export default async function ModificaAutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("garage");
  const { id } = await params;
  const user = await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // Un guasto NON è un 404 (lezione della micro-fase sugli errori silenziati):
  // `notFound()` resta solo per "query riuscita, nessuna riga".
  if (error) {
    console.error("Modifica auto: lettura non riuscita", error);
    return <p className="font-mono text-xs text-accent-red">{t("genericError")}</p>;
  }
  if (!data) notFound();

  const vehicle = data as Vehicle;
  // L'auto altrui non si modifica: 404, non un form che poi fallirebbe sulla RLS.
  if (vehicle.owner_id !== user.id) notFound();

  // `id` legato alla action: `useActionState` chiama (state, formData).
  const azione = aggiornaVeicolo.bind(null, vehicle.id);

  return (
    <div className="space-y-8">
      <SectionHeading>{t("editTitle")}</SectionHeading>
      <Card className="p-6">
        <VehicleForm action={azione} userId={user.id} vehicle={vehicle} />
      </Card>
    </div>
  );
}
```

- [ ] **Passo 2: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add "src/app/[locale]/(auth)/garage/[id]"
git commit -m "feat(garage): pagina di modifica dell'auto (404 se non e' tua)"
```

**⏸ Fermarsi e chiedere prima del Task 8.**

---

## Task 8 — Il garage nel profilo del membro (`/membri/[tag]`)

**File:**
- Modifica: `src/app/[locale]/(auth)/membri/[tag]/page.tsx` (blocco del segnaposto "Garage", oggi in fondo al file)

**Interfacce:** consuma `VehicleCard` (Task 6) con `owner={false}` (sola lettura: niente Modifica/Elimina).

- [ ] **Passo 1: aggiungere la lettura dei veicoli del membro**

Nel file, **dopo** `const member = data as Profile;`, aggiungere:

```tsx
  // Le auto del membro: la RLS `vehicles_select_authenticated` consente la lettura
  // a qualunque loggato, e la scheda in sola lettura non espone comandi.
  const { data: vehiclesData, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", member.id)
    .order("created_at", { ascending: false });
  if (vehiclesError) {
    console.error("Membro: lettura del garage non riuscita", vehiclesError);
  }
  const vehicles = (vehiclesData ?? []) as Vehicle[];
```

- [ ] **Passo 2: sostituire il segnaposto con la griglia**

Sostituire questo blocco:

```tsx
      {/* Segnaposto: la Fase 1B-2 sostituirà questa sezione col garage del membro. */}
      <div className="space-y-4">
        <SectionHeading>{t("garageTitle")}</SectionHeading>
        <p className="font-mono text-xs text-white/40">{tp("comingSoon")}</p>
      </div>
```

con:

```tsx
      <div className="space-y-4">
        <SectionHeading>{t("garageTitle")}</SectionHeading>
        {vehiclesError ? (
          <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
        ) : vehicles.length === 0 ? (
          <p className="font-mono text-xs text-white/40">{tg("emptyOther")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
```

- [ ] **Passo 3: sistemare import e traduzioni nello stesso file**

Aggiungere gli import:

```tsx
import VehicleCard from "@/components/features/garage/VehicleCard";
import type { Profile, Vehicle } from "@/types/database";
```
(la riga `import type { Profile } from "@/types/database";` esistente va sostituita da quella qui sopra)

e, accanto a `const t = await getTranslations("members");`, aggiungere:

```tsx
  const tg = await getTranslations("garage");
```

**`tp` (`placeholder`) non serve più in questo file:** se resta inutilizzato ESLint dà errore. Rimuovere la riga `const tp = await getTranslations("placeholder");` **e** l'import se non usato altrove.

- [ ] **Passo 4: tipi, lint e commit**

```bash
npx tsc --noEmit && npm run lint
git add "src/app/[locale]/(auth)/membri/[tag]/page.tsx"
git commit -m "feat(membri): il garage del membro al posto del segnaposto"
```

**⏸ Fermarsi e chiedere prima del Task 9.**

---

## Task 9 — Collaudo dal vivo e chiusura

Nessuna modifica attesa (se emergono bug: commit dedicati, come in 1B-1).

**Ambiente:** Docker Desktop → `npx supabase start` → `npm run dev` → http://localhost:3000/it (usare `localhost`, mai `127.0.0.1`).
⚠️ Il Task 1 ha fatto `db reset`: **le utenze di test vanno ricreate** (registrarsi, confermare da Mailpit su http://127.0.0.1:54324). Per l'admin, rieseguire la `update` di `supabase/seed.sql`. **Servono DUE account** (uno è l'admin, l'altro un membro qualsiasi) per collaudare la sola lettura.

- [ ] **Passo 1: creazione**

Da `/it/garage` → "Aggiungi auto" → compilare e salvare con una foto.
Atteso: si torna a `/garage` e l'auto compare nella griglia.
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select make, model, year, category, specs, image_path from public.vehicles;"
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select name, metadata->>'size' as byte, metadata->>'mimetype' as mime from storage.objects where bucket_id='vehicles';"
```
Atteso: la riga ha `image_path` valorizzato; nel bucket c'è **un** file dentro `{uid}/`.

- [ ] **Passo 2: compressione (la prova che conta)**

Aggiungere un'auto con una foto **grande** (≥ 3 MB, es. uno scatto da telefono).
Atteso, dalla query sullo storage qui sopra: il file salvato è **`image/webp`** e pesa **meno di 500 KB** (tipicamente < 300 KB), contro i ≥ 3 MB dell'originale. Se il MIME non è webp, la compressione non è entrata in funzione.

- [ ] **Passo 3: sostituzione della foto (prova che la policy della 0007 funziona)**

Modificare un'auto caricando una **nuova** foto.
```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres -c "select name from storage.objects where bucket_id='vehicles';"
```
Atteso: il numero di file **non cresce** — il vecchio è stato cancellato. Se ne restano due, la `remove()` sta fallendo in silenzio: è esattamente il bug della policy SELECT mancante (0006/0007).

- [ ] **Passo 4: eliminazione**

Su una scheda: "Elimina" → compare la conferma → **Annulla** non deve cancellare nulla → poi "Elimina" → **Conferma**.
Atteso: l'auto sparisce dalla griglia; la riga **e** il suo file spariscono (rieseguire le due query del Passo 1).

- [ ] **Passo 5: sola lettura e guardie**

Con il **secondo account**:
1. `/it/membri/<tag-del-primo>` → si vedono le sue auto, **senza** i comandi "Modifica"/"Elimina".
2. `/it/garage/<id-di-un'auto-altrui>/modifica` → **404**.
3. `/it/garage` → mostra **solo** le proprie auto (all'inizio: l'invito "Non hai ancora aggiunto nessuna auto").
4. Da **sloggato**, `/it/garage` → rimanda al login (la rotta ora sta sotto `(auth)`).

- [ ] **Passo 6: RLS dal vivo (non fidarsi solo della UI)**

Con la sessione del secondo utente (token da `localStorage`/cookie, oppure via `supabase` client anonimo autenticato), tentare un `update` e un `delete` su un veicolo **non proprio** via PostgREST: devono fallire (0 righe toccate / errore di policy). È la stessa verifica fatta in 1B-1 per `profiles`.

- [ ] **Passo 7: storage negativo**

Tentare l'upload nel bucket `vehicles` (via client Supabase, aggirando la UI) di:
1. un file **> 2 MB** → respinto (HTTP 400);
2. un file con **MIME non ammesso** (es. `application/pdf`) → respinto;
3. un file nella **cartella di un altro utente** (`{altro-uid}/x.webp`) → respinto.

- [ ] **Passo 8: regressione avatar**

Da `/it/profilo`, caricare una nuova foto profilo (grande).
Atteso: funziona come prima **e** il file nel bucket `avatars` è ora un **WebP compresso** (< 500 KB).

- [ ] **Passo 9: build**

⚠️ Prima killare `next dev`, poi:
```bash
rm -rf .next && npm run build
```
Atteso: build verde.

- [ ] **Passo 10: aggiornare `docs/STATO-LAVORI.md`**

1. "Dove siamo": **Fase 1B-2 completata** → con essa si chiude l'intera **Fase 1B**.
2. Esito della fase (rotte aggiunte, migrazione `0007`, compressione immagini) + esito del collaudo.
3. **Nuovo debito noto:** un **admin** può cancellare l'auto altrui (`vehicles_delete_owner_or_admin`) ma **non il file** nello storage (le policy limitano ciascuno alla propria cartella `{uid}/`) → resta un file orfano. Fix: policy admin sullo storage o funzione `SECURITY DEFINER`.
4. **Prossimo:** **Fase 1C — Eventi + RSVP + media**.

- [ ] **Passo 11: commit, merge, push**

```bash
git add docs/STATO-LAVORI.md
git commit -m "docs: esito della Fase 1B-2 (Garage)"
git checkout main
git merge --no-ff feat/fase1b2-garage -m "Merge Fase 1B-2 (Garage)"
git push
```

**⏸ Chiedere conferma prima del merge e del push.**
