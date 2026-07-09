import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthForm from "@/components/features/auth/AuthForm";
import AuthShell from "@/components/features/auth/AuthShell";
import ValidatedInput from "@/components/features/auth/ValidatedInput";
import TurnstileWidget from "@/components/features/auth/TurnstileWidget";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { signup, signInWithGoogle } from "../auth/actions";

export default async function RegistratiPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell>
      <AuthForm
        action={signup}
        title={t("signupTitle")}
        submitLabel={t("submitSignup")}
        footer={
          <>
            <form action={signInWithGoogle}>
              <Button variant="outline" type="submit" className="w-full">{t("google")}</Button>
            </form>
            <p className="text-xs font-mono text-white/40">
              {t("hasAccount")}{" "}
              <Link href="/login" className="text-accent-red">
                {t("loginTitle")}
              </Link>
            </p>
          </>
        }
      >
        <Input name="name" placeholder={t("name")} required />
        <ValidatedInput name="email" type="email" placeholder={t("email")} required rule="email" hint={t("emailHint")} />
        <ValidatedInput name="password" type="password" placeholder={t("password")} required rule="minLength" min={8} hint={t("passwordHint")} />
        <TurnstileWidget />
      </AuthForm>
    </AuthShell>
  );
}
