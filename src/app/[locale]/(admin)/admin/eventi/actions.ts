"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { istanteDaOraItaliana } from "@/lib/date/fuso";
import { slugDa } from "@/lib/events/slug";
import { eventSchema } from "@/lib/validation/event";

const BUCKET = "event-covers";

export type EventState = { error?: string };

/**
 * ⚠️ Nota sulla memoizzazione (vedi docs/STATO-LAVORI.md):
 * `cache()` di React vive UN RENDER PASS e una server action gira PRIMA del render che
 * essa stessa innesca con `revalidatePath`. Qui non si rilegge mai un dato appena
 * scritto passando dal DAL memoizzato: l'identità arriva da `requireAdmin()` e tutto
 * il resto sono query fresche fatte con `createClient()`.
 *
 * ⚠️ Il layout `(admin)` chiama già `requireAdmin()`, ma le server action NON sono
 * coperte da un layout: ognuna deve rifare il controllo per conto proprio.
 */

function campiDa(formData: FormData) {
  const testo = (chiave: string) => String(formData.get(chiave) ?? "");
  return {
    title: testo("title"),
    type: testo("type"),
    starts_at: testo("starts_at"),
    ends_at: testo("ends_at"),
    location: testo("location"),
    map_url: testo("map_url"),
    capacity: testo("capacity"),
    description: testo("description"),
  };
}

