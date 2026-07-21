import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
import ConfirmLeaveButton from "@/components/ui/ConfirmLeaveButton";
import SectionHeading from "@/components/ui/SectionHeading";
import EventForm from "@/components/features/events/EventForm";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";
import { aggiornaEvento } from "../../actions";

export default async function ModificaEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("adminEvents");
  // Un errore di LETTURA qui usa `events.loadError` ("Impossibile caricare i dati"),
  // come nell'elenco admin (`admin/eventi/page.tsx`): `adminEvents.genericError`
  // resta riservato agli errori di scrittura/azione (Task 6).
  const te = await getTranslations("events");
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();

  // Un guasto NON è un 404 (lezione della micro-fase sugli errori silenziati):
  // `notFound()` resta solo per "query riuscita, nessuna riga".
  // Eccezione simmetrica: un 404 non è un guasto. 22P02 è "invalid_text_representation",
  // il codice generico che Postgres dà per QUALSIASI cast testuale non valido nella
  // query, non uno specifico degli UUID. Qui è sano perché `id` (preso dall'URL) è
  // l'unico valore della query sottoposto a cast: se non è un UUID valido non può
  // corrispondere a nessun evento, mai, quindi non è un caso da "riprova più tardi"
  // ma un vero 404 (anche nello status HTTP). Se in futuro la query acquisisse un
  // altro filtro tipizzato letto dall'URL, un suo valore malformato farebbe scattare
  // lo stesso 22P02: andrebbe distinto da questo caso, altrimenti anche un guasto di
  // quel filtro diventerebbe silenziosamente un 404.
  if (error) {
    if (error.code === "22P02") notFound();
    console.error("Modifica evento: lettura non riuscita", error);
    return <p className="font-mono text-xs text-accent-red">{te("loadError")}</p>;
  }
  if (!data) notFound();

  const evento = data as Event;
  // `id` legato alla action: `useActionState` chiama (state, formData).
  const azione = aggiornaEvento.bind(null, evento.id);

  return (
    <div className="space-y-8">
      <ConfirmLeaveButton
        href="/eventi"
        label={t("back")}
        title={t("backTitle")}
        message={t("backWarning")}
        confirmLabel={t("backConfirm")}
        cancelLabel={t("backStay")}
      />
      <SectionHeading>{t("editTitle")}</SectionHeading>
      <Card className="p-6">
        <EventForm action={azione} event={evento} />
      </Card>
    </div>
  );
}
