"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL_KEYS } from "@/lib/profile/socials";
import { profileSchema } from "@/lib/validation/profile";
import type { ProfileState } from "@/components/features/profile/ProfileForm";

export async function updateProfile(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const t = await getTranslations("profile");
  const user = await requireUser();

  const text = (key: string) => String(formData.get(key) ?? "");
  const parsed = profileSchema.safeParse({
    name: text("name"),
    tag: text("tag"),
    bio: text("bio"),
    town: text("town"),
    instagram: text("instagram"),
    facebook: text("facebook"),
    tiktok: text("tiktok"),
    youtube: text("youtube"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, tag, bio, town } = parsed.data;
  const socials: Record<string, string> = {};
  for (const key of SOCIAL_KEYS) {
    const handle = parsed.data[key];
    if (handle) socials[key] = handle;
  }

  const supabase = await createClient();
  // La policy RLS `profiles_update_self` impedisce già di toccare il profilo
  // altrui e di cambiarsi il `role`: qui non serve altra logica.
  const { error } = await supabase
    .from("profiles")
    .update({ name, tag, bio: bio ?? null, town: town ?? null, socials })
    .eq("id", user.id);

  if (error) {
    // 23505 = unique_violation di Postgres: il tag è già di un altro membro.
    if (error.code === "23505") return { error: t("tagTaken") };
    return { error: t("genericError") };
  }

  // Il nome e (dal Task 5) l'avatar compaiono nell'header, che sta nel layout di
  // `[locale]`: rivalidare il solo path della pagina non basta. `/` + "layout"
  // è la forma documentata per invalidare tutto, ed è quello che ci serve qui.
  revalidatePath("/", "layout");
  return { success: t("saved") };
}

export async function setAvatar(path: string): Promise<{ error?: string }> {
  const t = await getTranslations("profile");
  const user = await requireUser();

  // Difesa in profondità: le policy dello storage consentono la scrittura solo
  // in `{uid}/`, ma `path` arriva dal client e finisce dritto in `avatar_url`.
  if (!path.startsWith(`${user.id}/`)) return { error: t("genericError") };

  const supabase = await createClient();
  // getPublicUrl è sincrono e non fallisce: il bucket `avatars` è pubblico in lettura.
  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", user.id);
  if (error) return { error: t("genericError") };

  // Nella cartella dell'utente resta un solo file: gli altri sono orfani.
  // Si elencano e si cancellano invece di ricavare il path dal vecchio URL.
  // L'elenco richiede la policy `avatars_select_own` (migrazione 0006): senza,
  // la RLS filtra tutto e `list` torna una lista vuota, silenziosamente.
  //
  // Un fallimento qui NON è un errore per l'utente: l'avatar nuovo è già salvato
  // e valido. Lasciamo però una traccia nei log del server, altrimenti una
  // pulizia rotta è indistinguibile da "non c'era nulla da pulire".
  const { data: files, error: listError } = await supabase.storage.from("avatars").list(user.id);
  if (listError) {
    console.error("setAvatar: elenco della cartella avatar non riuscito", listError);
  } else {
    const stale = (files ?? [])
      .map((file) => `${user.id}/${file.name}`)
      .filter((candidate) => candidate !== path);
    if (stale.length > 0) {
      const { error: removeError } = await supabase.storage.from("avatars").remove(stale);
      if (removeError) {
        console.error("setAvatar: rimozione degli avatar orfani non riuscita", removeError);
      }
    }
  }

  revalidatePath("/", "layout");
  return {};
}
