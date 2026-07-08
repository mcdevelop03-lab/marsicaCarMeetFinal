# Fase 1A — Backend + Auth · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dotare Marsica Car Meet di un backend Supabase reale (schema + RLS + Storage) e di un'autenticazione completa (email+conferma, Google, Turnstile, 2FA TOTP), con aree membro/admin protette a due livelli.

**Architecture:** Next.js 16 App Router + Supabase (`@supabase/ssr`). Operazioni auth via **Server Actions**; unico Route Handler per il callback OAuth/email. `proxy.ts` compone next-intl con il refresh sessione Supabase. Schema e RLS versionati in `supabase/migrations/`. Guardie server-side (`lib/auth`) + RLS nel DB. Design/spec: [`../specs/2026-07-08-fase1a-backend-auth-design.md`](../specs/2026-07-08-fase1a-backend-auth-design.md).

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, TailwindCSS 4, next-intl, @supabase/ssr, @supabase/supabase-js, supabase CLI (via npx), zod, Cloudflare Turnstile, Docker.

## Global Constraints

- **Node** ≥ 20, **npm** 10.x. Working dir del progetto Next: `marsicaCarMeetFinal/marsicaCarMeetFinal/` (root git annidata).
- **Next.js 16** (NON 15): prima di scrivere codice che tocca API Next, consultare `node_modules/next/dist/docs/` e rispettare le deprecazioni. Convenzione file: `proxy.ts` (NON `middleware.ts`).
- **Nessun colore hardcoded**: solo token del tema (`bg-background`, `text-accent-red`, ecc.).
- **Tutte le stringhe UI** passano da `next-intl` (`src/messages/it.json`); lingua IT, routing `/it`.
- `Link`/navigazione localizzata **sempre** da `@/i18n/navigation` (mai `next/link` diretto per link interni).
- **Segreti**: `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY` **solo server**, mai in codice client né in variabili `NEXT_PUBLIC_*`.
- **Guardie**: usare sempre `supabase.auth.getUser()` (valida col server), MAI `getSession()` per decisioni di autorizzazione.
- **Branch:** lavorare su `feat/fase1a-backend-auth` (non `main`).
- **Verifica**: il progetto non ha framework di test unit. Ogni task si verifica con comandi concreti (SQL su stack locale, `npm run build`/`lint`, `npx tsc --noEmit`, collaudo runtime dei flussi). Nessun unit-test inventato.
- **Commit**: uno per task (o sotto-passo logico), messaggi `feat(fase1a)/chore/fix`, con footer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure (target a fine 1A)

```
marsicaCarMeetFinal/
  supabase/
    config.toml                       # da `npx supabase init`
    migrations/
      0001_init_schema.sql            # enum, tabelle, indici, trigger handle_new_user
      0002_rls_policies.sql           # is_admin() + policy RLS
      0003_storage_buckets.sql        # bucket + policy storage
    seed.sql                          # promozione primo admin
  .env.local                          # (gitignored) chiavi Supabase/Turnstile/Google locali
  src/
    proxy.ts                          # next-intl + refresh sessione Supabase
    lib/
      supabase/
        client.ts server.ts           # esistenti
        middleware.ts                 # helper updateSession() per il proxy
      auth/index.ts                   # getUser/getProfile/requireUser/requireAdmin
      turnstile.ts                    # verifyTurnstile(token)
      validation/auth.ts              # schemi zod (signup/login/reset)
    app/[locale]/
      (public)/
        page.tsx eventi/ garage/ gadget/ privacy/ cookie/   # spostati qui
        login/page.tsx
        registrati/page.tsx
        reset-password/page.tsx
        auth/callback/route.ts
        auth/actions.ts               # Server Actions auth
      (auth)/
        layout.tsx                    # requireUser()
        dashboard/page.tsx
        impostazioni/page.tsx
        impostazioni/actions.ts       # Server Actions 2FA
      (admin)/
        layout.tsx                    # requireAdmin()
        admin/page.tsx
      layout.tsx not-found.tsx        # invariati
    components/features/auth/
      TurnstileWidget.tsx
      AuthForm.tsx                    # wrapper form + errori
      TwoFactorSetup.tsx
    types/database.ts                 # tipi tabelle (manuale, minimale)
```

---

## Task 1: Setup Supabase (CLI, stack locale, progetto cloud, env)

**Files:**
- Create: `supabase/config.toml` (da init), `.env.local`
- Modify: `package.json` (devDependency supabase, script), `.gitignore` (già ignora `.env*`)

**Interfaces:**
- Produces: stack Supabase locale attivo (API/DB/Studio/Inbucket) e credenziali in `.env.local`. Progetto cloud creato e `link`ato.

- [ ] **Step 1: Creare il branch di lavoro**

Run:
```bash
git checkout -b feat/fase1a-backend-auth
```
Expected: `Switched to a new branch 'feat/fase1a-backend-auth'`

- [ ] **Step 2: Installare la Supabase CLI come dev-dependency**

Run:
```bash
npm install -D supabase
```
Expected: `supabase` compare in `devDependencies`. (Install globale via npm è deprecata: si usa `npx supabase`.)

- [ ] **Step 3: Inizializzare Supabase nel progetto**

Run:
```bash
npx supabase init
```
Expected: crea `supabase/config.toml` e `supabase/` . Rispondere "N" a eventuali prompt su VS Code/Deno settings.

- [ ] **Step 4: Avviare Docker Desktop, poi lo stack locale**

Avviare **Docker Desktop** (il daemon risultava non attivo) e attendere che sia "running". Poi:
```bash
npx supabase start
```
Expected: output con `API URL: http://127.0.0.1:54321`, `DB URL`, `Studio URL: http://127.0.0.1:54323`, `Inbucket URL: http://127.0.0.1:54324`, `anon key`, `service_role key`. Annotare `anon key` e `service_role key`.

