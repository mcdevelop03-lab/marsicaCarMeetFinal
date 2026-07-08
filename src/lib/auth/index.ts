import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();
  return (data as Profile) ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect({ href: "/login", locale: "it" });
  return user!;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect({ href: "/login", locale: "it" });
  if (profile!.role !== "admin") redirect({ href: "/dashboard", locale: "it" });
  return profile!;
}
