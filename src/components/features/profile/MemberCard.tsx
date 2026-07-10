import { Link } from "@/i18n/navigation";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import type { MemberSummary } from "@/types/database";

export default function MemberCard({ member }: { member: MemberSummary }) {
  const displayName = member.name ?? `@${member.tag}`;
  return (
    <Link href={`/membri/${member.tag}`} className="block">
      <Card className="flex items-center gap-4 p-4 transition-colors hover:border-accent-red/40">
        <Avatar src={member.avatar_url} alt="" size={48} />
        <div className="min-w-0">
          <p className="truncate font-display font-black italic uppercase tracking-tighter text-white">
            {displayName}
          </p>
          <p className="truncate font-mono text-[11px] text-white/40">@{member.tag}</p>
          {member.town && (
            <p className="truncate font-mono text-[11px] text-white/40">{member.town}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
