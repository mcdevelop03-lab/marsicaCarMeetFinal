"use server";
import { createClient } from "@/lib/supabase/server";

export async function enrollTotp() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) return { error: "Impossibile avviare l'attivazione 2FA." };
  return {
    factorId: data.id,
    qr: `data:image/svg+xml;utf-8,${data.totp.qr_code}`,
    secret: data.totp.secret,
  };
}

export async function verifyTotp(factorId: string, code: string) {
  const supabase = await createClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) return { error: "Codice non valido." };
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  return error ? { error: "Codice non valido." } : { success: true };
}

export async function unenrollTotp(factorId: string) {
  const supabase = await createClient();
  await supabase.auth.mfa.unenroll({ factorId });
  return { success: true };
}
