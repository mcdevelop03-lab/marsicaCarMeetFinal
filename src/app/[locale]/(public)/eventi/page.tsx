import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard, { type EventoPerCard } from "@/components/features/events/EventCard";
import { createClient } from "@/lib/supabase/server";
import { eConcluso } from "@/lib/events/stato";
import type { Event } from "@/types/database";

// Le colonne che servono davvero a `EventCard` e a `statoEvento`/`eConcluso`. `select("*")`
// consegnerebbe anche `created_by` (FK a `profiles`) a chiunque: la lettura è pubblica
// (`events_select_public` vale pure per gli sloggati, D-146), ma l'identità dei membri no
// (`profiles_select_authenticated`) — niente colonne in più di quelle usate.
const COLONNE_PUBBLICHE =
  "id, slug, title, location, starts_at, ends_at, status, type, cover_url";

// `id` serve solo alla `key` di React qui in pagina; il resto sono gli stessi campi che
// `EventCard` dichiara di usare davvero (vedi `EventoPerCard` lì) — non `Event` intero.
type EventoPubblico = EventoPerCard & Pick<Event, "id">;

export default async function EventiPage() {
  const t = await getTranslations("events");

  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select(COLONNE_PUBBLICHE);

  // Un guasto non deve travestirsi da "nessun raduno" (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) {
    console.error("Eventi: lettura non riuscita", error);
    return (
      <div className="space-y-8">
        <SectionHeading>{t("title")}</SectionHeading>
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      </div>
    );
  }
  const eventi = (data ?? []) as EventoPubblico[];

  // Gli annullati con data futura restano fra i PROSSIMI, con il loro badge: chi
  // pensava di venire deve vederlo. Passata la data scendono fra i conclusi, sempre
  // con il badge ANNULLATO (`eConcluso` ignora l'annullamento di proposito: la
  // decisione "prossimo o concluso" è solo temporale, il badge resta affare di
  // `statoEvento`, usato da `EventCard`).
  const prossimi = eventi
    .filter((e) => !eConcluso(e))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const conclusi = eventi
    .filter((e) => eConcluso(e))
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

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
