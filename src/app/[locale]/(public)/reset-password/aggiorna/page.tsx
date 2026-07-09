import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthForm from "@/components/features/auth/AuthForm";
import AuthShell from "@/components/features/auth/AuthShell";
import ValidatedInput from "@/components/features/auth/ValidatedInput";
import { updatePassword } from "../../auth/actions";
import { requireUser } from "@/lib/auth";

export default async function NewPasswordPage() {
  // Richiede una sessione valida. Se l'utente ha il 2FA, `requireUser` lo rimanda
  // alla sfida MFA con `next` verso questa stessa pagina: GoTrue esige AAL2 per
  // cambiare la password quando l'MFA è attivo, quindi la sfida va completata prima.
  await requireUser("/reset-password/aggiorna");
  const t = await getTranslations("auth");
  return (
    <AuthShell>
      <AuthForm
        action={updatePassword}
        title={t("resetTitle")}
        submitLabel={t("submitReset")}
        successCta={
          <Link
            href="/login"
            className="inline-block text-xs font-mono uppercase tracking-widest text-accent-red hover:text-white transition-colors"
          >
            {t("proceedToLogin")}
          </Link>
        }
      >
        <ValidatedInput name="password" type="password" placeholder={t("password")} required rule="minLength" min={8} hint={t("passwordHint")} />
      </AuthForm>
    </AuthShell>
  );
}
