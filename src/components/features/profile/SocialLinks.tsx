import SocialIcon from "@/components/ui/icons/SocialIcon";
import { SOCIAL_LABELS, socialEntries } from "@/lib/profile/socials";
import type { Profile } from "@/types/database";

export default function SocialLinks({ socials }: { socials: Profile["socials"] }) {
  const entries = socialEntries(socials);
  if (entries.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {entries.map(({ key, handle, url }) => (
        <li key={key}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${SOCIAL_LABELS[key]}: @${handle}`}
            className="flex items-center gap-2 border border-white/10 px-3 py-2 font-mono text-[11px] text-white/60 transition-colors hover:border-accent-red/40 hover:text-white"
          >
            <SocialIcon name={key} />
            <span>@{handle}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
