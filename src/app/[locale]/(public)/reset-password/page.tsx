import { getTranslations } from "next-intl/server";
import AuthForm from "@/components/features/auth/AuthForm";
import Input from "@/components/ui/Input";
import { requestReset } from "../auth/actions";

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthForm action={requestReset} title={t("resetTitle")} submitLabel={t("submitReset")}>
      <Input name="email" type="email" placeholder={t("email")} required />
    </AuthForm>
  );
}
