import { getTranslations } from "next-intl/server";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { statoEvento } from "@/lib/events/stato";
import { formattaDataBreve } from "@/lib/date/format";
import type { Event } from "@/types/database";

export default async function EventCard({ event }: { event: Event }) {
  const t = await getTranslations("events");
  const stato = statoEvento(event);

  return (
    <Link href={`/eventi/${event.slug}`} className="group block">
      <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-white/20">
        {event.cover_url ? (
          // Foto con <img>: il progetto non configura `remotePatterns` (come Avatar.tsx).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_url}
            alt=""
            className={`h-48 w-full object-cover ${stato === "concluso" ? "opacity-50" : ""}`}
          />
        ) : (
          // Segnaposto: la copertina è facoltativa (spec 1C-1), così si può annunciare
          // un raduno prima di avere una foto. Solo token di tema, nessun colore fisso.
          <div className="flex h-48 w-full items-center justify-center bg-surface-dim">
            <span className="font-display text-3xl font-black italic uppercase tracking-tighter text-white/10">
              {t(`type_${event.type}`)}
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={stato === "annullato" ? "accent" : "muted"}>{t(`stato_${stato}`)}</Badge>
            <Badge>{t(`type_${event.type}`)}</Badge>
          </div>

          <p className="font-display font-black italic uppercase tracking-tighter text-white">
            {event.title}
          </p>

          <p className="font-mono text-[11px] text-white/40">
            {formattaDataBreve(event.starts_at)}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
      </Card>
    </Link>
  );
}
