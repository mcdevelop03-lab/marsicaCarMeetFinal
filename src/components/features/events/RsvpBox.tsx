"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Link, useRouter } from "@/i18n/navigation";
import { disdici, iscriviti, type VehiclePick } from "@/app/[locale]/(public)/eventi/[slug]/actions";
import type { StatoIscrizione } from "@/lib/rsvp/capienza";

type Props = {
  eventId: string;
  stato: StatoIscrizione;
  garage: VehiclePick[];
  autoIscritte: VehiclePick[];
};

const etichettaAuto = (v: VehiclePick) => `${v.make} ${v.model} (${v.year})`;

export default function RsvpBox({ eventId, stato, garage, autoIscritte }: Props) {
  const t = useTranslations("rsvp");
  const router = useRouter();
  const [selezione, setSelezione] = useState<string[]>([]);
  const [confermaDisdetta, setConfermaDisdetta] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelezione((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function partecipa() {
    setErrore(null);
    startTransition(async () => {
      const r = await iscriviti(eventId, selezione);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  function eseguiDisdetta() {
    setErrore(null);
    startTransition(async () => {
      const r = await disdici(eventId);
      setConfermaDisdetta(false);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  // Evento chiuso: nessun comando (il badge di stato lo dice già altrove).
  if (stato === "annullato" || stato === "concluso") return null;

  return (
    <div className="space-y-3">
      {errore && (
        <p role="alert" className="font-mono text-[11px] text-accent-red">
          {errore}
        </p>
      )}

      {stato === "esaurito" && (
        <Button type="button" disabled>
          {t("full")}
        </Button>
      )}

      {stato === "gia_iscritto" && (
        <div className="space-y-3">
          <p className="font-mono text-xs text-white/80">{t("youParticipate")}</p>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
              {t("yourCars")}
            </p>
            {autoIscritte.length === 0 ? (
              <p className="font-mono text-xs text-white/50">{t("noCars")}</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {autoIscritte.map((v) => (
                  <li key={v.id} className="font-mono text-xs text-white/70">
                    {etichettaAuto(v)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="button" variant="outline" onClick={() => setConfermaDisdetta(true)} disabled={pending}>
            {t("cancelRsvp")}
          </Button>
        </div>
      )}

      {stato === "aperto" && garage.length === 0 && (
        <div className="space-y-3">
          <p className="font-mono text-xs text-white/60">{t("emptyGarage")}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/garage/nuova">
              <Button type="button" variant="outline" className="flex items-center gap-2">
                <Plus size={14} />
                {t("addCar")}
              </Button>
            </Link>
            <Button type="button" onClick={partecipa} pending={pending}>
              {t("participateNoCar")}
            </Button>
          </div>
        </div>
      )}

      {stato === "aperto" && garage.length > 0 && (
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
            {t("chooseCars")}
          </p>
          <ul className="space-y-1">
            {garage.map((v) => (
              <li key={v.id}>
                <label className="flex items-center gap-2 font-mono text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={selezione.includes(v.id)}
                    onChange={() => toggle(v.id)}
                  />
                  {etichettaAuto(v)}
                </label>
              </li>
            ))}
          </ul>
          <Button type="button" onClick={partecipa} pending={pending}>
            {t("participate")}
          </Button>
        </div>
      )}

      {confermaDisdetta && (
        <Modal title={t("cancelRsvp")} onClose={() => setConfermaDisdetta(false)}>
          <p className="font-mono text-xs text-white/60">{t("confirmCancelRsvp")}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfermaDisdetta(false)} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={eseguiDisdetta} pending={pending}>
              {t("confirm")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
