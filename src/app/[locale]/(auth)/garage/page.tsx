import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import VehicleCard from "@/components/features/garage/VehicleCard";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types/database";

export default async function GaragePage() {
  const t = await getTranslations("garage");
  const user = await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Un guasto non deve travestirsi da garage vuoto (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) console.error("Garage: lettura dei veicoli non riuscita", error);
  const vehicles = (data ?? []) as Vehicle[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <SectionHeading>{t("title")}</SectionHeading>
        <Link href="/garage/nuova">
          <Button className="flex items-center gap-2">
            <Plus size={14} />
            {t("add")}
          </Button>
        </Link>
      </div>

      {error ? (
        <p className="font-mono text-xs text-accent-red">{t("genericError")}</p>
      ) : vehicles.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} owner />
          ))}
        </div>
      )}
    </div>
  );
}
