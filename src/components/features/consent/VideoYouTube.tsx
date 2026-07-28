"use client";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { estraiIdYouTube } from "@/lib/media/youtube";
import { useConsent } from "./ConsentProvider";

export default function VideoYouTube({
  url,
  caption,
}: {
  url: string;
  caption: string | null;
}) {
  const t = useTranslations("consent");
  const { external, setExternal } = useConsent();
  const id = estraiIdYouTube(url);
  if (!id) return null;

  return (
    <div className="space-y-1">
      {external ? (
        <div className="relative w-full overflow-hidden border border-white/10 pt-[56.25%]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={caption ?? "video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : (
        <div className="relative w-full overflow-hidden border border-white/10 bg-surface-dim pt-[56.25%]">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <p className="font-mono text-[11px] text-white/50">{t("videoBlocked")}</p>
            <button
              type="button"
              onClick={() => setExternal(true)}
              className="border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white/5"
            >
              {t("enableExternal")}
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-white/40 underline-offset-2 hover:text-white hover:underline"
            >
              <ExternalLink size={12} aria-hidden="true" />
              {t("watchOnYoutube")}
            </a>
          </div>
        </div>
      )}
      {caption && <p className="font-mono text-[11px] text-white/50">{caption}</p>}
    </div>
  );
}
