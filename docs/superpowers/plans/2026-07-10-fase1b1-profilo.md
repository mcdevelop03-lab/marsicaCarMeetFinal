# Fase 1B-1 — Profilo · Piano di implementazione

> **Per chi esegue (anche agenti):** SKILL RICHIESTA — usare `superpowers:subagent-driven-development` (consigliata) o `superpowers:executing-plans` per implementare il piano task per task. Gli step usano la sintassi checkbox (`- [ ]`) per il tracciamento.

**Obiettivo:** dare a ogni membro loggato un profilo consultabile e modificabile (con foto profilo) e un modo per trovare gli altri membri.

**Architettura:** tre rotte nel gruppo `(auth)` (`/profilo`, `/membri`, `/membri/[tag]`) servite da Server Component che leggono `public.profiles` tramite il client Supabase lato server; le scritture passano da due Server Action (`updateProfile`, `setAvatar`) con validazione zod. L'avatar è caricato dal browser direttamente su Supabase Storage nella cartella `avatars/{uid}/`, poi la Server Action ne registra l'URL e ripulisce i file vecchi. La RLS e i limiti sul bucket restano l'unica vera barriera di sicurezza: il codice applicativo aggiunge solo difesa in profondità.

**Stack:** Next.js 16.2.10 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · next-intl (solo `it`) · Supabase (`@supabase/ssr`) locale via Docker · zod 4 · lucide-react.

**Spec di riferimento:** [`docs/superpowers/specs/2026-07-10-fase1b1-profilo-design.md`](../specs/2026-07-10-fase1b1-profilo-design.md)

**Branch:** `feat/fase1b1-profilo`

---

## Vincoli globali

Valgono per **ogni** task, non si ripetono nei singoli step.

- **Lingua:** italiano ovunque — commenti, messaggi di commit, documentazione, UI.
- **Next.js 16, non 15.** Prima di toccare un'API di Next, leggere la pagina corrispondente in `node_modules/next/dist/docs/`. Convenzione `proxy.ts` (non `middleware.ts`). `params` e `searchParams` sono **Promise**: vanno `await`-ati.
- **Nessun testo hardcoded nella UI.** Ogni stringa passa da `src/messages/it.json` via next-intl. Unica eccezione: i nomi propri dei social (`Instagram`, `Facebook`, `TikTok`, `YouTube`), che sono marchi.
- **Colori solo da token di tema** (`--color-accent-red`, `--color-surface-card`, …, definiti in `src/app/globals.css`). Niente esadecimali nel JSX/CSS di componente.
- **Un commit per task**, in italiano, sul branch `feat/fase1b1-profilo`.
- **Dopo ogni task: fermarsi e chiedere** all'utente se proseguire.
- **Nessun test runner nel progetto** (scelta confermata): la verifica di ogni task è `npx tsc --noEmit` + `npm run lint` + un controllo mirato dal vivo nel browser. Il collaudo end-to-end completo è il Task 8.
- **Email:** mai usare l'email dell'account (`aidev3@goproject.it`). L'admin di seed è `mcdevelop03@gmail.com`. Chiedere sempre conferma prima di usare qualsiasi email.
- **Trappola nota:** non lanciare mai `npm run build` mentre gira `next dev` — corrompe `.next` (manifest delle server action) e tutte le pagine con `<form action={serverAction}>` iniziano a dare 404/500. Rimedio: killare il dev server, `rm -rf .next`, riavviare.
- **In dev usare sempre `http://localhost:3000`**, mai `127.0.0.1:3000`.
- **Attributo `pattern` HTML:** il browser lo compila come `new RegExp("^(?:" + pattern + ")$", "v")`. Nel flag `v` il trattino è sintattico dentro una classe di caratteri e va **escapato** (`[a-z0-9._\-]+`). Se la regex non compila, la spec impone di **ignorare l'attributo in silenzio**: il campo accetta qualunque valore e nessun errore compare in console. Bug reale trovato al collaudo del Task 3.

### Icone social — nota per chi implementa

