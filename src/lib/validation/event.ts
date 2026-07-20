import * as z from "zod";
import { EVENT_TYPES } from "@/types/database";

// I campi non obbligatori arrivano dal form come "": vanno trattati come "assenti".
// (Stesso accorgimento di `src/lib/validation/profile.ts` e `vehicle.ts`.)
const vuotoAUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

// Formato esatto prodotto da <input type="datetime-local"> (niente secondi, niente fuso).
const FORMATO_DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

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
      .regex(FORMATO_DATETIME_LOCAL, "Formato della data di inizio non valido"),
    ends_at: z.preprocess(
      vuotoAUndefined,
      z
        .string()
        .trim()
        .regex(FORMATO_DATETIME_LOCAL, "Formato della data di fine non valido")
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
