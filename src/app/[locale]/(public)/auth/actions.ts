"use server";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { signupSchema, loginSchema, resetSchema } from "@/lib/validation/auth";
import type { AuthState } from "@/components/features/auth/AuthForm";
import { redirect } from "@/i18n/navigation";
import { redirect as nextRedirect } from "next/navigation";

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");

  const turnstileOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
  );
  if (!turnstileOk) return { error: t("turnstileFailed") };

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: `${origin}/it/auth/callback`,
    },
  });
  if (error) return { error: t("genericError") };
  return { success: t("checkEmail") };
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");

  const turnstileOk = await verifyTurnstile(
    formData.get("cf-turnstile-response") as string | null,
  );
  if (!turnstileOk) return { error: t("turnstileFailed") };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: t("invalidCredentials") };

  // Se l'utente ha 2FA attiva, la sessione è "aal1": va completata la sfida.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
    redirect({ href: { pathname: "/login", query: { mfa: "1" } }, locale: "it" });
  }
  redirect({ href: "/dashboard", locale: "it" });
  return {};
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/", locale: "it" });
}

export async function signInWithGoogle(): Promise<void> {
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/it/auth/callback` },
  });
  if (data?.url) nextRedirect(data.url); // redirect esterno: usa next/navigation redirect
}

export async function requestReset(_state: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");

  const parsed = resetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/it/auth/callback?next=/it/impostazioni/reset`,
  });
  // messaggio neutro (no user enumeration)
  return { success: t("resetSent") };
}

export async function updatePassword(_state: AuthState, formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth");

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "La password deve avere almeno 8 caratteri" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: t("genericError") };
  return { success: t("passwordUpdated") };
}
