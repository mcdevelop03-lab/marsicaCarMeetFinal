/**
 * Blocco grigio pulsante che sta al posto di un contenuto non ancora arrivato.
 *
 * Solo token di tema, nessun colore fisso (stessa regola di `Card`/`EventCard`).
 * `aria-hidden`: è decorazione: chi usa uno screen reader non deve sentirsi leggere
 * una fila di rettangoli vuoti — l'attesa gliela annuncia il `role="status"` che
 * avvolge lo scheletro (vedi `[locale]/loading.tsx`).
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse bg-white/5 ${className}`} />;
}