- [ ] **Step 5: Creare `.env.local` con le chiavi locali**

Creare `.env.local` (gitignored) con i valori dallo Step 4:
```bash
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key locale>"
SUPABASE_SERVICE_ROLE_KEY="<service_role key locale>"
# Turnstile (test keys Cloudflare: passano sempre) — sostituire con reali sul cloud
NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
```
> Le [test keys Turnstile](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) `1x0000...` validano sempre: permettono di sviluppare login/registrazione in locale senza account Cloudflare. Le chiavi reali si mettono per il cloud (Task 10/oltre).

- [ ] **Step 6: Creare il progetto Supabase cloud e collegarlo (guidato)**

Guidare l'utente:
1. Su [supabase.com](https://supabase.com) → New project (regione EU, es. Frankfurt), scegliere una password DB.
2. In **Project Settings → API**: copiare `Project URL`, `anon public key`, `service_role key`.
3. In **Project Settings → General**: copiare il **Reference ID**.
4. Collegare:
```bash
npx supabase link --project-ref <REFERENCE_ID>
```
Expected: `Finished supabase link.` (chiede la password DB).
> Le chiavi cloud NON vanno in `.env.local` (che resta locale): serviranno nel deploy. Per ora si sviluppa in locale.

- [ ] **Step 7: Verificare che il dev server Next parta con le env locali**

Run:
```bash
npm run dev
```
Expected: server su `http://localhost:3000`, `/it` risponde 200 (nessun errore su env Supabase). Fermare il server dopo la verifica.

- [ ] **Step 8: Commit**

```bash
git add supabase/config.toml package.json package-lock.json
git commit -m "chore(fase1a): setup Supabase CLI, stack locale e link progetto cloud"
```
> `.env.local` NON viene committato (gitignored).

---

## Task 2: Migrazione schema (`0001_init_schema.sql`)

**Files:**
- Create: `supabase/migrations/0001_init_schema.sql`

**Interfaces:**
- Produces: enum (`user_role`,`event_status`,`event_type`,`registration_status`,`media_type`); tabelle `profiles`,`vehicles`,`events`,`event_registrations`,`event_vehicles`,`event_media`; trigger `handle_new_user`.

- [ ] **Step 1: Scrivere la migrazione schema**

Create `supabase/migrations/0001_init_schema.sql`:
```sql
-- Enums
create type public.user_role as enum ('member', 'organizer', 'admin');
create type public.event_status as enum ('upcoming', 'ongoing', 'completed', 'canceled');
create type public.event_type as enum ('raduno', 'giro', 'sociale');
create type public.registration_status as enum ('going', 'waitlist', 'canceled');
create type public.media_type as enum ('image', 'video');

-- profiles (1:1 con auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  tag text unique,
  avatar_url text,
  role public.user_role not null default 'member',
  bio text,
  town text,
  socials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  year int not null,
  image_url text not null,
  category text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index vehicles_owner_id_idx on public.vehicles(owner_id);

-- events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  location text,
  coords jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int,
  status public.event_status not null default 'upcoming',
  type public.event_type not null,
  map_url text,
  cover_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index events_status_idx on public.events(status);
create index events_slug_idx on public.events(slug);

-- event_registrations
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.registration_status not null default 'going',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index event_registrations_event_id_idx on public.event_registrations(event_id);
create index event_registrations_user_id_idx on public.event_registrations(user_id);

-- event_vehicles
create table public.event_vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  unique (registration_id, vehicle_id)
);

-- event_media
create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  uploader_id uuid references public.profiles(id) on delete set null,
  type public.media_type not null,
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);
create index event_media_event_id_idx on public.event_media(event_id);

-- Trigger: crea un profilo alla registrazione di un utente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_tag text;
begin
  base_tag := coalesce(nullif(new.raw_user_meta_data->>'tag', ''), split_part(new.email, '@', 1));
  insert into public.profiles (id, name, tag)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    -- garantisce unicità: appende parte dell'uuid se il tag base è già preso
    base_tag || '-' || substr(new.id::text, 1, 4)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Applicare la migrazione in locale**

Run:
```bash
npx supabase db reset
```
Expected: ricrea il DB locale applicando `0001_init_schema.sql` senza errori (`Applying migration 0001_init_schema.sql...`).

- [ ] **Step 3: Verificare tabelle ed enum**

Run:
```bash
npx supabase db reset >/dev/null 2>&1; docker exec supabase_db_marsica-car-meet psql -U postgres -c "\dt public.*"
```
> Se il nome container differisce, ricavarlo con `docker ps --format '{{.Names}}' | grep supabase_db`. In alternativa aprire Studio (`http://127.0.0.1:54323`) → Table editor.
Expected: elenco con `profiles, vehicles, events, event_registrations, event_vehicles, event_media`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init_schema.sql
git commit -m "feat(fase1a): schema DB Fase 1 (tabelle, enum, trigger profilo)"
```

---

## Task 3: RLS policies (`0002_rls_policies.sql`)

**Files:**
- Create: `supabase/migrations/0002_rls_policies.sql`

**Interfaces:**
- Consumes: tabelle del Task 2.
- Produces: `public.is_admin()`; RLS abilitata + policy per ogni tabella (regole da USER_ROLES §4).

- [ ] **Step 1: Scrivere le policy RLS**

Create `supabase/migrations/0002_rls_policies.sql`:
```sql
-- Helper: l'utente corrente è admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Abilita RLS
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_vehicles enable row level security;
alter table public.event_media enable row level security;

-- profiles: lettura solo loggati; update solo self (senza cambiare role) o admin
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.uid() is not null);
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- vehicles: lettura loggati; scrittura solo owner; admin tutto
create policy "vehicles_select_authenticated" on public.vehicles
  for select using (auth.uid() is not null);
