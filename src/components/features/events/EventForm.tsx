"use client";
import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { comprimiImmagine } from "@/lib/images/compress";
import { createClient } from "@/lib/supabase/client";
import { perInputDatetime } from "@/lib/date/format";
import type { EventState } from "@/app/[locale]/(admin)/admin/eventi/actions";
import { EVENT_TYPES, type Event } from "@/types/database";

const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/60";
const hintClass = "block font-mono text-[11px] text-white/40";
const MIME_AMMESSI = ["image/jpeg", "image/png", "image/webp"];
const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function EventForm({
  action,
  event,
}: {
  action: (state: EventState, formData: FormData) => Promise<EventState>;
  event?: Event;
}) {
  const t = useTranslations("adminEvents");
  // Le etichette dei tipi (Raduno/Giro/Sociale) stanno nella sezione `events`, non in
  // `adminEvents`: sono le stesse mostrate al pubblico e non vanno duplicate.
  const te = useTranslations("events");
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  // Ricorda il path già caricato per il `file` corrente: se la server action
  // rifiuta il submit (es. data non valida, slug duplicato) il file è già nel
  // bucket, quindi un ritentativo con la STESSA foto deve riusare quel path
  // invece di caricarne uno nuovo (altrimenti ogni tentativo fallito lascia un
  // file orfano). Va azzerato non appena l'utente sceglie una foto diversa.
  const copertinaCaricataRef = useRef<{ file: File; path: string } | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [anteprima, setAnteprima] = useState<string | null>(event?.cover_url ?? null);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(false);

  // Come in ProfileForm/VehicleForm: submit spento finché la validazione nativa non è
  // soddisfatta. Qui la copertina è facoltativa, quindi non entra nella condizione.
  const [valid, setValid] = useState(false);
  const revalidate = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(revalidate, []);
  const [descLength, setDescLength] = useState((event?.description ?? "").length);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const scelto = e.target.files?.[0];
    e.target.value = ""; // permette di riselezionare lo stesso file
    if (!scelto) return;
    setErrore(null);
    if (!MIME_AMMESSI.includes(scelto.type)) return setErrore(t("coverType"));
    // Nuova scelta: il path eventualmente memorizzato appartiene alla foto
    // precedente e non va riusato per questa.
    copertinaCaricataRef.current = null;
    setFile(scelto);
    setAnteprima(URL.createObjectURL(scelto));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrore(null);

    if (file) {
      const giaCaricata = copertinaCaricataRef.current;
      if (giaCaricata && giaCaricata.file === file) {
        // Stesso file del tentativo precedente (submit fallito lato server): il
        // path esiste già nel bucket, si riusa senza ricaricare.
        formData.set("coverPath", giaCaricata.path);
      } else {
        setCaricando(true);
        const daCaricare = await comprimiImmagine(file);
        const estensione = ESTENSIONI[daCaricare.type] ?? "webp";
        // Path piatto, NON `{uid}/` come per avatar e auto: lì la cartella per-utente è
        // la regola di sicurezza, qui invece scrive solo l'admin e la policy
        // `event_covers_admin_write` verifica `is_admin()`, non la cartella.
        // Nemmeno `{event-id}/`: in creazione l'evento non esiste ancora (l'upload
        // precede l'insert). Con `cover_path` che registra il file esatto e una sola
        // copertina per evento, una cartella non aggiungerebbe nulla.
        const path = `${crypto.randomUUID()}.${estensione}`;
        const supabase = createClient();
        const { error } = await supabase.storage
          .from("event-covers")
          .upload(path, daCaricare, { contentType: daCaricare.type });
        setCaricando(false);
        if (error) return setErrore(t("uploadFailed"));
        copertinaCaricataRef.current = { file, path };
        formData.set("coverPath", path);
      }
    }

    startTransition(() => formAction(formData));
  }

  const busy = caricando || pending;

  return (
    <form ref={formRef} onSubmit={onSubmit} onInput={revalidate} className="space-y-6">
      <div className="space-y-2">
        <span className={labelClass}>{t("cover")}</span>
        {anteprima && (
          // Foto con <img>: il progetto non configura `remotePatterns` (come Avatar.tsx).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anteprima}
            alt=""
            className="h-48 w-full max-w-sm border border-white/10 object-cover"
          />
        )}
        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputFileRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Camera size={14} />
          {t("coverChoose")}
        </Button>
        <span className={hintClass}>{t("coverRules")}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("titleField")}</span>
          <Input name="title" defaultValue={event?.title ?? ""} required minLength={3} maxLength={80} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("type")}</span>
          <Select name="type" defaultValue={event?.type ?? "raduno"} required>
            {EVENT_TYPES.map((tipo) => (
              <option key={tipo} value={tipo}>
                {te(`type_${tipo}`)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {/*
        min/max letterali qui perché EventForm.tsx è l'unico file toccabile in
        questo fix: la fonte di verità resta ANNO_MINIMO/ANNO_MASSIMO (2000-2100)
        in `src/lib/validation/event.ts`. Se quei valori cambiano, aggiornare
        anche questi due input.
      */}
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("startsAt")}</span>
          <Input
            name="starts_at"
            type="datetime-local"
            required
            min="2000-01-01T00:00"
            max="2100-12-31T23:59"
            defaultValue={event ? perInputDatetime(event.starts_at) : ""}
          />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("endsAt")}</span>
          <Input
            name="ends_at"
            type="datetime-local"
            min="2000-01-01T00:00"
            max="2100-12-31T23:59"
            defaultValue={event?.ends_at ? perInputDatetime(event.ends_at) : ""}
          />
          <span className={hintClass}>{t("endsAtHint")}</span>
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("location")}</span>
          <Input name="location" defaultValue={event?.location ?? ""} maxLength={120} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("mapUrl")}</span>
          <Input name="map_url" type="url" defaultValue={event?.map_url ?? ""} />
          <span className={hintClass}>{t("mapUrlHint")}</span>
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("capacity")}</span>
          <Input
            name="capacity"
            type="number"
            min={1}
            max={10000}
            step={1}
            defaultValue={event?.capacity ?? ""}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className={labelClass}>{t("description")}</span>
        <Textarea
          name="description"
          rows={6}
          maxLength={2000}
          defaultValue={event?.description ?? ""}
          onChange={(e) => setDescLength(e.target.value.length)}
        />
        <span className={hintClass}>{t("descriptionCount", { count: descLength })}</span>
      </label>

      {errore && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {errore}
        </p>
      )}
      {state.error && (
        <p role="alert" className="font-mono text-xs text-accent-red">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={busy || !valid}>
        {t("save")}
      </Button>
    </form>
  );
}
