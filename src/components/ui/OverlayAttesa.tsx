/**
 * Velo a schermo intero con rotella e messaggio, per le operazioni **lente**: creare un
 * evento carica anche la copertina, quindi comprime, spedisce e scrive sul database.
 *
 * ⚠️ **La comparsa è ritardata di proposito** (350 ms, vedi `.velo-attesa` in
 * `globals.css`). Un velo che appare e sparisce in 200 ms è un lampo, e dà più fastidio del
 * silenzio: la maggior parte dei salvataggi si chiude prima che valga la pena coprire lo
 * schermo. Sotto la soglia il segnale è la rotella dentro il bottone (prop `pending` di
 * `Button`), che è immediata; sopra la soglia arriva il velo. Il segnale cresce con
 * l'attesa invece di essere sempre al massimo.
 *
 * Il ritardo lo fa il **CSS**, non un `setTimeout`: niente stato, niente effect, niente
 * timer da ripulire. Nei primi 350 ms il velo è già montato e trasparente, quindi
 * **intercetta comunque i clic** — e va bene così: durante un invio non si deve poter
 * toccare un form che sta per essere sostituito.
 *
 * `aria-live="assertive"` e non `polite`: qui l'attesa è la cosa più importante sullo
 * schermo, e chi non vede deve saperlo subito.
 */
export default function OverlayAttesa({
  attivo,
  messaggio,
}: {
  attivo: boolean;
  messaggio: string;
}) {
  if (!attivo) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-busy="true"
      className="velo-attesa fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background/85 px-6 backdrop-blur-sm"
    >
      <span
        aria-hidden
        className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-accent-red"
      />
      <p className="text-center font-mono text-xs uppercase tracking-widest text-white/70">
        {messaggio}
      </p>
    </div>
  );
}
