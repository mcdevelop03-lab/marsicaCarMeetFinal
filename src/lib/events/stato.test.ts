import { describe, expect, it } from "vitest";
import { statoEvento } from "./stato";

// Helper locale: costruisce il minimo che `statoEvento` legge.
const ev = (starts_at: string, ends_at: string | null = null, status = "upcoming" as const) => ({
  status,
  starts_at,
  ends_at,
});

describe("statoEvento", () => {
  it("annullato vince su qualsiasi data", () => {
    const adesso = new Date("2026-07-12T10:00:00Z");
    const e = { status: "canceled" as const, starts_at: "2026-08-01T10:00:00Z", ends_at: null };
    expect(statoEvento(e, adesso)).toBe("annullato");
  });

  it("imminente se non è ancora iniziato", () => {
    const adesso = new Date("2026-07-12T10:00:00Z");
    expect(statoEvento(ev("2026-07-20T08:00:00Z"), adesso)).toBe("imminente");
  });

  it("in corso se siamo fra inizio e fine esplicita", () => {
    const adesso = new Date("2026-07-12T10:00:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z", "2026-07-12T16:00:00Z"), adesso)).toBe("in-corso");
  });

  it("concluso dopo la fine esplicita", () => {
    const adesso = new Date("2026-07-12T18:00:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z", "2026-07-12T16:00:00Z"), adesso)).toBe("concluso");
  });

  it("senza ora di fine resta IN CORSO per tutta la giornata italiana", () => {
    // Inizio: 12 lug 10:00 italiane (08:00 UTC). Adesso: 12 lug 23:30 italiane (21:30 UTC).
    // È il caso che smaschera sia la mezzanotte presa dal verso sbagliato sia il calcolo in UTC.
    const adesso = new Date("2026-07-12T21:30:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z"), adesso)).toBe("in-corso");
  });

  it("senza ora di fine è CONCLUSO il giorno dopo", () => {
    // Inizio: 12 lug 10:00 italiane. Adesso: 13 lug 00:30 italiane (12 lug 22:30 UTC).
    const adesso = new Date("2026-07-12T22:30:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z"), adesso)).toBe("concluso");
  });

  it("un raduno delle 10:00 non è concluso alle 10:01 (la regressione che ci interessa)", () => {
    const adesso = new Date("2026-07-12T08:01:00Z");
    expect(statoEvento(ev("2026-07-12T08:00:00Z"), adesso)).toBe("in-corso");
  });
});
