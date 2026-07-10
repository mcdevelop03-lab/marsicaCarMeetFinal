import type { Profile } from "@/types/database";

// L'ordine di questo array è l'ordine in cui i social compaiono nella UI.
export const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "youtube"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

// Nomi di marchio: non passano da next-intl, non si traducono.
export const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
};

// In `profiles.socials` salviamo solo l'handle (niente `@`, niente URL):
// l'indirizzo lo costruisce l'app, così un cambio di dominio non tocca i dati.
const BASE_URLS: Record<SocialKey, string> = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
};

export function socialUrl(key: SocialKey, handle: string): string {
  return BASE_URLS[key] + encodeURIComponent(handle);
}

export function socialEntries(
  socials: Profile["socials"],
): { key: SocialKey; handle: string; url: string }[] {
  return SOCIAL_KEYS.flatMap((key) => {
    const handle = socials?.[key];
    return handle ? [{ key, handle, url: socialUrl(key, handle) }] : [];
  });
}
