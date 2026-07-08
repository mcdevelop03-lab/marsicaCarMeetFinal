"use server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function verifyMfa(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (totp) {
    await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code });
  }
  redirect({ href: "/dashboard", locale: "it" });
}
