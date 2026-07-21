"use client";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

/**
 * Notifica temporanea in basso a destra: appare, resta `duration` ms, poi sfuma e chiama
 * `onClose`. Chiudibile anche a mano. Componente di presentazione generico — il messaggio
 * (già tradotto) e l'etichetta di chiusura arrivano come prop.
 */
export default function Toast({
  message,
  onClose,
  closeLabel,
  duration = 4000,
}: {
  message: string;
  onClose: () => void;
  closeLabel: string;
  duration?: number;
}) {
  const [uscita, setUscita] = useState(false);

  useEffect(() => {
    // Prima si avvia la dissolvenza, poi la chiusura vera (il parent smonta il Toast).
    const inizioUscita = setTimeout(() => setUscita(true), Math.max(0, duration - 300));
    const chiusura = setTimeout(onClose, duration);
    return () => {
      clearTimeout(inizioUscita);
      clearTimeout(chiusura);
    };
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-toast-in fixed bottom-6 right-6 z-50 flex items-center gap-3 border border-white/10 bg-surface-card px-4 py-3 shadow-2xl transition-opacity duration-300 ${
        uscita ? "opacity-0" : "opacity-100"
      }`}
    >
      <Check size={16} className="shrink-0 text-accent-red" aria-hidden="true" />
      <span className="font-mono text-xs text-white">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="shrink-0 text-white/40 transition-colors hover:text-white"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
