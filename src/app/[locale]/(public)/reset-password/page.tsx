import { getTranslations } from "next-intl/server";
import AuthForm from "@/components/features/auth/AuthForm";
import AuthShell from "@/components/features/auth/AuthShell";
import ValidatedInput from "@/components/features/auth/ValidatedInput";
import { requestReset } from "../auth/actions";

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell>
      <AuthForm action={requestReset} title={t("resetTitle")} submitLabel={t("submitReset")}>
        <ValidatedInput name="email" type="email" placeholder={t("email")} required rule="email" hint={t("emailHint")} />
      </AuthForm>
    </AuthShell>
  );
}