Lo spec chiede le **icone vere** dei marchi. **`lucide-react` v1 le ha rimosse** (`Instagram`, `Facebook`, `Youtube` non esistono più — verificato in `node_modules/lucide-react/dist/esm/icons/`). Invece di aggiungere una dipendenza per quattro glifi, i path SVG ufficiali sono **vendorizzati** da [Simple Icons](https://simpleicons.org) (licenza **CC0 1.0**, nessun obbligo di attribuzione) nel componente `src/components/ui/icons/SocialIcon.tsx` del Task 7. I path completi sono nel piano: vanno copiati **alla lettera**.

---

## Struttura dei file

**Creati:**

| File | Responsabilità |
|------|----------------|
| `supabase/migrations/0005_storage_avatar_limits.sql` | Limiti di peso e MIME sul bucket `avatars` |
| `supabase/migrations/0006_storage_avatars_select.sql` | Policy `SELECT` sul bucket `avatars` (Task 4): senza, `storage.list()` torna sempre vuoto |
| `src/lib/profile/socials.ts` | Chiavi social, etichette, costruzione degli URL dagli handle |
| `src/lib/profile/search.ts` | Escaping dei jolly `ilike` e quoting per il filtro `.or()` di PostgREST |
| `src/lib/validation/profile.ts` | Schema zod dei campi profilo |
| `public/default-avatar.svg` | Avatar di default |
| `src/components/ui/Avatar.tsx` | Avatar circolare riusabile (header, card, profilo) |
| `src/components/ui/Textarea.tsx` | Textarea con lo stile di `Input` |
| `src/components/ui/icons/SocialIcon.tsx` | Glifi ufficiali dei quattro marchi social (Simple Icons, CC0) |
| `src/components/features/profile/ProfileForm.tsx` | Form di modifica del proprio profilo (client) |
| `src/components/features/profile/AvatarUploader.tsx` | Upload avatar dal browser (client) |
| `src/components/features/profile/MemberCard.tsx` | Card di un membro nei risultati di ricerca |
| `src/components/features/profile/SocialLinks.tsx` | Chip dei link social (sola lettura) |
| `src/app/[locale]/(auth)/profilo/page.tsx` | Il mio profilo: avatar + form |
| `src/app/[locale]/(auth)/profilo/actions.ts` | Server action `updateProfile` e `setAvatar` |
| `src/app/[locale]/(auth)/membri/page.tsx` | Ricerca membri (`?q=`) |
| `src/app/[locale]/(auth)/membri/[tag]/page.tsx` | Profilo di un altro membro, sola lettura |

**Modificati:**

| File | Modifica |
|------|----------|
| `src/messages/it.json` | Nuove chiavi `nav.profilo`, `nav.membri`, `profile.*`, `members.*` |
| `src/types/database.ts` | Nuovo tipo `MemberSummary` |
| `src/app/[locale]/layout.tsx` | Da `getUser()` a `getProfile()`; passa `avatar` all'`Header` |
| `src/components/layout/Header.tsx` | Voci di menu `Profilo`/`Membri`; avatar accanto al menu |
| `src/components/layout/MobileMenu.tsx` | Riceve le nuove voci (nessuna modifica strutturale) |
| `docs/STATO-LAVORI.md` | Punto di ripartenza (Task 8) |

**Non toccati:** `supabase/migrations/0001–0004`, `src/lib/auth/index.ts`, la pagina placeholder `/garage` (si sposta sotto `(auth)` in **1B-2**).

---

## Task 1 — Migrazione: limiti sul bucket `avatars`

**File:**
- Crea: `supabase/migrations/0005_storage_avatar_limits.sql`

**Interfacce:**
- Consuma: il bucket `avatars` creato da `0003_storage_buckets.sql`.
- Produce: bucket `avatars` con `file_size_limit = 2097152` e `allowed_mime_types = {image/jpeg,image/png,image/webp}`. Il Task 4 vi si appoggia per rifiutare lato server i file fuori limite.

- [ ] **Step 1: Assicurarsi che l'ambiente giri**

Da `marsicaCarMeetFinal/marsicaCarMeetFinal/`, con Docker Desktop avviato:

```bash
npx supabase start
```

Atteso: l'elenco degli URL locali (API `54321`, DB `54322`, Studio `54323`, Mailpit `54324`).

- [ ] **Step 2: Verificare che il limite NON ci sia ancora**

Apri lo **SQL Editor** di Supabase Studio su `http://127.0.0.1:54323` ed esegui:

```sql
select id, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'avatars';
```

Atteso: una riga con `file_size_limit` **null** e `allowed_mime_types` **null**. È lo stato "prima": il vincolo non esiste.

- [ ] **Step 3: Scrivere la migrazione**

Crea `supabase/migrations/0005_storage_avatar_limits.sql`:

```sql
-- Vincoli lato server sul bucket degli avatar: non aggirabili dal client.
-- Il controllo nel browser (AvatarUploader) serve solo a dare feedback immediato.
update storage.buckets
set file_size_limit = 2097152, -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';
```

- [ ] **Step 4: Applicare le migrazioni da zero**

```bash
npx supabase db reset
```

Atteso: le migrazioni `0001` → `0005` vengono applicate in ordine, poi il seed. Nessun errore.

> ⚠️ `db reset` cancella gli utenti locali. Dopo il reset va rifatta la registrazione di `mcdevelop03@gmail.com` (poi ri-eseguire la `update` di `supabase/seed.sql` per promuoverlo ad admin).

- [ ] **Step 5: Verificare che il limite CI SIA**

Nello SQL Editor, di nuovo:

```sql
select id, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'avatars';
```

Atteso: `file_size_limit = 2097152`, `allowed_mime_types = {image/jpeg,image/png,image/webp}`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0005_storage_avatar_limits.sql
git commit -m "feat(db): limiti di peso e MIME sul bucket avatars"
```

---

## Task 2 — Fondamenta: validazione, social, ricerca, avatar di default

Nessuna UI nuova: questo task prepara i moduli condivisi che i task 3–7 consumano. Si verifica con `tsc` e `lint`.

**File:**
- Crea: `src/lib/profile/socials.ts`
- Crea: `src/lib/profile/search.ts`
- Crea: `src/lib/validation/profile.ts`
- Crea: `public/default-avatar.svg`
- Crea: `src/components/ui/Avatar.tsx`
- Modifica: `src/messages/it.json`

**Interfacce:**
- Consuma: `Profile` da `src/types/database.ts`; lo stile di `src/lib/validation/auth.ts`.
- Produce:
  - `SOCIAL_KEYS: readonly ["instagram","facebook","tiktok","youtube"]`, `type SocialKey`, `SOCIAL_LABELS: Record<SocialKey, string>`, `socialUrl(key: SocialKey, handle: string): string`, `socialEntries(socials: Profile["socials"]): { key: SocialKey; handle: string; url: string }[]`
  - `ilikePattern(raw: string): string`, `quoteOrValue(value: string): string`
  - `profileSchema` (zod), `type ProfileInput`
  - `<Avatar src={string | null} alt={string} size?={number} className?={string} />`
  - chiavi i18n `nav.profilo`, `nav.membri`, `profile.*`, `members.*`

- [ ] **Step 1: Social — chiavi, etichette, URL**

Crea `src/lib/profile/socials.ts`:

```ts
import type { Profile } from "@/types/database";

// L'ordine di questo array è l'ordine in cui i social compaiono nella UI.
export const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "youtube"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

// Nomi di marchio: non passano da next-intl, non si traducono.
export const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
};

// In `profiles.socials` salviamo solo l'handle (niente `@`, niente URL):
// l'indirizzo lo costruisce l'app, così un cambio di dominio non tocca i dati.
const BASE_URLS: Record<SocialKey, string> = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
};

export function socialUrl(key: SocialKey, handle: string): string {
  return BASE_URLS[key] + encodeURIComponent(handle);
}

export function socialEntries(
  socials: Profile["socials"],
): { key: SocialKey; handle: string; url: string }[] {
  return SOCIAL_KEYS.flatMap((key) => {
    const handle = socials?.[key];
    return handle ? [{ key, handle, url: socialUrl(key, handle) }] : [];
  });
}
```

- [ ] **Step 2: Ricerca — escaping dei jolly e quoting PostgREST**

Crea `src/lib/profile/search.ts`. Le due funzioni si applicano **in quest'ordine** (`quoteOrValue(ilikePattern(q))`): prima si neutralizzano i jolly per Postgres, poi si incapsula il risultato per il parser di PostgREST.

```ts
/**
 * Pattern per `ilike`. I jolly di LIKE (`%`, `_`) e il carattere di escape (`\`)
 * digitati dall'utente vengono neutralizzati, altrimenti una ricerca di `_`
 * corrisponderebbe a un carattere qualsiasi.
 */
export function ilikePattern(raw: string): string {
  const escaped = raw.replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}

/**
 * Incapsula un valore per il filtro `.or()` di PostgREST: senza virgolette una
 * virgola nella query spezzerebbe il filtro in due condizioni. Dentro le
 * virgolette doppie, `"` e `\` si escapano con `\` — anche i `\` introdotti da
 * `ilikePattern`, che PostgREST rimuove prima di passare il pattern a Postgres.
 *
 * Esempio: `a_b` → ilikePattern → `%a\_b%` → quoteOrValue → `"%a\\_b%"`
 *          PostgREST lo disfa in `%a\_b%` → Postgres cerca un `_` letterale.
 */
export function quoteOrValue(value: string): string {
  return `"${value.replace(/["\\]/g, (c) => `\\${c}`)}"`;
}
```

- [ ] **Step 3: Schema zod del profilo**

Crea `src/lib/validation/profile.ts`. I campi opzionali arrivano dal form come stringa vuota: `z.preprocess` la converte in `undefined`, così `max`/`regex` non scattano su un campo lasciato in bianco.

```ts
import * as z from "zod";
import type { SocialKey } from "@/lib/profile/socials";

// I campi non obbligatori arrivano dal form come "": va trattata come "assente",
// altrimenti regex e lunghezze minime scatterebbero su un campo lasciato vuoto.
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = (max: number, message: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, message).optional());

const optionalHandle = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(30, "Handle troppo lungo (massimo 30 caratteri)")
    .regex(/^[A-Za-z0-9._-]+$/, "Handle non valido: usa lettere, numeri, punto, trattino o underscore")
    .optional(),
);

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome troppo corto (minimo 2 caratteri)")
    .max(50, "Nome troppo lungo (massimo 50 caratteri)"),
  tag: z
    .string()
    .trim()
    .min(3, "Tag troppo corto (minimo 3 caratteri)")
    .max(30, "Tag troppo lungo (massimo 30 caratteri)")
    .regex(
      /^[a-z0-9._-]+$/,
      "Il tag deve essere tutto minuscolo: ammessi lettere minuscole, numeri, punto, trattino e underscore",
    ),
  bio: optionalText(300, "Bio troppo lunga (massimo 300 caratteri)"),
  town: optionalText(60, "Comune troppo lungo (massimo 60 caratteri)"),
  instagram: optionalHandle,
  facebook: optionalHandle,
  tiktok: optionalHandle,
  youtube: optionalHandle,
});

