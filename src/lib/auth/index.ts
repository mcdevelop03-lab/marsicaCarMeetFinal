import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

// Le letture di sessione sono avvolte in `cache()` di React: senza, ogni
// `getUser()` fa una richiesta di rete a GoTrue per validare il JWT (è così che
// funziona `@supabase/ssr`), e su una singola pagina protetta se ne accumulano
// tre — layout `[locale]` (avatar), layout `(auth)` (guardia), pagina.
//
// ⚠️ ATTENZIONE, letture stantie nelle SERVER ACTION. `cache()` vive per un
// render pass, e una server action gira PRIMA del render che essa stessa
// innesca con `revalidatePath`. Quindi: in una server action non leggere un
// dato con una funzione memoizzata, mutarlo, e poi fidarti del valore
// memoizzato — serviresti dati pre-update. Se una action deve rileggere ciò che
// ha appena scritto, fa una query fresca con `createClient()`.
// Leggere l'IDENTITÀ (`getUser`/`requireUser`) è invece sempre sicuro: l'utente
// non cambia dentro una richiesta.

/**
 * Traccia le esecuzioni reali delle funzioni memoizzate, solo in sviluppo.
 * Il corpo di una funzione avvolta in `cache()` gira una volta sola per render
 * pass: le righe stampate sono quindi le chiamate di rete davvero effettuate.
 * Su una pagina protetta ci si aspetta 1 getUser + 1 getProfile + 1 getAal; se
 * il conteggio risale, la deduplica si è rotta. In produzione è un no-op.
 */
const traccia: (nome: string) => void =
  process.env.NODE_ENV === "development"
    ? (nome) => console.log(`[auth] ${nome}`)
    : () => {};

export const getUser = cache(async (): Promise<User | null> => {
  traccia("getUser");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  traccia("getProfile");
  // Passa dalla `getUser()` memoizzata, NON da `supabase.auth.getUser()`: è
  // questo che evita un secondo round-trip a GoTrue quando il layout e la
  // pagina chiedono entrambi il profilo. Memoizzare `getUser` senza questa
  // riga non deduplicherebbe nulla dei due `getProfile`.
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
});

/**
 * Il solo dato di rete del controllo MFA, memoizzato a parte.
 * `requireUser` non può essere avvolta in `cache()` perché fa `redirect()`, che
 * funziona lanciando un'eccezione: si memoizza il dato, non il flusso di
 * controllo.
 */
const getAal = cache(async () => {
  traccia("getAal");
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data;
});

export async function requireUser(mfaNext?: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect({ href: "/login", locale: "it" });

  const data = await getAal();
  if (data?.nextLevel === "aal2" && data.currentLevel !== "aal2") {
    // User has a verified 2FA factor but has not completed the second
    // factor challenge in this session: bounce to the MFA prompt instead
    // of letting them through to protected pages. `mfaNext` (path senza
    // prefisso locale, es. "/reset-password/aggiorna") fa tornare l'utente
    // alla pagina di partenza dopo la sfida invece che alla dashboard.
    redirect({
      href: { pathname: "/login", query: mfaNext ? { mfa: "1", next: mfaNext } : { mfa: "1" } },
      locale: "it",
    });
  }

  return user!;
}

export async function requireAdmin(): Promise<Profile> {
  await requireUser();
  const profile = await getProfile();
  if (!profile) redirect({ href: "/login", locale: "it" });
  if (profile!.role !== "admin") redirect({ href: "/dashboard", locale: "it" });
  return profile!;
}
