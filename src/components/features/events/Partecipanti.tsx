import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Partecipante = { id: string; nome: string; tag: string | null; auto: string[] };

export default async function Partecipanti({ partecipanti }: { partecipanti: Partecipante[] }) {
  const t = await getTranslations("rsvp");

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-white/60">
        {t("participants")}
      </h2>
      {partecipanti.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("noParticipants")}</p>
      ) : (
        <ul className="space-y-2">
          {partecipanti.map((p) => (
            <li key={p.id} className="font-mono text-xs text-white/70">
              {p.tag ? (
                <Link href={`/membri/${p.tag}`} className="text-white underline-offset-2 hover:underline">
                  {p.nome}
                </Link>
              ) : (
                <span className="text-white">{p.nome}</span>
              )}
              {p.auto.length > 0 && <span className="text-white/40"> — {p.auto.join(", ")}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
