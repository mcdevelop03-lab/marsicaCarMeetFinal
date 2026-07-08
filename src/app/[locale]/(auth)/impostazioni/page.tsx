import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import TwoFactorSetup from "@/components/features/auth/TwoFactorSetup";

export default async function ImpostazioniPage() {
  const t = await getTranslations("settings");
  const labels = {
    enable2fa: t("enable2fa"),
    disable2fa: t("disable2fa"),
    scanQr: t("scanQr"),
    verify: t("verify"),
    enabled2fa: t("enabled2fa"),
    code: t("code"),
  };
  return (
    <div className="space-y-6">
      <SectionHeading>{t("title")}</SectionHeading>
      <div className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-white/60">{t("twoFactor")}</h3>
        <TwoFactorSetup labels={labels} />
      </div>
    </div>
  );
}
