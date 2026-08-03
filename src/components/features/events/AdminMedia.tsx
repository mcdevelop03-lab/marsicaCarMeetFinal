"use client";
import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useRouter } from "@/i18n/navigation";
import { comprimiImmagine } from "@/lib/images/compress";
import { createClient } from "@/lib/supabase/client";
import {
  aggiungiFoto,
  aggiungiVideo,
  impostaDriveUrl,
  rimuoviMedia,
} from "@/app/[locale]/(public)/eventi/[slug]/actions";

const MIME_AMMESSI = ["image/jpeg", "image/png", "image/webp"];
const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/60";

export type MediaAdminItem = {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string | null;
};

export default function AdminMedia({
  eventId,
  media,
  driveUrl,
}: {
  eventId: string;
  media: MediaAdminItem[];
  driveUrl: string | null;
}) {
  const t = useTranslations("gallery");
  const router = useRouter();
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState<{ done: number; total: number } | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [drive, setDrive] = useState(driveUrl ?? "");
  const [daEliminare, setDaEliminare] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Upload batch: comprime e carica ogni file, poi registra la riga. Un file che
  // fallisce non blocca gli altri; a fine si segnala quanti non sono passati.
  async function onFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // permette di riselezionare gli stessi file
    if (files.length === 0) return;
    setErrore(null);

    const supabase = createClient();
    let falliti = 0;
    setCaricamento({ done: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!MIME_AMMESSI.includes(file.type)) {
        falliti++;
        setCaricamento({ done: i + 1, total: files.length });
        continue;
      }
      try {
        const daCaricare = await comprimiImmagine(file);
        const estensione = ESTENSIONI[daCaricare.type] ?? "webp";
        const path = `${eventId}/${crypto.randomUUID()}.${estensione}`;
        const { error: upErr } = await supabase.storage
          .from("event-media")
          .upload(path, daCaricare, { contentType: daCaricare.type });
        if (upErr) {
          falliti++;
        } else {
          const { data: urlData } = supabase.storage.from("event-media").getPublicUrl(path);
          const r = await aggiungiFoto(eventId, path, urlData.publicUrl);
          if (r.error) {
            falliti++;
            // Anti-orfano sul caso comune: se la riga non entra, togli il file appena caricato.
            await supabase.storage.from("event-media").remove([path]);
          }
        }
      } catch {
        falliti++;
      }
      setCaricamento({ done: i + 1, total: files.length });
    }

    setCaricamento(null);
    if (falliti > 0) setErrore(t("someFailed", { count: falliti }));
    router.refresh();
  }

  function aggiungiVideoClick() {
    setErrore(null);
    startTransition(async () => {
      const r = await aggiungiVideo(eventId, videoUrl, videoCaption);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      setVideoUrl("");
      setVideoCaption("");
      router.refresh();
    });
  }

  function salvaDrive() {
    setErrore(null);
    startTransition(async () => {
      const r = await impostaDriveUrl(eventId, drive);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  function eseguiEliminazione(id: string) {
    setErrore(null);
    startTransition(async () => {
      const r = await rimuoviMedia(id);
      setDaEliminare(null);
      if (r.error) {
        setErrore(r.error);
        return;
      }
      router.refresh();
    });
  }

  const busy = pending || caricamento !== null;

  return (
    <section className="space-y-4 border-t border-white/10 pt-6">
      <h2 className="font-display text-lg font-black italic uppercase tracking-tighter text-white">
        {t("adminTitle")}
      </h2>
      {errore && (
        <p role="alert" className="font-mono text-[11px] text-accent-red">
          {errore}
        </p>
      )}

      {/* Upload foto batch */}
      <div className="space-y-2">
        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFilesChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          pending={busy}
          onClick={() => inputFileRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Camera size={14} />
          {t("uploadPhotos")}
        </Button>
        {caricamento ? (
          <span className="block font-mono text-[11px] text-white/50">
            {t("uploading", { done: caricamento.done, total: caricamento.total })}
          </span>
        ) : (
          <span className="block font-mono text-[11px] text-white/40">{t("photoRules")}</span>
        )}
      </div>

      {/* Video YouTube */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <h3 className={labelClass}>{t("addVideo")}</h3>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder={t("videoUrl")}
          maxLength={500}
        />
        <Input
          value={videoCaption}
          onChange={(e) => setVideoCaption(e.target.value)}
          placeholder={t("videoCaption")}
          maxLength={200}
        />
        <Button type="button" onClick={aggiungiVideoClick} pending={busy} disabled={!videoUrl.trim()}>
          {t("add")}
        </Button>
      </div>

      {/* Link Drive */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <h3 className={labelClass}>{t("driveTitle")}</h3>
        <Input
          value={drive}
          onChange={(e) => setDrive(e.target.value)}
          placeholder={t("driveUrl")}
          maxLength={500}
        />
        <Button type="button" variant="outline" onClick={salvaDrive} pending={busy}>
          {t("driveSave")}
        </Button>
      </div>

      {/* Elenco media con elimina */}
      {media.length === 0 ? (
        <p className="font-mono text-xs text-white/40">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-3">
          {media.map((m) => (
            <li key={m.id}>
              <Card className="flex flex-col gap-2 p-2">
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="h-24 w-full border border-white/10 object-cover" />
                ) : (
                  <span className="flex h-24 w-full items-center justify-center border border-white/10 bg-surface-dim font-mono text-[10px] text-white/40">
                    {t("videos")}
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setErrore(null);
                    setDaEliminare(m.id);
                  }}
                  disabled={busy}
                  className="flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  {t("delete")}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {daEliminare && (
        <Modal title={t("delete")} onClose={() => setDaEliminare(null)}>
          <p className="font-mono text-xs text-white/60">{t("confirmDelete")}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDaEliminare(null)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={() => eseguiEliminazione(daEliminare)} pending={busy}>
              {t("confirm")}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
