import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SectionHeading from "@/components/ui/SectionHeading";
import MemberCard from "@/components/features/profile/MemberCard";
import { ilikePattern, quoteOrValue } from "@/lib/profile/search";
import { createClient } from "@/lib/supabase/server";
import type { MemberSummary } from "@/types/database";

const MAX_QUERY_LENGTH = 50;
const SEARCH_LIMIT = 24;
const LATEST_LIMIT = 12;

export default async function MembriPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("members");
  const q = ((await searchParams).q ?? "").trim().slice(0, MAX_QUERY_LENGTH);

  const supabase = await createClient();
  // La policy `profiles_select_authenticated` limita già la lettura ai loggati.
  // I profili senza tag non hanno una pagina: si escludono a monte.
  const base = supabase
    .from("profiles")
    .select("id, name, tag, avatar_url, town")
    .not("tag", "is", null);

  // Niente `let query` riassegnata: `.order()` restituisce un builder di tipo
  // diverso da `.not()`, e TypeScript rifiuterebbe l'assegnazione.
  const pattern = q ? quoteOrValue(ilikePattern(q)) : null;
  const { data } = pattern
    ? await base.or(`name.ilike.${pattern},tag.ilike.${pattern}`).order("name").limit(SEARCH_LIMIT)
    : await base.order("created_at", { ascending: false }).limit(LATEST_LIMIT);

  const members = (data ?? []) as MemberSummary[];

  return (
    <div className="space-y-8">
      <SectionHeading>{t("title")}</SectionHeading>

      {/* Form GET: la ricerca finisce nell'URL, è condivisibile e non richiede JS. */}
      <form method="get" className="flex gap-3">
        <Input
          name="q"
          defaultValue={q}
          maxLength={MAX_QUERY_LENGTH}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
        />
        <Button type="submit" className="flex shrink-0 items-center gap-2">
          <Search size={14} />
          {t("searchSubmit")}
        </Button>
      </form>

      <h3 className="font-mono text-[11px] uppercase tracking-widest text-white/60">
        {q ? t("results", { q }) : t("latest")}
      </h3>

      {members.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
