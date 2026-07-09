"use server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function verifyMfa(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  // Destinazione post-sfida (path senza prefisso locale). Serve al flusso di reset
  // password con 2FA: dopo la sfida si torna alla pagina di reset, non alla dashboard.
  const next = String(formData.get("next") ?? "");
  const errorQuery = next ? { mfa: "1", next, error: "1" } : { mfa: "1", error: "1" };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (!totp) {
    redirect({ href: { pathname: "/login", query: errorQuery }, locale: "it" });
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp!.id, code });
  if (error) {
    redirect({ href: { pathname: "/login", query: errorQuery }, locale: "it" });
  }
  redirect({ href: next || "/dashboard", locale: "it" });
}
