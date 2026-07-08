import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function Home() {
  const t = useTranslations("home");
  const tn = useTranslations("nav");
  return (
    <div className="space-y-16">
      <section className="relative border border-white/10 min-h-[420px] flex items-center overflow-hidden">
        <div className="absolute inset-0 racing-grid opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-accent-red/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl px-6 md:px-12 py-12 space-y-6">
          <Badge tone="accent">Prossimi raduni</Badge>
          <h1 className="font-display text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-white uppercase">
            {t("heroTitle")}
          </h1>
          <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/eventi">
              <Button>{tn("eventi")}</Button>
            </Link>
            <Link href="/garage">
              <Button variant="outline">{tn("garage")}</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border border-white/10 relative p-8 md:p-12 text-center overflow-hidden">
        <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <h2 className="font-display text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase">
            {t("ctaTitle")}
          </h2>
          <Link href="/registrati">
            <Button>{t("ctaButton")}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
