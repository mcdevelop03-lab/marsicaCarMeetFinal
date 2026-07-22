import { describe, expect, it } from "vitest";
import { eEsaurito, postiRimasti, statoIscrizione } from "./capienza";
import type { EventStatusDb } from "@/types/database";

// Minimo che `statoIscrizione` legge (via statoEvento/eConcluso).
const ev = (starts_at: string, ends_at: string | null = null, status: EventStatusDb = "upcoming") => ({
  status,
  starts_at,
  ends_at,
});

describe("postiRimasti", () => {
  it("capienza illimitata -> null", () => {
    expect(postiRimasti(null, 5)).toBeNull();
  });
  it("posti liberi = capienza - iscritti", () => {
    expect(postiRimasti(20, 8)).toBe(12);
  });
  it("non scende sotto zero", () => {
    expect(postiRimasti(20, 25)).toBe(0);
  });
});

describe("eEsaurito", () => {
  it("illimitata non è mai esaurita", () => {
    expect(eEsaurito(null, 9999)).toBe(false);
  });
  it("pieno esatto = esaurito", () => {
    expect(eEsaurito(20, 20)).toBe(true);
  });
  it("un posto libero = non esaurito", () => {
    expect(eEsaurito(20, 19)).toBe(false);
  });
});

describe("statoIscrizione", () => {
  const futuro = "2026-08-01T10:00:00Z";
  const adesso = new Date("2026-07-12T10:00:00Z");

  it("annullato vince su tutto (anche se già iscritto e con posti)", () => {
    const e = ev(futuro, null, "canceled");
    expect(statoIscrizione(e, 20, 0, true, adesso)).toBe("annullato");
  });
  it("concluso vince su esaurito", () => {
    // Evento di due giorni fa, senza fine esplicita: concluso. Pieno E concluso -> "concluso".
    const e = ev("2026-07-10T08:00:00Z");
    expect(statoIscrizione(e, 10, 10, false, adesso)).toBe("concluso");
  });
  it("già iscritto (evento aperto) -> gia_iscritto", () => {
    expect(statoIscrizione(ev(futuro), 20, 5, true, adesso)).toBe("gia_iscritto");
  });
  it("aperto e pieno, non iscritto -> esaurito", () => {
    expect(statoIscrizione(ev(futuro), 10, 10, false, adesso)).toBe("esaurito");
  });
  it("aperto con posti, non iscritto -> aperto", () => {
    expect(statoIscrizione(ev(futuro), 10, 3, false, adesso)).toBe("aperto");
  });
  it("capienza illimitata: mai esaurito", () => {
    expect(statoIscrizione(ev(futuro), null, 9999, false, adesso)).toBe("aperto");
  });
  it("annullato vince su concluso (evento passato E annullato)", () => {
    // Passato + annullato + pieno: se annullato non fosse il primo, sarebbe "concluso".
    expect(statoIscrizione(ev("2026-07-10T08:00:00Z", null, "canceled"), 10, 10, false, adesso)).toBe(
      "annullato",
    );
  });
  it("concluso vince su gia_iscritto (evento passato, già iscritto)", () => {
    // Passato + già iscritto: se concluso non venisse prima, sarebbe "gia_iscritto".
    expect(statoIscrizione(ev("2026-07-10T08:00:00Z"), 20, 5, true, adesso)).toBe("concluso");
  });
  it("gia_iscritto vince su esaurito (evento pieno, già iscritto)", () => {
    // Futuro + pieno + già iscritto: se esaurito venisse prima, sarebbe "esaurito".
    expect(statoIscrizione(ev(futuro), 10, 10, true, adesso)).toBe("gia_iscritto");
  });
});