create policy "vehicles_insert_owner" on public.vehicles
  for insert with check (owner_id = auth.uid());
create policy "vehicles_update_owner" on public.vehicles
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "vehicles_delete_owner_or_admin" on public.vehicles
  for delete using (owner_id = auth.uid() or public.is_admin());

-- events: lettura pubblica; scrittura solo admin
create policy "events_select_public" on public.events
  for select using (true);
create policy "events_admin_write" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

-- event_registrations: self o admin
create policy "registrations_select_self_or_admin" on public.event_registrations
  for select using (user_id = auth.uid() or public.is_admin());
create policy "registrations_insert_self" on public.event_registrations
  for insert with check (user_id = auth.uid());
create policy "registrations_update_self_or_admin" on public.event_registrations
  for update using (user_id = auth.uid() or public.is_admin());
create policy "registrations_delete_self_or_admin" on public.event_registrations
  for delete using (user_id = auth.uid() or public.is_admin());

-- event_vehicles: legato alla propria registrazione, o admin
create policy "event_vehicles_select" on public.event_vehicles
  for select using (
    public.is_admin() or exists (
      select 1 from public.event_registrations r
      where r.id = registration_id and r.user_id = auth.uid()
    )
  );
create policy "event_vehicles_insert" on public.event_vehicles
  for insert with check (
    exists (
      select 1 from public.event_registrations r
      where r.id = registration_id and r.user_id = auth.uid()
    )
  );
create policy "event_vehicles_delete" on public.event_vehicles
  for delete using (
    public.is_admin() or exists (
      select 1 from public.event_registrations r
      where r.id = registration_id and r.user_id = auth.uid()
    )
  );

-- event_media: lettura pubblica; scrittura solo admin
create policy "event_media_select_public" on public.event_media
  for select using (true);
create policy "event_media_admin_write" on public.event_media
  for all using (public.is_admin()) with check (public.is_admin());
```

- [ ] **Step 2: Applicare e verificare**

Run:
```bash
npx supabase db reset
```
Expected: applica `0001` e `0002` senza errori.

- [ ] **Step 3: Verificare che RLS sia abilitata**

Run:
```bash
docker exec $(docker ps --format '{{.Names}}' | grep supabase_db) psql -U postgres -c "select relname, relrowsecurity from pg_class where relname in ('profiles','vehicles','events','event_registrations','event_vehicles','event_media');"
```
Expected: tutte le righe con `relrowsecurity = t`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_rls_policies.sql
git commit -m "feat(fase1a): RLS policies + helper is_admin()"
```

---

## Task 4: Storage buckets (`0003_storage_buckets.sql`) + seed primo admin

**Files:**
- Create: `supabase/migrations/0003_storage_buckets.sql`, `supabase/seed.sql`

**Interfaces:**
- Produces: bucket `avatars`,`vehicles`,`event-covers`,`event-media` con policy; procedura seed primo admin.

- [ ] **Step 1: Scrivere migrazione bucket + policy storage**

Create `supabase/migrations/0003_storage_buckets.sql`:
```sql
-- Bucket (public=true → lettura via URL pubblico; scrittura sempre regolata da policy)
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('vehicles', 'vehicles', true),
  ('event-covers', 'event-covers', true),
  ('event-media', 'event-media', true)
on conflict (id) do nothing;

-- avatars/vehicles: scrittura solo nella propria cartella {uid}/...
create policy "avatars_write_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vehicles_write_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicles_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicles_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vehicles' and (storage.foldername(name))[1] = auth.uid()::text);

-- event-covers / event-media: scrittura solo admin
create policy "event_covers_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'event-covers' and public.is_admin())
  with check (bucket_id = 'event-covers' and public.is_admin());
create policy "event_media_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'event-media' and public.is_admin())
  with check (bucket_id = 'event-media' and public.is_admin());
```

- [ ] **Step 2: Scrivere `supabase/seed.sql` (promozione primo admin)**

> **INPUT UTENTE RICHIESTO:** chiedere all'utente quale email sarà il primo admin (default suggerito: `aidev3@goproject.it`). Il seed promuove a `admin` il profilo con quell'email, DOPO che l'utente si è registrato.

Create `supabase/seed.sql`:
```sql
-- Promuove a admin il profilo associato all'email indicata.
-- L'utente deve essersi PRIMA registrato (così esistono auth.users + profiles).
-- Sostituire l'email con quella concordata col cliente.
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email = 'aidev3@goproject.it';
```
> `supabase db reset` esegue anche `seed.sql`, ma a DB appena creato non ci sono utenti: la promozione diventa effettiva dopo la prima registrazione. In alternativa, dopo esserti registrato, eseguire il solo UPDATE via Studio SQL editor.

- [ ] **Step 3: Applicare e verificare i bucket**

Run:
```bash
npx supabase db reset
docker exec $(docker ps --format '{{.Names}}' | grep supabase_db) psql -U postgres -c "select id, public from storage.buckets order by id;"
```
Expected: 4 righe (`avatars`,`event-covers`,`event-media`,`vehicles`) con `public = t`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_storage_buckets.sql supabase/seed.sql
git commit -m "feat(fase1a): bucket Storage con policy + seed primo admin"
```

---

## Task 5: Client Supabase, helper auth e composizione proxy

**Files:**
- Create: `src/lib/supabase/middleware.ts`, `src/lib/auth/index.ts`, `src/types/database.ts`
- Modify: `src/proxy.ts`

**Interfaces:**
- Consumes: `createServerClient` (@supabase/ssr), `routing` (`@/i18n/routing`), middleware next-intl.
- Produces:
  - `updateSession(request: NextRequest, response: NextResponse): Promise<NextResponse>` da `@/lib/supabase/middleware`.
  - `getUser(): Promise<User | null>`, `getProfile(): Promise<Profile | null>`, `requireUser(): Promise<User>`, `requireAdmin(): Promise<Profile>` da `@/lib/auth`.
  - `type Profile` da `@/types/database`.

- [ ] **Step 1: Definire i tipi minimi del database**

Create `src/types/database.ts`:
```ts
export type UserRole = "member" | "organizer" | "admin";

