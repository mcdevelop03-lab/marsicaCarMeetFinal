import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { statoEvento, eConcluso } from "@/lib/events/stato";
import { formattaIntervallo } from "@/lib/date/format";
import { getProfile, getUser } from "@/lib/auth";
import { statoIscrizione } from "@/lib/rsvp/capienza";
import RsvpBox from "@/components/features/events/RsvpBox";
import Partecipanti from "@/components/features/events/Partecipanti";
import AdminIscritti from "@/components/features/events/AdminIscritti";
import AdminMedia, { type MediaAdminItem } from "@/components/features/events/AdminMedia";
import GalleryEvento, { type GalleryItem } from "@/components/features/events/GalleryEvento";
import type { Event } from "@/types/database";
import type { EventMedia } from "@/types/database";
import type { VehiclePick } from "@/app/[locale]/(public)/eventi/[slug]/actions";

// Le colonne che questa pagina legge davvero (render + `statoEvento`). `select("*")`
// consegnerebbe anche `created_by` (FK a `profiles`) a chiunque: la lettura è pubblica
// anche per gli sloggati (`events_select_public`, `using(true)`), ma l'identità dei
// membri no (`profiles_select_authenticated`) — niente colonne in più di quelle usate,
// stesso principio della select dell'elenco (`src/app/[locale]/(public)/eventi/page.tsx`).
const COLONNE_PUBBLICHE =
  "id, title, description, location, map_url, starts_at, ends_at, capacity, status, type, cover_url, drive_url";

// Il minimo che serve al dettaglio: più campi di `EventoPerCard` (mappa, capienza,
// descrizione), ma sempre un `Pick<Event, ...>`, non `Event` intero — niente doppio
// cast `as unknown as Event` per far quadrare i tipi con una select parziale.
type EventoDettaglio = Pick<
  Event,
  | "id"
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
  | "drive_url"
