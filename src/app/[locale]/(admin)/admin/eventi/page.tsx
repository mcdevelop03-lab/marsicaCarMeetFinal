import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import EventAdminActions from "@/components/features/events/EventAdminActions";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { statoEvento } from "@/lib/events/stato";
import { formattaDataBreve } from "@/lib/date/format";
import type { Event } from "@/types/database";

export default async function AdminEventiPage() {
  const t = await getTranslations("adminEvents");
  const te = await getTranslations("events");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  // Un guasto non deve travestirsi da elenco vuoto (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) console.error("Admin eventi: lettura non riuscita", error);
  const eventi = (data ?? []) as Event[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <SectionHeading>{t("title")}</SectionHeading>
        <Link href="/admin/eventi/nuovo">
          <Button className="flex items-center gap-2">
            <Plus size={14} />
            {t("add")}
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="font-mono text-xs text-accent-red">{t("genericError")}</p>
      ) : eventi.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
        <div className="space-y-4">
          {eventi.map((evento) => {
            const stato = statoEvento(evento);
            return (
              <Card key={evento.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display font-black italic uppercase tracking-tighter text-white">
                      {evento.title}
                    </p>
                    <Badge tone={stato === "annullato" ? "accent" : "muted"}>
                      {te(`stato_${stato}`)}
                    </Badge>
                    <Badge>{te(`type_${evento.type}`)}</Badge>
                  </div>
                  <p className="font-mono text-[11px] text-white/40">
                    {formattaDataBreve(evento.starts_at)}
                    {evento.location ? ` · ${evento.location}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/eventi/${evento.slug}`}
                    className="font-mono text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                  >
                    {t("view")}
                  </Link>
                  <Link
                    href={`/admin/eventi/${evento.id}/modifica`}
                    className="font-mono text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                  >
                    {t("edit")}
                  </Link>
                  <EventAdminActions id={evento.id} annullato={evento.status === "canceled"} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
