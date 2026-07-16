import { describe, expect, it } from "vitest";
import { slugDa } from "./slug";

describe("slugDa", () => {
  it("mette in minuscolo e sostituisce gli spazi", () => {
    expect(slugDa("Raduno Estivo")).toBe("raduno-estivo");
  });

  it("toglie gli accenti", () => {
    expect(slugDa("Città di Avezzano")).toBe("citta-di-avezzano");
  });

  it("sostituisce l'apostrofo senza lasciare doppi trattini", () => {
    expect(slugDa("Raduno d'estate")).toBe("raduno-d-estate");
  });

  it("toglie la punteggiatura e i trattini alle estremità", () => {
    expect(slugDa("  Giro del Fucino!!!  ")).toBe("giro-del-fucino");
  });

  it("collassa i separatori multipli", () => {
    expect(slugDa("Cena   sociale / 2026")).toBe("cena-sociale-2026");
  });

  it("tiene i numeri", () => {
    expect(slugDa("Raduno 2026")).toBe("raduno-2026");
  });

  it("dà stringa vuota se non resta nulla di utile", () => {
    expect(slugDa("!!!")).toBe("");
  });
});
