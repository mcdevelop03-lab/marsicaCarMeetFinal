"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, X, ChevronLeft, ChevronRight } from "lucide-react";
import VideoYouTube from "@/components/features/consent/VideoYouTube";

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string | null;
};

export default function GalleryEvento({
  media,
  driveUrl,
}: {
  media: GalleryItem[];
  driveUrl: string | null;
}) {
  const t = useTranslations("gallery");
  const foto = media.filter((m) => m.type === "image");
  const video = media.filter((m) => m.type === "video");

  // Indice della foto aperta nel lightbox (null = chiuso). Naviga solo tra le foto.
  const [apertaIdx, setApertaIdx] = useState<number | null>(null);

  const chiudi = useCallback(() => setApertaIdx(null), []);
  const precedente = useCallback(
    () => setApertaIdx((i) => (i === null ? i : (i - 1 + foto.length) % foto.length)),
    [foto.length],
  );
  const successiva = useCallback(
    () => setApertaIdx((i) => (i === null ? i : (i + 1) % foto.length)),
    [foto.length],
  );

  useEffect(() => {
    if (apertaIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") chiudi();
      else if (e.key === "ArrowLeft") precedente();
      else if (e.key === "ArrowRight") successiva();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apertaIdx, chiudi, precedente, successiva]);

  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-white/60">{t("title")}</h2>

      {foto.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {foto.map((m, idx) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setApertaIdx(idx)}
                className="block w-full focus:outline-none focus:ring-1 focus:ring-white/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.caption ?? ""}
                  className="aspect-square w-full border border-white/10 object-cover transition-opacity hover:opacity-80"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {video.length > 0 && (
        <div className="space-y-4">
          {video.map((m) => (
            <VideoYouTube key={m.id} url={m.url} caption={m.caption} />
          ))}
        </div>
      )}

      {driveUrl && (
        <div className="space-y-1">
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/10 bg-surface-dim px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/70 transition-colors hover:text-white"
          >
            <ExternalLink size={14} aria-hidden="true" />
            {t("driveOpen")}
          </a>
          <p className="font-mono text-[11px] text-white/40">{t("driveNote")}</p>
        </div>
      )}

      {apertaIdx !== null && foto[apertaIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={chiudi}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={chiudi}
            aria-label={t("close")}
            className="absolute right-4 top-4 text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>
          {foto.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  precedente();
                }}
                aria-label={t("prev")}
                className="absolute left-4 text-white/70 hover:text-white"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  successiva();
                }}
                aria-label={t("next")}
                className="absolute right-4 text-white/70 hover:text-white"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto[apertaIdx].url}
            alt={foto[apertaIdx].caption ?? ""}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </section>
  );
}
