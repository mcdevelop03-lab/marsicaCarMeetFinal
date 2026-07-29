// Consenso ai cookie/contenuti di terze parti. Logica pura (nessun I/O). Due livelli:
// parseConsent() opera sul JSON GIÀ DECODIFICATO, leggiConsentCookie() parte dal valore
// grezzo del cookie e fa il decode in modo sicuro (è quella che usa il layout lato
// server). L'encode di trasporto (encodeURIComponent) resta al call-site che scrive il
// cookie. È l'unico pezzo con logica non banale della fase 1D → coperto da test (vitest).

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

/**
 * Legge il consenso dal valore GREZZO del cookie (percent-encoded, o undefined).
 * Decodifica in modo sicuro: un valore malformato (es. "%" isolato, che farebbe
 * lanciare decodeURIComponent) diventa null = "non ha scelto", MAI un'eccezione.
 */
export function leggiConsentCookie(raw: string | undefined | null): Consent | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return parseConsent(decoded);
}
