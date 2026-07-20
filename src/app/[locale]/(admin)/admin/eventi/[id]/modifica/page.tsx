import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
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
  if (error) {
    console.error("Modifica evento: lettura non riuscita", error);
    return <p className="font-mono text-xs text-accent-red">{te("loadError")}</p>;
  }
  if (!data) notFound();

  const evento = data as Event;
  // `id` legato alla action: `useActionState` chiama (state, formData).
  const azione = aggiornaEvento.bind(null, evento.id);

  return (
    <div className="space-y-8">
      <SectionHeading>{t("editTitle")}</SectionHeading>
      <Card className="p-6">
        <EventForm action={azione} event={evento} />
      </Card>
    </div>
  );
}
