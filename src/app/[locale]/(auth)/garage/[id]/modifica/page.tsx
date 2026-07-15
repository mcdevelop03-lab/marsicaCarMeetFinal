import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import VehicleForm from "@/components/features/garage/VehicleForm";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types/database";
import { aggiornaVeicolo } from "../../actions";

export default async function ModificaAutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("garage");
  const { id } = await params;
  const user = await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // Un guasto NON è un 404 (lezione della micro-fase sugli errori silenziati):
  // `notFound()` resta solo per "query riuscita, nessuna riga".
  if (error) {
    console.error("Modifica auto: lettura non riuscita", error);
    return <p className="font-mono text-xs text-accent-red">{t("genericError")}</p>;
  }
  if (!data) notFound();

  const vehicle = data as Vehicle;
  // L'auto altrui non si modifica: 404, non un form che poi fallirebbe sulla RLS.
  if (vehicle.owner_id !== user.id) notFound();

  // `id` legato alla action: `useActionState` chiama (state, formData).
  const azione = aggiornaVeicolo.bind(null, vehicle.id);

  return (
    <div className="space-y-8">
      <SectionHeading>{t("editTitle")}</SectionHeading>
      <Card className="p-6">
        <VehicleForm action={azione} userId={user.id} vehicle={vehicle} />
      </Card>
    </div>
  );
}
