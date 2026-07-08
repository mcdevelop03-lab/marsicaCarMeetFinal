"use client";
import Image from "next/image";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function MobileMenu({
  links,
  onClose,
}: {
  links: readonly { href: string; label: string }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xs h-full bg-surface-card border-r border-white/10 p-6 z-10 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <Image src="/logo-white.png" alt="" width={36} height={36} className="w-9 h-9 object-contain" />
          <button onClick={onClose} aria-label="Chiudi" className="p-2 text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-col gap-2 font-mono text-xs font-bold uppercase tracking-widest">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="px-4 py-3 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
