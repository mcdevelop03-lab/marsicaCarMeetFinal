import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import TwoFactorSetup from "@/components/features/auth/TwoFactorSetup";
import { createClient } from "@/lib/supabase/server";

export default async function ImpostazioniPage() {
  const t = await getTranslations("settings");
  const labels = {
    enable2fa: t("enable2fa"),
    disable2fa: t("disable2fa"),
    scanQr: t("scanQr"),
    verify: t("verify"),
    enabled2fa: t("enabled2fa"),
    code: t("code"),
    confirmDisable: t("confirmDisable"),
    confirm: t("confirm"),
    cancel: t("cancel"),
  };

  // La fonte di verità sullo stato 2FA sta qui, sul server: `TwoFactorSetup` è
  // un componente client e da solo non può conoscere i fattori già esistenti.
  // Senza questa lettura la pagina mostrava "Attiva 2FA" anche a 2FA attivo, e
  // premere quel bottone creava un SECONDO fattore.
  // Contano solo i fattori `verified`: gli `unverified` sono tentativi abbandonati.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) console.error("Impostazioni: elenco dei fattori 2FA non riuscito", error);
  const attivo = (data?.all ?? []).some(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  );

  return (
    <div className="space-y-6">
      <SectionHeading>{t("title")}</SectionHeading>
      <div className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-white/60">{t("twoFactor")}</h3>
        <TwoFactorSetup labels={labels} attivo={attivo} />
      </div>
    </div>
  );
}
