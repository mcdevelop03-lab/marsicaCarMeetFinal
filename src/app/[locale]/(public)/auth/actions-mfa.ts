"use server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function verifyMfa(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (!totp) {
    redirect({ href: "/login?mfa=1&error=1", locale: "it" });
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp!.id, code });
  if (error) {
    redirect({ href: "/login?mfa=1&error=1", locale: "it" });
  }
  redirect({ href: "/dashboard", locale: "it" });
}
