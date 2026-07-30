import { describe, expect, it, afterEach } from "vitest";
import { googleAuthAbilitato } from "./provider";

const originale = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;

afterEach(() => {
  if (originale === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;
  else process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = originale;
});

describe("googleAuthAbilitato", () => {
  it("è disabilitato quando la variabile è assente (caso staging)", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;
    expect(googleAuthAbilitato()).toBe(false);
  });

  it("è abilitato solo con il valore esatto \"true\"", () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "true";
    expect(googleAuthAbilitato()).toBe(true);
  });

  it("è disabilitato con la stringa vuota", () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "";
    expect(googleAuthAbilitato()).toBe(false);
  });

  it("non si fa ingannare da \"false\", \"0\" o \"TRUE\"", () => {
    for (const valore of ["false", "0", "TRUE", "yes"]) {
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = valore;
      expect(googleAuthAbilitato()).toBe(false);
    }
  });
});
