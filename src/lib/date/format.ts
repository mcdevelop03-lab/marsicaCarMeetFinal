// Formattazione date in italiano. Il progetto non aveva nulla del genere.
// Il fuso è fissato a Roma per lo stesso motivo di `fuso.ts`: le date sono istanti
// assoluti e il server gira in UTC, quindi senza `timeZone` un raduno serale
// verrebbe mostrato con la data del giorno prima.

const FUSO = "Europe/Rome";

const DATA_ORA = new Intl.DateTimeFormat("it-IT", {
  timeZone: FUSO,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATA_BREVE = new Intl.DateTimeFormat("it-IT", {
  timeZone: FUSO,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const SOLO_ORA = new Intl.DateTimeFormat("it-IT", {
  timeZone: FUSO,
  hour: "2-digit",
  minute: "2-digit",
});

/** "12 luglio 2026, 10:00" — per il dettaglio. */
export function formattaData(iso: string): string {
  return DATA_ORA.format(new Date(iso));
}

/** "12 lug 2026" — per le schede. */
export function formattaDataBreve(iso: string): string {
  return DATA_BREVE.format(new Date(iso));
}

/**
 * "12 luglio 2026, 10:00 – 18:00" se finisce lo stesso giorno,
 * "12 luglio 2026, 10:00 – 13 luglio 2026, 18:00" altrimenti,
 * "12 luglio 2026, 10:00" se non c'è ora di fine.
 */
export function formattaIntervallo(inizioIso: string, fineIso: string | null): string {
  const inizio = formattaData(inizioIso);
  if (!fineIso) return inizio;

  const stessoGiorno = DATA_BREVE.format(new Date(inizioIso)) === DATA_BREVE.format(new Date(fineIso));
  return stessoGiorno
    ? `${inizio} – ${SOLO_ORA.format(new Date(fineIso))}`
    : `${inizio} – ${formattaData(fineIso)}`;
}

/**
 * ISO → il formato che vuole `<input type="datetime-local">`: "2026-07-12T10:00".
 * L'input non ha fuso: mostra e restituisce ORA LOCALE, quindi il valore va reso
 * nell'ora italiana, non in UTC (`toISOString()` qui sarebbe sbagliato).
 */
export function perInputDatetime(iso: string): string {
  const parti = new Intl.DateTimeFormat("sv-SE", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  // "sv-SE" rende "2026-07-12 10:00": all'input serve la "T".
  return parti.replace(" ", "T");
}
