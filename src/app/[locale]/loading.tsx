import { getTranslations } from "next-intl/server";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Scheletro mostrato mentre la pagina successiva si prepara.
 *
 * Sta a livello di `[locale]`, quindi vale per TUTTE le rotte sotto (i gruppi
 * `(public)`/`(auth)`/`(admin)` non cambiano il percorso): header, footer e banner cookie
 * restano al loro posto — vivono nel layout — e cambia solo l'area del contenuto.
 *
 * Perché serve: ogni pagina del sito è dinamica (legge i cookie di sessione via
 * `createClient`), quindi senza un confine di sospensione il browser resta fermo sulla
 * pagina vecchia finché il server non risponde, senza dare alcun segno di vita. È il
 * motivo per cui si finisce per cliccare tre volte lo stesso link.
 *
 * La forma è volutamente generica (un titolo e una griglia di schede): copre pagine molto
 * diverse fra loro e non deve promettere un impaginato che poi non arriva.
 */
export default async function Loading() {
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
