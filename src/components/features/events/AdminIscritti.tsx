"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import { useRouter } from "@/i18n/navigation";
import {
  cercaMembri,
  garageDi,
  iscriviMembro,
  rimuoviIscritto,
  type VehiclePick,
} from "@/app/[locale]/(public)/eventi/[slug]/actions";
import type { MemberSummary } from "@/types/database";
import { formattaDataBreve } from "@/lib/date/format";

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
  const t = useTranslations("rsvp");
  const router = useRouter();
  const [daRimuovere, setDaRimuovere] = useState<IscrittoAdmin | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [risultati, setRisultati] = useState<MemberSummary[]>([]);
  const [cercato, setCercato] = useState(false);
  const [membro, setMembro] = useState<MemberSummary | null>(null);
  const [garageMembro, setGarageMembro] = useState<VehiclePick[]>([]);
  const [autoScelte, setAutoScelte] = useState<string[]>([]);

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

  function cerca() {
    setErrore(null);
    startTransition(async () => {
      const r = await cercaMembri(query);
      setRisultati(r);
      setCercato(true);
    });
  }

  function scegliMembro(m: MemberSummary) {
    setErrore(null);
    setMembro(m);
    setAutoScelte([]);
    startTransition(async () => {
      setGarageMembro(await garageDi(m.id));
    });
  }

  function toggleAuto(id: string) {
    setAutoScelte((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function eseguiIscrizioneManuale() {
    if (!membro) return;
    setErrore(null);
    startTransition(async () => {
      const r = await iscriviMembro(eventId, membro.id, autoScelte);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      // Reset del widget e refresh della lista.
      setMembro(null);
      setGarageMembro([]);
      setAutoScelte([]);
      setQuery("");
      setRisultati([]);
      setCercato(false);
      router.refresh();
    });
  }

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
                    {t("registeredOn", { date: formattaDataBreve(i.iscrittoIl) })}
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
              pending={pending}
            >
              {t("confirm")}
            </Button>
          </div>
        </Modal>
      )}

      <div className="space-y-3 border-t border-white/10 pt-4">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-white/60">
          {t("manualTitle")}
        </h3>

        {!membro ? (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    cerca();
                  }
                }}
                maxLength={50}
                placeholder={t("searchMember")}
                className="flex-1 border border-white/10 bg-surface-dim px-3 py-2 font-mono text-xs text-white placeholder:text-white/30"
              />
              <Button type="button" variant="outline" onClick={cerca} pending={pending}>
                {t("search")}
              </Button>
            </div>
            {cercato && risultati.length === 0 ? (
              <p className="font-mono text-xs text-white/40">{t("noResults")}</p>
            ) : (
              <ul className="space-y-1">
                {risultati.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => scegliMembro(m)}
                      disabled={pending}
                      className="font-mono text-xs text-white/70 underline-offset-2 hover:text-white hover:underline"
                    >
                      {m.name ?? m.tag} <span className="text-white/40">@{m.tag}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="font-mono text-xs text-white">
              {membro.name ?? membro.tag} <span className="text-white/40">@{membro.tag}</span>
            </p>
            {garageMembro.length === 0 ? (
              <p className="font-mono text-[11px] text-white/40">{t("noCars")}</p>
            ) : (
              <ul className="space-y-1">
                {garageMembro.map((v) => (
                  <li key={v.id}>
                    <label className="flex items-center gap-2 font-mono text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={autoScelte.includes(v.id)}
                        onChange={() => toggleAuto(v.id)}
                      />
                      {v.make} {v.model} ({v.year})
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setMembro(null)} disabled={pending}>
                {t("cancel")}
              </Button>
              <Button type="button" onClick={eseguiIscrizioneManuale} pending={pending}>
                {t("enroll")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
