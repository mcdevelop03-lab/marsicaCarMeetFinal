import * as z from "zod";
import { EVENT_TYPES } from "@/types/database";

// I campi non obbligatori arrivano dal form come "": vanno trattati come "assenti".
// (Stesso accorgimento di `src/lib/validation/profile.ts` e `vehicle.ts`.)
const vuotoAUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

// Formato esatto prodotto da <input type="datetime-local"> (niente secondi, niente fuso).
const FORMATO_DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// La regex sopra controlla solo la FORMA della stringa, non che sia una data di
// calendario esistente: "2026-02-31T10:00" la supera, ma 31 febbraio non esiste.
// `new Date` con una stringa ISO non lo segnala con un errore: alcuni componenti
// fuori range (mese, ora, minuti) danno "Invalid Date", ma il giorno del mese
// trabocca in silenzio nel mese successivo (31 feb → 3 marzo). Il modo robusto per
// intercettare entrambi i casi è il round-trip: si ricostruisce la data e si
// verifica che la sua rappresentazione ISO coincida esattamente con l'input.
function eDataCalendarioValida(valore: string): boolean {
  const istante = new Date(`${valore}:00Z`);
  if (Number.isNaN(istante.getTime())) return false;
  return istante.toISOString().slice(0, 16) === valore;
}

// `eDataCalendarioValida` accetta anche date calendarialmente esistenti ma
// assurde per un'app di raduni, es. "0000-01-01T00:00": `istanteDaOraItaliana`
// la converte con i dati storici di fuso LMT di Roma (ante 1893), producendo
// un istante palesemente sbagliato ma senza errore. Restringiamo l'anno a un
// secolo ragionevole: fuori da qui è per forza un errore o un POST manuale.
// Funzione condivisa da starts_at ed ends_at, come `eDataCalendarioValida`.
const ANNO_MINIMO = 2000;
const ANNO_MASSIMO = 2100;

function eAnnoAmmesso(valore: string): boolean {
  const anno = Number(valore.slice(0, 4));
  return anno >= ANNO_MINIMO && anno <= ANNO_MASSIMO;
}

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Titolo troppo corto (minimo 3 caratteri)")
      .max(80, "Titolo troppo lungo (massimo 80 caratteri)"),
    type: z.enum(EVENT_TYPES, { message: "Tipo di evento non valido" }),
    // `datetime-local` manda "2026-07-12T10:00": è ora ITALIANA senza fuso.
    // La conversione a istante assoluto la fa la action, non lo schema.
    starts_at: z
      .string()
      .trim()
      .min(1, "La data di inizio è obbligatoria")
      .regex(FORMATO_DATETIME_LOCAL, "Formato della data di inizio non valido")
      .refine(eDataCalendarioValida, "Data di inizio inesistente nel calendario")
      .refine(eAnnoAmmesso, "Anno della data di inizio fuori dall'intervallo ammesso (2000-2100)"),
    ends_at: z.preprocess(
      vuotoAUndefined,
      z
        .string()
        .trim()
        .regex(FORMATO_DATETIME_LOCAL, "Formato della data di fine non valido")
        .refine(eDataCalendarioValida, "Data di fine inesistente nel calendario")
        .refine(eAnnoAmmesso, "Anno della data di fine fuori dall'intervallo ammesso (2000-2100)")
        .optional(),
    ),
    location: z.preprocess(
      vuotoAUndefined,
      z.string().trim().max(120, "Luogo troppo lungo (massimo 120 caratteri)").optional(),
    ),
    map_url: z.preprocess(
      vuotoAUndefined,
      z.url({ message: "Il link alla mappa non è un indirizzo valido" }).optional(),
    ),
    capacity: z.preprocess(
      vuotoAUndefined,
      z.coerce
        .number()
        .int()
        .min(1, "La capienza deve essere almeno 1")
        .max(10000, "Capienza non valida (massimo 10000)")
        .optional(),
    ),
    description: z.preprocess(
      vuotoAUndefined,
      z.string().trim().max(2000, "Descrizione troppo lunga (massimo 2000 caratteri)").optional(),
    ),
  })
  .refine((d) => !d.ends_at || new Date(d.ends_at) > new Date(d.starts_at), {
    message: "La fine deve venire dopo l'inizio",
    path: ["ends_at"],
  });

export type EventInput = z.infer<typeof eventSchema>;