export type ProfileInput = z.infer<typeof profileSchema>;

// I quattro campi social di profileSchema devono restare allineati a SOCIAL_KEYS
// (`src/lib/profile/socials.ts`), che ne detta l'ordine nella UI. Se un social
// viene aggiunto là senza un campo qui, `Pick` non trova la chiave e `tsc` fallisce.
export type SocialFields = Pick<ProfileInput, SocialKey>;
```

- [ ] **Step 4: Avatar di default**

Crea `public/default-avatar.svg`. È un asset statico: i colori non possono leggere i token di tema, sono scelti per accordarsi a `--color-surface-card`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="32" fill="#111114" />
  <circle cx="32" cy="25" r="11" fill="#4a4a52" />
  <path d="M12 60c0-11 9-19 20-19s20 8 20 19z" fill="#4a4a52" />
</svg>
```

- [ ] **Step 5: Componente `Avatar`**

Crea `src/components/ui/Avatar.tsx`:

```tsx
// SVG servito con <img>: passare l'avatar di default da next/image richiederebbe
// `dangerouslyAllowSVG` in next.config, che non vogliamo abilitare per un asset
// decorativo. Le foto caricate dagli utenti sono JPG/PNG/WebP e restano piccole
// (max 2 MB), quindi non perdiamo ottimizzazioni significative.
export default function Avatar({
  src,
  alt,
  size = 40,
  className = "",
}: {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? "/default-avatar.svg"}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-full object-cover border border-white/10 bg-surface-card ${className}`}
    />
  );
}
```

- [ ] **Step 6: Stringhe i18n**

In `src/messages/it.json`, aggiungi `"profilo"` e `"membri"` dentro `"nav"`:

```json
  "nav": {
    "home": "Home",
    "eventi": "Eventi",
    "garage": "Garage",
    "gadget": "Gadget",
    "dashboard": "Dashboard",
    "profilo": "Profilo",
    "membri": "Membri",
    "impostazioni": "Impostazioni",
    "login": "Accedi",
    "logout": "Logout"
  },
```

e aggiungi i due blocchi `profile` e `members` **dopo** il blocco `settings` (ricordando la virgola dopo la graffa di `settings`):

```json
  "profile": {
    "title": "Il mio profilo",
    "avatarTitle": "Foto profilo",
    "avatarChange": "Cambia foto",
    "avatarRules": "JPG, PNG o WebP · massimo 2 MB",
    "avatarType": "Formato non ammesso: usa JPG, PNG o WebP.",
    "avatarSize": "File troppo grande: massimo 2 MB.",
    "avatarUploadFailed": "Caricamento non riuscito. Riprova.",
    "name": "Nome",
    "tag": "Tag",
    "tagHint": "Deve essere tutto minuscolo, senza spazi. Da 3 a 30 caratteri: lettere minuscole, numeri, punto, trattino, underscore",
    "tagTaken": "Tag già in uso",
    "town": "Comune",
    "bio": "Bio",
    "bioCount": "{count}/300",
    "socialsTitle": "Social",
    "handlePlaceholder": "Solo il nome utente, senza @",
    "save": "Salva",
    "saved": "Profilo aggiornato.",
    "genericError": "Qualcosa è andato storto. Riprova."
  },
  "members": {
    "title": "Membri",
    "searchLabel": "Cerca un membro",
    "searchPlaceholder": "Nome o tag",
    "searchSubmit": "Cerca",
    "latest": "Ultimi iscritti",
    "results": "Risultati per «{q}»",
    "empty": "Nessun membro trovato",
    "noBio": "Questo membro non ha ancora scritto una bio.",
    "garageTitle": "Garage"
  }
```

- [ ] **Step 7: Verificare che compili e passi il lint**

```bash
npx tsc --noEmit
npm run lint
```

Atteso: entrambi senza errori.

Poi verifica che la guardia di tipo morda davvero: togli `youtube: optionalHandle,` da `profileSchema` e rilancia `npx tsc --noEmit`. **Deve fallire** su `SocialFields`. Rimetti la riga e ricontrolla che torni verde.

- [ ] **Step 8: Commit**

```bash
git add src/lib/profile/socials.ts src/lib/profile/search.ts src/lib/validation/profile.ts public/default-avatar.svg src/components/ui/Avatar.tsx src/messages/it.json
git commit -m "feat(profilo): validazione, helper social e ricerca, avatar di default"
```

---

## Task 3 — Pagina `/profilo`: vista e modifica

**File:**
- Crea: `src/components/ui/Textarea.tsx`
- Crea: `src/components/features/profile/ProfileForm.tsx`
- Crea: `src/app/[locale]/(auth)/profilo/actions.ts`
- Crea: `src/app/[locale]/(auth)/profilo/page.tsx`
- Modifica: `src/components/layout/Header.tsx` (voce di menu `Profilo`)

**Interfacce:**
- Consuma: `profileSchema` (Task 2), `SOCIAL_KEYS`/`SOCIAL_LABELS` (Task 2), `getProfile()` da `@/lib/auth`, `requireUser()` da `@/lib/auth`, `createClient()` da `@/lib/supabase/server`.
- Produce:
  - `export type ProfileState = { error?: string; success?: string }` (in `ProfileForm.tsx`)
  - `updateProfile(state: ProfileState, formData: FormData): Promise<ProfileState>` (in `profilo/actions.ts`)
  - `<ProfileForm action={…} profile={Profile} />`
  - `<Textarea {...TextareaHTMLAttributes} />`

> **Perché `ProfileState` vive nel componente client e non nella server action:** un file `"use server"` può esportare **solo funzioni async**. È lo stesso motivo per cui `AuthState` sta in `AuthForm.tsx`. E per la stessa ragione l'azione arriva al form **come prop dalla pagina** (`action={updateProfile}`), come già fa `AuthForm`: evita un import circolare form → actions → form.

- [ ] **Step 1: Componente `Textarea`**

Crea `src/components/ui/Textarea.tsx`, gemello di `Input`:

```tsx
import { TextareaHTMLAttributes } from "react";

export default function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2.5 bg-surface-dim border border-white/10 hover:border-white/20 focus:border-accent-red/50 user-invalid:border-accent-red text-xs font-mono text-white placeholder-white/20 focus:outline-none resize-y ${className}`}
      {...props}
    />
  );
}
```

> `user-invalid:border-accent-red` (aggiunto anche a `src/components/ui/Input.tsx`) colora di rosso il campo **solo dopo** che l'utente lo ha toccato lasciandolo invalido: all'apertura della pagina nessun campo è rosso. Con nove campi, il solo submit disabilitato non basta a dire *quale* campo blocca il salvataggio.

- [ ] **Step 2: Il form (client)**

Crea `src/components/features/profile/ProfileForm.tsx`:

