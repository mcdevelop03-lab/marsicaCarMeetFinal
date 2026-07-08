import { useTranslations } from "next-intl";
import SectionHeading from "@/components/ui/SectionHeading";

export default function GaragePage() {
  const t = useTranslations("placeholder");
  return (
    <div className="space-y-6">
      <SectionHeading>Garage</SectionHeading>
      <p className="font-mono text-xs text-white/40 uppercase tracking-widest">{t("comingSoon")}</p>
    </div>
  );
}
