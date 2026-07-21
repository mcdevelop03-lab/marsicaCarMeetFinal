import { getTranslations } from "next-intl/server";
import Card from "@/components/ui/Card";
import ConfirmLeaveButton from "@/components/ui/ConfirmLeaveButton";
import SectionHeading from "@/components/ui/SectionHeading";
import EventForm from "@/components/features/events/EventForm";
import { creaEvento } from "../actions";

export default async function NuovoEventoPage() {
  const t = await getTranslations("adminEvents");

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
      <SectionHeading>{t("newTitle")}</SectionHeading>
      <Card className="p-6">
        <EventForm action={creaEvento} />
      </Card>
    </div>
  );
}
