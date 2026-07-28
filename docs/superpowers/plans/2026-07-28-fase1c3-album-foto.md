# Fase 1C-3 — Album foto (media evento) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dare a ogni evento un album media (foto WebP nel nostro storage + video YouTube incorporati + link Drive opzionale), caricato **solo dall'Admin**, **a raduno concluso**, e **pubblico**.

**Architecture:** L'infrastruttura media è già quasi tutta pronta (tabella `event_media`, enum `media_type`, RLS SELECT-pubblica/write-admin su tabella e bucket, limiti 2 MB/MIME, grant). Questa fase aggiunge due colonne (migrazione `0010`), un parser YouTube puro, quattro server action admin, un pannello admin client (upload batch orchestrato client-side, come `VehicleForm`) e una gallery pubblica con lightbox. Chiude la Fase 1C.

**Tech Stack:** Next.js **16** (App Router, server actions, `revalidatePath` con firma `"/[locale]/…", "page"`), Supabase (Postgres + RLS + Storage), `@supabase/ssr`, next-intl (IT), vitest (solo logica pura), Tailwind con token di tema.

## Global Constraints

- **Next.js 16** (non 15): prima di toccare API Next consultare `node_modules/next/dist/docs/`. Convenzione `proxy.ts` (non `middleware.ts`).
- **`revalidatePath`**: sempre con la struttura dei file di route e il `type`, es. `revalidatePath("/[locale]/eventi/[slug]", "page")` (come già in `actions.ts`). *(Il debito `revalidatePath` è una micro-fase separata: qui si copia la forma già usata, non si "corregge".)*
- **Solo token di tema** per i colori; **nessuna stringa UI hardcoded** → tutte via next-intl, namespace `gallery` in `src/messages/it.json`.
- **Email:** MAI usare l'email dell'account. Admin di seed = `mcdevelop03@gmail.com`. Chiedere conferma prima di usare qualsiasi email.
- **Difesa vera = RLS + bucket**, non il gate UI: ogni server action richiama `requireAdmin()` **e** ricontrolla `eConcluso` lato server.
- **Errori Supabase**: sempre `console.error`, mai confusi col vuoto (convenzione del progetto).
- **Un commit per task** (dopo la review). **Fermarsi e chiedere conferma dopo ogni task.**
- **Branch:** `feat/fase1c3-album` (parte da `main`, commit `2873a96`).
- ⚠️ **Non lanciare `npm run build` mentre gira `next dev`** (corrompe `.next`).
- Compressione foto: **solo** `comprimiImmagine` di `src/lib/images/compress.ts` (già esistente, riusata as-is).
- **Spec di riferimento:** `docs/superpowers/specs/2026-07-28-fase1c3-album-foto-design.md`.

---

## File Structure

**Nuovi:**
- `supabase/migrations/0010_event_media.sql` — colonne `event_media.storage_path`, `events.drive_url`.
- `src/lib/media/youtube.ts` — `estraiIdYouTube(url)` (logica pura).
- `src/lib/media/youtube.test.ts` — test vitest.
- `src/components/features/events/AdminMedia.tsx` — pannello admin (client): upload batch, video, Drive, elimina.
- `src/components/features/events/GalleryEvento.tsx` — gallery pubblica (griglia + video embed + bottone Drive), include il lightbox.

**Modificati:**
- `src/types/database.ts` — tipo `EventMedia` + `MediaType`; `Event.drive_url`.
- `src/app/[locale]/(public)/eventi/[slug]/actions.ts` — `aggiungiFoto`, `aggiungiVideo`, `impostaDriveUrl`, `rimuoviMedia` + helper gate.
- `src/app/[locale]/(public)/eventi/[slug]/page.tsx` — lettura media + `drive_url`; montaggio `GalleryEvento` e `AdminMedia`.
- `src/messages/it.json` — namespace `gallery`.

---

## Task 0: Setup branch

- [ ] **Step 1: Creare il branch di fase**

Run:
```bash
git checkout main
git checkout -b feat/fase1c3-album
git log --oneline -1   # atteso: 2873a96 (merge 1C-2) o discendente
```

Nessun commit in questo task.

---

## Task 1: Migrazione `0010` + tipi

**Files:**
- Create: `supabase/migrations/0010_event_media.sql`
- Modify: `src/types/database.ts`

**Interfaces:**
- Consumes: nulla.
- Produces: colonna `event_media.storage_path text` (NULL per i video), colonna `events.drive_url text`; tipi `MediaType`, `EventMedia`, campo `Event.drive_url`.

- [ ] **Step 1: Scrivere la migrazione**

Create `supabase/migrations/0010_event_media.sql`:
```sql
-- Fase 1C-3 (Album foto). L'infrastruttura media è già quasi tutta pronta dalle
-- migrazioni 0001-0004/0008: tabella event_media, enum media_type, RLS (SELECT
-- pubblica / write admin) su tabella E bucket, limiti 2 MB/MIME sul bucket, grant.
-- Qui mancano solo due colonne.

-- Path del file nel bucket, per cancellarlo con certezza quando si elimina la foto.
-- Stessa lezione di events.cover_path (0008) e vehicles.image_path (0007): mai
-- ricavare il path spezzando l'URL pubblico. NULL per le righe video (un link
-- YouTube non ha un file nel nostro storage).
alter table public.event_media add column if not exists storage_path text;

-- Link Drive opzionale per-evento (D-171c): bottone per scaricare gli originali in
-- alta risoluzione. È fuori dal nostro perimetro (caveat GDPR D-172, da dichiarare
-- nella privacy policy).
alter table public.events add column if not exists drive_url text;
```