export type Profile = {
  id: string;
  name: string | null;
  tag: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  town: string | null;
  socials: Record<string, string>;
  created_at: string;
};
```

- [ ] **Step 2: Helper di refresh sessione per il proxy**

Create `src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Aggiorna i cookie di sessione Supabase sulla `response` passata (creata da next-intl).
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: non inserire logica tra createServerClient e getUser().
  await supabase.auth.getUser();
  return response;
}
```

- [ ] **Step 3: Comporre next-intl + Supabase nel proxy**

Replace `src/proxy.ts`:
```ts
import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18n = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);
  return updateSession(request, response);
}

export const config = {
  matcher: ["/", "/(it|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 4: Helper di autorizzazione server-side**

Create `src/lib/auth/index.ts`:
```ts
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();
  return (data as Profile) ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect({ href: "/login", locale: "it" });
  return user!;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect({ href: "/login", locale: "it" });
  if (profile!.role !== "admin") redirect({ href: "/dashboard", locale: "it" });
  return profile!;
}
```
> Nota: `redirect` da `@/i18n/navigation` richiede `locale`. In App Router, `redirect()` lancia internamente, quindi il `!` post-redirect è sicuro.

- [ ] **Step 5: Verificare build e typecheck**

Run:
```bash
npx tsc --noEmit && npm run build
```
Expected: entrambi verdi (nessun errore di tipo su `updateSession`/`requireAdmin`).

- [ ] **Step 6: Verificare che il refresh sessione non rompa il routing**

Run `npm run dev`, poi:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/it
```
Expected: `/` → 307 verso `/it`; `/it` → 200. Fermare il server.

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase/middleware.ts src/lib/auth/index.ts src/types/database.ts src/proxy.ts
git commit -m "feat(fase1a): refresh sessione nel proxy + helper auth (getUser/requireAdmin)"
```

---

## Task 6: Route groups `(public)`/`(auth)`/`(admin)` + guardie

**Files:**
- Move: pagine esistenti sotto `src/app/[locale]/(public)/`
- Create: `src/app/[locale]/(auth)/layout.tsx`, `(auth)/dashboard/page.tsx`, `(admin)/layout.tsx`, `(admin)/admin/page.tsx`
- Modify: `src/messages/it.json`

**Interfaces:**
- Consumes: `requireUser`, `requireAdmin` (Task 5).
- Produces: aree protette; URL invariati (i route group non compaiono nell'URL).

- [ ] **Step 1: Spostare le pagine pubbliche nel gruppo `(public)`**

Run (bash, dalla root del progetto Next):
```bash
cd "src/app/[locale]"
mkdir -p "(public)"
git mv page.tsx eventi garage gadget privacy cookie login registrati "(public)/"
cd -
```
Expected: `page.tsx` e le cartelle ora sotto `(public)/`; `layout.tsx` e `not-found.tsx` restano in `[locale]/`.

- [ ] **Step 2: Verificare che gli URL pubblici rispondano ancora**

Run `npm run build`.
Expected: build ok; le rotte `/it`, `/it/eventi`, ecc. restano invariate (i route group non cambiano gli URL). Fermare eventuale server.

- [ ] **Step 3: Layout protetto `(auth)` con `requireUser`**

Create `src/app/[locale]/(auth)/layout.tsx`:
```tsx
import { requireUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
```

- [ ] **Step 4: Pagina `dashboard` minima**

Create `src/app/[locale]/(auth)/dashboard/page.tsx`:
```tsx
import { getProfile } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";

export default async function DashboardPage() {
  const profile = await getProfile();
  const t = await getTranslations("dashboard");
  return (
    <div className="space-y-6">
      <SectionHeading>{t("title")}</SectionHeading>
      <p className="font-mono text-xs text-white/60 uppercase tracking-widest">
        {t("greeting", { name: profile?.name ?? profile?.tag ?? "" })}
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Layout `(admin)` con `requireAdmin` + pagina admin**

Create `src/app/[locale]/(admin)/layout.tsx`:
```tsx
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
```
Create `src/app/[locale]/(admin)/admin/page.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";

export default async function AdminPage() {
  const t = await getTranslations("admin");
  return (
    <div className="space-y-6">
      <SectionHeading>{t("title")}</SectionHeading>
      <p className="font-mono text-xs text-white/40 uppercase tracking-widest">{t("placeholder")}</p>
    </div>
  );
}
```

- [ ] **Step 6: Aggiungere le chiavi i18n**

In `src/messages/it.json` aggiungere (accanto alle sezioni esistenti):
```json
  "dashboard": {
    "title": "Dashboard",
    "greeting": "Ciao {name}"
  },
  "admin": {
    "title": "Pannello Admin",
    "placeholder": "In arrivo"
  }
```

- [ ] **Step 7: Verificare guardie (redirect al login)**

Run `npm run dev`, poi:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/it/dashboard
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/it/admin
```
Expected: entrambe reindirizzano a `/it/login` (307) essendo non autenticati. Fermare il server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(fase1a): route groups (public)/(auth)/(admin) con guardie server-side"
```

---

## Task 7: Turnstile + validazione zod + shell UI auth

**Files:**
- Create: `src/lib/turnstile.ts`, `src/lib/validation/auth.ts`, `src/components/features/auth/TurnstileWidget.tsx`, `src/components/features/auth/AuthForm.tsx`
- Modify: `package.json` (zod), `src/messages/it.json`

**Interfaces:**
- Produces:
  - `verifyTurnstile(token: string | null): Promise<boolean>` da `@/lib/turnstile`.
  - `signupSchema`, `loginSchema`, `resetSchema` (zod) da `@/lib/validation/auth`.
  - `<TurnstileWidget />` (client) che inserisce un input hidden `cf-turnstile-response`.
  - `<AuthForm action title submitLabel>` wrapper con stato errore via `useActionState`.

- [ ] **Step 1: Installare zod**

Run: `npm install zod`
Expected: `zod` in `dependencies`.

- [ ] **Step 2: Schemi di validazione**

Create `src/lib/validation/auth.ts`:
```ts
import * as z from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Nome troppo corto").trim(),
  email: z.string().email("Email non valida").trim(),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export const loginSchema = z.object({
  email: z.string().email("Email non valida").trim(),
  password: z.string().min(1, "Inserisci la password"),
});

export const resetSchema = z.object({
  email: z.string().email("Email non valida").trim(),
});
```

- [ ] **Step 3: Verifica Turnstile server-side**

Create `src/lib/turnstile.ts`:
```ts
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
    }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
```

- [ ] **Step 4: Widget Turnstile (client)**

Create `src/components/features/auth/TurnstileWidget.tsx`:
```tsx
"use client";
import Script from "next/script";

// Renderizza il widget Turnstile; il token finisce in un input hidden `cf-turnstile-response`
// che viene inviato con il form (letto server-side come formData.get("cf-turnstile-response")).
export default function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
    </>
  );
}
```

- [ ] **Step 5: Wrapper form con stato errore**

Create `src/components/features/auth/AuthForm.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

