"use client";
import { routing } from "@/i18n/routing";

// Con una sola lingua non si mostra nulla; predisposto per Fase 3 (EN).
export default function LocaleSwitcher() {
  if (routing.locales.length < 2) return null;
  return null;
}
