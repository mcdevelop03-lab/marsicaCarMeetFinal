import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard from "@/components/features/events/EventCard";
import { createClient } from "@/lib/supabase/server";
import { statoEvento } from "@/lib/events/stato";
import type { Event } from "@/types/database";

export default async function EventiPage() {
  const t = await getTranslations("events");

  const supabase = await createClient();
  // Lettura pubblica: la policy `events_select_public` la consente anche da sloggati (D-146).
  const { data, error } = await supabase.from("events").select("*");

  // Un guasto non deve travestirsi da "nessun raduno" (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) console.error("Eventi: lettura non riuscita", error);
  const eventi = (data ?? []) as Event[];

  // Gli annullati con data futura restano fra i PROSSIMI, con il loro badge: chi
  // pensava di venire deve vederlo. Passata la data scendono fra i conclusi.
  const prossimi = eventi
    .filter((e) => statoEvento(e) !== "concluso")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const conclusi = eventi
    .filter((e) => statoEvento(e) === "concluso")
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  if (error) {
    return (
      <div className="space-y-8">
        <SectionHeading>{t("title")}</SectionHeading>
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <SectionHeading>{t("upcoming")}</SectionHeading>
        {prossimi.length === 0 ? (
          <p className="font-mono text-xs text-white/40">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {prossimi.map((evento) => (
              <EventCard key={evento.id} event={evento} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <SectionHeading>{t("past")}</SectionHeading>
        {conclusi.length === 0 ? (
          <p className="font-mono text-xs text-white/40">{t("emptyPast")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {conclusi.map((evento) => (
              <EventCard key={evento.id} event={evento} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
