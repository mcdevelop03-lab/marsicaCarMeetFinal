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

// Sottoinsieme di Profile usato nelle card dei risultati. `tag` è non-nullo:
// i profili senza tag non sono raggiungibili da /membri/[tag] e vanno filtrati.
export type MemberSummary = {
  id: string;
  name: string | null;
  tag: string;
  avatar_url: string | null;
  town: string | null;
};

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

export const EVENT_TYPES = ["raduno", "giro", "sociale"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// L'enum `event_status` del DB ha quattro valori, ma con lo stato derivato dalle date
// ne scriviamo solo due: 'upcoming' (= non annullato) e 'canceled'. Vedi la migrazione
// 0008 e `src/lib/events/stato.ts`.
export type EventStatusDb = "upcoming" | "ongoing" | "completed" | "canceled";

export type Event = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  // Riservato alla mappa interattiva della Fase 2: la 1C-1 non lo tocca.
  coords: unknown | null;
  starts_at: string; // NOT NULL dalla migrazione 0008
  ends_at: string | null;
  capacity: number | null;
  status: EventStatusDb;
  type: EventType;
  map_url: string | null;
  cover_url: string | null;
  cover_path: string | null; // colonna aggiunta dalla migrazione 0008
  created_by: string | null;
  created_at: string;
};
