import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("cookiePolicy");
  return { title: `${t("title")} — Marsica Car Meet` };
}

export default async function CookiePage() {
  const t = await getTranslations("cookiePolicy");
  const necessaryRows = t.raw("necessaryRows") as string[];

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-black italic uppercase tracking-tighter text-white">
          {t("title")}
        </h1>
        <p className="font-mono text-[11px] text-white/40">{t("updated")}</p>
        <p className="border border-accent-red/40 bg-accent-red/10 p-3 font-mono text-[11px] text-white/70">
          {t("disclaimer")}
        </p>
      </header>

      <p className="text-sm leading-relaxed text-white/70">{t("intro")}</p>

      <section className="space-y-2">
        <h2 className="font-mono text-sm uppercase tracking-widest text-white">
          {t("necessaryTitle")}
        </h2>
        <ul className="space-y-1">
          {necessaryRows.map((r, i) => (
            <li key={i} className="text-sm leading-relaxed text-white/70">
              • {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-mono text-sm uppercase tracking-widest text-white">
          {t("externalTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-white/70">{t("externalText")}</p>
        <p className="text-sm leading-relaxed text-white/50">{t("noAnalytics")}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-mono text-sm uppercase tracking-widest text-white">{t("manageTitle")}</h2>
        <p className="text-sm leading-relaxed text-white/70">{t("manageText")}</p>
      </section>
    </article>
  );
}
