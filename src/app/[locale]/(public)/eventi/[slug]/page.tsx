import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { statoEvento } from "@/lib/events/stato";
import { formattaIntervallo } from "@/lib/date/format";
import type { Event } from "@/types/database";

// Le colonne che questa pagina legge davvero (render + `statoEvento`). `select("*")`
// consegnerebbe anche `created_by` (FK a `profiles`) a chiunque: la lettura è pubblica
// anche per gli sloggati (`events_select_public`, `using(true)`), ma l'identità dei
// membri no (`profiles_select_authenticated`) — niente colonne in più di quelle usate,
// stesso principio della select dell'elenco (`src/app/[locale]/(public)/eventi/page.tsx`).
const COLONNE_PUBBLICHE =
  "title, description, location, map_url, starts_at, ends_at, capacity, status, type, cover_url";

// Il minimo che serve al dettaglio: più campi di `EventoPerCard` (mappa, capienza,
// descrizione), ma sempre un `Pick<Event, ...>`, non `Event` intero — niente doppio
// cast `as unknown as Event` per far quadrare i tipi con una select parziale.
type EventoDettaglio = Pick<
  Event,
  | "title"
  | "description"
  | "location"
  | "map_url"
  | "starts_at"
  | "ends_at"
  | "capacity"
  | "status"
  | "type"
  | "cover_url"
>;

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getTranslations("events");
  const { slug } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(COLONNE_PUBBLICHE)
    .eq("slug", slug)
    .maybeSingle();

  // Un guasto NON è un 404: rispondere "questo evento non esiste" quando in realtà non
  // siamo riusciti a controllare è una bugia. `notFound()` resta solo per
  // "query riuscita, nessuna riga". A differenza dell'`id` (uuid) della pagina di
  // modifica, `slug` è testo: non esiste un cast che possa fallire, quindi uno slug
  // inesistente è sempre una query RIUSCITA con zero righe (mai un errore Postgres).
  if (error) {
    console.error("Evento: lettura non riuscita", error);
    return (
      <div className="space-y-8">
        <Link
          href="/eventi"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t("backToEvents")}
        </Link>
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      </div>
    );
  }
  if (!data) notFound();

  const evento = data as EventoDettaglio;
  const stato = statoEvento(evento);

  return (
    <div className="space-y-8">
      <Link
        href="/eventi"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {t("backToEvents")}
      </Link>

      {evento.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={evento.cover_url}
          alt=""
          className="h-64 w-full border border-white/10 object-cover md:h-80"
        />
      ) : (
        <div className="flex h-64 w-full items-center justify-center border border-white/10 bg-surface-dim md:h-80">
          <span className="font-display text-5xl font-black italic uppercase tracking-tighter text-white/10">
            {t(`type_${evento.type}`)}
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={stato === "annullato" ? "accent" : "muted"}>{t(`stato_${stato}`)}</Badge>
          <Badge>{t(`type_${evento.type}`)}</Badge>
        </div>
        <h1 className="font-display text-3xl font-black italic uppercase tracking-tighter text-white">
          {evento.title}
        </h1>
        <p className="font-mono text-xs text-white/60">
          {formattaIntervallo(evento.starts_at, evento.ends_at)}
        </p>
      </div>

      <Card className="space-y-4 p-6">
        {(evento.location || evento.map_url) && (
          <p className="flex items-center gap-2 font-mono text-xs text-white/60">
            <MapPin size={12} aria-hidden="true" />
            {evento.location}
            {evento.map_url && (
              <a
                href={evento.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="uppercase tracking-widest text-white/40 underline transition-colors hover:text-white"
              >
                {t("map")}
              </a>
            )}
          </p>
        )}
        {evento.capacity !== null && (
          <p className="flex items-center gap-2 font-mono text-xs text-white/60">
            <Users size={12} aria-hidden="true" />
            {t("capacity", { count: evento.capacity })}
          </p>
        )}
        {evento.description && (
          <p className="whitespace-pre-line text-sm text-white/70">{evento.description}</p>
        )}
      </Card>
    </div>
  );
}
