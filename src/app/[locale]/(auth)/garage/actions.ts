"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { specsDa, vehicleSchema } from "@/lib/validation/vehicle";

const BUCKET = "vehicles";

export type VehicleState = { error?: string };

/**
 * ⚠️ Nota sulla memoizzazione (vedi docs/STATO-LAVORI.md, sezione 1B-2):
 * `cache()` di React vive UN RENDER PASS e una server action gira PRIMA del render
 * che essa stessa innesca con `revalidatePath`. Qui non si rilegge mai un dato
 * appena scritto passando dal DAL memoizzato: l'identità arriva da `requireUser()`
 * (sempre sicura: l'utente non cambia dentro una richiesta) e tutto il resto sono
 * query fresche fatte con `createClient()`.
 */

function campiDa(formData: FormData) {
  const testo = (chiave: string) => String(formData.get(chiave) ?? "");
  return {
    make: testo("make"),
    model: testo("model"),
    year: testo("year"),
    category: testo("category"),
    description: testo("description"),
    potenza: testo("potenza"),
    cilindrata: testo("cilindrata"),
    cambio: testo("cambio"),
    alimentazione: testo("alimentazione"),
  };
}

export async function creaVeicolo(
  _state: VehicleState,
  formData: FormData,
): Promise<VehicleState> {
  const t = await getTranslations("garage");
  const user = await requireUser();

  const parsed = vehicleSchema.safeParse(campiDa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const path = String(formData.get("imagePath") ?? "");
  if (!path) return { error: t("photoRequired") };
  // Difesa in profondità: `path` arriva dal client e finisce dritto nel DB.
  // Le policy dello storage consentono la scrittura solo in `{uid}/`, ma qui non
  // ci fidiamo comunque di un valore che non abbiamo generato noi.
  if (!path.startsWith(`${user.id}/`)) return { error: t("genericError") };

  const supabase = await createClient();
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { make, model, year, category, description } = parsed.data;
  const { error } = await supabase.from("vehicles").insert({
    owner_id: user.id,
    make,
    model,
    year,
    image_url: urlData.publicUrl,
    image_path: path,
    category: category ?? null,
    description: description ?? null,
    specs: specsDa(parsed.data),
  });
  if (error) {
    console.error("creaVeicolo: insert non riuscita", error);
    return { error: t("genericError") };
  }

  revalidatePath("/garage");
  redirect({ href: "/garage", locale: "it" });
  // Il `redirect` di next-intl NON è tipizzato `never` (si vede da `requireUser` in
  // `src/lib/auth/index.ts`, che dopo il redirect deve usare `user!`): senza questo
  // return, TypeScript si lamenta che non tutti i rami restituiscono un valore.
  // La riga non viene mai eseguita.
  return {};
}

export async function aggiornaVeicolo(
  id: string,
  _state: VehicleState,
  formData: FormData,
): Promise<VehicleState> {
  const t = await getTranslations("garage");
  const user = await requireUser();

  const parsed = vehicleSchema.safeParse(campiDa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // La RLS impedirebbe comunque di toccare l'auto altrui, ma un errore generico di
  // policy è indistinguibile da un guasto: qui si controlla e si risponde chiaro.
  const { data: esistente, error: letturaError } = await supabase
    .from("vehicles")
    .select("id, owner_id, image_path")
    .eq("id", id)
    .maybeSingle();
  if (letturaError) {
    console.error("aggiornaVeicolo: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!esistente || esistente.owner_id !== user.id) return { error: t("notYours") };

  // La foto è facoltativa in modifica: senza nuovo path si tiene quella esistente.
  const nuovoPath = String(formData.get("imagePath") ?? "");
  if (nuovoPath && !nuovoPath.startsWith(`${user.id}/`)) return { error: t("genericError") };

  const { make, model, year, category, description } = parsed.data;
  const aggiornamento: Record<string, unknown> = {
    make,
    model,
    year,
    category: category ?? null,
    description: description ?? null,
    specs: specsDa(parsed.data),
  };
  if (nuovoPath) {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(nuovoPath);
    aggiornamento.image_url = urlData.publicUrl;
    aggiornamento.image_path = nuovoPath;
  }

  const { error } = await supabase.from("vehicles").update(aggiornamento).eq("id", id);
  if (error) {
    console.error("aggiornaVeicolo: update non riuscita", error);
    return { error: t("genericError") };
  }

  // Solo ORA il vecchio file è sostituibile: se lo avessimo cancellato prima e
  // l'update fosse fallito, l'auto sarebbe rimasta con un URL rotto.
  if (nuovoPath && esistente.image_path && esistente.image_path !== nuovoPath) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove([esistente.image_path]);
    // Un orfano nel bucket non è un errore per l'utente: l'auto è salva e corretta.
    // Ma va tracciato, altrimenti una pulizia rotta è indistinguibile dal silenzio.
    // (Richiede la policy `vehicles_select_own` della migrazione 0007.)
    if (removeError) console.error("aggiornaVeicolo: vecchia foto non rimossa", removeError);
  }

  revalidatePath("/garage");
  redirect({ href: "/garage", locale: "it" });
  // Come in `creaVeicolo`: il `redirect` di next-intl non è tipizzato `never`,
  // quindi serve un return che TypeScript possa vedere. Mai eseguito.
  return {};
}

export async function eliminaVeicolo(id: string): Promise<{ error?: string }> {
  const t = await getTranslations("garage");
  const user = await requireUser();

  const supabase = await createClient();
  const { data: esistente, error: letturaError } = await supabase
    .from("vehicles")
    .select("id, owner_id, image_path")
    .eq("id", id)
    .maybeSingle();
  if (letturaError) {
    console.error("eliminaVeicolo: lettura non riuscita", letturaError);
    return { error: t("genericError") };
  }
  if (!esistente || esistente.owner_id !== user.id) return { error: t("notYours") };

  // Prima la riga, poi il file: se cancellassimo il file per primo e la delete
  // fallisse, resterebbe un'auto con la foto rotta. Al contrario, il peggio che
  // può capitare è un file orfano — brutto, ma innocuo, e viene loggato.
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) {
    console.error("eliminaVeicolo: delete non riuscita", error);
    return { error: t("genericError") };
  }

  if (esistente.image_path) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove([esistente.image_path]);
    if (removeError) console.error("eliminaVeicolo: foto non rimossa", removeError);
  }

  revalidatePath("/garage");
  return {};
}
