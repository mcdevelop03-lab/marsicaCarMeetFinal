import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import SocialLinks from "@/components/features/profile/SocialLinks";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function MembroPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("members");
  const tp = await getTranslations("placeholder");
  const { tag } = await params;
  // `q` arriva dalla card di /membri: serve solo a ricostruire il link di ritorno
  // sui risultati della ricerca da cui l'utente è partito.
  const { q } = await searchParams;
  // I tag sono salvati in minuscolo: normalizziamo l'URL prima di cercare.
  // decodeURIComponent lancia su sequenze percent malformate (es. "abc%zz"):
  // un URL ostile del genere è semplicemente un tag inesistente, non un 500.
  let wantedTag: string;
  try {
    wantedTag = decodeURIComponent(tag).toLowerCase();
  } catch {
    notFound();
  }

  const me = await getProfile();
  // Il mio profilo si modifica da /profilo: non serve una seconda vista.
  if (me?.tag === wantedTag) redirect({ href: "/profilo", locale: "it" });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("tag", wantedTag)
    .maybeSingle();

  // Un guasto NON è un 404: rispondere "questo membro non esiste" quando in
  // realtà non siamo riusciti a controllare è una bugia. `notFound()` resta solo
  // per il caso "query riuscita, nessuna riga".
  if (error) {
    console.error("Membro: lettura del profilo non riuscita", error);
    return (
      <div className="space-y-8">
        <Link
          href="/membri"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t("back")}
        </Link>
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      </div>
    );
  }
  if (!data) notFound();

  const member = data as Profile;
  const displayName = member.name ?? `@${member.tag}`;

  // Link vero, non `history.back()`: la pagina può essere aperta da un URL
  // condiviso, e in quel caso la cronologia non ha nulla a cui tornare.
  const backHref = q ? `/membri?q=${encodeURIComponent(q)}` : "/membri";

  return (
    <div className="space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {t("back")}
      </Link>

      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Avatar src={member.avatar_url} alt={displayName} size={96} />
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-2xl font-black italic uppercase tracking-tighter text-white">
            {displayName}
          </h1>
          <p className="font-mono text-xs text-white/40">@{member.tag}</p>
          {member.town && (
            <p className="flex items-center gap-2 font-mono text-xs text-white/40">
              <MapPin size={12} aria-hidden="true" />
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
