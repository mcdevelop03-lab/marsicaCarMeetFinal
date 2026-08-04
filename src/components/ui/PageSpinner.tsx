import { getTranslations } from "next-intl/server";

/**
 * Rotellina di attesa, per le pagine che **non** sono griglie di schede: testi (privacy,
 * cookie), form (profilo, login, garage/nuova) e pagine di dettaglio.
 *
 * ⚠️ **Perché non uno scheletro ovunque.** Uno scheletro deve somigliare a ciò che arriva:
 * far lampeggiare tre schede prima di una pagina di testo è una bugia grafica, e in
 * collaudo è stata notata subito. Le schede stanno in `PageSkeleton` e le usano solo le
 * quattro rotte che sono davvero griglie (home, `/eventi`, `/garage`, `/membri`).
 *
 * Vedi `PageSkeleton` per il motivo per cui i `loading.tsx` sono uno per rotta.
 */
export default async function PageSpinner() {
  const t = await getTranslations("common");

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center gap-4 py-24"
    >
      <span
        aria-hidden
        className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-accent-red"
      />
      <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
        {t("caricamento")}
      </span>
    </div>
  );
}
