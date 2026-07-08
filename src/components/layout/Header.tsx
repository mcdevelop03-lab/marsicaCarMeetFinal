"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/eventi", label: t("eventi") },
    { href: "/garage", label: t("garage") },
    { href: "/gadget", label: t("gadget") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group select-none">
          <Image
            src="/logo-white.png"
            alt={tb("name")}
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            priority
          />
          <div className="leading-none">
            <span className="font-display text-lg md:text-xl font-black italic tracking-tighter text-white uppercase block">
              {tb("name")}
            </span>
            <span className="text-[9px] font-mono text-accent-red tracking-widest uppercase block pt-1">
              {tb("payoff")}
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded text-white/60 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setOpen(true)}
          className="lg:hidden p-2.5 bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-lg"
          aria-label="Menu"
        >
          <Menu size={16} />
        </button>
      </div>
      {open && <MobileMenu links={links} onClose={() => setOpen(false)} />}
    </header>
  );
}
