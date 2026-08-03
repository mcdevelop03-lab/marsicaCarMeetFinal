import { getTranslations } from "next-intl/server";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Lo scheletro mostrato mentre una pagina si prepara. Un componente solo, riesportato
 * dai `loading.tsx` delle singole rotte.
 *
 * ⚠️ **Perché i `loading.tsx` sono tanti e non uno solo in cima.** Un `loading.tsx` messo
 * a livello di `[locale]` funziona al primo caricamento ma **non fa niente** passando da
 * una pagina all'altra: in una navigazione lato client Next ridisegna solo ciò che sta
 * **sotto il layout condiviso** fra partenza e destinazione, e un confine di sospensione
 * più in alto resta fuori dal ridisegno. È scritto nella guida "Ensuring instant
 * navigations" di Next 16 ed è stato **misurato sullo staging**: con il solo confine in
 * cima, andare dalla home a `/eventi` restava 4,2 secondi senza mostrare nulla.
 * Il confine deve stare **nella rotta di destinazione**. Se aggiungi una rotta, aggiungile
 * il suo `loading.tsx` o quella pagina tornerà a caricare in silenzio.
 *
 * ⚠️ **Da usare SOLO sulle rotte che sono davvero griglie di schede:** home, `/eventi`,
 * `/garage`, `/membri`. Un primo tentativo lo metteva ovunque, e in collaudo l'utente ha
 * notato subito il difetto: tre schede che lampeggiano prima di una pagina di testo o di
 * un form sono una bugia grafica — lo scheletro deve somigliare a ciò che arriva. Per
 * tutte le altre rotte c'è `PageSpinner`.
 */
export default async function PageSkeleton() {
  const t = await getTranslations("common");

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-8">
      {/* L'unico testo vero dello scheletro: sta qui per chi non vede i rettangoli. */}
      <span className="sr-only">{t("caricamento")}</span>

      <div className="flex items-center gap-3">
        <span className="h-6 w-1.5 bg-accent-red" />
        <Skeleton className="h-7 w-56" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border border-white/5 bg-surface-card">
            <Skeleton className="h-48 w-full" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
