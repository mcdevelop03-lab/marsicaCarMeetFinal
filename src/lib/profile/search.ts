/**
 * Pattern per `ilike`. I jolly di LIKE (`%`, `_`) e il carattere di escape (`\`)
 * digitati dall'utente vengono neutralizzati, altrimenti una ricerca di `_`
 * corrisponderebbe a un carattere qualsiasi.
 */
export function ilikePattern(raw: string): string {
  const escaped = raw.replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}

/**
 * Incapsula un valore per il filtro `.or()` di PostgREST: senza virgolette una
 * virgola nella query spezzerebbe il filtro in due condizioni. Dentro le
 * virgolette doppie, `"` e `\` si escapano con `\` — anche i `\` introdotti da
 * `ilikePattern`, che PostgREST rimuove prima di passare il pattern a Postgres.
 *
 * Esempio: `a_b` → ilikePattern → `%a\_b%` → quoteOrValue → `"%a\\_b%"`
 *          PostgREST lo disfa in `%a\_b%` → Postgres cerca un `_` letterale.
 */
export function quoteOrValue(value: string): string {
  return `"${value.replace(/["\\]/g, (c) => `\\${c}`)}"`;
}