/** Slug libero a partire dal titolo: `raduno`, `raduno-2`, `raduno-3`… */
async function slugLibero(
  supabase: Awaited<ReturnType<typeof createClient>>,
  titolo: string,
): Promise<string> {
  // `slugDa` può tornare vuoto (titolo di sola punteggiatura): serve un ripiego.
  const base = slugDa(titolo) || "evento";
  for (let i = 1; i < 50; i++) {
    const candidato = i === 1 ? base : `${base}-${i}`;
    const { data } = await supabase.from("events").select("id").eq("slug", candidato).maybeSingle();
    if (!data) return candidato;
  }
  // Ripiego estremo: un suffisso casuale non collide in pratica.
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function creaEvento(_state: EventState, formData: FormData): Promise<EventState> {
  const t = await getTranslations("adminEvents");
  const profile = await requireAdmin();

  const parsed = eventSchema.safeParse(campiDa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { title, type, starts_at, ends_at, location, map_url, capacity, description } = parsed.data;

  const path = String(formData.get("coverPath") ?? "");
  const cover = path
    ? { cover_url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, cover_path: path }
    : { cover_url: null, cover_path: null };

  const { error } = await supabase.from("events").insert({
    slug: await slugLibero(supabase, title),
    title,
    type,
    starts_at: istanteDaOraItaliana(starts_at),
    ends_at: ends_at ? istanteDaOraItaliana(ends_at) : null,
    location: location ?? null,
    map_url: map_url ?? null,
    capacity: capacity ?? null,
    description: description ?? null,
    created_by: profile.id,
    ...cover,
  });
  if (error) {
    // 23505 = unique_violation: `slugLibero` controlla prima, ma due creazioni
    // simultanee con lo stesso titolo passerebbero entrambe il controllo. Stesso
    // codice già gestito per il `tag` in profilo/actions.ts.
    if (error.code === "23505") return { error: t("genericError") };
    console.error("creaEvento: insert non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  redirect({ href: "/admin/eventi", locale: "it" });
  // Il `redirect` di next-intl non è tipizzato `never`: senza questo return TypeScript
  // si lamenta che non tutti i rami restituiscono un valore. Mai eseguito.
  return {};
}

export async function aggiornaEvento(
  id: string,
  _state: EventState,
  formData: FormData,
): Promise<EventState> {
  const t = await getTranslations("adminEvents");
  await requireAdmin();

  const parsed = eventSchema.safeParse(campiDa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: esistente, error: letturaError } = await supabase
    .from("events")
    .select("id, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (letturaError) {
    console.error("aggiornaEvento: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!esistente) return { error: t("genericError") };

  const { title, type, starts_at, ends_at, location, map_url, capacity, description } = parsed.data;
  const aggiornamento: Record<string, unknown> = {
    title,
    type,
    starts_at: istanteDaOraItaliana(starts_at),
    ends_at: ends_at ? istanteDaOraItaliana(ends_at) : null,
    location: location ?? null,
    map_url: map_url ?? null,
    capacity: capacity ?? null,
    description: description ?? null,
  };
  // Lo slug NON si tocca mai in modifica: è l'URL già condiviso (spec 1C-1).

  const nuovoPath = String(formData.get("coverPath") ?? "");
  if (nuovoPath) {
    aggiornamento.cover_url = supabase.storage.from(BUCKET).getPublicUrl(nuovoPath).data.publicUrl;
    aggiornamento.cover_path = nuovoPath;
  }

  const { error } = await supabase.from("events").update(aggiornamento).eq("id", id);
  if (error) {
    console.error("aggiornaEvento: update non riuscita", error);
    return { error: t("genericError") };
  }

  // Solo ORA la vecchia copertina è sostituibile: cancellarla prima e poi fallire
  // l'update lascerebbe l'evento con un'immagine rotta.
  if (nuovoPath && esistente.cover_path && esistente.cover_path !== nuovoPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([esistente.cover_path]);
    // Un orfano non è un errore per l'utente (l'evento è salvo e corretto), ma va
    // tracciato: una pulizia rotta è altrimenti indistinguibile dal silenzio.
    if (removeError) console.error("aggiornaEvento: vecchia copertina non rimossa", removeError);
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  redirect({ href: "/admin/eventi", locale: "it" });
  return {};
}

/** Annullare è l'azione normale: l'evento resta visibile, segnato come annullato. */
export async function annullaEvento(id: string): Promise<{ error?: string }> {
  const t = await getTranslations("adminEvents");
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ status: "canceled" }).eq("id", id);
  if (error) {
    console.error("annullaEvento: update non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  return {};
}

export async function ripristinaEvento(id: string): Promise<{ error?: string }> {
  const t = await getTranslations("adminEvents");
  await requireAdmin();

  const supabase = await createClient();
  // Si torna a 'upcoming', che con lo stato derivato significa solo "non annullato":
  // se la data è passata, la pagina lo mostrerà "concluso" da sé.
  const { error } = await supabase.from("events").update({ status: "upcoming" }).eq("id", id);
  if (error) {
    console.error("ripristinaEvento: update non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  return {};
}

/**
 * Eliminare è permesso SOLO su un evento vuoto (niente iscritti, niente foto).
 * In 0001 le foreign key sono `on delete cascade`: senza questo controllo un clic
 * porterebbe via iscrizioni e album. Per tutto il resto esiste l'annullamento.
 */
export async function eliminaEvento(id: string): Promise<{ error?: string }> {
  const t = await getTranslations("adminEvents");
  await requireAdmin();

  const supabase = await createClient();
  const { data: esistente, error: letturaError } = await supabase
    .from("events")
    .select("id, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (letturaError) {
    console.error("eliminaEvento: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!esistente) return { error: t("genericError") };

  const { count: iscritti, error: contaIscrittiError } = await supabase
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  const { count: foto, error: contaFotoError } = await supabase
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  if (contaIscrittiError || contaFotoError) {
    console.error("eliminaEvento: conteggio non riuscito", contaIscrittiError ?? contaFotoError);
    return { error: t("genericError") };
  }
  if ((iscritti ?? 0) > 0 || (foto ?? 0) > 0) return { error: t("notEmpty") };

  // Prima la riga, poi il file: se cancellassimo il file per primo e la delete
  // fallisse, resterebbe un evento con la copertina rotta.
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("eliminaEvento: delete non riuscita", error);
    return { error: t("genericError") };
  }

  if (esistente.cover_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([esistente.cover_path]);
    if (removeError) console.error("eliminaEvento: copertina non rimossa", removeError);
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/eventi");
  return {};
}
