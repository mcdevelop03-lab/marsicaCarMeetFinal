"use client";
import Script from "next/script";
import { useCallback, useRef } from "react";

// Con il render implicito (`<div class="cf-turnstile" data-sitekey>` + `<Script async defer>`)
// lo script Cloudflare veniva a volte "preloaded but not used": il widget non partiva e il
// form restava senza token `cf-turnstile-response` -> login/registrazione bloccati.
// Qui usiamo il render ESPLICITO (`?render=explicit` + `onReady`) così il widget viene
// montato in modo deterministico a ogni caricamento pagina. Turnstile inserisce da sé
// l'input hidden `cf-turnstile-response` dentro il contenitore (che è nel form).
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; theme?: string }) => string;
    };
  }
}

export default function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!siteKey || !ref.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(ref.current, { sitekey: siteKey, theme: "dark" });
  }, [siteKey]);

  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={ref} />
    </>
  );
}
