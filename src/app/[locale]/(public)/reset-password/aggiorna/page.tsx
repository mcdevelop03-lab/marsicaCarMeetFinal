import { getTranslations } from "next-intl/server";
import AuthForm from "@/components/features/auth/AuthForm";
import Input from "@/components/ui/Input";
import { updatePassword } from "../../auth/actions";
import { requireUser } from "@/lib/auth";

export default async function NewPasswordPage() {
  // Richiede una sessione valida. Se l'utente ha il 2FA, `requireUser` lo rimanda
  // alla sfida MFA con `next` verso questa stessa pagina: GoTrue esige AAL2 per
  // cambiare la password quando l'MFA è attivo, quindi la sfida va completata prima.
  await requireUser("/reset-password/aggiorna");
  const t = await getTranslations("auth");
  return (
    <AuthForm action={updatePassword} title={t("resetTitle")} submitLabel={t("submitReset")}>
      <Input name="password" type="password" placeholder={t("password")} required />
    </AuthForm>
  );
}
