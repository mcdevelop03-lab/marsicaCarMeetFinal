import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import VehicleForm from "@/components/features/garage/VehicleForm";
import { requireUser } from "@/lib/auth";
import { creaVeicolo } from "../actions";

export default async function NuovaAutoPage() {
  const t = await getTranslations("garage");
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <SectionHeading>{t("newTitle")}</SectionHeading>
      <Card className="p-6">
        <VehicleForm action={creaVeicolo} userId={user.id} />
      </Card>
    </div>
  );
}
