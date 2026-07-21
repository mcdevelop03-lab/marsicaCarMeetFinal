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

/**
 * Pannello di gestione eventi dell'admin. NON è una rotta a sé: viene montato in fondo a
 * `/eventi` solo quando chi guarda è admin (principio "niente rotte parallele" — vedi
 * docs/STATO-LAVORI.md). Il controllo del ruolo qui è solo facciata UI: la difesa vera
 * resta doppia — `requireAdmin()` in ogni server action + le RLS a livello DB.
 *
 * Usa `select("*")` (a differenza della lista pubblica in `/eventi`, che nasconde
 * `created_by`): qui chi legge è admin, quindi vedere tutte le colonne è legittimo.
 */
export default async function EventiGestione() {
  const t = await getTranslations("adminEvents");
  const te = await getTranslations("events");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  // Un guasto non deve travestirsi da elenco vuoto (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) console.error("Gestione eventi: lettura non riuscita", error);
  const eventi = (data ?? []) as Event[];

  return (
    <section className="space-y-6 border-t border-white/10 pt-10">
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
        <p className="font-mono text-xs text-accent-red">{te("loadError")}</p>
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
                  <EventAdminActions id={evento.id} annullato={stato === "annullato"} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