- [ ] **Step 2: Applicare la migrazione**

Run (ambiente Supabase acceso — vedi STATO-LAVORI §"Come rimettere in moto l'ambiente"):
```bash
npx supabase migration up
```
Expected: applica `0010` senza errori. *(Se l'ambiente non è acceso, applicare al momento del collaudo — Task 7 — ma segnarlo.)*

- [ ] **Step 3: Verificare le colonne nel DB**

Run:
```bash
npx supabase db reset >/dev/null 2>&1 || true   # opzionale, per un check pulito
psql "$DATABASE_URL" -c "\d public.event_media" -c "\d public.events" | grep -E "storage_path|drive_url"
```
Expected: compaiono `storage_path | text` e `drive_url | text`. *(In alternativa via Studio su http://127.0.0.1:54323.)*

- [ ] **Step 4: Aggiornare i tipi**

Modify `src/types/database.ts` — aggiungere dopo il blocco `RsvpEsito` (fine file):
```ts
export type MediaType = "image" | "video";

export type EventMedia = {
  id: string;
  event_id: string;
  uploader_id: string | null;
  type: MediaType;
  url: string; // foto: URL pubblico del bucket. video: link YouTube.
  storage_path: string | null; // colonna 0010; il path nel bucket per le foto, NULL per i video
  caption: string | null;
  created_at: string;
};
```

E aggiungere a `type Event` (dopo `cover_path`):
```ts
  drive_url: string | null; // colonna aggiunta dalla migrazione 0010 (link Drive opzionale)
```

- [ ] **Step 5: Verificare la compilazione**

Run:
```bash
npx tsc --noEmit
```
Expected: nessun errore.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0010_event_media.sql src/types/database.ts
git commit -m "feat(1c3): migrazione 0010 (event_media.storage_path + events.drive_url) + tipi"
```

---

## Task 2: Parser YouTube (logica pura + vitest)

**Files:**
- Create: `src/lib/media/youtube.ts`
- Test: `src/lib/media/youtube.test.ts`

**Interfaces:**
- Consumes: nulla.
- Produces: `estraiIdYouTube(url: string): string | null` — id a 11 caratteri o `null`.

- [ ] **Step 1: Scrivere i test (falliscono)**

Create `src/lib/media/youtube.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { estraiIdYouTube } from "./youtube";

describe("estraiIdYouTube", () => {
  it("watch?v=ID", () => {
    expect(estraiIdYouTube("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("youtu.be/ID", () => {
    expect(estraiIdYouTube("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("watch con parametri extra (&t=, &list=)", () => {
    expect(estraiIdYouTube("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLxyz")).toBe(
      "dQw4w9WgXcQ",
    );
  });
  it("youtu.be con parametro ?t=", () => {
    expect(estraiIdYouTube("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe("dQw4w9WgXcQ");
  });
  it("embed/ID", () => {
    expect(estraiIdYouTube("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("shorts/ID", () => {
    expect(estraiIdYouTube("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("senza protocollo (youtu.be/ID)", () => {
    expect(estraiIdYouTube("youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("con spazi ai bordi", () => {
    expect(estraiIdYouTube("  https://youtu.be/dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });
  it("URL non-YouTube → null", () => {
    expect(estraiIdYouTube("https://vimeo.com/12345678")).toBeNull();
  });
  it("stringa vuota / solo spazi → null", () => {
    expect(estraiIdYouTube("")).toBeNull();
    expect(estraiIdYouTube("   ")).toBeNull();
  });
  it("id di lunghezza errata → null", () => {
    expect(estraiIdYouTube("https://youtu.be/short")).toBeNull();
  });
  it("testo qualsiasi non-URL → null", () => {
    expect(estraiIdYouTube("pippo")).toBeNull();
  });
});
```

- [ ] **Step 2: Eseguire i test (devono fallire)**

Run:
```bash
npm test -- youtube
```
Expected: FAIL ("estraiIdYouTube is not a function" / modulo non trovato).

- [ ] **Step 3: Implementare il parser**

Create `src/lib/media/youtube.ts`:
```ts
// Estrae l'id a 11 caratteri di un video YouTube da un URL, o null se non è un link
// YouTube valido. Logica pura (nessun I/O): è l'unico pezzo con logica non banale
// della fase 1C-3, quindi è coperto da test (vitest).
//
// Accetta le forme comuni (protocollo e "www." facoltativi):
//   youtube.com/watch?v=ID  (con parametri extra: &t=, &list=)
//   youtu.be/ID
//   youtube.com/embed/ID
//   youtube.com/shorts/ID

const ID_VALIDO = /^[A-Za-z0-9_-]{11}$/;

function analizzaUrl(s: string): URL | null {
  // Un link YouTube condiviso ha sempre lo schema; ma se l'admin incolla "youtu.be/ID"
  // senza "https://", riproviamo aggiungendolo invece di rifiutarlo.
  try {
    return new URL(s);
  } catch {
    /* riprova sotto */
  }
  try {
    return new URL("https://" + s);
  } catch {
    return null;
  }
}

export function estraiIdYouTube(url: string): string | null {
  const grezzo = url.trim();
  if (!grezzo) return null;

  const u = analizzaUrl(grezzo);
  if (!u) return null;

  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  let id: string | null = null;
  if (host === "youtu.be") {
    id = u.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      id = u.searchParams.get("v");
    } else {
      const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/);
      if (m) id = m[1];
    }
  }

  return id && ID_VALIDO.test(id) ? id : null;
}
```

- [ ] **Step 4: Eseguire i test (devono passare)**

Run:
```bash
npm test -- youtube
```
Expected: PASS (tutti i casi).

- [ ] **Step 5: Verifiche + commit**

Run:
```bash
npx tsc --noEmit && npm run lint
git add src/lib/media/youtube.ts src/lib/media/youtube.test.ts
git commit -m "feat(1c3): parser estraiIdYouTube + test (logica pura)"
```

---

## Task 3: Server action media + i18n

**Files:**
- Modify: `src/app/[locale]/(public)/eventi/[slug]/actions.ts`
- Modify: `src/messages/it.json`

**Interfaces:**
- Consumes: `estraiIdYouTube` (Task 2); `requireAdmin` (`Promise<Profile>`), `eConcluso`, `createClient` (server).
- Produces:
  - `type MediaState = { error?: string; ok?: boolean }`
  - `aggiungiFoto(eventId: string, storagePath: string, url: string): Promise<MediaState>`
  - `aggiungiVideo(eventId: string, url: string, caption: string): Promise<MediaState>`
  - `impostaDriveUrl(eventId: string, url: string): Promise<MediaState>`
  - `rimuoviMedia(mediaId: string): Promise<MediaState>`

- [ ] **Step 1: Aggiungere il namespace i18n**

Modify `src/messages/it.json` — aggiungere, dopo il blocco `"rsvp": { … }` (inserire una virgola dopo la sua graffa di chiusura):
```json
  "gallery": {
    "title": "Album",
    "photos": "Foto",
    "videos": "Video",
    "adminTitle": "Album (admin)",
    "notConcludedHint": "L'album si carica a raduno concluso.",
    "uploadPhotos": "Carica foto",
    "uploading": "Caricamento {done}/{total}…",
    "someFailed": "{count} foto non caricate. Riprova con quelle.",
    "photoType": "Formato non ammesso: usa JPG, PNG o WebP.",
    "photoRules": "JPG, PNG o WebP · più foto insieme · compresse automaticamente",
    "addVideo": "Aggiungi video YouTube",
    "videoUrl": "Link YouTube",
    "videoCaption": "Titolo del video (facoltativo)",
    "invalidYoutube": "Inserisci un link YouTube valido.",
    "driveTitle": "Link Drive (originali in alta risoluzione)",
    "driveUrl": "Link Drive (facoltativo)",
    "driveSave": "Salva link",
    "driveOpen": "Scarica le foto originali",
    "driveNote": "Il download apre un archivio Drive esterno al sito.",
    "delete": "Elimina",
    "confirmDelete": "Eliminare questo contenuto dall'album?",
    "confirm": "Conferma",
    "cancel": "Annulla",
    "notConcluded": "L'album si può caricare solo a raduno concluso.",
    "genericError": "Qualcosa è andato storto. Riprova.",
    "add": "Aggiungi",
    "empty": "Nessuna foto o video ancora.",
    "close": "Chiudi",
    "prev": "Precedente",
    "next": "Successiva"
  }
```

- [ ] **Step 2: Aggiungere le action** (in fondo a `actions.ts`)

Modify `src/app/[locale]/(public)/eventi/[slug]/actions.ts`. In testa il file ha già `import { eConcluso } from "@/lib/events/stato"`, `requireAdmin`, `createClient`, `z`, `getTranslations`, `revalidatePath`, `uuid`. Aggiungere l'import del parser:
```ts
import { estraiIdYouTube } from "@/lib/media/youtube";
```
Poi in fondo:
```ts
export type MediaState = { error?: string; ok?: boolean };

const BUCKET_MEDIA = "event-media";

/**
 * Carica l'evento e verifica che sia concluso. Le action media servono a caricare
 * l'album DOPO il raduno (RF-28): il gate "concluso" è in TS (il fuso vive solo in
 * src/lib/events/stato.ts), non nelle RLS. La difesa vera resta RLS+bucket admin-only.
 */
async function gateEventoConcluso(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
): Promise<MediaState | null> {
  const t = await getTranslations("gallery");
  const { data: evento, error } = await supabase
    .from("events")
    .select("starts_at, ends_at, status")
    .eq("id", eventId)
    .maybeSingle();
  if (error) {
    console.error("media: lettura evento non riuscita", error);
    return { error: t("genericError") };
  }
  if (!evento) return { error: t("genericError") };
  if (!eConcluso(evento)) return { error: t("notConcluded") };
  return null; // ok
}

/** Admin: registra una foto già caricata nel bucket dal client. */
export async function aggiungiFoto(
  eventId: string,
  storagePath: string,
  url: string,
): Promise<MediaState> {
  const t = await getTranslations("gallery");
  const admin = await requireAdmin();

  const parsed = z
    .object({ eventId: uuid, storagePath: z.string().min(1).max(300), url: z.string().url() })
    .safeParse({ eventId, storagePath, url });
  if (!parsed.success) return { error: t("genericError") };

  // Difesa in profondità: `storagePath` arriva dal client. Le policy dello storage
  // consentono la scrittura solo all'admin, ma vincoliamo comunque il path all'evento.
  if (!parsed.data.storagePath.startsWith(`${parsed.data.eventId}/`)) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const gate = await gateEventoConcluso(supabase, parsed.data.eventId);
  if (gate) return gate;

  const { error } = await supabase.from("event_media").insert({
    event_id: parsed.data.eventId,
    uploader_id: admin.id,
    type: "image",
    url: parsed.data.url,
    storage_path: parsed.data.storagePath,
  });
  if (error) {
    console.error("aggiungiFoto: insert non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: aggiunge un video come link YouTube (nessun upload di file). */
export async function aggiungiVideo(
  eventId: string,
  url: string,
  caption: string,
): Promise<MediaState> {
  const t = await getTranslations("gallery");
  const admin = await requireAdmin();

  const parsed = z
    .object({ eventId: uuid, url: z.string().min(1).max(500), caption: z.string().max(200) })
    .safeParse({ eventId, url, caption });
  if (!parsed.success) return { error: t("genericError") };

  const id = estraiIdYouTube(parsed.data.url);
  if (!id) return { error: t("invalidYoutube") };
  const urlCanonico = `https://www.youtube.com/watch?v=${id}`;
  const captionPulita = parsed.data.caption.trim();

  const supabase = await createClient();
  const gate = await gateEventoConcluso(supabase, parsed.data.eventId);
  if (gate) return gate;

  const { error } = await supabase.from("event_media").insert({
    event_id: parsed.data.eventId,
    uploader_id: admin.id,
    type: "video",
    url: urlCanonico,
    storage_path: null,
    caption: captionPulita || null,
  });
  if (error) {
    console.error("aggiungiVideo: insert non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: imposta o azzera il link Drive dell'evento (originali in alta risoluzione). */
export async function impostaDriveUrl(eventId: string, url: string): Promise<MediaState> {
  const t = await getTranslations("gallery");
  await requireAdmin();

  const parsed = z.object({ eventId: uuid, url: z.string().max(500) }).safeParse({ eventId, url });
  if (!parsed.success) return { error: t("genericError") };

  const pulito = parsed.data.url.trim();
  // Vuoto = rimuovi il link. Se valorizzato, dev'essere un URL valido.
  if (pulito && !z.string().url().safeParse(pulito).success) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const gate = await gateEventoConcluso(supabase, parsed.data.eventId);
  if (gate) return gate;

  const { error } = await supabase
    .from("events")
    .update({ drive_url: pulito || null })
    .eq("id", parsed.data.eventId);
  if (error) {
    console.error("impostaDriveUrl: update non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: elimina un media dall'album; per le foto cancella anche il file dal bucket. */
export async function rimuoviMedia(mediaId: string): Promise<MediaState> {
  const t = await getTranslations("gallery");
  await requireAdmin();

  const parsed = uuid.safeParse(mediaId);
  if (!parsed.success) return { error: t("genericError") };

  const supabase = await createClient();

  // Legge il path prima di cancellare la riga (serve per rimuovere il file).
  const { data: media, error: letturaError } = await supabase
    .from("event_media")
    .select("id, type, storage_path")
    .eq("id", parsed.data)
    .maybeSingle();
  if (letturaError) {
    console.error("rimuoviMedia: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!media) return { error: t("genericError") };

  // Prima la riga, poi il file: se cancellassimo il file per primo e la delete
  // fallisse, resterebbe una foto con URL rotto. Un file orfano è brutto ma innocuo,
  // e viene loggato. (Stesso ordine di eliminaVeicolo.)
  const { error } = await supabase.from("event_media").delete().eq("id", parsed.data);
  if (error) {
    console.error("rimuoviMedia: delete non riuscita", error);
    return { error: t("genericError") };
  }

  if (media.type === "image" && media.storage_path) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET_MEDIA)
      .remove([media.storage_path]);
    if (removeError) console.error("rimuoviMedia: file non rimosso", removeError);
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}
```

- [ ] **Step 3: Verifica compilazione e lint**

Run:
```bash
npx tsc --noEmit && npm run lint && npm test
```
Expected: tutto verde (i test esistenti + youtube restano verdi; nessun test nuovo qui — le action si collaudano dal vivo, come tutte le action del progetto).

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(public)/eventi/[slug]/actions.ts" src/messages/it.json
git commit -m "feat(1c3): server action media (foto/video/drive/rimuovi) + i18n gallery"
```

---

## Task 4: Pannello admin `AdminMedia` + montaggio

**Files:**
- Create: `src/components/features/events/AdminMedia.tsx`
- Modify: `src/app/[locale]/(public)/eventi/[slug]/page.tsx`

**Interfaces:**
- Consumes: `aggiungiFoto`, `aggiungiVideo`, `impostaDriveUrl`, `rimuoviMedia`, `type MediaState` (Task 3); `comprimiImmagine`; `createClient` (browser); `eConcluso`, `statoEvento`, `getProfile`/`getUser` (page).
- Produces: componente `AdminMedia` con props `{ eventId: string; media: MediaAdminItem[]; driveUrl: string | null }`, dove `type MediaAdminItem = { id: string; type: "image" | "video"; url: string; caption: string | null }`.

- [ ] **Step 1: Scrivere il componente**

Create `src/components/features/events/AdminMedia.tsx`:
```tsx
"use client";
import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useRouter } from "@/i18n/navigation";
import { comprimiImmagine } from "@/lib/images/compress";
import { createClient } from "@/lib/supabase/client";
import {
  aggiungiFoto,
  aggiungiVideo,
  impostaDriveUrl,
  rimuoviMedia,
} from "@/app/[locale]/(public)/eventi/[slug]/actions";

const MIME_AMMESSI = ["image/jpeg", "image/png", "image/webp"];
const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/60";

export type MediaAdminItem = {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string | null;
};

export default function AdminMedia({
  eventId,
  media,
  driveUrl,
}: {
  eventId: string;
  media: MediaAdminItem[];
  driveUrl: string | null;
}) {
  const t = useTranslations("gallery");
  const router = useRouter();
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState<{ done: number; total: number } | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [drive, setDrive] = useState(driveUrl ?? "");
  const [daEliminare, setDaEliminare] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Upload batch: comprime e carica ogni file, poi registra la riga. Un file che
  // fallisce non blocca gli altri; a fine si segnala quanti non sono passati.
  async function onFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // permette di riselezionare gli stessi file
    if (files.length === 0) return;
    setErrore(null);

    const supabase = createClient();
    let falliti = 0;
    setCaricamento({ done: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!MIME_AMMESSI.includes(file.type)) {
        falliti++;
        setCaricamento({ done: i + 1, total: files.length });
        continue;
      }
      try {
        const daCaricare = await comprimiImmagine(file);
        const estensione = ESTENSIONI[daCaricare.type] ?? "webp";
        const path = `${eventId}/${crypto.randomUUID()}.${estensione}`;
        const { error: upErr } = await supabase.storage
          .from("event-media")
          .upload(path, daCaricare, { contentType: daCaricare.type });
        if (upErr) {
          falliti++;
        } else {
          const { data: urlData } = supabase.storage.from("event-media").getPublicUrl(path);
          const r = await aggiungiFoto(eventId, path, urlData.publicUrl);
          if (r.error) {
            falliti++;
            // Anti-orfano sul caso comune: se la riga non entra, togli il file appena caricato.
            await supabase.storage.from("event-media").remove([path]);
          }
        }
      } catch {
        falliti++;
      }
      setCaricamento({ done: i + 1, total: files.length });
    }

    setCaricamento(null);
    if (falliti > 0) setErrore(t("someFailed", { count: falliti }));
    router.refresh();
  }

  function aggiungiVideoClick() {
    setErrore(null);
    startTransition(async () => {
      const r = await aggiungiVideo(eventId, videoUrl, videoCaption);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      setVideoUrl("");
      setVideoCaption("");
      router.refresh();
    });
  }

  function salvaDrive() {
    setErrore(null);
    startTransition(async () => {
      const r = await impostaDriveUrl(eventId, drive);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  function eseguiEliminazione(id: string) {
    setErrore(null);
    startTransition(async () => {
      const r = await rimuoviMedia(id);
      setDaEliminare(null);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  const busy = pending || caricamento !== null;

  return (
    <section className="space-y-4 border-t border-white/10 pt-6">
      <h2 className="font-display text-lg font-black italic uppercase tracking-tighter text-white">
        {t("adminTitle")}
      </h2>
      {errore && (
        <p role="alert" className="font-mono text-[11px] text-accent-red">
          {errore}
        </p>
      )}

      {/* Upload foto batch */}
      <div className="space-y-2">
        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFilesChange}
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
          {t("uploadPhotos")}
        </Button>
        {caricamento ? (
          <span className="block font-mono text-[11px] text-white/50">
            {t("uploading", { done: caricamento.done, total: caricamento.total })}
          </span>
        ) : (
          <span className="block font-mono text-[11px] text-white/40">{t("photoRules")}</span>
        )}
      </div>

      {/* Video YouTube */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <h3 className={labelClass}>{t("addVideo")}</h3>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder={t("videoUrl")}
          maxLength={500}
        />
        <Input
          value={videoCaption}
          onChange={(e) => setVideoCaption(e.target.value)}
          placeholder={t("videoCaption")}
          maxLength={200}
        />
        <Button type="button" onClick={aggiungiVideoClick} disabled={busy || !videoUrl.trim()}>
          {t("add")}
        </Button>
      </div>

      {/* Link Drive */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <h3 className={labelClass}>{t("driveTitle")}</h3>
        <Input
          value={drive}
          onChange={(e) => setDrive(e.target.value)}
          placeholder={t("driveUrl")}
          maxLength={500}
        />
        <Button type="button" variant="outline" onClick={salvaDrive} disabled={busy}>
          {t("driveSave")}
        </Button>
      </div>

      {/* Elenco media con elimina */}
      {media.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-3">
          {media.map((m) => (
            <li key={m.id}>
              <Card className="flex flex-col gap-2 p-2">
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="h-24 w-full border border-white/10 object-cover" />
                ) : (
                  <span className="flex h-24 w-full items-center justify-center border border-white/10 bg-surface-dim font-mono text-[10px] text-white/40">
                    {t("videos")}
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setErrore(null);
                    setDaEliminare(m.id);
                  }}
                  disabled={busy}
                  className="flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  {t("delete")}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {daEliminare && (
        <Modal title={t("delete")} onClose={() => setDaEliminare(null)}>
          <p className="font-mono text-xs text-white/60">{t("confirmDelete")}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDaEliminare(null)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={() => eseguiEliminazione(daEliminare)} disabled={busy}>
              {t("confirm")}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Leggere i media e montare il pannello nella pagina**

Modify `src/app/[locale]/(public)/eventi/[slug]/page.tsx`.

(a) In testa, aggiungere gli import e `eConcluso`:
```ts
import { statoEvento, eConcluso } from "@/lib/events/stato";
import AdminMedia, { type MediaAdminItem } from "@/components/features/events/AdminMedia";
import type { EventMedia } from "@/types/database";
```
*(La riga `import { statoEvento } from "@/lib/events/stato";` esistente va sostituita da quella con anche `eConcluso`.)*

(b) Aggiungere `drive_url` alle colonne pubbliche e al tipo `EventoDettaglio`:
```ts
const COLONNE_PUBBLICHE =
  "id, title, description, location, map_url, starts_at, ends_at, capacity, status, type, cover_url, drive_url";
```
e nel `type EventoDettaglio = Pick<Event, …>` aggiungere `| "drive_url"`.

(c) Dopo il calcolo di `isAdmin` (riga ~91), leggere i media (lettura pubblica: `event_media_select_public`):
```ts
  const { data: mediaRows, error: erroreMedia } = await supabase
    .from("event_media")
    .select("id, type, url, caption, created_at")
    .eq("event_id", evento.id)
    .order("created_at", { ascending: false });
  if (erroreMedia) console.error("Evento: lettura media non riuscita", erroreMedia);
  const media = (mediaRows ?? []) as Pick<
    EventMedia,
    "id" | "type" | "url" | "caption" | "created_at"
  >[];

  const concluso = eConcluso(evento);
  const mediaAdmin: MediaAdminItem[] = media.map((m) => ({
    id: m.id,
    type: m.type,
    url: m.url,
    caption: m.caption,
  }));
```

(d) In fondo al JSX, dopo la riga di `AdminIscritti`, montare il pannello (solo admin + concluso):
```tsx
      {user && isAdmin && concluso && (
        <AdminMedia eventId={evento.id} media={mediaAdmin} driveUrl={evento.drive_url} />
      )}
```

- [ ] **Step 3: Verifica compilazione e lint**

Run:
```bash
npx tsc --noEmit && npm run lint && npm test
```
Expected: tutto verde.

- [ ] **Step 4: Commit**

```bash
git add src/components/features/events/AdminMedia.tsx "src/app/[locale]/(public)/eventi/[slug]/page.tsx"
git commit -m "feat(1c3): pannello admin AdminMedia (upload batch/video/drive/elimina) + montaggio"
```

---

## Task 5: Gallery pubblica `GalleryEvento` + lightbox + montaggio

**Files:**
- Create: `src/components/features/events/GalleryEvento.tsx`
- Modify: `src/app/[locale]/(public)/eventi/[slug]/page.tsx`

**Interfaces:**
- Consumes: `estraiIdYouTube` (Task 2); `media` + `evento.drive_url` (Task 4, già letti in page).
- Produces: componente `GalleryEvento` con props `{ media: GalleryItem[]; driveUrl: string | null }`, dove `type GalleryItem = { id: string; type: "image" | "video"; url: string; caption: string | null }`.

- [ ] **Step 1: Scrivere il componente (gallery + lightbox integrato)**

Create `src/components/features/events/GalleryEvento.tsx`:
```tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, X, ChevronLeft, ChevronRight } from "lucide-react";
import { estraiIdYouTube } from "@/lib/media/youtube";

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string | null;
};

export default function GalleryEvento({
  media,
  driveUrl,
}: {
  media: GalleryItem[];
  driveUrl: string | null;
}) {
  const t = useTranslations("gallery");
  const foto = media.filter((m) => m.type === "image");
  const video = media.filter((m) => m.type === "video");

  // Indice della foto aperta nel lightbox (null = chiuso). Naviga solo tra le foto.
  const [apertaIdx, setApertaIdx] = useState<number | null>(null);

  const chiudi = useCallback(() => setApertaIdx(null), []);
  const precedente = useCallback(
    () => setApertaIdx((i) => (i === null ? i : (i - 1 + foto.length) % foto.length)),
    [foto.length],
  );
  const successiva = useCallback(
    () => setApertaIdx((i) => (i === null ? i : (i + 1) % foto.length)),
    [foto.length],
  );

  useEffect(() => {
    if (apertaIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") chiudi();
      else if (e.key === "ArrowLeft") precedente();
      else if (e.key === "ArrowRight") successiva();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apertaIdx, chiudi, precedente, successiva]);

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-white/60">{t("title")}</h2>

      {foto.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {foto.map((m, idx) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setApertaIdx(idx)}
                className="block w-full focus:outline-none focus:ring-1 focus:ring-white/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.caption ?? ""}
                  className="aspect-square w-full border border-white/10 object-cover transition-opacity hover:opacity-80"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {video.length > 0 && (
        <div className="space-y-4">
          {video.map((m) => {
            const id = estraiIdYouTube(m.url);
            if (!id) return null;
            return (
              <div key={m.id} className="space-y-1">
                <div className="relative w-full overflow-hidden border border-white/10 pt-[56.25%]">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={m.caption ?? "video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
                {m.caption && (
                  <p className="font-mono text-[11px] text-white/50">{m.caption}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {driveUrl && (
        <div className="space-y-1">
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/10 bg-surface-dim px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/70 transition-colors hover:text-white"
          >
            <ExternalLink size={14} aria-hidden="true" />
            {t("driveOpen")}
          </a>
          <p className="font-mono text-[11px] text-white/40">{t("driveNote")}</p>
        </div>
      )}

      {apertaIdx !== null && foto[apertaIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={chiudi}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={chiudi}
            aria-label={t("close")}
            className="absolute right-4 top-4 text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>
          {foto.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  precedente();
                }}
                aria-label={t("prev")}
                className="absolute left-4 text-white/70 hover:text-white"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  successiva();
                }}
                aria-label={t("next")}
                className="absolute right-4 text-white/70 hover:text-white"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto[apertaIdx].url}
            alt={foto[apertaIdx].caption ?? ""}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Montare la gallery nella pagina**

Modify `src/app/[locale]/(public)/eventi/[slug]/page.tsx`.

(a) Import:
```ts
import GalleryEvento, { type GalleryItem } from "@/components/features/events/GalleryEvento";
```

(b) Dopo `mediaAdmin` (Task 4), costruire l'elenco per la gallery (identico contenuto, tipo pubblico):
```ts
  const mediaGallery: GalleryItem[] = media.map((m) => ({
    id: m.id,
    type: m.type,
    url: m.url,
    caption: m.caption,
  }));
  const haGallery = mediaGallery.length > 0 || Boolean(evento.drive_url);
```

(c) Nel JSX, **dopo la `<Card>` informativa** (quella con luogo/capienza/descrizione) e **prima** della `<section>` "Partecipazione", montare:
```tsx
      {haGallery && <GalleryEvento media={mediaGallery} driveUrl={evento.drive_url} />}
```

- [ ] **Step 3: Verifica compilazione, lint, build**

Run (⚠️ NON mentre gira `next dev`):
```bash
npx tsc --noEmit && npm run lint && npm test && rm -rf .next && npm run build
```
Expected: tutto verde.

- [ ] **Step 4: Commit**

```bash
git add src/components/features/events/GalleryEvento.tsx "src/app/[locale]/(public)/eventi/[slug]/page.tsx"
git commit -m "feat(1c3): gallery pubblica GalleryEvento (griglia + lightbox + video + drive) + montaggio"
```

---

## Task 6: Review finale whole-branch + wave di fix

**Files:** eventuali fix su tutti i file della fase.

- [ ] **Step 1: Review indipendente dell'intero branch**

Usare `superpowers:requesting-code-review` sul diff `main..feat/fase1c3-album` (modello capace). Ambiti da controllare in particolare:
- Il gate `eConcluso` è ricontrollato **lato server** in tutte e quattro le action (non solo nel montaggio della pagina). *(`impostaDriveUrl` incluso.)*
- L'anti-orfano del batch (`remove()` su insert fallito) e il fatto che un file storto non blocca gli altri.
- Nessuna colonna di troppo nelle select pubbliche di `page.tsx` (mai `created_by`).
- `rimuoviMedia`: ordine riga→file, video senza file, `storage_path` usato per la remove.
- `estraiIdYouTube` usato **sia** in validazione (action) **sia** in render (embed): un video salvato ha sempre id valido, ma il render è difensivo (`if (!id) return null`).
- `useEffect`/listener del lightbox rimossi correttamente; niente scroll-lock mancante se richiesto.

- [ ] **Step 2: Applicare una sola wave di fix**

Raccogliere tutti i Minor/Important in un'unica tornata di commit dedicati. Riverificare: `npx tsc --noEmit && npm run lint && npm test`.

- [ ] **Step 3: Commit finale della wave**

```bash
git add -A
git commit -m "fix(1c3): wave di fix dalla review finale whole-branch"
```

---

## Task 7: Collaudo dal vivo e chiusura fase

**Files:** eventuali fix dei bug emersi (commit dedicati).

Richiede l'ambiente acceso (Docker + `npx supabase start` + `npm run dev` su **localhost:3000** + Mailpit + psql). Se la migrazione `0010` non è stata applicata al Task 1, applicarla ora (`npx supabase migration up`). Serve un **admin** (`mcdevelop03@gmail.com`, ripromuovere con la `update` di `supabase/seed.sql`) e almeno un **evento concluso** (crearne uno con `starts_at` nel passato, o forzare la data via SQL).

- [ ] **Step 1: Percorsi funzionali (admin, evento concluso)**
  - Il pannello `AdminMedia` compare **solo** su un evento concluso e **solo** da admin. Su un evento futuro non c'è; da non-admin non c'è.
  - **Upload batch:** selezionare più foto insieme → avanzamento "k/N", compaiono nella gallery al refresh; conteggio file nel bucket `event-media/{event-id}/` = numero foto; ogni riga ha `storage_path` valorizzato e `url` pubblico che carica.
  - **Compressione:** una foto grande (>2 MB) entra come WebP piccolo (verifica il MIME salvato = `image/webp`).
  - **Video YouTube:** incollare un link `watch?v=`, uno `youtu.be/`, uno con `&t=`/`&list=` → salvati e **incorporati** (player visibile, 16:9). Un URL non-YouTube → errore `invalidYoutube`, niente riga.
  - **Link Drive:** salvare un URL → bottone "Scarica le foto originali" compare nella gallery pubblica; svuotare e salvare → il bottone sparisce.
  - **Elimina:** eliminare una foto → riga **e** file via (0 orfani nel bucket); eliminare un video → solo la riga (nessun file coinvolto). Conferma in modale; Annulla non tocca nulla.

- [ ] **Step 2: Superficie pubblica**
  - Aprire `/eventi/[slug]` **da sloggato** (finestra anonima): la **gallery si vede** (foto + video + bottone Drive). La sezione **non compare** se non c'è alcun media né Drive.
  - **Lightbox:** click su una foto → overlay a schermo intero; frecce ‹ › e tasti freccia scorrono; Esc e click fuori chiudono.
  - Embed YouTube che **carica** (nessun blocco: non c'è CSP nel progetto — confermare che nessun `frame-src` lo impedisca).

- [ ] **Step 3: Prove negative (sicurezza)**
  - POST diretto alle action da **non-admin** e da **sloggato** → respinto (redirect + `requireAdmin`).
  - **Insert diretto** in `event_media` via PostgREST con sessione non-admin → **403** (RLS `event_media_admin_write`).
  - **Upload diretto** nel bucket `event-media/` con sessione non-admin → **403** (policy storage admin).
  - Upload di file **>2 MB** / **MIME non ammesso** (es. `application/pdf`) → **413 / 415** dal bucket.
  - Forzare `aggiungiFoto`/`aggiungiVideo`/`impostaDriveUrl` su un evento **non concluso** (chiamando l'action con l'id di un evento futuro) → respinto con `notConcluded` (gate server).
  - `aggiungiVideo` con URL non-YouTube via chiamata diretta → `invalidYoutube`, niente riga.

- [ ] **Step 4: Regressione 1C-1**
  - Eliminare un evento **con media** dall'elenco admin → **rifiutato** con `notEmpty` (la regola "elimina solo se vuoto" resta valida; le FK `event_media` sono `on delete cascade`, ma l'admin non deve poter cancellare un evento con album).

- [ ] **Step 5: Verifiche standard**

Run (⚠️ NON mentre gira `next dev`):
```bash
npm test && npx tsc --noEmit && npm run lint && rm -rf .next && npm run build
```
Expected: tutto verde.

- [ ] **Step 6: Correggere i bug emersi** (commit dedicati) e **chiudere la fase**

Usare `superpowers:finishing-a-development-branch`: merge di `feat/fase1c3-album` su `main`, elimina il branch. Aggiornare `docs/STATO-LAVORI.md` (1C-3 chiusa → Fase 1C completa) e il ledger `.superpowers/sdd/progress.md`.

---

## Self-Review (fatta in fase di stesura)

**Spec coverage:**
- Foto WebP nel bucket → Task 4 (upload batch) + Task 1 (storage_path). ✅
- Video YouTube incorporati → Task 2 (parser) + Task 3 (aggiungiVideo) + Task 5 (embed). ✅
- Link Drive opzionale → Task 1 (colonna) + Task 3 (impostaDriveUrl) + Task 5 (bottone). ✅
- Gate "concluso" (server + UI) → Task 3 (`gateEventoConcluso`) + Task 4 (montaggio `concluso`). ✅
- Batch multi-file con avanzamento e fallimenti parziali → Task 4. ✅
- Anti-orfano → Task 4 (remove su insert fallito) + Task 3 (`rimuoviMedia`). ✅
- Gallery pubblica + lightbox → Task 5. ✅
- Solo admin, nessun upload membri → RLS esistenti + `requireAdmin` (Task 3). ✅
- Test logica pura → Task 2. ✅
- Prove negative + collaudo → Task 7. ✅

**Placeholder scan:** nessun TBD/TODO; ogni step di codice ha codice reale.

**Type consistency:** `MediaState`, `MediaAdminItem`, `GalleryItem` coerenti tra Task 3/4/5; `estraiIdYouTube(string): string | null` coerente tra Task 2/3/5; `aggiungiFoto(eventId, storagePath, url)` / `aggiungiVideo(eventId, url, caption)` coerenti tra Task 3 (def) e Task 4 (uso). `eConcluso(Pick<Event,"starts_at"|"ends_at">)` — la select del gate prende `starts_at, ends_at, status` (superset, ok). ✅
