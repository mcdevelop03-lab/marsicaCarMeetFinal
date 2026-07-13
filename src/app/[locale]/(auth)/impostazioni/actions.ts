"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * I fattori TOTP dell'utente DELLA SESSIONE, divisi per stato.
 * `verified` = 2FA davvero attivo. `unverified` = tentativi di attivazione
 * abbandonati (QR aperto e mai confermato).
 */
async function totpFactors() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) {
    console.error("2FA: elenco dei fattori non riuscito", error);
    return { verified: [], unverified: [] };
  }
  const totp = data.all.filter((f) => f.factor_type === "totp");
  return {
    verified: totp.filter((f) => f.status === "verified"),
    unverified: totp.filter((f) => f.status !== "verified"),
  };
}

export async function enrollTotp() {
  const supabase = await createClient();

  // Ogni clic su "Attiva 2FA" creava un nuovo fattore: i tentativi abbandonati
  // restavano `unverified` e si accumulavano. Si ripuliscono prima di enrollare.
  const { unverified } = await totpFactors();
  for (const factor of unverified) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) return { error: "Impossibile avviare l'attivazione 2FA." };
  return {
    factorId: data.id,
    qr: data.totp.qr_code,
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
  if (error) return { error: "Codice non valido." };
  // Lo stato 2FA è ora letto dal server (impostazioni/page.tsx): va rivalidato,
  // altrimenti la pagina continuerebbe a mostrare "Attiva 2FA".
  revalidatePath("/", "layout");
  return { success: true };
}

export async function unenrollTotp(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  // Difesa in profondità: NESSUN `factorId` dal client. Se lo accettassimo dal
  // browser ci fideremmo di un id che non controlliamo; qui lo cerchiamo fra i
  // fattori dell'utente della sessione.
  // Nota: chi arriva qui col 2FA attivo è per forza in sessione AAL2 (il layout
  // `(auth)` chiama requireUser, che impone la sfida MFA), quindi il possesso
  // del telefono è già dimostrato: non serve richiedere un altro codice.
  const { verified } = await totpFactors();
  if (verified.length === 0) return { error: "Nessun 2FA attivo da disattivare." };

  for (const factor of verified) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) {
      console.error("2FA: disattivazione non riuscita", error);
      return { error: "Impossibile disattivare il 2FA." };
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}
