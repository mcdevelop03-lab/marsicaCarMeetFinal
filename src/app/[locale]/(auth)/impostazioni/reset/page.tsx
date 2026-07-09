import { getTranslations } from "next-intl/server";
import AuthForm from "@/components/features/auth/AuthForm";
import Input from "@/components/ui/Input";
import { updatePassword } from "../../../(public)/auth/actions";

export default async function NewPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthForm action={updatePassword} title={t("resetTitle")} submitLabel={t("submitReset")}>
      <Input name="password" type="password" placeholder={t("password")} required />
    </AuthForm>
  );
}