export type AuthState = { error?: string; success?: string };

export default function AuthForm({
  action,
  title,
  submitLabel,
  children,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  title: string;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="max-w-sm space-y-6">
      <SectionHeading>{title}</SectionHeading>
      {children}
      {state.error && (
        <p className="text-xs font-mono text-accent-red">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs font-mono text-accent-orange">{state.success}</p>
      )}
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 6: Chiavi i18n auth**

In `src/messages/it.json` aggiungere sezione `auth`:
```json
  "auth": {
    "loginTitle": "Accedi",
    "signupTitle": "Registrati",
    "resetTitle": "Recupera password",
    "email": "Email",
    "password": "Password",
    "name": "Nome",
    "submitLogin": "Accedi",
    "submitSignup": "Crea account",
    "submitReset": "Invia link",
    "google": "Continua con Google",
    "checkEmail": "Ti abbiamo inviato un'email di conferma. Controlla la posta.",
    "resetSent": "Se l'email esiste, riceverai un link per reimpostare la password.",
    "genericError": "Qualcosa è andato storto. Riprova.",
    "invalidCredentials": "Credenziali non valide.",
    "turnstileFailed": "Verifica anti-bot non superata.",
    "twoFactorPrompt": "Inserisci il codice dell'app di autenticazione",
    "twoFactorCode": "Codice 2FA",
    "noAccount": "Non hai un account?",
    "hasAccount": "Hai già un account?",
    "forgotPassword": "Password dimenticata?"
  },
  "settings": {
    "title": "Impostazioni",
    "twoFactor": "Autenticazione a due fattori (2FA)",
    "enable2fa": "Attiva 2FA",
    "disable2fa": "Disattiva 2FA",
    "scanQr": "Scansiona il QR con la tua app authenticator, poi inserisci il codice.",
    "verify": "Verifica",
    "enabled2fa": "2FA attiva",
    "code": "Codice"
  }
```

- [ ] **Step 7: Verificare typecheck/build**

Run: `npx tsc --noEmit && npm run build`
Expected: verdi.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(fase1a): Turnstile, validazione zod e shell UI form auth"
```

---

## Task 8: Registrazione + conferma email + callback

**Files:**
- Create: `src/app/[locale]/(public)/auth/actions.ts`, `src/app/[locale]/(public)/auth/callback/route.ts`
- Modify: `src/app/[locale]/(public)/registrati/page.tsx`

**Interfaces:**
- Consumes: `verifyTurnstile`, `signupSchema`, `AuthForm`, `TurnstileWidget`, `createClient` (server).
- Produces: Server Action `signup(state, formData)`; Route Handler `GET /[locale]/auth/callback`.

- [ ] **Step 1: Server Action di registrazione**

Create `src/app/[locale]/(public)/auth/actions.ts`:
```ts
"use server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { signupSchema } from "@/lib/validation/auth";
import type { AuthState } from "@/components/features/auth/AuthForm";

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const turnstileOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
  );
  if (!turnstileOk) return { error: "Verifica anti-bot non superata." };

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: `${origin}/it/auth/callback`,
    },
  });
  if (error) return { error: "Qualcosa è andato storto. Riprova." };
  return { success: "Ti abbiamo inviato un'email di conferma. Controlla la posta." };
}
```

- [ ] **Step 2: Route Handler callback (scambio code)**

Create `src/app/[locale]/(public)/auth/callback/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/it/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/it/login?error=auth`);
}
```

- [ ] **Step 3: Pagina registrati**

