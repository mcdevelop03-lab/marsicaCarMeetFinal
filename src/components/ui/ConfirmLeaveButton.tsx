"use client";
import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

/**
 * Bottone "Torna indietro" che, prima di lasciare un form con dati non salvati, apre una
 * modale di conferma. La navigazione (`href`) è un semplice cambio di pagina: NON invia il
 * form e NON salva nulla — è solo un guard-rail contro l'uscita accidentale.
 *
 * I testi arrivano come prop (il chiamante li legge da next-intl): il componente resta
 * generico e riusabile su qualsiasi form, senza stringhe cablate dentro.
 */
export default function ConfirmLeaveButton({
  href,
  label,
  title,
  message,
  confirmLabel,
  cancelLabel,
}: {
  href: string;
  label: string;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const chiudi = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {label}
      </button>

      {open && (
        <Modal title={title} onClose={chiudi}>
          <p className="font-mono text-xs text-white/60">{message}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={chiudi}>
              {cancelLabel}
            </Button>
            <Button type="button" onClick={() => router.push(href)}>
              {confirmLabel}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
