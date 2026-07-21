"use client";
import { useEffect, useState } from "react";
import Toast from "@/components/ui/Toast";

/**
 * Mostra un Toast per un messaggio "flash" arrivato via query param (`?flash=...`) dopo
 * un'azione admin (creazione/modifica via redirect, annulla/ripristina/elimina via
 * `router.replace`). Al mount ripulisce il parametro dall'URL, così un refresh non
 * ripropone la notifica. La pagina lo monta con `key={flash}`: ogni nuova azione rimonta
 * il toast e ne riavvia l'animazione.
 */
export default function FlashToast({
  message,
  closeLabel,
}: {
  message: string;
  closeLabel: string;
}) {
  const [visibile, setVisibile] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("flash")) {
      url.searchParams.delete("flash");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  if (!visibile) return null;
  return <Toast message={message} closeLabel={closeLabel} onClose={() => setVisibile(false)} />;
}
