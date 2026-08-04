import type { EventoPerCard } from "@/components/features/events/EventCard";
import type { Event } from "@/types/database";

/**
 * Le colonne che servono davvero a `EventCard` e a `statoEvento`/`eConcluso`.
 *
 * `select("*")` consegnerebbe anche `created_by` (FK a `profiles`) a chiunque: la lettura
 * degli eventi è pubblica (`events_select_public` vale pure per gli sloggati, D-146), ma
 * l'identità dei membri no (`profiles_select_authenticated`). Le RLS filtrano le RIGHE,
 * non le colonne: qui la difesa è applicativa, quindi niente colonne in più di quelle usate.
 *
 * Vive qui e non dentro una pagina perché la usano sia `/eventi` sia la home: due copie
 * della stessa lista sono due occasioni di aggiungere `created_by` per distrazione.
 */
export const COLONNE_PUBBLICHE =
  "id, slug, title, location, starts_at, ends_at, status, type, cover_url";

/** `id` serve alla `key` di React; il resto sono i campi che `EventCard` dichiara di usare. */
export type EventoPubblico = EventoPerCard & Pick<Event, "id">;
