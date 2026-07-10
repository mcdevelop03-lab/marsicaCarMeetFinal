import * as z from "zod";

// I quattro campi social qui sotto devono restare allineati a SOCIAL_KEYS
// (`src/lib/profile/socials.ts`), che ne detta l'ordine nella UI.
// I campi non obbligatori arrivano dal form come "": va trattata come "assente",
// altrimenti regex e lunghezze minime scatterebbero su un campo lasciato vuoto.
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = (max: number, message: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, message).optional());

const optionalHandle = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(30, "Handle troppo lungo (massimo 30 caratteri)")
    .regex(/^[A-Za-z0-9._-]+$/, "Handle non valido: usa lettere, numeri, punto, trattino o underscore")
    .optional(),
);

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome troppo corto (minimo 2 caratteri)")
    .max(50, "Nome troppo lungo (massimo 50 caratteri)"),
  tag: z
    .string()
    .trim()
    .min(3, "Tag troppo corto (minimo 3 caratteri)")
    .max(30, "Tag troppo lungo (massimo 30 caratteri)")
    .regex(/^[a-z0-9._-]+$/, "Il tag può contenere solo minuscole, numeri, punto, trattino e underscore"),
  bio: optionalText(300, "Bio troppo lunga (massimo 300 caratteri)"),
  town: optionalText(60, "Comune troppo lungo (massimo 60 caratteri)"),
  instagram: optionalHandle,
  facebook: optionalHandle,
  tiktok: optionalHandle,
  youtube: optionalHandle,
});

export type ProfileInput = z.infer<typeof profileSchema>;