Replace `src/app/[locale]/(public)/registrati/page.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthForm from "@/components/features/auth/AuthForm";
import TurnstileWidget from "@/components/features/auth/TurnstileWidget";
import Input from "@/components/ui/Input";
import { signup } from "../auth/actions";

export default async function RegistratiPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-4">
      <AuthForm action={signup} title={t("signupTitle")} submitLabel={t("submitSignup")}>
        <Input name="name" placeholder={t("name")} required />
        <Input name="email" type="email" placeholder={t("email")} required />
        <Input name="password" type="password" placeholder={t("password")} required />
        <TurnstileWidget />
      </AuthForm>
      <p className="text-xs font-mono text-white/40">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-accent-red">{t("loginTitle")}</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verificare registrazione end-to-end (Inbucket locale)**

Run `npm run dev`. Nel browser: `/it/registrati` → compilare (Turnstile test-key passa) → submit. Poi aprire **Inbucket** `http://127.0.0.1:54324` → aprire l'email di conferma → cliccare il link → deve reindirizzare a `/it/dashboard` (ora accessibile).
Expected: profilo creato (verifica: `select id, tag, role from public.profiles;` via Studio → 1 riga).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(fase1a): registrazione + conferma email + callback OAuth/email"
```

---

## Task 9: Login + logout (+ sfida 2FA)

**Files:**
- Modify: `src/app/[locale]/(public)/auth/actions.ts` (aggiunge `login`, `logout`)
- Modify: `src/app/[locale]/(public)/login/page.tsx`

**Interfaces:**
- Consumes: `loginSchema`, `verifyTurnstile`, `createClient`.
- Produces: Server Action `login(state, formData)`, `logout()`.

- [ ] **Step 1: Azioni login/logout**

Append a `src/app/[locale]/(public)/auth/actions.ts`:
```ts
import { redirect } from "@/i18n/navigation";
import { loginSchema } from "@/lib/validation/auth";

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const turnstileOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
  );
  if (!turnstileOk) return { error: "Verifica anti-bot non superata." };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: "Credenziali non valide." };

  // Se l'utente ha 2FA attiva, la sessione è "aal1": va completata la sfida.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
    redirect({ href: "/login?mfa=1", locale: "it" });
  }
  redirect({ href: "/dashboard", locale: "it" });
  return {};
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/", locale: "it" });
}
```
> La UI completa della sfida TOTP (campo codice → `mfa.challengeAndVerify`) viene gestita nella pagina login quando `?mfa=1`. Per 1A è sufficiente reindirizzare e mostrare il campo codice; la verifica usa `mfa.challengeAndVerify({ factorId, code })` sul factor `totp` dell'utente.

- [ ] **Step 2: Pagina login (con campo 2FA condizionale)**

Replace `src/app/[locale]/(public)/login/page.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthForm from "@/components/features/auth/AuthForm";
import TurnstileWidget from "@/components/features/auth/TurnstileWidget";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { login } from "../auth/actions";
import { verifyMfa } from "../auth/actions-mfa";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mfa?: string }>;
}) {
  const t = await getTranslations("auth");
  const { mfa } = await searchParams;

  if (mfa === "1") {
    return (
      <form action={verifyMfa} className="max-w-sm space-y-6">
        <p className="text-xs font-mono text-white/60">{t("twoFactorPrompt")}</p>
        <Input name="code" inputMode="numeric" placeholder={t("twoFactorCode")} required />
        <Button type="submit">{t("submitLogin")}</Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <AuthForm action={login} title={t("loginTitle")} submitLabel={t("submitLogin")}>
        <Input name="email" type="email" placeholder={t("email")} required />
        <Input name="password" type="password" placeholder={t("password")} required />
        <TurnstileWidget />
      </AuthForm>
      <div className="text-xs font-mono text-white/40 space-y-1">
        <p>
          <Link href="/reset-password" className="text-accent-red">{t("forgotPassword")}</Link>
        </p>
        <p>
          {t("noAccount")}{" "}
          <Link href="/registrati" className="text-accent-red">{t("signupTitle")}</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Azione di verifica MFA al login**

Create `src/app/[locale]/(public)/auth/actions-mfa.ts`:
```ts
"use server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function verifyMfa(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (totp) {
    await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code });
  }
  redirect({ href: "/dashboard", locale: "it" });
}
```

- [ ] **Step 4: Bottone logout nella dashboard**

In `src/app/[locale]/(auth)/dashboard/page.tsx` aggiungere in fondo al JSX, importando l'azione:
```tsx
import { logout } from "../../(public)/auth/actions";
import Button from "@/components/ui/Button";
// ...dentro il return, dopo il <p>:
      <form action={logout}>
        <Button variant="outline" type="submit">Logout</Button>
      </form>
```

- [ ] **Step 5: Verificare login/logout end-to-end**

Run `npm run dev`. Con l'utente registrato al Task 8 (email confermata): `/it/login` → credenziali → `/it/dashboard` mostra "Ciao <nome>". Cliccare Logout → torna a `/it` e `/it/dashboard` reindirizza di nuovo al login.
Expected: ciclo login→dashboard→logout funzionante.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(fase1a): login/logout con Server Actions e sfida 2FA condizionale"
```

---

## Task 10: Google OAuth + Turnstile reali (cloud)

**Files:**
- Modify: `src/app/[locale]/(public)/login/page.tsx`, `registrati/page.tsx` (bottone Google), `src/app/[locale]/(public)/auth/actions.ts` (azione `signInWithGoogle`)

**Interfaces:**
- Produces: Server Action `signInWithGoogle()` che reindirizza a Google.

- [ ] **Step 1: Azione Google OAuth**

Append a `src/app/[locale]/(public)/auth/actions.ts`:
```ts
export async function signInWithGoogle(): Promise<void> {
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/it/auth/callback` },
  });
  if (data?.url) redirect(data.url); // redirect esterno: usa next/navigation redirect
}
```
> Qui `redirect` è quello di `next/navigation` (URL assoluto esterno), NON quello localizzato. Importarlo come `import { redirect as nextRedirect } from "next/navigation"` e usarlo per `data.url`.

- [ ] **Step 2: Bottone "Continua con Google"**

In `login/page.tsx` e `registrati/page.tsx`, sotto il form, aggiungere:
```tsx
import { signInWithGoogle } from "../auth/actions";
// ...
      <form action={signInWithGoogle}>
        <Button variant="outline" type="submit">{t("google")}</Button>
      </form>
```

- [ ] **Step 3: Configurare Google Cloud + Supabase (guidato, sul progetto cloud)**

Guidare l'utente:
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth client ID (tipo *Web application*).
2. Authorized redirect URI: `https://<REF>.supabase.co/auth/v1/callback` (dalla dashboard Supabase → Auth → Providers → Google).
3. In Supabase → **Authentication → Providers → Google**: incollare Client ID/Secret, abilitare.
4. In Supabase → **Authentication → URL Configuration**: aggiungere `http://localhost:3000` e l'eventuale dominio ai *Redirect URLs*.

- [ ] **Step 4: Configurare Turnstile reale (guidato)**

1. [Cloudflare dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) → Add site (domini: `localhost` e produzione).
2. Copiare **site key** e **secret key**; su cloud usarle al posto delle test-key.

- [ ] **Step 5: Verifica (sul progetto cloud)**

Puntando le env al progetto cloud (`.env.local` con URL/chiavi cloud), `npm run dev`: `/it/login` → "Continua con Google" → login Google → callback → `/it/dashboard`.
Expected: primo login Google crea `auth.users` + `profiles` (via trigger) e riporta in dashboard.
> Se non hai ancora configurato il cloud, questo task può essere completato più avanti: login email/password (Task 9) resta pienamente funzionante in locale.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(fase1a): login con Google OAuth + config Turnstile reale"
```

---

## Task 11: Reset password

**Files:**
- Create: `src/app/[locale]/(public)/reset-password/page.tsx`, `src/app/[locale]/(auth)/impostazioni/reset/page.tsx` (nuova password)
- Modify: `src/app/[locale]/(public)/auth/actions.ts` (azioni reset)

**Interfaces:**
- Produces: `requestReset(state, formData)`, `updatePassword(state, formData)`.

- [ ] **Step 1: Azioni reset**

Append a `src/app/[locale]/(public)/auth/actions.ts`:
```ts
import { resetSchema } from "@/lib/validation/auth";

export async function requestReset(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/it/auth/callback?next=/it/impostazioni/reset`,
  });
  // messaggio neutro (no user enumeration)
  return { success: "Se l'email esiste, riceverai un link per reimpostare la password." };
}

export async function updatePassword(_state: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "La password deve avere almeno 8 caratteri" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Qualcosa è andato storto. Riprova." };
  return { success: "Password aggiornata." };
}
```

- [ ] **Step 2: Pagina richiesta reset**

Create `src/app/[locale]/(public)/reset-password/page.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import AuthForm from "@/components/features/auth/AuthForm";
import Input from "@/components/ui/Input";
import { requestReset } from "../auth/actions";

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthForm action={requestReset} title={t("resetTitle")} submitLabel={t("submitReset")}>
      <Input name="email" type="email" placeholder={t("email")} required />
    </AuthForm>
  );
}
```

- [ ] **Step 3: Pagina nuova password (area auth, dopo il link)**

Create `src/app/[locale]/(auth)/impostazioni/reset/page.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import AuthForm from "@/components/features/auth/AuthForm";
import Input from "@/components/ui/Input";
import { updatePassword } from "../../../(public)/auth/actions";

export default async function NewPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthForm action={updatePassword} title={t("resetTitle")} submitLabel={t("submitReset")}>
      <Input name="password" type="password" placeholder={t("password")} required />
    </AuthForm>
  );
}
```

- [ ] **Step 4: Verifica reset end-to-end (Inbucket)**

Run `npm run dev`: `/it/reset-password` → email → Inbucket → link → `/it/impostazioni/reset` → nuova password → login con la nuova password.
Expected: cambio password funzionante.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(fase1a): reset password (richiesta + impostazione nuova password)"
```

---

## Task 12: 2FA enrollment in `/impostazioni`

**Files:**
- Create: `src/app/[locale]/(auth)/impostazioni/page.tsx`, `src/app/[locale]/(auth)/impostazioni/actions.ts`, `src/components/features/auth/TwoFactorSetup.tsx`

**Interfaces:**
- Consumes: `createClient` (server/browser), `mfa.*`.
- Produces: pagina impostazioni con attivazione/disattivazione 2FA TOTP.

- [ ] **Step 1: Azioni enroll/verify/unenroll**

Create `src/app/[locale]/(auth)/impostazioni/actions.ts`:
```ts
"use server";
import { createClient } from "@/lib/supabase/server";

export async function enrollTotp() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) return { error: "Impossibile avviare l'attivazione 2FA." };
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyTotp(factorId: string, code: string) {
  const supabase = await createClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) return { error: "Codice non valido." };
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  return error ? { error: "Codice non valido." } : { success: true };
}

export async function unenrollTotp(factorId: string) {
  const supabase = await createClient();
  await supabase.auth.mfa.unenroll({ factorId });
  return { success: true };
}
```

- [ ] **Step 2: Componente client TwoFactorSetup**

Create `src/components/features/auth/TwoFactorSetup.tsx`:
```tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { enrollTotp, verifyTotp } from "@/app/[locale]/(auth)/impostazioni/actions";

export default function TwoFactorSetup({ labels }: { labels: Record<string, string> }) {
  const [state, setState] = useState<{ factorId?: string; qr?: string; done?: boolean; error?: string }>({});
  const [code, setCode] = useState("");

  async function start() {
    const r = await enrollTotp();
    if ("error" in r) return setState({ error: r.error });
    setState({ factorId: r.factorId, qr: r.qr });
  }
  async function confirm() {
    if (!state.factorId) return;
    const r = await verifyTotp(state.factorId, code);
    setState((s) => ("error" in r ? { ...s, error: r.error } : { done: true }));
  }

  if (state.done) return <p className="text-xs font-mono text-accent-orange">{labels.enabled2fa}</p>;
  if (state.qr) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-white/60">{labels.scanQr}</p>
        <Image src={state.qr} alt="QR 2FA" width={180} height={180} unoptimized />
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={labels.code} inputMode="numeric" />
        {state.error && <p className="text-xs font-mono text-accent-red">{state.error}</p>}
        <Button onClick={confirm}>{labels.verify}</Button>
      </div>
    );
  }
  return <Button onClick={start}>{labels.enable2fa}</Button>;
}
```

- [ ] **Step 3: Pagina impostazioni**

Create `src/app/[locale]/(auth)/impostazioni/page.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import TwoFactorSetup from "@/components/features/auth/TwoFactorSetup";

export default async function ImpostazioniPage() {
  const t = await getTranslations("settings");
  const labels = {
    enable2fa: t("enable2fa"),
    disable2fa: t("disable2fa"),
    scanQr: t("scanQr"),
    verify: t("verify"),
    enabled2fa: t("enabled2fa"),
    code: t("code"),
  };
  return (
    <div className="space-y-6">
      <SectionHeading>{t("title")}</SectionHeading>
      <div className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-white/60">{t("twoFactor")}</h3>
        <TwoFactorSetup labels={labels} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verifica 2FA end-to-end**

Run `npm run dev`, login, `/it/impostazioni` → "Attiva 2FA" → scansiona QR con app authenticator (o inserisci il secret) → codice → "2FA attiva". Logout → login: dopo le credenziali deve chiedere il codice TOTP (`?mfa=1`) → inserendo il codice si entra in dashboard.
Expected: enrollment + sfida al login funzionanti.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(fase1a): attivazione 2FA TOTP in /impostazioni"
```

---

## Task 13: Verifica finale, docs e chiusura

**Files:**
- Modify: `docs/ROADMAP.md`, `docs/TODO.md`

**Interfaces:**
- Produces: build/lint/tsc verdi; checklist esito 1A; docs aggiornati.

- [ ] **Step 1: Lint + typecheck + build completi**

Run:
```bash
npm run lint && npx tsc --noEmit && npm run build
```
Expected: tutti verdi.

- [ ] **Step 2: Checklist esito 1A (collaudo runtime, stack locale)**

Con `npm run dev` e stack Supabase locale attivo, confermare:
- Registrazione → email (Inbucket) → conferma → `/it/dashboard`.
- Login email/password → dashboard; Logout → `/it`.
- `/it/dashboard` e `/it/admin` da NON loggato → redirect a `/it/login`.
- Promuovendo il proprio profilo ad `admin` (Studio SQL: `update profiles set role='admin' where ...`), `/it/admin` diventa accessibile.
- 2FA: attivazione in `/impostazioni` → sfida al login successivo.
- RLS: da Studio, come utente non-owner, UPDATE su `vehicles` altrui negato.

- [ ] **Step 3: Aggiornare ROADMAP e TODO**

In `docs/ROADMAP.md` (Fase 1) e `docs/TODO.md`, marcare come completati gli item coperti da 1A (auth completa, schema DB, RLS, guardie) e annotare che restano 1B/1C/1D. Aggiornare la data.

- [ ] **Step 4: Commit finale**

```bash
git add -A
git commit -m "chore(fase1a): verifica finale e aggiornamento ROADMAP/TODO"
```

- [ ] **Step 5: Chiusura branch**

Usare la skill **superpowers:finishing-a-development-branch** per verificare e integrare `feat/fase1a-backend-auth`.

---

## Self-Review

**Spec coverage (spec §):**
- Setup Supabase (CLI/local/cloud/env) → Task 1 ✅
- Schema completo Fase 1 + trigger → Task 2 ✅
- RLS + is_admin() → Task 3 ✅
- Storage buckets + seed admin → Task 4 ✅
- Proxy composition + auth helpers/guardie → Task 5 ✅
- Route groups (public)/(auth)/(admin) → Task 6 ✅
- Turnstile + validazione + shell UI → Task 7 ✅
- Registrazione + conferma email + callback → Task 8 ✅
- Login/logout + sfida 2FA → Task 9 ✅
- Google OAuth + Turnstile reale → Task 10 ✅
- Reset password → Task 11 ✅
- 2FA enrollment (/impostazioni) → Task 12 ✅
- Verifica e2e + docs → Task 13 ✅

**Placeholder scan:** l'unico "input da fornire" è l'email admin (Task 4) — dato dell'utente, non gap di piano; e la config account esterni (Google/Turnstile) isolata in task guidati. Nessun TODO/TBD nel codice.

**Type consistency:** `AuthState` definito in `AuthForm` e consumato dalle azioni; `Profile`/`UserRole` da `@/types/database` usati in `lib/auth`; `updateSession`/`getUser`/`requireUser`/`requireAdmin` coerenti tra Task 5 e consumatori (Task 6). `createClient` server/browser dai moduli esistenti. `redirect` localizzato (`@/i18n/navigation`) vs `next/navigation` per URL esterni (Google) esplicitato nel Task 10.

**Note aperte per 1B/1C/1D:** UI profilo+avatar e garage CRUD (1B); eventi/RSVP/album media (1C); cookie banner + pagine GDPR reali (1D).
```
