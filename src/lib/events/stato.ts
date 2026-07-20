import { mezzanotteSuccessiva } from "@/lib/date/fuso";
import type { Event } from "@/types/database";

export type StatoEvento = "imminente" | "in-corso" | "concluso" | "annullato";

/** Il minimo che serve per calcolare lo stato: comodo per i test e per le select parziali. */
type EventoPerStato = Pick<Event, "status" | "starts_at" | "ends_at">;

/** Il minimo che serve per sapere se un evento è finito, date a parte dall'annullamento. */
type EventoPerData = Pick<Event, "starts_at" | "ends_at">;

/**
 * Dice se un evento è finito guardando SOLO le date, ignorando l'annullamento.
 *
 * È l'unica fonte di verità per "quando un evento è finito": la usa `statoEvento` per
 * decidere fra "in-corso" e "concluso", e la usa anche la pagina pubblica per decidere
 * se un annullato scende fra i conclusi. Non duplicare questa logica altrove.
 *
 * `adesso` è iniettabile per i test: in produzione non si passa.
 */
export function eConcluso(e: EventoPerData, adesso: Date = new Date()): boolean {
  const inizio = new Date(e.starts_at);
  if (adesso < inizio) return false;

  // Senza ora di fine l'evento vale per tutta la sua giornata italiana: è come si legge
  // "il raduno del 12 luglio". Altrimenti un raduno delle 10:00 sarebbe "concluso" alle 10:01.
  const fine = e.ends_at ? new Date(e.ends_at) : mezzanotteSuccessiva(inizio);
  return adesso > fine;
}

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

  return eConcluso(e, adesso) ? "concluso" : "in-corso";
}
