"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eConcluso } from "@/lib/events/stato";
import { ilikePattern, quoteOrValue } from "@/lib/profile/search";
import { estraiIdYouTube } from "@/lib/media/youtube";
import type { MemberSummary, RsvpEsito } from "@/types/database";

export type RsvpState = { error?: string; ok?: boolean };
export type VehiclePick = { id: string; make: string; model: string; year: number };

const uuid = z.string().uuid();
const vehicleIdsSchema = z.array(uuid).max(20);

/** Mappa l'esito della funzione SQL in un messaggio d'errore, o null se è andata bene. */
async function messaggioEsito(esito: RsvpEsito): Promise<string | null> {
  const t = await getTranslations("rsvp");
  switch (esito) {
    case "ok":
    case "gia_iscritto": // idempotente: era già dentro, per l'utente è un successo
      return null;
    case "esaurito":
      return t("full");
    case "annullato":
      return t("canceledEvent");
    case "evento_inesistente":
    default:
      return t("genericError");
  }
}

/** Il membro si iscrive con 0..N auto del proprio garage. */
export async function iscriviti(eventId: string, vehicleIds: string[]): Promise<RsvpState> {
  const t = await getTranslations("rsvp");
  await requireUser();

  const parsed = z.object({ eventId: uuid, vehicleIds: vehicleIdsSchema }).safeParse({
    eventId,
    vehicleIds,
  });
  if (!parsed.success) return { error: t("genericError") };

  const supabase = await createClient();

  // Gate "concluso": la matematica del fuso vive in TS, non in SQL (la RPC copre solo
  // capienza + annullato, i casi a rischio-corsa). Un evento concluso non è racy.
  const { data: evento, error: letturaError } = await supabase
    .from("events")
    .select("starts_at, ends_at, status")
    .eq("id", parsed.data.eventId)
    .maybeSingle();
  if (letturaError) {
    console.error("iscriviti: lettura evento non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!evento) return { error: t("genericError") };
  if (eConcluso(evento)) return { error: t("concludedEvent") };

  const { data, error } = await supabase.rpc("iscriviti_evento", {
    p_event_id: parsed.data.eventId,
    p_vehicle_ids: parsed.data.vehicleIds,
  });
  if (error) {
    console.error("iscriviti: rpc non riuscita", error);
    return { error: t("genericError") };
  }

  const messaggio = await messaggioEsito(data as RsvpEsito);
  if (messaggio) return { error: messaggio };

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Il membro disdice: hard delete della propria iscrizione (event_vehicles va in cascade). */
export async function disdici(eventId: string): Promise<RsvpState> {
  const t = await getTranslations("rsvp");
  const user = await requireUser();

  const parsed = uuid.safeParse(eventId);
  if (!parsed.success) return { error: t("genericError") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", parsed.data)
    .eq("user_id", user.id);
  if (error) {
    console.error("disdici: delete non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: rimuove un iscritto per id di registrazione (RLS delete self-or-admin). */
export async function rimuoviIscritto(registrationId: string): Promise<RsvpState> {
  const t = await getTranslations("rsvp");
  await requireAdmin();

  const parsed = uuid.safeParse(registrationId);
  if (!parsed.success) return { error: t("genericError") };

  const supabase = await createClient();
  const { error } = await supabase.from("event_registrations").delete().eq("id", parsed.data);
  if (error) {
    console.error("rimuoviIscritto: delete non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: iscrive un membro al posto suo (con le sue auto). Rispetta la capienza. */
export async function iscriviMembro(
  eventId: string,
  userId: string,
  vehicleIds: string[],
): Promise<RsvpState> {
  const t = await getTranslations("rsvp");
  await requireAdmin();

  const parsed = z
    .object({ eventId: uuid, userId: uuid, vehicleIds: vehicleIdsSchema })
    .safeParse({ eventId, userId, vehicleIds });
  if (!parsed.success) return { error: t("genericError") };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("iscriviti_evento", {
    p_event_id: parsed.data.eventId,
    p_vehicle_ids: parsed.data.vehicleIds,
    p_user_id: parsed.data.userId,
  });
  if (error) {
    console.error("iscriviMembro: rpc non riuscita", error);
    return { error: t("genericError") };
  }

  const messaggio = await messaggioEsito(data as RsvpEsito);
  if (messaggio) return { error: messaggio };

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: cerca membri per nome/tag (stesso escaping collaudato di /membri). */
export async function cercaMembri(q: string): Promise<MemberSummary[]> {
  await requireAdmin();
  const pulita = q.trim().slice(0, 50);
  if (!pulita) return [];

  const supabase = await createClient();
  const pattern = quoteOrValue(ilikePattern(pulita));
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, tag, avatar_url, town")
    .not("tag", "is", null)
    .or(`name.ilike.${pattern},tag.ilike.${pattern}`)
    .order("name")
    .limit(10);
  if (error) {
    console.error("cercaMembri: ricerca non riuscita", error);
    return [];
  }
  return (data ?? []) as MemberSummary[];
}

/** Admin: legge il garage di un membro per la scelta auto nell'iscrizione manuale. */
export async function garageDi(userId: string): Promise<VehiclePick[]> {
  await requireAdmin();
  const parsed = uuid.safeParse(userId);
  if (!parsed.success) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model, year")
    .eq("owner_id", parsed.data)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("garageDi: lettura garage non riuscita", error);
    return [];
  }
  return (data ?? []) as VehiclePick[];
}

export type MediaState = { error?: string; ok?: boolean };

const BUCKET_MEDIA = "event-media";

/**
 * Carica l'evento e verifica che sia concluso. Le action media servono a caricare
 * l'album DOPO il raduno (RF-28): il gate "concluso" è in TS (il fuso vive solo in
 * src/lib/events/stato.ts), non nelle RLS. La difesa vera resta RLS+bucket admin-only.
 */
async function gateEventoConcluso(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
): Promise<MediaState | null> {
  const t = await getTranslations("gallery");
  const { data: evento, error } = await supabase
    .from("events")
    .select("starts_at, ends_at, status")
    .eq("id", eventId)
    .maybeSingle();
  if (error) {
    console.error("media: lettura evento non riuscita", error);
    return { error: t("genericError") };
  }
  if (!evento) return { error: t("genericError") };
  if (!eConcluso(evento)) return { error: t("notConcluded") };
  return null; // ok
}

/** Admin: registra una foto già caricata nel bucket dal client. */
export async function aggiungiFoto(
  eventId: string,
  storagePath: string,
  url: string,
): Promise<MediaState> {
  const t = await getTranslations("gallery");
  const admin = await requireAdmin();

  const parsed = z
    .object({ eventId: uuid, storagePath: z.string().min(1).max(300), url: z.string().url() })
    .safeParse({ eventId, storagePath, url });
  if (!parsed.success) return { error: t("genericError") };

  // Difesa in profondità: `storagePath` arriva dal client. Le policy dello storage
  // consentono la scrittura solo all'admin, ma vincoliamo comunque il path all'evento.
  if (!parsed.data.storagePath.startsWith(`${parsed.data.eventId}/`)) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const gate = await gateEventoConcluso(supabase, parsed.data.eventId);
  if (gate) return gate;

  const { error } = await supabase.from("event_media").insert({
    event_id: parsed.data.eventId,
    uploader_id: admin.id,
    type: "image",
    url: parsed.data.url,
    storage_path: parsed.data.storagePath,
  });
  if (error) {
    console.error("aggiungiFoto: insert non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: aggiunge un video come link YouTube (nessun upload di file). */
export async function aggiungiVideo(
  eventId: string,
  url: string,
  caption: string,
): Promise<MediaState> {
  const t = await getTranslations("gallery");
  const admin = await requireAdmin();

  const parsed = z
    .object({ eventId: uuid, url: z.string().min(1).max(500), caption: z.string().max(200) })
    .safeParse({ eventId, url, caption });
  if (!parsed.success) return { error: t("genericError") };

  const id = estraiIdYouTube(parsed.data.url);
  if (!id) return { error: t("invalidYoutube") };
  const urlCanonico = `https://www.youtube.com/watch?v=${id}`;
  const captionPulita = parsed.data.caption.trim();

  const supabase = await createClient();
  const gate = await gateEventoConcluso(supabase, parsed.data.eventId);
  if (gate) return gate;

  const { error } = await supabase.from("event_media").insert({
    event_id: parsed.data.eventId,
    uploader_id: admin.id,
    type: "video",
    url: urlCanonico,
    storage_path: null,
    caption: captionPulita || null,
  });
  if (error) {
    console.error("aggiungiVideo: insert non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: imposta o azzera il link Drive dell'evento (originali in alta risoluzione). */
export async function impostaDriveUrl(eventId: string, url: string): Promise<MediaState> {
  const t = await getTranslations("gallery");
  await requireAdmin();

  const parsed = z.object({ eventId: uuid, url: z.string().max(500) }).safeParse({ eventId, url });
  if (!parsed.success) return { error: t("genericError") };

  const pulito = parsed.data.url.trim();
  // Vuoto = rimuovi il link. Se valorizzato, dev'essere un URL valido.
  if (pulito && !z.string().url().safeParse(pulito).success) {
    return { error: t("genericError") };
  }

  const supabase = await createClient();
  const gate = await gateEventoConcluso(supabase, parsed.data.eventId);
  if (gate) return gate;

  const { error } = await supabase
    .from("events")
    .update({ drive_url: pulito || null })
    .eq("id", parsed.data.eventId);
  if (error) {
    console.error("impostaDriveUrl: update non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}

/** Admin: elimina un media dall'album; per le foto cancella anche il file dal bucket. */
export async function rimuoviMedia(mediaId: string): Promise<MediaState> {
  const t = await getTranslations("gallery");
  await requireAdmin();

  const parsed = uuid.safeParse(mediaId);
  if (!parsed.success) return { error: t("genericError") };

  const supabase = await createClient();

  // Legge il path prima di cancellare la riga (serve per rimuovere il file).
  const { data: media, error: letturaError } = await supabase
    .from("event_media")
    .select("id, type, storage_path")
    .eq("id", parsed.data)
    .maybeSingle();
  if (letturaError) {
    console.error("rimuoviMedia: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!media) return { error: t("genericError") };

  // Prima la riga, poi il file: se cancellassimo il file per primo e la delete
  // fallisse, resterebbe una foto con URL rotto. Un file orfano è brutto ma innocuo,
  // e viene loggato. (Stesso ordine di eliminaVeicolo.)
  const { error } = await supabase.from("event_media").delete().eq("id", parsed.data);
  if (error) {
    console.error("rimuoviMedia: delete non riuscita", error);
    return { error: t("genericError") };
  }

  if (media.type === "image" && media.storage_path) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET_MEDIA)
      .remove([media.storage_path]);
    if (removeError) console.error("rimuoviMedia: file non rimosso", removeError);
  }

  revalidatePath("/[locale]/eventi/[slug]", "page");
  return { ok: true };
}
