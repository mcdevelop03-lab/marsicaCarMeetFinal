import * as z from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Nome troppo corto").trim(),
  email: z.string().email("Email non valida").trim(),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export const loginSchema = z.object({
  email: z.string().email("Email non valida").trim(),
  password: z.string().min(1, "Inserisci la password"),
});

export const resetSchema = z.object({
  email: z.string().email("Email non valida").trim(),
});
