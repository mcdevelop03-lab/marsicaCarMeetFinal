"use server";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { signupSchema } from "@/lib/validation/auth";
import type { AuthState } from "@/components/features/auth/AuthForm";

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
