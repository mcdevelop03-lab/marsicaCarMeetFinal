import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("privacy");
  return { title: `${t("title")} — Marsica Car Meet` };
}

type Sezione = { titolo: string; paragrafi: string[] };

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const sezioni = t.raw("sezioni") as Sezione[];

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
      {sezioni.map((s) => (
        <section key={s.titolo} className="space-y-2">
          <h2 className="font-mono text-sm uppercase tracking-widest text-white">{s.titolo}</h2>
          {s.paragrafi.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-white/70">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
