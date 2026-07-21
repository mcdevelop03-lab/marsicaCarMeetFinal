"use client";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
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
  const chiudiConferma = useCallback(() => setConferma("nessuna"), []);

  function esegui(azione: () => Promise<{ error?: string }>, flash: string) {
    startTransition(async () => {
      const r = await azione();
      setConferma("nessuna");
      if (r.error) {
        setErrore(r.error);
        return;
      }
      setErrore(null);
      // Naviga a /eventi col messaggio flash: la lista si aggiorna con dati freschi e il
      // toast compare a livello pagina — così sopravvive anche quando la riga eliminata
      // scompare (un toast dentro la riga si smonterebbe insieme a essa).
      router.replace({ pathname: "/eventi", query: { flash } });
    });
  }

  return (
    <div className="space-y-2">
      {errore && (
        <p role="alert" className="font-mono text-[11px] text-accent-red">
          {errore}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {annullato ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => esegui(() => ripristinaEvento(id), "ripristinato")}
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

      {conferma !== "nessuna" && (
        <Modal
          title={conferma === "annulla" ? t("cancelEvent") : t("delete")}
          onClose={chiudiConferma}
        >
          <p className="font-mono text-xs text-white/60">
            {conferma === "annulla" ? t("confirmCancel") : t("confirmDelete")}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={chiudiConferma} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() =>
                esegui(
                  conferma === "annulla" ? () => annullaEvento(id) : () => eliminaEvento(id),
                  conferma === "annulla" ? "annullato" : "eliminato",
                )
              }
              disabled={pending}
            >
              {t("confirm")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
