"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { eliminaVeicolo } from "@/app/[locale]/(auth)/garage/actions";

export default function DeleteVehicleButton({ id }: { id: string }) {
  const t = useTranslations("garage");
  const router = useRouter();
  const [conferma, setConferma] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function elimina() {
    startTransition(async () => {
      const r = await eliminaVeicolo(id);
      if (r.error) {
        setConferma(false);
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  if (!conferma) {
    return (
      <div className="space-y-2">
        {errore && <p className="font-mono text-[11px] text-accent-red">{errore}</p>}
        <Button type="button" variant="ghost" onClick={() => setConferma(true)}>
          {t("delete")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] text-white/60">{t("confirmDelete")}</p>
      <div className="flex gap-2">
        <Button type="button" onClick={elimina} disabled={pending}>
          {t("confirm")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setConferma(false)} disabled={pending}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
