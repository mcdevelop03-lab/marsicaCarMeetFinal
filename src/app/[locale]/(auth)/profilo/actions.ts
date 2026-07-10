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
