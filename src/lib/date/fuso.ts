// Confine di giornata nel fuso italiano, senza librerie.
//
// Serve perché le date del DB sono `timestamptz` (istanti assoluti) e il server gira
// in UTC: "la fine del 12 luglio" per un club italiano è la mezzanotte di Roma, non
// quella di Greenwich. Lo scarto fra Italia e UTC cambia con l'ora legale (+1 o +2),
// quindi non si può sommare una costante: lo si chiede a `Intl`.

const FUSO = "Europe/Rome";

/** Le parti di data/ora di un istante, lette nel fuso italiano. */
function parti(d: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = dtf.formatToParts(d);
  const n = (tipo: string) => Number(p.find((x) => x.type === tipo)!.value);
  return {
    anno: n("year"),
    mese: n("month"),
    giorno: n("day"),
    // Con `hour12: false` alcuni runtime rendono la mezzanotte come "24": va normalizzata.
    ora: n("hour") % 24,
    minuti: n("minute"),
    secondi: n("second"),
  };
}

/** Scarto in ms fra l'ora italiana e UTC in un dato istante (ora legale inclusa). */
function scarto(d: Date): number {
  const p = parti(d);
  const comeSeFosseUtc = Date.UTC(p.anno, p.mese - 1, p.giorno, p.ora, p.minuti, p.secondi);
  return comeSeFosseUtc - d.getTime();
}

/**
 * L'istante delle 00:00 italiane del giorno DOPO quello (italiano) di `d`.
 *
 * È il confine di giornata: un evento senza ora di fine vale fino a qui.
 * NB: è la mezzanotte *successiva*, non quella del giorno stesso — quella sarebbe
 * l'inizio della giornata e darebbe il risultato opposto.
 */
export function mezzanotteSuccessiva(d: Date): Date {
  const p = parti(d);
  // `Date.UTC` normalizza da sé il cambio di mese e di anno (31 dic + 1 → 1 gen).
  const mezzanotteUtc = Date.UTC(p.anno, p.mese - 1, p.giorno + 1, 0, 0, 0);
  // `mezzanotteUtc` è mezzanotte a Greenwich: per ottenere la mezzanotte ITALIANA
  // come istante assoluto la si arretra dello scarto in vigore in quel momento.
  return new Date(mezzanotteUtc - scarto(new Date(mezzanotteUtc)));
}

/**
 * Il valore di un `<input type="datetime-local">` ("2026-07-12T10:00") come istante
 * assoluto ISO.
 *
 * Serve perché quell'input NON ha fuso: mostra e restituisce ora locale. Darlo in
 * pasto a `new Date("2026-07-12T10:00")` lo farebbe interpretare col fuso del SERVER,
 * che in produzione è UTC: l'admin scrive "10:00" pensando all'ora italiana e il
 * raduno verrebbe salvato con due ore di anticipo. Qui il valore viene esplicitamente
 * letto come ora di Roma.
 */
//
// Limite noto (cambio da ora legale a ora solare, ultima domenica di ottobre): quel
// giorno le 02:30 italiane si presentano DUE volte (00:30Z e 01:30Z sono entrambe
// "02:30" locali, perché l'ora ripete). Un round-trip perfetto è impossibile per
// definizione — non c'è modo di sapere, dalla sola stringa "02:30", a quale delle due
// occorrenze l'admin si riferisse. Questa funzione le fa collassare entrambe sulla
// seconda (l'istante più tardo, con scarto +1): non è un bug da inseguire.
export function istanteDaOraItaliana(valore: string): string {
  // Prima ipotesi: si interpreta il valore come UTC solo per scoprire quale scarto
  // italiano è probabilmente in vigore in quella data (l'ora legale cambia fra +1 e +2).
  const ipotesi = new Date(`${valore}:00Z`);
  // Vicino al cambio di ora legale, lo scarto calcolato su `ipotesi` può essere quello
  // sbagliato: `ipotesi` è ancora "ora italiana letta come se fosse UTC", cioè può
  // cadere dalla parte sbagliata del salto rispetto all'istante reale. Si ricalcola lo
  // scarto una seconda volta, questa volta sul primo istante stimato (che è già vicino
  // a quello vero): a quel punto lo scarto è quello corretto per l'istante reale, non
  // per la sua approssimazione grezza.
  const primo = new Date(ipotesi.getTime() - scarto(ipotesi));
  return new Date(ipotesi.getTime() - scarto(primo)).toISOString();
}
