"use client";
import Script from "next/script";

// Renderizza il widget Turnstile; il token finisce in un input hidden `cf-turnstile-response`
// che viene inviato con il form (letto server-side come formData.get("cf-turnstile-response")).
export default function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
    </>
  );
}
