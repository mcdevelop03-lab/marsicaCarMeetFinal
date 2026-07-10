"use client";
import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { setAvatar } from "@/app/[locale]/(auth)/profilo/actions";

// Stessi limiti della migrazione 0005. Qui servono solo per il feedback
// immediato: chi li aggira viene comunque respinto dal bucket.
const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function AvatarUploader({
  userId,
  avatarUrl,
}: {
  userId: string;
  avatarUrl: string | null;
}) {
  const t = useTranslations("profile");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permette di riselezionare lo stesso file
    if (!file) return;

    setError(null);
    if (!EXTENSIONS[file.type]) return setError(t("avatarType"));
    if (file.size > MAX_BYTES) return setError(t("avatarSize"));

    setUploading(true);
    // Il nome cambia a ogni caricamento: niente cache stantia del browser.
    const path = `${userId}/avatar-${Date.now()}.${EXTENSIONS[file.type]}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });
    setUploading(false);
    if (uploadError) return setError(t("avatarUploadFailed"));

    startTransition(async () => {
      const result = await setAvatar(path);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  const busy = uploading || pending;

  return (
    <div className="flex items-center gap-6">
      <Avatar src={avatarUrl} alt={t("avatarTitle")} size={96} />
      <div className="space-y-2">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-white/60">
          {t("avatarTitle")}
        </h3>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Camera size={14} />
          {t("avatarChange")}
        </Button>
        <p className="font-mono text-[11px] text-white/40">{t("avatarRules")}</p>
        {error && <p className="font-mono text-xs text-accent-red">{error}</p>}
      </div>
    </div>
  );
}
