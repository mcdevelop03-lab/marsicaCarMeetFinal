// Il login con Google esiste nel codice (signInWithGoogle) ma il provider OAuth va
// configurato per dominio: sullo staging non lo è, quindi il bottone "Continua con
// Google" va nascosto invece di mostrarne uno che dà errore.
// Alla fase pubblica basta valorizzare la variabile: nessun codice da riscrivere.
// ⚠️ È una NEXT_PUBLIC_*, quindi inlinata alla build: cambiarla richiede un rebuild,
// non basta salvarla fra le variabili dell'host.
export function googleAuthAbilitato(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
}
