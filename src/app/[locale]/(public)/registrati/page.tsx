import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthForm from "@/components/features/auth/AuthForm";
import TurnstileWidget from "@/components/features/auth/TurnstileWidget";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { signup, signInWithGoogle } from "../auth/actions";

export default async function RegistratiPage() {
  const t = await getTranslations("auth");
  return (
    <div className="space-y-4">
      <AuthForm action={signup} title={t("signupTitle")} submitLabel={t("submitSignup")}>
        <Input name="name" placeholder={t("name")} required />
        <Input name="email" type="email" placeholder={t("email")} required />
        <Input name="password" type="password" placeholder={t("password")} required />
        <TurnstileWidget />
      </AuthForm>
      <form action={signInWithGoogle}>
        <Button variant="outline" type="submit">{t("google")}</Button>
      </form>
      <p className="text-xs font-mono text-white/40">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-accent-red">
          {t("loginTitle")}
        </Link>
      </p>
    </div>
  );
}
