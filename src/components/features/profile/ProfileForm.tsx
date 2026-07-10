"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { SOCIAL_KEYS, SOCIAL_LABELS } from "@/lib/profile/socials";
import type { Profile } from "@/types/database";

export type ProfileState = { error?: string; success?: string };

const labelClass = "font-mono text-[11px] uppercase tracking-widest text-white/60";
const hintClass = "block font-mono text-[11px] text-white/40";

export default function ProfileForm({
  action,
  profile,
}: {
  action: (state: ProfileState, formData: FormData) => Promise<ProfileState>;
  profile: Profile;
}) {
  const t = useTranslations("profile");
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  // Come in AuthForm: il submit resta spento finché la validazione nativa
  // (required + pattern + minLength) non è soddisfatta.
  const [valid, setValid] = useState(false);
  const revalidate = () => setValid(formRef.current?.checkValidity() ?? false);
  useEffect(revalidate, []);
  const [bioLength, setBioLength] = useState((profile.bio ?? "").length);

  return (
    <form ref={formRef} action={formAction} onInput={revalidate} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{t("name")}</span>
          <Input name="name" defaultValue={profile.name ?? ""} required minLength={2} maxLength={50} />
        </label>

        <label className="block space-y-1.5">
          <span className={labelClass}>{t("tag")}</span>
          <Input
            name="tag"
            defaultValue={profile.tag ?? ""}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9._-]+"
          />
          <span className={hintClass}>{t("tagHint")}</span>
        </label>

        <label className="block space-y-1.5 md:col-span-2">
          <span className={labelClass}>{t("town")}</span>
          <Input name="town" defaultValue={profile.town ?? ""} maxLength={60} />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className={labelClass}>{t("bio")}</span>
        <Textarea
          name="bio"
          rows={4}
          maxLength={300}
          defaultValue={profile.bio ?? ""}
          onChange={(e) => setBioLength(e.target.value.length)}
        />
        <span className={hintClass}>{t("bioCount", { count: bioLength })}</span>
      </label>

      <div className="space-y-3">
        <h3 className={labelClass}>{t("socialsTitle")}</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {SOCIAL_KEYS.map((key) => (
            <label key={key} className="block space-y-1.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                {SOCIAL_LABELS[key]}
              </span>
              {/* Campo opzionale: se resta vuoto la validazione nativa non applica il pattern. */}
              <Input
                name={key}
                defaultValue={profile.socials?.[key] ?? ""}
                maxLength={30}
                pattern="[A-Za-z0-9._-]+"
                placeholder={t("handlePlaceholder")}
              />
            </label>
          ))}
        </div>
      </div>

      {state.error && <p className="font-mono text-xs text-accent-red">{state.error}</p>}
      {state.success && <p className="font-mono text-xs text-accent-orange">{state.success}</p>}

      <Button type="submit" disabled={pending || !valid}>
        {t("save")}
      </Button>
    </form>
  );
}