```tsx
"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { SOCIAL_KEYS, SOCIAL_LABELS } from "@/lib/profile/socials";
import type { Profile } from "@/types/database";

export type ProfileState = { error?: string; success?: string };

const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/60";
const hintClass = "block font-mono text-[11px] text-white/40";

// Il browser compila l'attributo `pattern` come new RegExp(`^(?:${pattern})$`, "v").
// Nel flag `v` il trattino è sintattico dentro una classe di caratteri: senza `\-`
// la regex NON compila e la spec impone di IGNORARE l'attributo, in silenzio —
// il campo accetterebbe qualsiasi valore. I `\-` qui sotto non sono superflui.
const TAG_PATTERN = "[a-z0-9._\\-]+";
const HANDLE_PATTERN = "[A-Za-z0-9._\\-]+";

export default function ProfileForm({
  action,
  profile,
}: {
  action: (state: ProfileState, formData: FormData) => Promise<ProfileState>;
  profile: Profile;
}) {
  const t = useTranslations("profile");
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  // Come in AuthForm: il submit resta spento finché la validazione nativa
  // (required + pattern + minLength) non è soddisfatta.
  const [valid, setValid] = useState(false);
  const revalidate = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(revalidate, []);
  const [bioLength, setBioLength] = useState((profile.bio ?? "").length);

  return (
    <form ref={formRef} action={formAction} onInput={revalidate} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("name")}</span>
          <Input name="name" defaultValue={profile.name ?? ""} required minLength={2} maxLength={50} />
        </label>

        <label className="block space-y-1.5">
          <span className={labelClass}>{t("tag")}</span>
          <Input
            name="tag"
            defaultValue={profile.tag ?? ""}
            required
            minLength={3}
            maxLength={30}
            pattern={TAG_PATTERN}
          />
          <span className={hintClass}>{t("tagHint")}</span>
        </label>

        <label className="block space-y-1.5 md:col-span-2">
          <span className={labelClass}>{t("town")}</span>
          <Input name="town" defaultValue={profile.town ?? ""} maxLength={60} />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className={labelClass}>{t("bio")}</span>
        <Textarea
          name="bio"
          rows={4}
          maxLength={300}
          defaultValue={profile.bio ?? ""}
          onChange={(e) => setBioLength(e.target.value.length)}
        />
        <span className={hintClass}>{t("bioCount", { count: bioLength })}</span>
      </label>

      <div className="space-y-3">
        <h3 className={labelClass}>{t("socialsTitle")}</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {SOCIAL_KEYS.map((key) => (
            <label key={key} className="block space-y-1.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                {SOCIAL_LABELS[key]}
              </span>
              {/* Campo opzionale: se resta vuoto la validazione nativa non applica il pattern. */}
              <Input
                name={key}
                defaultValue={profile.socials?.[key] ?? ""}
                maxLength={30}
                pattern={HANDLE_PATTERN}
                placeholder={t("handlePlaceholder")}
              />
            </label>
          ))}
        </div>
      </div>

      {state.error && <p className="font-mono text-xs text-accent-red">{state.error}</p>}
      {state.success && <p className="font-mono text-xs text-accent-orange">{state.success}</p>}

      <Button type="submit" disabled={pending || !valid}>
        {t("save")}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: La server action `updateProfile`**

Crea `src/app/[locale]/(auth)/profilo/actions.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL_KEYS } from "@/lib/profile/socials";
import { profileSchema } from "@/lib/validation/profile";
import type { ProfileState } from "@/components/features/profile/ProfileForm";

