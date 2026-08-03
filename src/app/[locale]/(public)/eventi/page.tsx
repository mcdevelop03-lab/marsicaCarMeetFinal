import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard from "@/components/features/events/EventCard";
import EventiGestione from "@/components/features/events/EventiGestione";
import FlashToast from "@/components/features/events/FlashToast";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eConcluso } from "@/lib/events/stato";
import { COLONNE_PUBBLICHE, type EventoPubblico } from "@/lib/events/pubblici";

export default async function EventiPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string }>;
}) {
  const t = await getTranslations("events");
  const ta = await getTranslations("adminEvents");

  // Messaggio "flash" dopo un'azione admin (arriva via ?flash=..., da redirect o
  // router.replace). Solo chiavi note: un valore arbitrario nell'URL non mostra nulla.
  const { flash } = await searchParams;
  const messaggiFlash: Record<string, string> = {
    creato: ta("toastCreato"),
    aggiornato: ta("toastAggiornato"),
    annullato: ta("toastAnnullato"),
    ripristinato: ta("toastRipristinato"),
    eliminato: ta("toastEliminato"),
  };
  const messaggioFlash = flash ? messaggiFlash[flash] : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select(COLONNE_PUBBLICHE);

  // Un guasto non deve travestirsi da "nessun raduno" (lezione della micro-fase
  // "errori Supabase silenziati").
  if (error) {
    console.error("Eventi: lettura non riuscita", error);
    return (
      <div className="space-y-8">
        <SectionHeading>{t("title")}</SectionHeading>
        <p className="font-mono text-xs text-accent-red">{t("loadError")}</p>
      </div>
    );
  }
  const eventi = (data ?? []) as EventoPubblico[];

  // Vista base uguale per tutti; se chi guarda è admin, in fondo alla stessa pagina si
  // aggiunge il pannello di gestione (principio "niente rotte parallele"). `getProfile`
  // è memoizzato con `cache()`, quindi non costa una query in più rispetto al layout.
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  // Gli annullati con data futura restano fra i PROSSIMI, con il loro badge: chi
  // pensava di venire deve vederlo. Passata la data scendono fra i conclusi, sempre
  // con il badge ANNULLATO (`eConcluso` ignora l'annullamento di proposito: la
  // decisione "prossimo o concluso" è solo temporale, il badge resta affare di
  // `statoEvento`, usato da `EventCard`).
  const prossimi = eventi
    .filter((e) => !eConcluso(e))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const conclusi = eventi
    .filter((e) => eConcluso(e))
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <SectionHeading>{t("upcoming")}</SectionHeading>
        {prossimi.length === 0 ? (
          <p className="font-mono text-xs text-white/40">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {prossimi.map((evento) => (
              <EventCard key={evento.id} event={evento} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <SectionHeading>{t("past")}</SectionHeading>
        {conclusi.length === 0 ? (
          <p className="font-mono text-xs text-white/40">{t("emptyPast")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {conclusi.map((evento) => (
              <EventCard key={evento.id} event={evento} />
            ))}
          </div>
        )}
      </div>

      {isAdmin && <EventiGestione />}

      {messaggioFlash && (
        <FlashToast key={flash} message={messaggioFlash} closeLabel={ta("toastChiudi")} />
      )}
    </div>
  );
}
