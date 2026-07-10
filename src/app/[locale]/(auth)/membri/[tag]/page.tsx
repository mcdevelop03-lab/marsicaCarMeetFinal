import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import SocialLinks from "@/components/features/profile/SocialLinks";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function MembroPage({ params }: { params: Promise<{ tag: string }> }) {
  const t = await getTranslations("members");
  const tp = await getTranslations("placeholder");
  const { tag } = await params;
  // I tag sono salvati in minuscolo: normalizziamo l'URL prima di cercare.
  const wantedTag = decodeURIComponent(tag).toLowerCase();

  const me = await getProfile();
  // Il mio profilo si modifica da /profilo: non serve una seconda vista.
  if (me?.tag === wantedTag) redirect({ href: "/profilo", locale: "it" });

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("tag", wantedTag).maybeSingle();
  if (!data) notFound();

  const member = data as Profile;
  const displayName = member.name ?? `@${member.tag}`;

  return (
    <div className="space-y-8">
      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Avatar src={member.avatar_url} alt={displayName} size={96} />
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-2xl font-black italic uppercase tracking-tighter text-white">
            {displayName}
          </h1>
          <p className="font-mono text-xs text-white/40">@{member.tag}</p>
          {member.town && (
            <p className="flex items-center gap-2 font-mono text-xs text-white/40">
              <MapPin size={12} />
              {member.town}
            </p>
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <p className="text-sm text-white/70">{member.bio ?? t("noBio")}</p>
        <SocialLinks socials={member.socials} />
      </Card>

      {/* Segnaposto: la Fase 1B-2 sostituirà questa sezione col garage del membro. */}
      <div className="space-y-4">
        <SectionHeading>{t("garageTitle")}</SectionHeading>
        <p className="font-mono text-xs text-white/40">{tp("comingSoon")}</p>
      </div>
    </div>
  );
}
