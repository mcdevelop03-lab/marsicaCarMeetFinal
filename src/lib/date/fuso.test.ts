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
});
