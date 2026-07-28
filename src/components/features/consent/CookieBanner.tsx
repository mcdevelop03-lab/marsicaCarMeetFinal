"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import { useConsent } from "./ConsentProvider";

export default function CookieBanner() {
  const t = useTranslations("consent");
  const { bannerAperto, external, acceptAll, rejectAll, setExternal } = useConsent();
  const [personalizza, setPersonalizza] = useState(false);
  const [extScelto, setExtScelto] = useState(external);

  if (!bannerAperto) return null;

  function apriPersonalizza() {
    setExtScelto(external); // sincronizza col valore corrente (utile alla riapertura dal footer)
    setPersonalizza(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-surface-dim/95 backdrop-blur">
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-5">
        <div className="space-y-1">
          <p className="font-display text-sm font-black italic uppercase tracking-tight text-white">
            {t("bannerTitle")}
          </p>
          <p className="font-mono text-[11px] leading-relaxed text-white/60">
            {t("bannerText")}{" "}
            <Link href="/privacy" className="underline hover:text-white">
              {t("linkPrivacy")}
            </Link>{" "}
            ·{" "}
            <Link href="/cookie" className="underline hover:text-white">
              {t("linkCookie")}
            </Link>
          </p>
        </div>

        {personalizza && (
          <div className="space-y-2 border-y border-white/10 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-white">{t("catNecessary")}</p>
                <p className="font-mono text-[11px] text-white/50">{t("catNecessaryDesc")}</p>
              </div>
              <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-white/40">
                {t("alwaysOn")}
              </span>
            </div>
            <label className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-white">{t("catExternal")}</p>
                <p className="font-mono text-[11px] text-white/50">{t("catExternalDesc")}</p>
              </div>
              <input
                type="checkbox"
                checked={extScelto}
                onChange={(e) => setExtScelto(e.target.checked)}
                className="mt-1"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {personalizza ? (
            <Button type="button" onClick={() => setExternal(extScelto)}>
              {t("savePrefs")}
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={acceptAll}>
                {t("acceptAll")}
              </Button>
              <Button type="button" variant="outline" onClick={rejectAll}>
                {t("rejectAll")}
              </Button>
              <Button type="button" variant="ghost" onClick={apriPersonalizza}>
                {t("customize")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
