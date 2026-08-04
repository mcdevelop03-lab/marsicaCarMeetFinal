"use client";
import { useLinkStatus } from "next/link";

/**
 * Puntino che compare accanto alla voce di menu appena cliccata, finché la nuova pagina
 * non è pronta.
 *
 * `useLinkStatus` funziona **solo dentro un `<Link>`**: legge lo stato di quel link, non
 * uno stato globale, ed è per questo che il componente è minuscolo e va annidato invece
 * di ricevere una prop.
 *
 * Perché anche questo, se c'è già `loading.tsx`: lo scheletro dice "il sito sta
 * lavorando", ma non dice *quale* voce hai premuto. Su una barra con otto link è
 * l'informazione che evita il secondo clic.
 */
export default function NavPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent-red align-middle"
    />
  );
}
