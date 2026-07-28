"use client";
import { createContext, useCallback, useContext, useState } from "react";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  serializeConsent,
  type Consent,
} from "@/lib/consent/consenso";

type ConsentContextValue = {
  consent: Consent | null;
  haScelto: boolean;
  bannerAperto: boolean;
  external: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  setExternal: (v: boolean) => void;
  riapriBanner: () => void;
};

const ConsentCtx = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentCtx);
  if (!ctx) throw new Error("useConsent deve stare dentro <ConsentProvider>");
  return ctx;
}

// Scrive il cookie first-party. encodeURIComponent perché il JSON contiene caratteri
// ({ } " : ,) non ammessi grezzi in un cookie-value.
function scriviCookie(consent: Consent) {
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    serializeConsent(consent),
  )}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}

export default function ConsentProvider({
  initialConsent,
  children,
}: {
  initialConsent: Consent | null;
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState<Consent | null>(initialConsent);
  const [bannerAperto, setBannerAperto] = useState<boolean>(initialConsent === null);

  const salva = useCallback((external: boolean) => {
    const nuovo: Consent = { external, ts: Date.now() };
    scriviCookie(nuovo);
    setConsent(nuovo);
    setBannerAperto(false);
  }, []);

  const value: ConsentContextValue = {
    consent,
    haScelto: consent !== null,
    bannerAperto,
    external: consent?.external ?? false,
    acceptAll: useCallback(() => salva(true), [salva]),
    rejectAll: useCallback(() => salva(false), [salva]),
    setExternal: useCallback((v: boolean) => salva(v), [salva]),
    riapriBanner: useCallback(() => setBannerAperto(true), []),
  };

  return <ConsentCtx.Provider value={value}>{children}</ConsentCtx.Provider>;
}