>;

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getTranslations("events");
  const tr = await getTranslations("rsvp");
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

  // Conteggio pubblico (anche sloggati): funzione aggregata, non le righe.
  const { data: conteggi, error: erroreConteggio } = await supabase.rpc("iscritti_per_eventi", {
    p_event_ids: [evento.id],
  });
  if (erroreConteggio) console.error("Evento: conteggio iscritti non riuscito", erroreConteggio);
  const iscritti = (conteggi as { event_id: string; iscritti: number }[] | null)?.[0]?.iscritti ?? 0;

  // Identità: gli sloggati vedono solo il conteggio (RLS). I loggati leggono la lista.
  const user = await getUser();
  const profile = user ? await getProfile() : null;
  const isAdmin = profile?.role === "admin";

  const { data: mediaRows, error: erroreMedia } = await supabase
    .from("event_media")
    .select("id, type, url, caption, created_at")
    .eq("event_id", evento.id)
    .order("created_at", { ascending: false });
  if (erroreMedia) console.error("Evento: lettura media non riuscita", erroreMedia);
  const media = (mediaRows ?? []) as Pick<
    EventMedia,
    "id" | "type" | "url" | "caption" | "created_at"
  >[];

  const concluso = eConcluso(evento);
  const mediaAdmin: MediaAdminItem[] = media.map((m) => ({
    id: m.id,
    type: m.type,
    url: m.url,
    caption: m.caption,
  }));
  const mediaGallery: GalleryItem[] = media.map((m) => ({
    id: m.id,
    type: m.type,
    url: m.url,
    caption: m.caption,
  }));
  const haGallery = mediaGallery.length > 0 || Boolean(evento.drive_url);

  type RigaIscrizione = {
    id: string;
    user_id: string;
    created_at: string;
    profiles: { name: string | null; tag: string | null; town: string | null; socials: Record<string, string> } | null;
    event_vehicles: { vehicles: VehiclePick | null }[];
  };

  let iscrizioni: RigaIscrizione[] = [];
  if (user) {
    const { data: righe, error: erroreIscrizioni } = await supabase
      .from("event_registrations")
      .select(
        "id, user_id, created_at, profiles(name, tag, town, socials), event_vehicles(vehicles(id, make, model, year))",
      )
      .eq("event_id", evento.id)
      .eq("status", "going")
      .order("created_at", { ascending: true });
    if (erroreIscrizioni) {
      console.error("Evento: lettura iscrizioni non riuscita", erroreIscrizioni);
    }
    iscrizioni = (righe ?? []) as unknown as RigaIscrizione[];
  }

  // La propria iscrizione (se c'è) e le auto associate, per RsvpBox.
  const miaIscrizione = user ? iscrizioni.find((r) => r.user_id === user.id) : undefined;
  const autoIscritte: VehiclePick[] = (miaIscrizione?.event_vehicles ?? [])
    .map((ev) => ev.vehicles)
    .filter((v): v is VehiclePick => v !== null);

  // Il proprio garage, per la scelta auto in RsvpBox.
  let garage: VehiclePick[] = [];
  if (user) {
    const { data: auto, error: erroreGarage } = await supabase
      .from("vehicles")
      .select("id, make, model, year")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (erroreGarage) console.error("Evento: lettura garage non riuscita", erroreGarage);
    garage = (auto ?? []) as VehiclePick[];
  }

  const statoRsvp = statoIscrizione(evento, evento.capacity, iscritti, Boolean(miaIscrizione));

  // Lista "chi partecipa" per i loggati (nomi + auto), riusata anche dal pannello admin.
  const partecipanti = iscrizioni.map((r) => ({
    id: r.id,
    nome: r.profiles?.name ?? r.profiles?.tag ?? "—",
    tag: r.profiles?.tag ?? null,
    auto: r.event_vehicles
      .map((ev) => ev.vehicles)
      .filter((v): v is VehiclePick => v !== null)
      .map((v) => `${v.make} ${v.model} (${v.year})`),
  }));

  // Stessa lista, con i campi extra (città, social, id iscrizione) per il pannello admin.
  const iscrittiAdmin = iscrizioni.map((r) => ({
    registrationId: r.id,
    nome: r.profiles?.name ?? r.profiles?.tag ?? "—",
    tag: r.profiles?.tag ?? null,
    town: r.profiles?.town ?? null,
    socials: r.profiles?.socials ?? {},
    iscrittoIl: r.created_at,
    auto: r.event_vehicles
      .map((ev) => ev.vehicles)
      .filter((v): v is VehiclePick => v !== null)
      .map((v) => `${v.make} ${v.model} (${v.year})`),
  }));

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
        <p className="flex items-center gap-2 font-mono text-xs text-white/60">
          <Users size={12} aria-hidden="true" />
          {evento.capacity !== null
            ? tr("count", { iscritti, capacity: evento.capacity })
            : tr("countUnlimited", { iscritti })}
        </p>
        {evento.description && (
          <p className="whitespace-pre-line text-sm text-white/70">{evento.description}</p>
        )}
      </Card>

      {haGallery && <GalleryEvento media={mediaGallery} driveUrl={evento.drive_url} />}

      <section className="space-y-3">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-white/60">
          {tr("sectionTitle")}
        </h2>
        {user ? (
          <RsvpBox eventId={evento.id} stato={statoRsvp} garage={garage} autoIscritte={autoIscritte} />
        ) : (
          <Link
            href="/login"
            className="font-mono text-xs text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            {tr("loginToParticipate")}
          </Link>
        )}
      </section>

      {user && !isAdmin && <Partecipanti partecipanti={partecipanti} />}
      {user && isAdmin && <AdminIscritti eventId={evento.id} iscritti={iscrittiAdmin} />}
      {user && isAdmin && concluso && (
        <AdminMedia eventId={evento.id} media={mediaAdmin} driveUrl={evento.drive_url} />
      )}
    </div>
  );
}
