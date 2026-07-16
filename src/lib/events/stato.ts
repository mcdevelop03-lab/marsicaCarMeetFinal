import { mezzanotteSuccessiva } from "@/lib/date/fuso";
import type { Event } from "@/types/database";

export type StatoEvento = "imminente" | "in-corso" | "concluso" | "annullato";

/** Il minimo che serve per calcolare lo stato: comodo per i test e per le select parziali. */
type EventoPerStato = Pick<Event, "status" | "starts_at" | "ends_at">;

/**
 * L'unica fonte di verità dello stato mostrato di un evento.
 *
 * Lo stato NON è un campo del DB: si calcola dalle date a ogni render, così un raduno
 * passato non può restare scritto "imminente" perché nessuno ha aggiornato il campo.
 * L'unico stato che le date non possono sapere è l'annullamento, e quello sta in
 * `status` (vedi il commento sulla colonna, migrazione 0008).
 *
 * `adesso` è iniettabile per i test: in produzione non si passa.
 */
export function statoEvento(e: EventoPerStato, adesso: Date = new Date()): StatoEvento {
  if (e.status === "canceled") return "annullato";

  const inizio = new Date(e.starts_at);
  if (adesso < inizio) return "imminente";

  // Senza ora di fine l'evento vale per tutta la sua giornata italiana: è come si legge
  // "il raduno del 12 luglio". Altrimenti un raduno delle 10:00 sarebbe "concluso" alle 10:01.
  const fine = e.ends_at ? new Date(e.ends_at) : mezzanotteSuccessiva(inizio);
  return adesso <= fine ? "in-corso" : "concluso";
}
