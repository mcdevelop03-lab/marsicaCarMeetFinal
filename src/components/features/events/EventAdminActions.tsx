"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import {
  annullaEvento,
  eliminaEvento,
  ripristinaEvento,
} from "@/app/[locale]/(admin)/admin/eventi/actions";

type Conferma = "nessuna" | "annulla" | "elimina";

export default function EventAdminActions({ id, annullato }: { id: string; annullato: boolean }) {
  const t = useTranslations("adminEvents");
  const router = useRouter();
  const [conferma, setConferma] = useState<Conferma>("nessuna");
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function esegui(azione: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const r = await azione();
      setConferma("nessuna");
      if (r.error) {
        setErrore(r.error);
        return;
      }
      setErrore(null);
      router.refresh();
    });
  }

  if (conferma !== "nessuna") {
    const messaggio = conferma === "annulla" ? t("confirmCancel") : t("confirmDelete");
    const azione = conferma === "annulla" ? () => annullaEvento(id) : () => eliminaEvento(id);
    return (
      <div className="space-y-2">
        <p className="font-mono text-[11px] text-white/60">{messaggio}</p>
        <div className="flex gap-2">
          <Button type="button" onClick={() => esegui(azione)} disabled={pending}>
            {t("confirm")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConferma("nessuna")}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errore && <p className="font-mono text-[11px] text-accent-red">{errore}</p>}
      <div className="flex flex-wrap gap-2">
        {annullato ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => esegui(() => ripristinaEvento(id))}
            disabled={pending}
          >
            {t("restoreEvent")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setErrore(null);
              setConferma("annulla");
            }}
            disabled={pending}
          >
            {t("cancelEvent")}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setErrore(null);
            setConferma("elimina");
          }}
          disabled={pending}
        >
          {t("delete")}
        </Button>
      </div>
    </div>
  );
}
