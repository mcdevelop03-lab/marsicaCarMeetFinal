import { getTranslations } from "next-intl/server";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import DeleteVehicleButton from "./DeleteVehicleButton";
import type { Vehicle } from "@/types/database";

export default async function VehicleCard({
  vehicle,
  owner = false,
}: {
  vehicle: Vehicle;
  owner?: boolean;
}) {
  const t = await getTranslations("garage");

  // Riga compatta delle specifiche: si mostrano solo quelle valorizzate.
  const specs: string[] = [];
  if (vehicle.specs?.potenza) specs.push(`${vehicle.specs.potenza} CV`);
  if (vehicle.specs?.cilindrata) specs.push(`${vehicle.specs.cilindrata} cc`);
  if (vehicle.specs?.cambio) specs.push(t(`gear_${vehicle.specs.cambio}`));
  if (vehicle.specs?.alimentazione) specs.push(t(`fuel_${vehicle.specs.alimentazione}`));

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Foto utente con <img>: il progetto non configura `remotePatterns`
          (stessa scelta di Avatar.tsx). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={vehicle.image_url} alt="" className="h-48 w-full object-cover" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display font-black italic uppercase tracking-tighter text-white">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="font-mono text-[11px] text-white/40">{vehicle.year}</p>
          </div>
          {vehicle.category && <Badge tone="accent">{t(`cat_${vehicle.category}`)}</Badge>}
        </div>

        {specs.length > 0 && (
          <p className="font-mono text-[11px] text-white/60">{specs.join(" · ")}</p>
        )}

        {vehicle.description && (
          <p className="line-clamp-3 text-sm text-white/70">{vehicle.description}</p>
        )}

        {owner && (
          <div className="mt-auto flex items-center gap-3 pt-2">
            <Link
              href={`/garage/${vehicle.id}/modifica`}
              className="font-mono text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:text-white"
            >
              {t("edit")}
            </Link>
            <DeleteVehicleButton id={vehicle.id} />
          </div>
        )}
      </div>
    </Card>
  );
}
