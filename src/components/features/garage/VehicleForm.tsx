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
import { ANNO_MAX, ANNO_MIN } from "@/lib/validation/vehicle";
import type { VehicleState } from "@/app/[locale]/(auth)/garage/actions";
import {
  FUELS,
  GEARBOXES,
  VEHICLE_CATEGORIES,
  type Vehicle,
} from "@/types/database";

const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/60";
const hintClass = "block font-mono text-[11px] text-white/40";
const MIME_AMMESSI = ["image/jpeg", "image/png", "image/webp"];
const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function VehicleForm({
  action,
  userId,
  vehicle,
}: {
  action: (state: VehicleState, formData: FormData) => Promise<VehicleState>;
  userId: string;
  vehicle?: Vehicle;
}) {
  const t = useTranslations("garage");
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [anteprima, setAnteprima] = useState<string | null>(vehicle?.image_url ?? null);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricando, setCaricando] = useState(false);

  // Come in ProfileForm: il submit resta spento finché la validazione nativa non
  // è soddisfatta. In creazione serve anche la foto, che il browser non convalida.
  const [valid, setValid] = useState(false);
  const revalidate = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(revalidate, []);
  const [descLength, setDescLength] = useState((vehicle?.description ?? "").length);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const scelto = event.target.files?.[0];
    event.target.value = ""; // permette di riselezionare lo stesso file
    if (!scelto) return;
    setErrore(null);
    if (!MIME_AMMESSI.includes(scelto.type)) return setErrore(t("photoType"));
    setFile(scelto);
    setAnteprima(URL.createObjectURL(scelto));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrore(null);

    // In creazione la foto è obbligatoria; in modifica, se non se ne sceglie una
    // nuova, si tiene quella esistente e non si carica nulla.
    if (!vehicle && !file) return setErrore(t("photoRequired"));

    if (file) {
      setCaricando(true);
      const daCaricare = await comprimiImmagine(file);
      const estensione = ESTENSIONI[daCaricare.type] ?? "webp";
      const path = `${userId}/${crypto.randomUUID()}.${estensione}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("vehicles")
        .upload(path, daCaricare, { contentType: daCaricare.type });
      setCaricando(false);
      if (error) return setErrore(t("uploadFailed"));
      formData.set("imagePath", path);
    }

    startTransition(() => formAction(formData));
  }

  const busy = caricando || pending;

  return (
    <form ref={formRef} onSubmit={onSubmit} onInput={revalidate} className="space-y-6">
      <div className="space-y-2">
        <span className={labelClass}>{t("photo")}</span>
        {anteprima && (
          // Foto utente con <img>: il progetto non configura `remotePatterns`
          // (stessa scelta di Avatar.tsx).
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
          {t("photoChoose")}
        </Button>
        <span className={hintClass}>{t("photoRules")}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("make")}</span>
          <Input name="make" defaultValue={vehicle?.make ?? ""} required minLength={2} maxLength={40} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("model")}</span>
          <Input name="model" defaultValue={vehicle?.model ?? ""} required minLength={1} maxLength={40} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("year")}</span>
          <Input
            name="year"
            type="number"
            defaultValue={vehicle?.year ?? ""}
            required
            min={ANNO_MIN}
            max={ANNO_MAX}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className={labelClass}>{t("category")}</span>
        <Select name="category" defaultValue={vehicle?.category ?? ""}>
          <option value="">{t("categoryNone")}</option>
          {VEHICLE_CATEGORIES.map((categoria) => (
            <option key={categoria} value={categoria}>
              {t(`cat_${categoria}`)}
            </option>
          ))}
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className={labelClass}>{t("description")}</span>
        <Textarea
          name="description"
          rows={4}
          maxLength={500}
          defaultValue={vehicle?.description ?? ""}
          onChange={(e) => setDescLength(e.target.value.length)}
        />
        <span className={hintClass}>{t("descriptionCount", { count: descLength })}</span>
      </label>

      <div className="space-y-3">
        <h3 className={labelClass}>{t("specsTitle")}</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className={labelClass}>{t("power")}</span>
            <Input name="potenza" type="number" min={1} max={2000} defaultValue={vehicle?.specs?.potenza ?? ""} />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t("displacement")}</span>
            <Input
              name="cilindrata"
              type="number"
              min={1}
              max={10000}
              defaultValue={vehicle?.specs?.cilindrata ?? ""}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t("gearbox")}</span>
            <Select name="cambio" defaultValue={vehicle?.specs?.cambio ?? ""}>
              <option value="">{t("notSpecified")}</option>
              {GEARBOXES.map((cambio) => (
                <option key={cambio} value={cambio}>
                  {t(`gear_${cambio}`)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>{t("fuel")}</span>
            <Select name="alimentazione" defaultValue={vehicle?.specs?.alimentazione ?? ""}>
              <option value="">{t("notSpecified")}</option>
              {FUELS.map((alimentazione) => (
                <option key={alimentazione} value={alimentazione}>
                  {t(`fuel_${alimentazione}`)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      {errore && <p className="font-mono text-xs text-accent-red">{errore}</p>}
      {state.error && <p className="font-mono text-xs text-accent-red">{state.error}</p>}

      <Button type="submit" disabled={busy || !valid}>
        {t("save")}
      </Button>
    </form>
  );
}
