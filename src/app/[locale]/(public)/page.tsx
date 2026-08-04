import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard from "@/components/features/events/EventCard";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eConcluso } from "@/lib/events/stato";
import { COLONNE_PUBBLICHE, type EventoPubblico } from "@/lib/events/pubblici";

// Quanti raduni mostrare in home: tre riempiono esattamente la griglia a 3 colonne su
// desktop e restano leggibili sul telefono. Il resto sta su /eventi.
const QUANTI_IN_HOME = 3;

export default async function Home() {
  const t = await getTranslations("home");
  const tn = await getTranslations("nav");
  const te = await getTranslations("events");
  // La call-to-action "Registrati" ha senso solo per chi non ha un account: a un utente
  // già loggato non va mostrata (`getProfile` è memoizzato, nessuna query in più).
  const isAuthenticated = !!(await getProfile());

  // I prossimi raduni in vetrina. Il filtro "non concluso" resta in TS perché la regola
  // del fuso (mezzanotte italiana) vive in `eConcluso`, non nel DB: per questo si legge
  // tutto e si taglia dopo, invece di usare un `limit` in query che scarterebbe le righe
  // sbagliate.
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select(COLONNE_PUBBLICHE);
  if (error) console.error("Home: lettura eventi non riuscita", error);
  const prossimi = ((data ?? []) as EventoPubblico[])
    .filter((e) => !eConcluso(e))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, QUANTI_IN_HOME);

  return (
    <div className="space-y-16">
      <section className="relative border border-white/10 min-h-[420px] flex items-center overflow-hidden">
        <div className="absolute inset-0 racing-grid opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-accent-red/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl px-6 md:px-12 py-12 space-y-6">
          {/* Qui c'era un <Badge>Prossimi raduni</Badge> scritto a mano (residuo del
              mockup, nemmeno tradotto): annunciava una sezione che non esisteva. Ora la
              sezione esiste davvero, qui sotto, e l'etichetta è il suo titolo. */}
          <h1 className="font-display text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-white uppercase">
            {t("heroTitle")}
          </h1>
          <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/eventi">
              <Button>{tn("eventi")}</Button>
            </Link>
            <Link href="/garage">
              <Button variant="outline">{tn("garage")}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sezione mostrata solo se c'è davvero qualcosa da mostrare: una landing page che
          annuncia "nessun raduno in programma" è peggio di una che non ne parla. Se la
          query fallisce l'errore è già loggato sopra e la sezione sparisce: non diciamo
          "nessun raduno" al posto di "non lo so" (lezione della micro-fase sugli errori
          Supabase silenziati). */}
      {prossimi.length > 0 && (
        <section className="space-y-6">
          <SectionHeading>{te("upcoming")}</SectionHeading>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {prossimi.map((evento) => (
              <EventCard key={evento.id} event={evento} />
            ))}
          </div>
          <div className="pt-2">
            <Link href="/eventi">
              <Button variant="outline">{t("tuttiGliEventi")}</Button>
            </Link>
          </div>
        </section>
      )}

      {!isAuthenticated && (
        <section className="border border-white/10 relative p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h2 className="font-display text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase">
              {t("ctaTitle")}
            </h2>
            <Link href="/registrati">
              <Button>{t("ctaButton")}</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
