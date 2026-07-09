import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthForm from "@/components/features/auth/AuthForm";
import AuthShell from "@/components/features/auth/AuthShell";
import ValidatedInput from "@/components/features/auth/ValidatedInput";
import TurnstileWidget from "@/components/features/auth/TurnstileWidget";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import { login, signInWithGoogle } from "../auth/actions";
import { verifyMfa } from "../auth/actions-mfa";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mfa?: string; error?: string; next?: string }>;
}) {
  const t = await getTranslations("auth");
  const { mfa, error, next } = await searchParams;

  if (mfa === "1") {
    return (
      <AuthShell>
        <form action={verifyMfa} className="w-full space-y-5">
          <SectionHeading>{t("loginTitle")}</SectionHeading>
          <p className="text-xs font-mono text-white/60">{t("twoFactorPrompt")}</p>
          <Input name="code" inputMode="numeric" placeholder={t("twoFactorCode")} required />
          {next && <input type="hidden" name="next" value={next} />}
          {error && <p className="text-xs font-mono text-accent-red">{t("invalidCode")}</p>}
          <Button type="submit" className="w-full">{t("submitLogin")}</Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthForm
        action={login}
        title={t("loginTitle")}
        submitLabel={t("submitLogin")}
        footer={
          <>
            <form action={signInWithGoogle}>
              <Button variant="outline" type="submit" className="w-full">{t("google")}</Button>
            </form>
            <div className="text-xs font-mono text-white/40 space-y-1">
              <p>
                <Link href="/reset-password" className="text-accent-red">{t("forgotPassword")}</Link>
              </p>
              <p>
                {t("noAccount")}{" "}
                <Link href="/registrati" className="text-accent-red">{t("signupTitle")}</Link>
              </p>
            </div>
          </>
        }
      >
        <ValidatedInput name="email" type="email" placeholder={t("email")} required rule="email" hint={t("emailHint")} />
        <Input name="password" type="password" placeholder={t("password")} required />
        <TurnstileWidget />
      </AuthForm>
    </AuthShell>
  );
}
