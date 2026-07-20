import { describe, expect, it } from "vitest";
import { istanteDaOraItaliana, mezzanotteSuccessiva } from "./fuso";

describe("mezzanotteSuccessiva", () => {
  it("dà le 00:00 italiane del giorno dopo (ora solare: scarto +1)", () => {
    // 12 gen 2026, 10:00 italiane = 09:00 UTC. Atteso: 13 gen 00:00 italiane = 12 gen 23:00 UTC.
    const d = new Date("2026-01-12T09:00:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-01-12T23:00:00.000Z");
  });

  it("dà le 00:00 italiane del giorno dopo (ora legale: scarto +2)", () => {
    // 12 lug 2026, 10:00 italiane = 08:00 UTC. Atteso: 13 lug 00:00 italiane = 12 lug 22:00 UTC.
    const d = new Date("2026-07-12T08:00:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-07-12T22:00:00.000Z");
  });

  it("usa il giorno ITALIANO, non quello UTC", () => {
    // 12 lug 23:30 italiane = 21:30 UTC dello stesso giorno.
    // In Italia è ancora il 12: la fine è il 13 alle 00:00 (12 lug 22:00 UTC).
    const d = new Date("2026-07-12T21:30:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-07-12T22:00:00.000Z");
  });

  it("gestisce il cambio di mese", () => {
    // 31 gen 2026, 12:00 italiane. Atteso: 1 feb 00:00 italiane = 31 gen 23:00 UTC.
    const d = new Date("2026-01-31T11:00:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-01-31T23:00:00.000Z");
  });

  it("gestisce il cambio di anno", () => {
    // 31 dic 2026, 12:00 italiane. Atteso: 1 gen 2027 00:00 italiane = 31 dic 23:00 UTC.
    const d = new Date("2026-12-31T11:00:00Z");
    expect(mezzanotteSuccessiva(d).toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });
});

describe("istanteDaOraItaliana", () => {
  it("interpreta il valore dell'input come ora ITALIANA, non UTC (ora legale)", () => {
    // L'admin scrive "12 luglio, 10:00" pensando all'ora italiana: sono le 08:00 UTC.
    expect(istanteDaOraItaliana("2026-07-12T10:00")).toBe("2026-07-12T08:00:00.000Z");
  });

  it("interpreta il valore come ora italiana anche in ora solare", () => {
    // 12 gennaio, 10:00 italiane = 09:00 UTC (scarto +1).
    expect(istanteDaOraItaliana("2026-01-12T10:00")).toBe("2026-01-12T09:00:00.000Z");
  });

  it("è l'inverso di perInputDatetime per un orario serale", () => {
    // 12 luglio, 23:30 italiane = 21:30 UTC dello stesso giorno.
    expect(istanteDaOraItaliana("2026-07-12T23:30")).toBe("2026-07-12T21:30:00.000Z");
  });

  describe("cambio di ora legale (ultima domenica di marzo, 2026: notte 28→29)", () => {
    it("round-trip stabile appena prima del salto (00:30Z, ancora scarto +1)", () => {
      // 2026-03-29T00:30:00.000Z, letta in Italia, è ancora 01:30 (scarto +1: l'ora
      // legale scatta solo alle 02:00 locali, che diventano le 03:00).
      expect(istanteDaOraItaliana("2026-03-29T01:30")).toBe("2026-03-29T00:30:00.000Z");
    });

    it("round-trip stabile un minuto prima del salto (00:59Z)", () => {
      expect(istanteDaOraItaliana("2026-03-29T01:59")).toBe("2026-03-29T00:59:00.000Z");
    });

    it("round-trip stabile appena dopo il salto (01:30Z, già scarto +2)", () => {
      // Dopo il salto le 02:00 locali sono diventate le 03:00: 2026-03-29T01:30:00.000Z
      // corrisponde a "03:30" italiane (scarto +2), non a "02:30" (che non esiste).
      expect(istanteDaOraItaliana("2026-03-29T03:30")).toBe("2026-03-29T01:30:00.000Z");
    });

    it("round-trip stabile in piena estate (nessuna regressione, scarto +2)", () => {
      expect(istanteDaOraItaliana("2026-07-12T10:00")).toBe("2026-07-12T08:00:00.000Z");
    });

    it("round-trip stabile in pieno inverno (nessuna regressione, scarto +1)", () => {
      expect(istanteDaOraItaliana("2026-01-15T10:00")).toBe("2026-01-15T09:00:00.000Z");
    });

    it(
      "ORA INESISTENTE, non un bug: le 02:00-02:59 del 29 marzo 2026 non esistono " +
        "mai (alle 02:00 locali gli orologi saltano alle 03:00). Per un'ora " +
        "inesistente non c'è nessuno scarto \"corretto\": l'iterazione oscilla fra " +
        "+1 e +2 senza convergere (periodo 2), quindi fermarsi al secondo passaggio " +
        "è una scelta, non un'approssimazione. Qui va in avanti per convenzione " +
        "(03:30 locali, dopo il salto), non indietro (01:30 locali, prima del " +
        "salto): una TERZA iterazione darebbe proprio quest'ultima, cioè un " +
        "risultato peggiore. Il numero di iterazioni in `istanteDaOraItaliana` è " +
        "quindi deliberato: un futuro `while` \"fino a convergenza\" non convergerebbe " +
        "mai qui e manderebbe silenziosamente gli orari all'indietro.",
      () => {
        expect(istanteDaOraItaliana("2026-03-29T02:30")).toBe("2026-03-29T01:30:00.000Z");
      },
    );
  });

  describe("cambio da ora legale a ora solare (ultima domenica di ottobre, 2026: notte 25)", () => {
    it("LIMITE NOTO, non un bug: le 02:30 italiane esistono due volte quella notte " +
      "(l'ora si ripete). Sia 00:30Z sia 01:30Z si presentano come input \"02:30\": " +
      "un round-trip perfetto per entrambe è impossibile per definizione (la stringa " +
      "dell'input non porta l'informazione su quale delle due occorrenze fosse). " +
      "Questa funzione fa collassare l'input sulla seconda occorrenza (scarto +1, " +
      "l'istante più tardo) in modo deterministico.", () => {
      expect(istanteDaOraItaliana("2026-10-25T02:30")).toBe("2026-10-25T01:30:00.000Z");
    });
  });
});
