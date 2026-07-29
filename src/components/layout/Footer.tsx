import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import PreferenzeCookieButton from "@/components/features/consent/PreferenzeCookieButton";

export default function Footer() {
  const t = useTranslations("footer");
  const tb = useTranslations("brand");
  return (
    <footer className="mt-auto bg-surface-dim border-t border-white/5 py-6 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] font-mono text-white/40">
        <span>{t("copyright")}</span>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="uppercase tracking-widest transition-colors hover:text-white">
            {t("privacy")}
          </Link>
          <Link href="/cookie" className="uppercase tracking-widest transition-colors hover:text-white">
            {t("cookie")}
          </Link>
          <PreferenzeCookieButton />
        </nav>
        <span className="uppercase tracking-widest text-accent-red">{tb("payoff")}</span>
      </div>
    </footer>
  );
}
