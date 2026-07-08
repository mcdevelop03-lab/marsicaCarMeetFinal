import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";

export default async function AdminPage() {
  const t = await getTranslations("admin");
  return (
    <div className="space-y-6">
      <SectionHeading>{t("title")}</SectionHeading>
      <p className="font-mono text-xs text-white/40 uppercase tracking-widest">{t("placeholder")}</p>
    </div>
  );
}
