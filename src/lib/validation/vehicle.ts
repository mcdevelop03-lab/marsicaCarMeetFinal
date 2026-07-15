import * as z from "zod";
import { VEHICLE_CATEGORIES, GEARBOXES, FUELS, type VehicleSpecs } from "@/types/database";

export const ANNO_MIN = 1900;
export const ANNO_MAX = new Date().getFullYear() + 1;

// I campi non obbligatori arrivano dal form come "": vanno trattati come "assenti",
// altrimenti enum e minimi scatterebbero su un campo lasciato vuoto.
// (Stesso accorgimento di `src/lib/validation/profile.ts`.)
const vuotoAUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const interoOpzionale = (max: number, messaggio: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().int().min(1, messaggio).max(max, messaggio).optional(),
  );

export const vehicleSchema = z.object({
  make: z
    .string()
    .trim()
    .min(2, "Marca troppo corta (minimo 2 caratteri)")
    .max(40, "Marca troppo lunga (massimo 40 caratteri)"),
  model: z
    .string()
    .trim()
    .min(1, "Il modello è obbligatorio")
    .max(40, "Modello troppo lungo (massimo 40 caratteri)"),
  year: z.coerce
    .number()
    .int()
    .min(ANNO_MIN, `Anno non valido (dal ${ANNO_MIN})`)
    .max(ANNO_MAX, `Anno non valido (fino al ${ANNO_MAX})`),
  category: z.preprocess(vuotoAUndefined, z.enum(VEHICLE_CATEGORIES).optional()),
  description: z.preprocess(
    vuotoAUndefined,
    z.string().trim().max(500, "Descrizione troppo lunga (massimo 500 caratteri)").optional(),
  ),
  potenza: interoOpzionale(2000, "Potenza non valida (1–2000 CV)"),
  cilindrata: interoOpzionale(10000, "Cilindrata non valida (1–10000 cc)"),
  cambio: z.preprocess(vuotoAUndefined, z.enum(GEARBOXES).optional()),
  alimentazione: z.preprocess(vuotoAUndefined, z.enum(FUELS).optional()),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

/** Le quattro specifiche opzionali, pronte per la colonna `specs` (jsonb). */
export function specsDa(input: VehicleInput): VehicleSpecs {
  const specs: VehicleSpecs = {};
  if (input.potenza !== undefined) specs.potenza = input.potenza;
  if (input.cilindrata !== undefined) specs.cilindrata = input.cilindrata;
  if (input.cambio !== undefined) specs.cambio = input.cambio;
  if (input.alimentazione !== undefined) specs.alimentazione = input.alimentazione;
  return specs;
}
