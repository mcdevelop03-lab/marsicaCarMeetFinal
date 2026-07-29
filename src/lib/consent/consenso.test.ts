import { describe, it, expect } from "vitest";
import { parseConsent, serializeConsent, leggiConsentCookie, CONSENT_VERSION } from "./consenso";

describe("parseConsent", () => {
  it("valore assente → null", () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
  });
  it("JSON invalido → null", () => {
    expect(parseConsent("non-json")).toBeNull();
    expect(parseConsent("{broken")).toBeNull();
  });
  it("non-oggetto → null", () => {
    expect(parseConsent("42")).toBeNull();
    expect(parseConsent("null")).toBeNull();
    expect(parseConsent('"stringa"')).toBeNull();
  });
  it("versione diversa → null", () => {
    expect(parseConsent(JSON.stringify({ v: 999, external: true, ts: 1 }))).toBeNull();
  });
  it("external mancante o non booleano → null", () => {
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, ts: 1 }))).toBeNull();
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, external: "si", ts: 1 }))).toBeNull();
  });
  it("oggetto valido → Consent", () => {
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, external: true, ts: 123 }))).toEqual({
      external: true,
      ts: 123,
    });
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, external: false, ts: 0 }))).toEqual({
      external: false,
      ts: 0,
    });
  });
  it("ts mancante o non numerico → 0 (ma resta valido se external ok)", () => {
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, external: true }))).toEqual({
      external: true,
      ts: 0,
    });
  });
});

describe("serializeConsent", () => {
  it("produce JSON con la versione corrente", () => {
    const s = serializeConsent({ external: true, ts: 123 });
    expect(JSON.parse(s)).toEqual({ v: CONSENT_VERSION, external: true, ts: 123 });
  });
  it("round-trip conserva external e ts", () => {
    const c = { external: false, ts: 987654 };
    expect(parseConsent(serializeConsent(c))).toEqual(c);
  });
});

describe("leggiConsentCookie", () => {
  it("valore grezzo malformato (percent invalido) → null, non lancia", () => {
    expect(leggiConsentCookie("%")).toBeNull();
    expect(leggiConsentCookie("%E0%A4%A")).toBeNull();
  });
  it("undefined/vuoto → null", () => {
    expect(leggiConsentCookie(undefined)).toBeNull();
    expect(leggiConsentCookie("")).toBeNull();
  });
  it("valore percent-encoded valido → Consent", () => {
    const raw = encodeURIComponent(serializeConsent({ external: true, ts: 5 }));
    expect(leggiConsentCookie(raw)).toEqual({ external: true, ts: 5 });
  });
});
