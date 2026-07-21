"use client";
import { useEffect, useRef } from "react";

/**
 * Finestra modale di base: overlay scuro + riquadro centrato col titolo, e dentro ciò che
 * le passi (`children`). Si chiude con Esc o cliccando fuori (entrambi chiamano `onClose`),
 * blocca lo scroll di sfondo e porta il focus nel dialog.
 *
 * `onClose` dev'essere stabile fra i render (es. `useCallback`): l'effect lo usa come
 * dipendenza, così un valore che cambia a ogni render non rimonta i listener a vuoto.
 */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflowPrima = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrima;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" onClick={onClose} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="animate-toast-in relative z-10 w-full max-w-md space-y-5 border border-white/10 bg-surface-card p-6 shadow-2xl outline-none"
      >
        <h2 className="font-display text-lg font-black italic uppercase tracking-tighter text-white">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
