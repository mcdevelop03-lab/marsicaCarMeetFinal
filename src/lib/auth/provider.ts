// Il login con Google esiste nel codice (signInWithGoogle) ma il provider OAuth va
// configurato per dominio: sullo staging workers.dev non lo è, quindi il bottone
// "Continua con Google" va nascosto invece di mostrarne uno che dà errore.
// Alla fase pubblica basta valorizzare la variabile: nessun codice da riscrivere.
export function googleAuthAbilitato(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}
