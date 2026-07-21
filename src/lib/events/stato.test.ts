import { describe, expect, it } from "vitest";
import { eConcluso, statoEvento } from "./stato";
import { mezzanotteSuccessiva } from "@/lib/date/fuso";
import type { EventStatusDb } from "@/types/database";

// Helper locale: costruisce il minimo che `statoEvento` legge.
const ev = (starts_at: string, ends_at: string | null = null, status: EventStatusDb = "upcoming") => ({
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

  it("annullato con data PASSATA: statoEvento dice comunque annullato", () => {
    const adesso = new Date("2026-07-20T10:00:00Z");
    const e = ev("2024-05-01T10:00:00Z", null, "canceled");
    expect(statoEvento(e, adesso)).toBe("annullato");
  });

  it("annullato con data FUTURA: statoEvento dice comunque annullato", () => {
    const adesso = new Date("2026-07-20T10:00:00Z");
    const e = ev("2026-08-01T10:00:00Z", null, "canceled");
    expect(statoEvento(e, adesso)).toBe("annullato");
  });
});

describe("eConcluso", () => {
  it("un annullato con data passata È concluso (ignora l'annullamento, guarda solo le date)", () => {
    const adesso = new Date("2026-07-20T10:00:00Z");
    const e = ev("2024-05-01T10:00:00Z", null, "canceled");
    expect(eConcluso(e, adesso)).toBe(true);
  });

  it("un annullato con data futura NON è concluso", () => {
    const adesso = new Date("2026-07-20T10:00:00Z");
    const e = ev("2026-08-01T10:00:00Z", null, "canceled");
    expect(eConcluso(e, adesso)).toBe(false);
  });

  it("un normale futuro non è concluso", () => {
    const adesso = new Date("2026-07-20T10:00:00Z");
    expect(eConcluso(ev("2026-09-01T10:00:00Z"), adesso)).toBe(false);
  });

  it("un normale passato è concluso", () => {
    const adesso = new Date("2026-07-20T10:00:00Z");
    expect(eConcluso(ev("2026-01-01T10:00:00Z"), adesso)).toBe(true);
  });
});

describe("eConcluso — confine esatto della mezzanotte successiva (senza ends_at)", () => {
  // Inizio: 12 lug 10:00 italiane (08:00 UTC, CEST). Senza ends_at la fine è la
  // mezzanotte italiana successiva: la si ricava dalla stessa funzione che usa il
  // codice, così il test resta corretto anche se cambiasse lo scarto di fuso.
  const inizio = "2026-07-12T08:00:00Z";
  const confine = mezzanotteSuccessiva(new Date(inizio));

  it("a mezzanotte successiva esatta il bordo è inclusivo: NON è ancora concluso", () => {
    expect(eConcluso(ev(inizio), confine)).toBe(false);
    expect(statoEvento(ev(inizio), confine)).toBe("in-corso");
  });

  it("un millisecondo dopo la mezzanotte successiva è concluso", () => {
    const unMillisecondoDopo = new Date(confine.getTime() + 1);
    expect(eConcluso(ev(inizio), unMillisecondoDopo)).toBe(true);
    expect(statoEvento(ev(inizio), unMillisecondoDopo)).toBe("concluso");
  });
});
