import { describe, expect, it } from "vitest";
import { eventSchema } from "./event";

// Payload minimo valido, da alterare campo per campo nei singoli test.
const base = {
  title: "Raduno di prova",
  type: "raduno",
  starts_at: "2026-07-12T10:00",
  ends_at: "",
  location: "",
  map_url: "",
  capacity: "",
  description: "",
};

describe("eventSchema — formato date (datetime-local)", () => {
  it("accetta starts_at nel formato prodotto da datetime-local (senza secondi)", () => {
    const result = eventSchema.safeParse({ ...base, starts_at: "2026-07-12T10:00" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.starts_at).toBe("2026-07-12T10:00");
    }
  });

  it("respinge starts_at con i secondi (formato che manda in RangeError istanteDaOraItaliana)", () => {
    const result = eventSchema.safeParse({ ...base, starts_at: "2026-07-12T10:00:30" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.filter((i) => i.path[0] === "starts_at").map((i) => i.message);
      expect(messages).toContain("Formato della data di inizio non valido");
    }
  });

  it("respinge starts_at non riconducibile a una data (es. 'pippo')", () => {
    const result = eventSchema.safeParse({ ...base, starts_at: "pippo" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.filter((i) => i.path[0] === "starts_at").map((i) => i.message);
      expect(messages).toContain("Formato della data di inizio non valido");
    }
  });

  it("respinge starts_at vuoto con il messaggio esistente 'obbligatoria'", () => {
    const result = eventSchema.safeParse({ ...base, starts_at: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.filter((i) => i.path[0] === "starts_at").map((i) => i.message);
      expect(messages).toContain("La data di inizio è obbligatoria");
    }
  });

  it("accetta ends_at vuoto e lo trasforma in undefined", () => {
    const result = eventSchema.safeParse({ ...base, ends_at: "" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ends_at).toBeUndefined();
    }
  });

  it("respinge ends_at malformato (es. 'pippo')", () => {
    const result = eventSchema.safeParse({ ...base, ends_at: "pippo" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.filter((i) => i.path[0] === "ends_at").map((i) => i.message);
      expect(messages).toContain("Formato della data di fine non valido");
    }
  });

  it("accetta ends_at valorizzato nel formato datetime-local, coerente con il refine successivo/inizio", () => {
    const result = eventSchema.safeParse({
      ...base,
      starts_at: "2026-07-12T10:00",
      ends_at: "2026-07-12T18:00",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ends_at).toBe("2026-07-12T18:00");
    }
  });
});

describe("eventSchema — date di calendario inesistenti (forma valida, calendario no)", () => {
  const casiInesistenti: Array<[string, string]> = [
    ["2026-02-31T10:00", "31 febbraio non esiste (trabocca in silenzio al 3 marzo)"],
    ["2026-13-01T10:00", "mese 13 non esiste"],
    ["2026-07-12T25:99", "ora 25 e minuti 99 fuori range"],
    ["2026-00-00T00:00", "mese 00 e giorno 00 non esistono"],
    ["2026-07-32T10:00", "giorno 32 non esiste"],
  ];

  it.each(casiInesistenti)("respinge starts_at = %s (%s)", (valore) => {
    const result = eventSchema.safeParse({ ...base, starts_at: valore });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.filter((i) => i.path[0] === "starts_at").map((i) => i.message);
      expect(messages).toContain("Data di inizio inesistente nel calendario");
    }
  });

  it.each(casiInesistenti)("respinge ends_at = %s (%s)", (valore) => {
    const result = eventSchema.safeParse({ ...base, ends_at: valore });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.filter((i) => i.path[0] === "ends_at").map((i) => i.message);
      expect(messages).toContain("Data di fine inesistente nel calendario");
    }
  });

  it("continua ad accettare una data di calendario realmente esistente (2026-07-12T10:00)", () => {
    const result = eventSchema.safeParse({ ...base, starts_at: "2026-07-12T10:00" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.starts_at).toBe("2026-07-12T10:00");
    }
  });
});
