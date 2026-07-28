// Consenso ai cookie/contenuti di terze parti. Logica pura (nessun I/O): opera sul
// JSON DECODIFICATO del cookie; l'encode/decode di trasporto (encodeURIComponent lato
// client, decodeURIComponent lato server) sta ai due call-site. È l'unico pezzo con
// logica non banale della fase 1D → coperto da test (vitest).

export type Consent = { external: boolean; ts: number };

export const CONSENT_COOKIE = "mcm_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE = 31536000; // 1 anno in secondi

type Stored = { v: number; external: boolean; ts: number };

/**
 * Ritorna il consenso o null se il valore manca / è malformato / è di una versione
 * ignota (→ "non ha ancora scelto", si ri-chiede). Non lancia mai.
 */
export function parseConsent(cookieValue: string | undefined | null): Consent | null {
  if (!cookieValue) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(cookieValue);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;
  if (o.v !== CONSENT_VERSION) return null;
  if (typeof o.external !== "boolean") return null;
  const ts = typeof o.ts === "number" ? o.ts : 0;
  return { external: o.external, ts };
}

/** Serializza il consenso nel JSON del cookie (senza gli attributi di trasporto). */
export function serializeConsent(consent: Consent): string {
  const stored: Stored = { v: CONSENT_VERSION, external: consent.external, ts: consent.ts };
  return JSON.stringify(stored);
}
