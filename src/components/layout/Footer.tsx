import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const tb = useTranslations("brand");
  return (
    <footer className="mt-auto bg-surface-dim border-t border-white/5 py-6 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] font-mono text-white/40">
        <span>{t("copyright")}</span>
        <span className="uppercase tracking-widest text-accent-red">{tb("payoff")}</span>
      </div>
    </footer>
  );
}
