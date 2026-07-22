"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eConcluso } from "@/lib/events/stato";
import { ilikePattern, quoteOrValue } from "@/lib/profile/search";
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
