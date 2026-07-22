"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import { useRouter } from "@/i18n/navigation";
import { rimuoviIscritto } from "@/app/[locale]/(public)/eventi/[slug]/actions";

type IscrittoAdmin = {
  registrationId: string;
  nome: string;
  tag: string | null;
  town: string | null;
  socials: Record<string, string>;
  iscrittoIl: string;
  auto: string[];
};

export default function AdminIscritti({
  eventId,
  iscritti,
}: {
  eventId: string;
  iscritti: IscrittoAdmin[];
}) {
  // `eventId` non è ancora usato qui: serve al Task 7 (iscrizione manuale).
  void eventId;

  const t = useTranslations("rsvp");
  const router = useRouter();
  const [daRimuovere, setDaRimuovere] = useState<IscrittoAdmin | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function eseguiRimozione(id: string) {
    setErrore(null);
    startTransition(async () => {
      const r = await rimuoviIscritto(id);
      setDaRimuovere(null);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  const dataIt = (iso: string) => new Date(iso).toLocaleDateString("it-IT");

  return (
    <section className="space-y-3 border-t border-white/10 pt-6">
      <h2 className="font-display text-lg font-black italic uppercase tracking-tighter text-white">
        {t("adminTitle")}
      </h2>
      {errore && (
        <p role="alert" className="font-mono text-[11px] text-accent-red">
          {errore}
        </p>
      )}

      {iscritti.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("noParticipants")}</p>
      ) : (
        <ul className="space-y-2">
          {iscritti.map((i) => (
            <li key={i.registrationId}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="space-y-1">
                  <p className="font-mono text-xs text-white">
                    {i.nome}
                    {i.tag && <span className="text-white/40"> @{i.tag}</span>}
                  </p>
                  <p className="font-mono text-[11px] text-white/50">
                    {i.town && <span>{i.town} · </span>}
                    {t("registeredOn", { date: dataIt(i.iscrittoIl) })}
                  </p>
                  {i.auto.length > 0 && (
                    <p className="font-mono text-[11px] text-white/60">{i.auto.join(", ")}</p>
                  )}
                  {Object.keys(i.socials).length > 0 && (
                    <p className="font-mono text-[11px] text-white/40">
                      {Object.entries(i.socials)
                        .map(([rete, val]) => `${rete}: ${val}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setErrore(null);
                    setDaRimuovere(i);
                  }}
                  disabled={pending}
                >
                  {t("remove")}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {daRimuovere && (
        <Modal title={t("remove")} onClose={() => setDaRimuovere(null)}>
          <p className="font-mono text-xs text-white/60">
            {t("confirmRemove", { name: daRimuovere.nome })}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDaRimuovere(null)} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => eseguiRimozione(daRimuovere.registrationId)}
              disabled={pending}
            >
              {t("confirm")}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
