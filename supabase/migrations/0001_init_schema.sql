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
