"use client";
import { useTranslations } from "next-intl";
import { useConsent } from "./ConsentProvider";

export default function PreferenzeCookieButton() {
  const t = useTranslations("footer");
  const { riapriBanner } = useConsent();
  return (
    <button
      type="button"
      onClick={riapriBanner}
      className="uppercase tracking-widest transition-colors hover:text-white"
    >
      {t("cookiePrefs")}
    </button>
  );
}
