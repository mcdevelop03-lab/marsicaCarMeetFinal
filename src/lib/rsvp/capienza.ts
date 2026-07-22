import { eConcluso, statoEvento } from "@/lib/events/stato";
import type { Event } from "@/types/database";

// Il minimo che serve per decidere lo stato dell'iscrizione: comodo per i test e per le
// select parziali. La capienza e il numero di iscritti arrivano a parte (fonti diverse:
// la capienza dall'evento, il conteggio dalla funzione SQL `iscritti_per_eventi`).
type EventoPerIscrizione = Pick<Event, "status" | "starts_at" | "ends_at">;

/** Posti ancora liberi. `null` = capienza illimitata (nessun limite). Non scende sotto 0. */
export function postiRimasti(capacity: number | null, iscritti: number): number | null {
  if (capacity === null) return null;
  return Math.max(0, capacity - iscritti);
}

/** L'evento ha esaurito i posti? Con capienza illimitata (`null`) non è mai esaurito. */
export function eEsaurito(capacity: number | null, iscritti: number): boolean {
  if (capacity === null) return false;
  return iscritti >= capacity;
}

export type StatoIscrizione = "aperto" | "esaurito" | "gia_iscritto" | "concluso" | "annullato";

/**
 * Stato del bottone di iscrizione per un membro loggato.
 *
 * L'ORDINE dei controlli conta: annullato e concluso vincono sempre (non ci si iscrive a
 * un evento chiuso, e il badge deve restare coerente con `statoEvento`); poi "già
 * iscritto" (mostra la disdetta); infine la capienza. Riusa `statoEvento`/`eConcluso`,
 * unica fonte di verità del fuso — nessuna matematica di data qui dentro.
 *
 * `adesso` è iniettabile per i test: in produzione non si passa.
 */
export function statoIscrizione(
  evento: EventoPerIscrizione,
  capacity: number | null,
  iscritti: number,
  giaIscritto: boolean,
  adesso: Date = new Date(),
): StatoIscrizione {
  if (statoEvento(evento, adesso) === "annullato") return "annullato";
  if (eConcluso(evento, adesso)) return "concluso";
  if (giaIscritto) return "gia_iscritto";
  if (eEsaurito(capacity, iscritti)) return "esaurito";
  return "aperto";
}