export async function updateProfile(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const t = await getTranslations("profile");
  const user = await requireUser();

  const text = (key: string) => String(formData.get(key) ?? "");
  const parsed = profileSchema.safeParse({
    name: text("name"),
    tag: text("tag"),
    bio: text("bio"),
    town: text("town"),
    instagram: text("instagram"),
    facebook: text("facebook"),
    tiktok: text("tiktok"),
    youtube: text("youtube"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, tag, bio, town } = parsed.data;
  const socials: Record<string, string> = {};
  for (const key of SOCIAL_KEYS) {
    const handle = parsed.data[key];
    if (handle) socials[key] = handle;
  }

  const supabase = await createClient();
  // La policy RLS `profiles_update_self` impedisce già di toccare il profilo
  // altrui e di cambiarsi il `role`: qui non serve altra logica.
  const { error } = await supabase
    .from("profiles")
    .update({ name, tag, bio: bio ?? null, town: town ?? null, socials })
    .eq("id", user.id);

  if (error) {
    // 23505 = unique_violation di Postgres: il tag è già di un altro membro.
    if (error.code === "23505") return { error: t("tagTaken") };
    return { error: t("genericError") };
  }

  // Il nome e (dal Task 5) l'avatar compaiono nell'header, che sta nel layout di
  // `[locale]`: rivalidare il solo path della pagina non basta. `/` + "layout"
  // è la forma documentata per invalidare tutto, ed è quello che ci serve qui.
  revalidatePath("/", "layout");
  return { success: t("saved") };
}
```

- [ ] **Step 4: La pagina**

Crea `src/app/[locale]/(auth)/profilo/page.tsx`. Il layout `(auth)` chiama già `requireUser()`, quindi qui l'utente c'è; il `redirect` è solo per restringere il tipo.

```tsx
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import ProfileForm from "@/components/features/profile/ProfileForm";
import { getProfile } from "@/lib/auth";
import { updateProfile } from "./actions";

export default async function ProfiloPage() {
  const t = await getTranslations("profile");
  const profile = await getProfile();
  if (!profile) redirect({ href: "/login", locale: "it" });

  return (
    <div className="space-y-8">
      <SectionHeading>{t("title")}</SectionHeading>
      <Card className="p-6">
        <ProfileForm action={updateProfile} profile={profile!} />
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Voce di menu `Profilo`**

In `src/components/layout/Header.tsx`, dentro l'array `links`, aggiungi la voce nel ramo autenticato:

```tsx
    ...(isAuthenticated
      ? [
          { href: "/dashboard", label: t("dashboard") },
          { href: "/profilo", label: t("profilo") },
          { href: "/impostazioni", label: t("impostazioni") },
        ]
      : []),
```

`MobileMenu` riceve lo stesso array: non va toccato.

- [ ] **Step 6: Verificare dal vivo**

```bash
npm run dev
```

Su `http://localhost:3000/it`, loggato come `mcdevelop03@gmail.com`:

1. Nel menu compare **Profilo** → apre `/it/profilo` con i campi precompilati.
2. Il tasto **Salva** è spento finché nome e tag non sono validi; scrivi un tag con una maiuscola → resta spento (validazione nativa `pattern`).
3. Cambia nome, comune, bio e l'handle Instagram → **Salva** → compare «Profilo aggiornato.» e ricaricando la pagina i valori sono persistiti.
4. Metti come tag quello di un altro membro esistente → **Salva** → compare **«Tag già in uso»** (non un errore generico).
5. Da sloggato, `http://localhost:3000/it/profilo` rimanda a `/it/login`.

- [ ] **Step 7: Compilazione e lint**

Ferma il dev server prima di lanciare `build` (vedi vincoli globali). Qui bastano:

```bash
npx tsc --noEmit
npm run lint
```

Atteso: nessun errore.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/Textarea.tsx src/components/features/profile/ProfileForm.tsx "src/app/[locale]/(auth)/profilo/actions.ts" "src/app/[locale]/(auth)/profilo/page.tsx" src/components/layout/Header.tsx
git commit -m "feat(profilo): pagina /profilo con form di modifica e voce di menu"
```

---

## Task 4 — Upload dell'avatar

**File:**
- Crea: `supabase/migrations/0006_storage_avatars_select.sql`
- Crea: `src/components/features/profile/AvatarUploader.tsx`
- Modifica: `src/app/[locale]/(auth)/profilo/actions.ts` (aggiunge `setAvatar`)
- Modifica: `src/app/[locale]/(auth)/profilo/page.tsx` (monta l'uploader)

**Interfacce:**
- Consuma: `<Avatar />` (Task 2), `createClient()` da `@/lib/supabase/client`, il bucket con i limiti del Task 1.
- Produce:
  - `setAvatar(path: string): Promise<{ error?: string }>` (in `profilo/actions.ts`)
  - `<AvatarUploader userId={string} avatarUrl={string | null} />`

- [ ] **Step 0: Migrazione `0006` — policy `SELECT` sul bucket `avatars`**

La `0003` creò per `avatars` le policy di `INSERT`, `UPDATE` e `DELETE`, ma **non quella di `SELECT`**. Su `storage.objects` la RLS è attiva: senza policy di lettura, `storage.list()` chiamato con la sessione dell'utente restituisce **sempre una lista vuota**, e la pulizia dei file orfani nello Step 1 non cancella mai nulla. Il difetto è silenzioso — nessun errore, solo `[]`. (Trovato al collaudo: due upload reali, `list()` → `[]`, mentre il service role vedeva entrambi i file.)

Crea `supabase/migrations/0006_storage_avatars_select.sql`:

```sql
-- La 0003 ha creato per `avatars` le policy di INSERT, UPDATE e DELETE, ma NON
-- quella di SELECT. Su `storage.objects` la RLS è attiva: senza policy di lettura
-- `storage.list()` chiamato con la sessione dell'utente restituisce sempre una
-- lista vuota, e la pulizia dei file orfani in `setAvatar` non cancella mai nulla
-- (i vecchi avatar restano nel bucket, pubblicamente scaricabili via URL).
--
-- Il bucket è `public = true`, quindi la lettura anonima via URL pubblico passa
-- già da un'altra strada e questa policy non la tocca: qui abilitiamo soltanto
-- l'elenco della PROPRIA cartella `{uid}/` da parte dell'utente autenticato.
create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

Applicala **senza resettare il database** (gli utenti locali sopravvivono):

```bash
npx supabase migration up --local
```

Verifica che la policy esista:

```bash
docker exec supabase_db_marsicaCarMeetFinal psql -U postgres -d postgres \
  -c "select policyname, cmd from pg_policies where schemaname='storage' and tablename='objects' and cmd='SELECT';"
```

Atteso: una riga, `avatars_select_own | SELECT`.

- [ ] **Step 1: La server action `setAvatar`**

In coda a `src/app/[locale]/(auth)/profilo/actions.ts`, aggiungi:

```ts
export async function setAvatar(path: string): Promise<{ error?: string }> {
  const t = await getTranslations("profile");
  const user = await requireUser();

  // Difesa in profondità: le policy dello storage consentono la scrittura solo
  // in `{uid}/`, ma `path` arriva dal client e finisce dritto in `avatar_url`.
  if (!path.startsWith(`${user.id}/`)) return { error: t("genericError") };

  const supabase = await createClient();
  // getPublicUrl è sincrono e non fallisce: il bucket `avatars` è pubblico in lettura.
  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", user.id);
  if (error) return { error: t("genericError") };

  // Nella cartella dell'utente resta un solo file: gli altri sono orfani.
  // Si elencano e si cancellano invece di ricavare il path dal vecchio URL.
  // L'elenco richiede la policy `avatars_select_own` (migrazione 0006): senza,
  // la RLS filtra tutto e `list` torna una lista vuota, silenziosamente.
  //
  // Un fallimento qui NON è un errore per l'utente: l'avatar nuovo è già salvato
  // e valido. Lasciamo però una traccia nei log del server, altrimenti una
  // pulizia rotta è indistinguibile da "non c'era nulla da pulire".
  const { data: files, error: listError } = await supabase.storage.from("avatars").list(user.id);
  if (listError) {
    console.error("setAvatar: elenco della cartella avatar non riuscito", listError);
  } else {
    const stale = (files ?? [])
      .map((file) => `${user.id}/${file.name}`)
      .filter((candidate) => candidate !== path);
    if (stale.length > 0) {
      const { error: removeError } = await supabase.storage.from("avatars").remove(stale);
      if (removeError) {
        console.error("setAvatar: rimozione degli avatar orfani non riuscita", removeError);
      }
    }
  }

  revalidatePath("/", "layout");
  return {};
}
```

- [ ] **Step 2: Il componente di upload (client)**

Crea `src/components/features/profile/AvatarUploader.tsx`:

```tsx
"use client";
import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { setAvatar } from "@/app/[locale]/(auth)/profilo/actions";

// Stessi limiti della migrazione 0005. Qui servono solo per il feedback
// immediato: chi li aggira viene comunque respinto dal bucket.
const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function AvatarUploader({
  userId,
  avatarUrl,
}: {
  userId: string;
  avatarUrl: string | null;
}) {
  const t = useTranslations("profile");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permette di riselezionare lo stesso file
    if (!file) return;

    setError(null);
    if (!EXTENSIONS[file.type]) return setError(t("avatarType"));
    if (file.size > MAX_BYTES) return setError(t("avatarSize"));

    setUploading(true);
    // Il nome cambia a ogni caricamento: niente cache stantia del browser.
    const path = `${userId}/avatar-${Date.now()}.${EXTENSIONS[file.type]}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });
    setUploading(false);
    if (uploadError) return setError(t("avatarUploadFailed"));

    startTransition(async () => {
      const result = await setAvatar(path);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  const busy = uploading || pending;

  return (
    <div className="flex items-center gap-6">
      <Avatar src={avatarUrl} alt={t("avatarTitle")} size={96} />
      <div className="space-y-2">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-white/60">
          {t("avatarTitle")}
        </h3>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Camera size={14} />
          {t("avatarChange")}
        </Button>
        <p className="font-mono text-[11px] text-white/40">{t("avatarRules")}</p>
        {error && <p className="font-mono text-xs text-accent-red">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Montare l'uploader nella pagina**

In `src/app/[locale]/(auth)/profilo/page.tsx`, aggiungi l'import e la card sopra al form:

```tsx
import AvatarUploader from "@/components/features/profile/AvatarUploader";
```

```tsx
      <Card className="p-6">
        <AvatarUploader userId={profile!.id} avatarUrl={profile!.avatar_url} />
      </Card>
      <Card className="p-6">
        <ProfileForm action={updateProfile} profile={profile!} />
      </Card>
```

- [ ] **Step 4: Verificare dal vivo**

Con `npm run dev` attivo, su `/it/profilo` da loggato:

1. **Cambia foto** → scegli un JPG < 2 MB → dopo un istante l'avatar mostrato cambia.
2. Ricarica la pagina: l'avatar resta (è in `profiles.avatar_url`).
3. Ripeti l'upload con una seconda immagine. Poi, nello **Storage** di Supabase Studio (`http://127.0.0.1:54323`), apri il bucket `avatars` e la cartella `{uid}/`: deve contenerne **un solo file**, quello nuovo.
4. Prova a caricare un **GIF** → messaggio «Formato non ammesso…», nessun upload.
5. Prova un JPG **> 2 MB** → messaggio «File troppo grande…», nessun upload.

I punti 4 e 5 dimostrano solo il controllo *nel browser*. Che il **bucket** rifiuti gli stessi file anche scavalcando la UI si verifica nel **Task 8, Step 4**, con uno script che parla direttamente con Supabase.

- [ ] **Step 5: Compilazione e lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/features/profile/AvatarUploader.tsx "src/app/[locale]/(auth)/profilo/actions.ts" "src/app/[locale]/(auth)/profilo/page.tsx"
git commit -m "feat(profilo): upload avatar su Storage con pulizia dei file orfani"
```

---

## Task 5 — Avatar nell'header

Chiude il requisito raccolto dopo la Fase 1A e rimandato apposta a 1B.

**File:**
- Modifica: `src/app/[locale]/layout.tsx`
- Modifica: `src/components/layout/Header.tsx`

**Interfacce:**
- Consuma: `getProfile()` da `@/lib/auth`, `<Avatar />` (Task 2), la rotta `/profilo` (Task 3).
- Produce: `<Header isAuthenticated={boolean} avatar={string | null} />` — la prop `avatar` è nuova.

- [ ] **Step 1: Il layout legge il profilo, non più il solo utente**

In `src/app/[locale]/layout.tsx` sostituisci l'import e la chiamata:

```tsx
import { getProfile } from "@/lib/auth";
```

```tsx
  // getProfile() esce subito con null per gli anonimi: nessuna query in più.
  const profile = await getProfile();
```

e passa la nuova prop all'header:

```tsx
          <Header isAuthenticated={!!profile} avatar={profile?.avatar_url ?? null} />
```

- [ ] **Step 2: L'header mostra l'avatar accanto al menu**

In `src/components/layout/Header.tsx`:

```tsx
import Avatar from "@/components/ui/Avatar";
```

```tsx
export default function Header({
  isAuthenticated,
  avatar,
}: {
  isAuthenticated: boolean;
  avatar: string | null;
}) {
```

Poi, dentro `<div className="flex items-center gap-2">`, **fra** il `</nav>` e il bottone dell'hamburger, inserisci:

```tsx
            {isAuthenticated && (
              <Link href="/profilo" aria-label={t("profilo")} className="shrink-0">
                <Avatar
                  src={avatar}
                  alt={t("profilo")}
                  size={36}
                  className="hover:border-accent-red transition-colors"
                />
              </Link>
            )}
```

Così l'avatar sta accanto al menu sia su desktop (dopo la nav) sia su mobile (accanto all'hamburger). `MobileMenu` non cambia.

- [ ] **Step 3: Verificare dal vivo**

1. **Sloggato:** nell'header non c'è nessun avatar.
2. **Loggato senza foto:** compare il cerchio grigio di `default-avatar.svg`.
3. Clic sull'avatar → porta a `/it/profilo`.
4. Carica una foto da `/it/profilo`: l'header si aggiorna **senza ricaricare a mano** (grazie a `revalidatePath("/", "layout")` + `router.refresh()`).

- [ ] **Step 4: Compilazione e lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/layout.tsx" src/components/layout/Header.tsx
git commit -m "feat(header): avatar del profilo accanto al menu"
```

---

## Task 6 — Ricerca membri `/membri`

**File:**
- Modifica: `src/types/database.ts` (tipo `MemberSummary`)
- Crea: `src/components/features/profile/MemberCard.tsx`
- Crea: `src/app/[locale]/(auth)/membri/page.tsx`
- Modifica: `src/components/layout/Header.tsx` (voce di menu `Membri`)

**Interfacce:**
- Consuma: `ilikePattern`, `quoteOrValue` (Task 2), `<Avatar />` (Task 2), `createClient()` da `@/lib/supabase/server`.
- Produce:
  - `export type MemberSummary = { id: string; name: string | null; tag: string; avatar_url: string | null; town: string | null }`
  - `<MemberCard member={MemberSummary} />`
  - la rotta `/membri?q=…`, consumata dal Task 7 come punto di ingresso.

- [ ] **Step 1: Il tipo `MemberSummary`**

In coda a `src/types/database.ts`:

```ts
// Sottoinsieme di Profile usato nelle card dei risultati. `tag` è non-nullo:
// i profili senza tag non sono raggiungibili da /membri/[tag] e vanno filtrati.
export type MemberSummary = {
  id: string;
  name: string | null;
  tag: string;
  avatar_url: string | null;
  town: string | null;
};
```

- [ ] **Step 2: La card di un membro**

Crea `src/components/features/profile/MemberCard.tsx` (Server Component: nessun `"use client"`):

```tsx
import { Link } from "@/i18n/navigation";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import type { MemberSummary } from "@/types/database";

export default function MemberCard({ member }: { member: MemberSummary }) {
  const displayName = member.name ?? `@${member.tag}`;
  return (
    <Link href={`/membri/${member.tag}`} className="block">
      <Card className="flex items-center gap-4 p-4 transition-colors hover:border-accent-red/40">
        <Avatar src={member.avatar_url} alt="" size={48} />
        <div className="min-w-0">
          <p className="truncate font-display font-black italic uppercase tracking-tighter text-white">
            {displayName}
          </p>
          <p className="truncate font-mono text-[11px] text-white/40">@{member.tag}</p>
          {member.town && (
            <p className="truncate font-mono text-[11px] text-white/40">{member.town}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: La pagina di ricerca**

Crea `src/app/[locale]/(auth)/membri/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SectionHeading from "@/components/ui/SectionHeading";
import MemberCard from "@/components/features/profile/MemberCard";
import { ilikePattern, quoteOrValue } from "@/lib/profile/search";
import { createClient } from "@/lib/supabase/server";
import type { MemberSummary } from "@/types/database";

const MAX_QUERY_LENGTH = 50;
const SEARCH_LIMIT = 24;
const LATEST_LIMIT = 12;

export default async function MembriPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("members");
  const q = ((await searchParams).q ?? "").trim().slice(0, MAX_QUERY_LENGTH);

  const supabase = await createClient();
  // La policy `profiles_select_authenticated` limita già la lettura ai loggati.
  // I profili senza tag non hanno una pagina: si escludono a monte.
  const base = supabase
    .from("profiles")
    .select("id, name, tag, avatar_url, town")
    .not("tag", "is", null);

  // Niente `let query` riassegnata: `.order()` restituisce un builder di tipo
  // diverso da `.not()`, e TypeScript rifiuterebbe l'assegnazione.
  const pattern = q ? quoteOrValue(ilikePattern(q)) : null;
  const { data } = pattern
    ? await base.or(`name.ilike.${pattern},tag.ilike.${pattern}`).order("name").limit(SEARCH_LIMIT)
    : await base.order("created_at", { ascending: false }).limit(LATEST_LIMIT);

  const members = (data ?? []) as MemberSummary[];

  return (
    <div className="space-y-8">
      <SectionHeading>{t("title")}</SectionHeading>

      {/* Form GET: la ricerca finisce nell'URL, è condivisibile e non richiede JS. */}
      <form method="get" className="flex gap-3">
        <Input
          name="q"
          defaultValue={q}
          maxLength={MAX_QUERY_LENGTH}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
        />
        <Button type="submit" className="flex shrink-0 items-center gap-2">
          <Search size={14} />
          {t("searchSubmit")}
        </Button>
      </form>

      <h3 className="font-mono text-[11px] uppercase tracking-widest text-white/60">
        {q ? t("results", { q }) : t("latest")}
      </h3>

      {members.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Voce di menu `Membri`**

In `src/components/layout/Header.tsx`, nell'array `links`:

```tsx
    ...(isAuthenticated
      ? [
          { href: "/dashboard", label: t("dashboard") },
          { href: "/profilo", label: t("profilo") },
          { href: "/membri", label: t("membri") },
          { href: "/impostazioni", label: t("impostazioni") },
        ]
      : []),
```

- [ ] **Step 5: Verificare dal vivo**

Servono almeno due membri: se hai un solo utente, registrane un secondo (chiedi conferma prima di usare un indirizzo email; le email locali si leggono su Mailpit, `http://127.0.0.1:54324`).

1. `/it/membri` senza `q` → mostra gli ultimi iscritti (max 12).
2. Cerca una porzione del **nome** → il membro compare, e l'URL diventa `/it/membri?q=…`.
3. Cerca una porzione del **tag** → stesso risultato.
4. Cerca una stringa inventata → «Nessun membro trovato».
5. Cerca `%` da solo → **nessun risultato** (se li mostrasse tutti, l'escaping dei jolly non funziona).
6. Cerca `a,b` → nessun errore 500 (se il filtro `.or()` non fosse quotato, PostgREST restituirebbe un errore di parsing).
7. Clic su una card → porta a `/it/membri/<tag>` (404 finché non c'è il Task 7: è atteso).
8. Da sloggato, `/it/membri` rimanda a `/it/login`.

- [ ] **Step 6: Compilazione e lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/types/database.ts src/components/features/profile/MemberCard.tsx "src/app/[locale]/(auth)/membri/page.tsx" src/components/layout/Header.tsx
git commit -m "feat(membri): pagina /membri con ricerca server-side per nome e tag"
```

---

## Task 7 — Profilo pubblico `/membri/[tag]`

**File:**
- Crea: `src/components/ui/icons/SocialIcon.tsx`
- Crea: `src/components/features/profile/SocialLinks.tsx`
- Crea: `src/app/[locale]/(auth)/membri/[tag]/page.tsx`

**Interfacce:**
- Consuma: `socialEntries`, `SOCIAL_LABELS`, `type SocialKey` (Task 2), `<Avatar />` (Task 2), `getProfile()` da `@/lib/auth`.
- Produce: `<SocialIcon name={SocialKey} size?={number} />`, `<SocialLinks socials={Profile["socials"]} />`; la rotta `/membri/[tag]`, che il Task 8 collauda.

- [ ] **Step 1: Le icone dei marchi**

Crea `src/components/ui/icons/SocialIcon.tsx`. I `d=` vanno copiati **alla lettera**: sono i path ufficiali, un solo carattere sbagliato deforma il glifo.

```tsx
import type { SocialKey } from "@/lib/profile/socials";

// Glifi ufficiali dei marchi, presi da Simple Icons (simpleicons.org), licenza
// CC0 1.0. Vendorizzati invece di aggiungere una dipendenza per quattro icone:
// lucide-react v1 ha rimosso le icone dei marchi.
// `fill="currentColor"` li aggancia al colore del testo, quindi ai token di tema.
const PATHS: Record<SocialKey, string> = {
  instagram:
    "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  facebook:
    "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  tiktok:
    "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
};

export default function SocialIcon({ name, size = 14 }: { name: SocialKey; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
```

- [ ] **Step 2: I link social**

Crea `src/components/features/profile/SocialLinks.tsx`. L'icona è decorativa (`aria-hidden`): il nome del marchio arriva allo screen reader dall'`aria-label` del link.

```tsx
import SocialIcon from "@/components/ui/icons/SocialIcon";
import { SOCIAL_LABELS, socialEntries } from "@/lib/profile/socials";
import type { Profile } from "@/types/database";

export default function SocialLinks({ socials }: { socials: Profile["socials"] }) {
  const entries = socialEntries(socials);
  if (entries.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {entries.map(({ key, handle, url }) => (
        <li key={key}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${SOCIAL_LABELS[key]}: @${handle}`}
            className="flex items-center gap-2 border border-white/10 px-3 py-2 font-mono text-[11px] text-white/60 transition-colors hover:border-accent-red/40 hover:text-white"
          >
            <SocialIcon name={key} />
            <span>@{handle}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: La pagina del membro**

Crea `src/app/[locale]/(auth)/membri/[tag]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import SocialLinks from "@/components/features/profile/SocialLinks";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function MembroPage({ params }: { params: Promise<{ tag: string }> }) {
  const t = await getTranslations("members");
  const tp = await getTranslations("placeholder");
  const { tag } = await params;
  // I tag sono salvati in minuscolo: normalizziamo l'URL prima di cercare.
  // decodeURIComponent lancia su sequenze percent malformate (es. "abc%zz"):
  // un URL ostile del genere e un tag inesistente, non un 500.
  let wantedTag: string;
  try {
    wantedTag = decodeURIComponent(tag).toLowerCase();
  } catch {
    notFound();
  }

  const me = await getProfile();
  // Il mio profilo si modifica da /profilo: non serve una seconda vista.
  if (me?.tag === wantedTag) redirect({ href: "/profilo", locale: "it" });

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("tag", wantedTag).maybeSingle();
  if (!data) notFound();

  const member = data as Profile;
  const displayName = member.name ?? `@${member.tag}`;

  return (
    <div className="space-y-8">
      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Avatar src={member.avatar_url} alt={displayName} size={96} />
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-2xl font-black italic uppercase tracking-tighter text-white">
            {displayName}
          </h1>
          <p className="font-mono text-xs text-white/40">@{member.tag}</p>
          {member.town && (
            <p className="flex items-center gap-2 font-mono text-xs text-white/40">
              <MapPin size={12} />
              {member.town}
            </p>
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <p className="text-sm text-white/70">{member.bio ?? t("noBio")}</p>
        <SocialLinks socials={member.socials} />
      </Card>

      {/* Segnaposto: la Fase 1B-2 sostituirà questa sezione col garage del membro. */}
      <div className="space-y-4">
        <SectionHeading>{t("garageTitle")}</SectionHeading>
        <p className="font-mono text-xs text-white/40">{tp("comingSoon")}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificare dal vivo**

Con `npm run dev` e due membri a disposizione:

1. Da `/it/membri`, clic sulla card di **un altro** membro → si apre `/it/membri/<tag>` in sola lettura (nessun form).
2. Se l'altro membro ha una bio e dei social, compaiono; se non ha bio, compare «Questo membro non ha ancora scritto una bio.».
3. Le **icone dei marchi** si vedono correttamente (Instagram, Facebook, TikTok, YouTube) e prendono il colore del testo, schiarendosi al passaggio del mouse. Un glifo deforme = path copiato male.
4. Clic su un chip social → si apre in una **nuova scheda** all'URL giusto (es. `https://instagram.com/<handle>`).
5. In fondo compare la sezione **Garage** con «In arrivo».
6. Vai a mano su `/it/membri/<il-mio-tag>` → **redirect** a `/it/profilo`.
7. Vai a mano su `/it/membri/tag-che-non-esiste` → **404** (la pagina `[locale]/not-found.tsx`).
8. Da sloggato, `/it/membri/<tag>` rimanda a `/it/login`.

- [ ] **Step 5: Compilazione e lint**

```bash
npx tsc --noEmit
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/icons/SocialIcon.tsx src/components/features/profile/SocialLinks.tsx "src/app/[locale]/(auth)/membri/[tag]/page.tsx"
git commit -m "feat(membri): profilo pubblico /membri/[tag] in sola lettura"
```

---

## Task 8 — Collaudo end-to-end, sicurezza e chiusura di fase

Come per la Fase 1A: collaudo dal vivo nel browser + verifiche SQL, senza test runner. Ogni bug trovato si corregge in un **commit `fix(...)` dedicato**.

**File:**
- Modifica: `docs/STATO-LAVORI.md`

- [ ] **Step 1: Preparare l'ambiente pulito**

```bash
npx supabase db reset
npm run dev
```

Registra due utenti (chiedi conferma prima di usare qualunque indirizzo email; le email locali si leggono su Mailpit, `http://127.0.0.1:54324`). Promuovi il primo ad admin rieseguendo la `update` di `supabase/seed.sql`.

- [ ] **Step 2: Collaudo funzionale (browser)**

Spunta ogni riga:

- [ ] Modifica profilo: nome, tag, bio, comune e i 4 handle social → salvataggio e persistenza dopo ricarica.
- [ ] Tag duplicato (quello dell'altro utente) → errore **«Tag già in uso»**.
- [ ] Tag con maiuscole o spazi → il submit resta disabilitato (validazione nativa).
- [ ] Bio a 301 caratteri → il campo si ferma a 300 (`maxLength`).
- [ ] Upload avatar (JPG < 2 MB) → compare nel profilo **e nell'header**, senza ricaricare a mano.
- [ ] Secondo upload → in `avatars/{uid}/` (Studio → Storage) resta **un solo file**.
- [ ] Upload di un GIF → rifiutato con messaggio, nessun file caricato.
- [ ] Upload di un JPG > 2 MB → rifiutato con messaggio.
- [ ] `/membri` senza `q` → ultimi iscritti; con `q` su nome → trovato; con `q` su tag → trovato.
- [ ] `/membri?q=%` → nessun risultato (jolly neutralizzato).
- [ ] `/membri?q=a,b` → nessun errore server.
- [ ] Clic su una card → `/membri/[tag]` in sola lettura, link social in nuova scheda, icone dei marchi rese correttamente.
- [ ] `/membri/<mio-tag>` → redirect a `/profilo`.
- [ ] `/membri/tag-inesistente` → 404.
- [ ] Da sloggato: `/profilo`, `/membri`, `/membri/<tag>` → tutti a `/login`.
- [ ] Con 2FA attivo: le tre rotte impongono la sfida AAL2 prima di aprirsi.

- [ ] **Step 3: Collaudo RLS (SQL Editor su `http://127.0.0.1:54323`)**

Prima prendi i due id reali:

```sql
select id, tag, role from public.profiles order by created_at;
```

Poi, sostituendo `<uid-A>` e `<uid-B>`, esegui **un blocco alla volta**. `set local` vale solo dentro una transazione, e il `rollback` finale garantisce che il collaudo non lasci tracce.

```sql
-- L'utente A prova a rinominare il profilo di B.
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<uid-A>","role":"authenticated"}';
  update public.profiles set name = 'hack' where id = '<uid-B>' returning id;
rollback;
```

Atteso: **nessuna riga** restituita (`UPDATE 0`). La policy `profiles_update_self` non fa nemmeno vedere la riga in scrittura.

```sql
-- L'utente A prova a promuoversi ad admin.
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<uid-A>","role":"authenticated"}';
  update public.profiles set role = 'admin' where id = '<uid-A>' returning id;
rollback;
```

Atteso: errore `new row violates row-level security policy for table "profiles"`. **Mai** una riga restituita.

- [ ] **Step 4: Collaudo Storage (script)**

Le policy dello storage e i limiti del bucket vanno provati **scavalcando la UI**. Crea `tmp-collaudo-storage.mjs` nella root del progetto Next:

```js
// Collaudo negativo dello storage: tutti e tre gli upload DEVONO fallire.
// Uso: node --env-file=.env.local tmp-collaudo-storage.mjs <email-A> <password-A> <uid-B>
import { createClient } from "@supabase/supabase-js";

const [email, password, otherUid] = process.argv.slice(2);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
if (signInError) throw signInError;
const { data: { user } } = await supabase.auth.getUser();

const blob = (bytes, type) => new Blob([new Uint8Array(bytes)], { type });
const esito = (etichetta, error) =>
  console.log(`${etichetta}: ${error ? `respinto — ${error.message}` : "!!! ACCETTATO: BUG !!!"}`);

// 1. Scrittura nella cartella di un altro utente.
const a = await supabase.storage.from("avatars")
  .upload(`${otherUid}/hack.jpg`, blob(10, "image/jpeg"), { contentType: "image/jpeg" });
esito("cartella altrui", a.error);

// 2. MIME non ammesso.
const b = await supabase.storage.from("avatars")
  .upload(`${user.id}/x.gif`, blob(10, "image/gif"), { contentType: "image/gif" });
esito("mime image/gif", b.error);

// 3. File oltre i 2 MB.
const c = await supabase.storage.from("avatars")
  .upload(`${user.id}/big.jpg`, blob(3 * 1024 * 1024, "image/jpeg"), { contentType: "image/jpeg" });
esito("file da 3 MB", c.error);
```

Eseguilo (`--env-file` legge `.env.local`; serve Node 20+). Usa le credenziali dell'utente A registrato allo Step 1 — **chiedi conferma prima di usare qualsiasi email**:

```bash
node --env-file=.env.local tmp-collaudo-storage.mjs <email-A> <password-A> <uid-B>
```

Atteso — tre righe, tutte «respinto»:

```
cartella altrui: respinto — new row violates row-level security policy
mime image/gif: respinto — mime type image/gif is not supported
file da 3 MB: respinto — The object exceeded the maximum allowed size
```

(I testi esatti dei messaggi possono variare con la versione di Supabase; ciò che conta è che **nessuna** riga dica «ACCETTATO».)

Poi rimuovi lo script:

```bash
rm tmp-collaudo-storage.mjs
```

- [ ] **Step 5: Build, lint, tipi**

**Killa prima il dev server** (vedi vincoli globali), poi:

```bash
rm -rf .next
npx tsc --noEmit
npm run lint
npm run build
```

Atteso: tutti e tre verdi.

- [ ] **Step 6: Aggiornare il file di ripartenza**

In `docs/STATO-LAVORI.md`, aggiorna:
- la data di «Ultima modifica»;
- «Dove siamo» → *Ultimo completato: **Fase 1B-1 — Profilo** ✅ (8 task su 8)*; *Prossimo: **Fase 1B-2 — Garage***;
- i link al piano (`superpowers/plans/2026-07-10-fase1b1-profilo.md`) e allo spec (`superpowers/specs/2026-07-10-fase1b1-profilo-design.md`);
- una sezione «Esito collaudo 1B-1» con i bug trovati e i commit `fix(...)` relativi;
- rimuovi dalle note aperte la riga «Avatar profilo accanto al menu: rimandato a 1B» (ora è fatto).

- [ ] **Step 7: Commit**

```bash
git add docs/STATO-LAVORI.md
git commit -m "docs: esito collaudo Fase 1B-1 e punto di ripartenza"
```

- [ ] **Step 8: Chiudere la fase**

Chiedi all'utente come integrare il lavoro (merge in `main` + push, oppure PR). Non fare merge senza conferma.

---

## Criteri di accettazione (dallo spec)

- [ ] Un membro loggato può vedere e modificare il proprio profilo, compreso l'avatar. *(Task 3, 4)*
- [ ] L'avatar compare nell'header accanto al menu ed è link a `/profilo`. *(Task 5)*
- [ ] Un membro loggato può cercare altri membri per nome o tag e aprirne il profilo in sola lettura. *(Task 6, 7)*
- [ ] Un utente non loggato non raggiunge nessuna di queste pagine. *(layout `(auth)`; verificato nei Task 3, 6, 7 e 8)*
- [ ] Il `tag` resta unico e il `role` non è modificabile dall'utente. *(Task 3 per `23505`; Task 8 per la RLS)*
