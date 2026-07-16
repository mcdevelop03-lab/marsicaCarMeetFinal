/**
 * Slug leggibile a partire dal titolo dell'evento.
 *
 * Lo slug è l'URL che le persone si scambiano: si genera UNA VOLTA alla creazione e
 * poi non cambia più, nemmeno correggendo il titolo (spec 1C-1). Qui c'è solo la
 * trasformazione: la gestione dei duplicati richiede il DB e vive nella server action.
 *
 * Può restituire stringa vuota (titolo di sola punteggiatura): chi chiama deve avere
 * un ripiego — vedi `creaEvento`.
 */
export function slugDa(titolo: string): string {
  return titolo
    .normalize("NFD") // separa le lettere dai segni diacritici…
    .replace(/[̀-ͯ]/g, "") // …e butta i segni: "à" → "a"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // tutto ciò che non è lettera o numero diventa separatore
    .replace(/^-+|-+$/g, ""); // via i trattini alle estremità
}
