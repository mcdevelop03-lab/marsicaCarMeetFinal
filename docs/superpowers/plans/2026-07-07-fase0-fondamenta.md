# Fase 0 — Fondamenta · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare il mockup Vite/VELOCITY in una base Next.js 15 ribrandizzata "Marsica Car Meet", navigabile, responsive e con pagine placeholder — pronta per costruire l'MVP.

**Architecture:** Next.js 15 App Router + React 19 + TypeScript. Il design del mockup viene riusato spostando i colori su **token di tema** Tailwind 4 (`@theme`). Layout (header/footer/nav) e componenti UI condivisi estratti da zero. i18n con `next-intl` (solo IT, struttura pronta per EN). Backend Supabase collegato via `@supabase/ssr` (client/server) ma **senza funzionalità utente** in questa fase. Il mockup originale resta in `_mockup-reference/` come riferimento visivo, rimosso a fine fase.

**Tech Stack:** Next.js 15, React 19, TypeScript, TailwindCSS 4, next-intl, @supabase/ssr, next/font, lucide-react.

## Global Constraints

- **Node** ≥ 20 (ambiente: v20.19.3), **npm** 10.8.2.
- **Nessun** `@google/genai`, `motion`, `express`, `dotenv` (dipendenze morte del mockup — D-analisi).
- **Nessun colore hardcoded** nei componenti: usare esclusivamente i token del tema (`bg-background`, `text-accent-red`, ecc.) — CODE_ANALYSIS §3.1.
- **Palette:** scura + rosso `#FF3E00` / arancio `#fd8b00` (D-102).
- **Lingua:** solo Italiano al lancio, routing `/it`; struttura i18n pronta per EN (D-151).
- **Copy di brand** verbatim da DECISIONS.md §"Brand copy":
  - Nome: **Marsica Car Meet**
  - Payoff: **La community dei motori della Marsica**
  - Headline hero: **LA MARSICA CORRE INSIEME**
  - Sottotitolo hero: **Scopri i raduni, mostra la tua auto e vivi la passione dei motori in Marsica.**
  - Nav: **Home · Eventi · Garage · Gadget** (Mappa in Fase 2)
  - Banner CTA: titolo **PRONTO A UNIRTI AL RADUNO?**, bottone **Registrati**
  - Footer: **© 2026 Marsica Car Meet**
- **Logo:** `assets/logo-white.png` (trasparente, per tema scuro), `assets/logo-black.jpeg` (sfondi chiari) — D-104.
- **Nessun e-commerce/carrello, mai** (D-161): la sezione si chiama **Gadget**.
- **Branch:** lavorare su un branch dedicato `feat/fase0-fondamenta` (non su `main`).

---

## File Structure (target a fine Fase 0)

```
marsicaCarMeetFinal/            # repo root (git)
  _mockup-reference/            # mockup Vite archiviato (rimosso allo Step finale)
  assets/                       # logo-white.png, logo-black.jpeg (invariati)
  docs/                         # documentazione (invariata)
  public/
    logo-white.png             # copiato da assets/ per uso runtime
    logo-black.jpeg
  src/
    app/
      [locale]/
        layout.tsx             # <html>, font, Header, Footer, provider i18n
        page.tsx               # Home (hero + payoff + CTA)
        eventi/page.tsx        # placeholder
        garage/page.tsx        # placeholder
        gadget/page.tsx        # placeholder
        login/page.tsx         # placeholder
        registrati/page.tsx    # placeholder
        privacy/page.tsx       # placeholder
        cookie/page.tsx        # placeholder
        not-found.tsx
      globals.css              # @import tailwind + @theme token + utility custom
    components/
      layout/
        Header.tsx
        Footer.tsx
        MobileMenu.tsx
        LocaleSwitcher.tsx     # predisposto (solo IT visibile)
      ui/
        Button.tsx
        Card.tsx
        Badge.tsx
        Input.tsx
        SectionHeading.tsx
    i18n/
      routing.ts               # config next-intl (locales, defaultLocale)
      request.ts               # getRequestConfig
      navigation.ts            # Link/redirect/usePathname localizzati
    lib/
      supabase/
        client.ts              # createBrowserClient
        server.ts              # createServerClient (cookies)
    messages/
      it.json                  # stringhe UI in italiano
    middleware.ts              # middleware next-intl (locale)
  next.config.ts               # plugin next-intl
  .env.local.example
  package.json
```

---

## Task 1: Archiviazione mockup + scaffold Next.js 15

**Files:**
- Create: `_mockup-reference/` (sposta qui i file del mockup Vite)
- Create: intero scaffold Next.js in root
- Modify: `.gitignore`

**Interfaces:**
- Produces: progetto Next.js 15 funzionante con dev server su :3000; alias import `@/*` → `src/*`.

- [ ] **Step 1: Creare il branch di lavoro**

Run:
```bash
git checkout -b feat/fase0-fondamenta
```
Expected: `Switched to a new branch 'feat/fase0-fondamenta'`

- [ ] **Step 2: Archiviare i file del mockup Vite in `_mockup-reference/`**

Sposta SOLO i file del mockup, lasciando in root `docs/`, `assets/`, `.git`, `.gitignore`.

Run (bash):
```bash
mkdir -p _mockup-reference
git mv src index.html vite.config.ts tsconfig.json package.json metadata.json README.md _mockup-reference/
# file non tracciati o residui:
[ -f test-utenza-git.txt ] && git mv test-utenza-git.txt _mockup-reference/ || true
```
Expected: i file compaiono sotto `_mockup-reference/`; `ls` in root mostra `assets docs _mockup-reference`.

- [ ] **Step 3: Verificare che `assets/` e `docs/` siano rimasti in root**

Run: `ls -1`
Expected: contiene `assets`, `docs`, `_mockup-reference` (NON `src`, `package.json`).

- [ ] **Step 4: Scaffold Next.js in una cartella temporanea (evita conflitti con i file esistenti)**

Run:
```bash
npx --yes create-next-app@latest .__next_tmp --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm --no-turbopack --disable-git
```
Expected: crea `.__next_tmp/` con progetto Next.js 15 + Tailwind 4.

- [ ] **Step 5: Spostare i contenuti dello scaffold in root e rimuovere la temp**

Run (bash):
```bash
# porta su tutto tranne la sua .git eventuale
(cd .__next_tmp && tar cf - --exclude=.git .) | tar xf -
rm -rf .__next_tmp
```
Expected: in root ora ci sono `package.json`, `next.config.*`, `src/app/`, `tsconfig.json`, `postcss.config.*`.

- [ ] **Step 6: Aggiungere `_mockup-reference/` e artefatti al `.gitignore`**

Aggiungi in fondo a `.gitignore`:
```
# Mockup Vite archiviato (riferimento visivo, non parte del build)
/_mockup-reference/
.__next_tmp/
```

- [ ] **Step 7: Installare le dipendenze e avviare il dev server per verifica**

Run:
```bash
npm install
npm run build
```
Expected: `npm run build` termina con "Compiled successfully" (pagina di default Next).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(fase0): archivia mockup Vite e inizializza Next.js 15 (App Router, TS, Tailwind 4)"
```

---

## Task 2: Tema Tailwind con token brand + font

**Files:**
- Modify: `src/app/globals.css`
- Create/Modify: `src/app/layout.tsx` (root, per i font) — nota: verrà sostituito dal locale layout in Task 3; qui si imposta solo `next/font`.
- Test: verifica visiva build

**Interfaces:**
- Produces: token CSS `--color-background`, `--color-surface-card`, `--color-accent-red`, `--color-accent-orange`, `--color-on-surface-muted`; classi `font-display`, `font-mono`; utility `racing-grid`, `glass-panel`, `neon-glow-red`, `neon-text-red`, `redline-flicker`. Variabili font `--font-display`, `--font-sans`, `--font-mono`.

- [ ] **Step 1: Sostituire `globals.css` con tema + token (porta dal mockup, self-hosted font via variabili)**

Contenuto di `src/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --font-display: var(--font-anybody), sans-serif;
  --font-sans: var(--font-hanken), sans-serif;
  --font-mono: var(--font-jetbrains), monospace;

  --color-background: #0A0A0B;
  --color-surface-dim: #050505;
  --color-surface-card: #111114;
  --color-surface-panel: #050505;
  --color-accent-red: #FF3E00;
  --color-accent-red-hover: #E03500;
  --color-accent-orange: #fd8b00;
  --color-accent-orange-hover: #e07a00;
  --color-accent-pink: #ffb3ac;
  --color-on-surface-muted: rgba(255, 255, 255, 0.4);
}

body {
  background-color: var(--color-background);
  color: #FFFFFF;
  font-family: var(--font-sans);
  overflow-x: hidden;
}

.font-display { font-family: var(--font-display); }
.font-mono { font-family: var(--font-mono); }

.glass-panel {
  background: rgba(21, 21, 24, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.racing-grid {
  background-size: 40px 40px;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
}

.neon-glow-red { box-shadow: 0 0 15px rgba(255, 59, 59, 0.35); border-color: rgba(255, 59, 59, 0.6); }
.neon-text-red { text-shadow: 0 0 8px rgba(255, 59, 59, 0.6); }

@keyframes flicker {
  0%,19%,21%,23%,25%,54%,56%,100% { opacity: 1; filter: drop-shadow(0 0 8px rgba(255,59,59,.6)); }
  20%,24%,55% { opacity: .5; filter: none; }
}
.redline-flicker { animation: flicker 4s infinite alternate; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #0A0A0B; }
::-webkit-scrollbar-thumb { background: #1D1D22; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #ff3b3b; }
```

- [ ] **Step 2: Configurare i font con `next/font/google` nel root layout**

In `src/app/layout.tsx` (root layout generato dallo scaffold), imposta le variabili font:
```tsx
import type { Metadata } from "next";
import { Anybody, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const anybody = Anybody({ subsets: ["latin"], variable: "--font-anybody", style: ["normal", "italic"] });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Marsica Car Meet",
  description: "La community dei motori della Marsica",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${anybody.variable} ${hanken.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verificare il build**

Run: `npm run build`
Expected: "Compiled successfully" senza errori CSS/font.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat(fase0): tema Tailwind con token brand (scuro+rosso) e font self-hosted"
```

---

## Task 3: i18n con next-intl (IT, struttura pronta per EN)

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`
- Create: `src/middleware.ts`
- Create: `src/messages/it.json`
- Modify: `next.config.ts`
- Move: `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`
- Move: `src/app/page.tsx` → `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: token/font di Task 2.
- Produces: routing localizzato `/it/...`; `Link`, `redirect`, `usePathname`, `useRouter` da `@/i18n/navigation`; hook `useTranslations`/`getTranslations`; messaggi in `src/messages/it.json`.

- [ ] **Step 1: Installare next-intl**

Run: `npm install next-intl`
Expected: aggiunto a `package.json`.

- [ ] **Step 2: `src/i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it"],        // "en" aggiunto in Fase 3
  defaultLocale: "it",
});
```

- [ ] **Step 3: `src/i18n/navigation.ts`**

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 4: `src/i18n/request.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "it")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: `src/middleware.ts`**

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(it|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 6: `next.config.ts` con plugin next-intl**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: `src/messages/it.json` (stringhe iniziali)**

```json
{
  "brand": {
    "name": "Marsica Car Meet",
    "payoff": "La community dei motori della Marsica"
  },
  "nav": {
    "home": "Home",
    "eventi": "Eventi",
    "garage": "Garage",
    "gadget": "Gadget"
  },
  "home": {
    "heroTitle": "LA MARSICA CORRE INSIEME",
    "heroSubtitle": "Scopri i raduni, mostra la tua auto e vivi la passione dei motori in Marsica.",
    "ctaTitle": "PRONTO A UNIRTI AL RADUNO?",
    "ctaButton": "Registrati"
  },
  "footer": {
    "copyright": "© 2026 Marsica Car Meet"
  },
  "placeholder": {
    "comingSoon": "In arrivo"
  }
}
```

- [ ] **Step 8: Spostare layout e page sotto `[locale]/` e adattare il layout**

Sposta i file e sostituisci `src/app/[locale]/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Anybody, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import "../globals.css";

const anybody = Anybody({ subsets: ["latin"], variable: "--font-anybody", style: ["normal", "italic"] });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Marsica Car Meet",
  description: "La community dei motori della Marsica",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} className={`${anybody.variable} ${hanken.variable} ${jetbrains.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```
Rimuovi il vecchio `src/app/layout.tsx` (root) se presente dopo lo spostamento.

- [ ] **Step 9: `src/app/[locale]/page.tsx` minimale che usa le traduzioni**

```tsx
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");
  return (
    <main className="p-12">
      <h1 className="font-display text-4xl font-black italic uppercase">{t("heroTitle")}</h1>
    </main>
  );
}
```

- [ ] **Step 10: Verificare il routing localizzato**

Run:
```bash
npm run build
```
Expected: build ok; rotta `/[locale]` generata per `it`. Avviando `npm run dev`, `http://localhost:3000/it` mostra "LA MARSICA CORRE INSIEME"; `http://localhost:3000` redirige a `/it`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(fase0): i18n next-intl (IT) con routing [locale] e messaggi"
```

---

## Task 4: Componenti UI condivisi (`components/ui`)

**Files:**
- Create: `src/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `SectionHeading.tsx`

**Interfaces:**
- Produces:
  - `Button({ variant?: "primary" | "outline" | "ghost", className?, ...button })` — default `primary`.
  - `Card({ className?, children })` — contenitore `bg-surface-card border border-white/5`.
  - `Badge({ tone?: "accent" | "muted", children, className? })`.
  - `Input(props: InputHTMLAttributes)` — input mono con focus accent.
  - `SectionHeading({ children, className? })` — titolo display con barretta rossa.

- [ ] **Step 1: `Button.tsx` (solo token, nessun colore hardcoded)**

```tsx
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-accent-red hover:text-white",
  outline: "border border-white/20 text-white hover:border-white hover:bg-white/5",
  ghost: "text-white/60 hover:text-white",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-6 py-3 font-mono font-bold text-xs uppercase tracking-widest transition-colors ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 2: `Card.tsx`**

```tsx
export default function Card({
  className = "",
  children,
}: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-surface-card border border-white/5 ${className}`}>{children}</div>
  );
}
```

- [ ] **Step 3: `Badge.tsx`**

```tsx
export default function Badge({
  tone = "muted",
  className = "",
  children,
}: { tone?: "accent" | "muted"; className?: string; children: React.ReactNode }) {
  const tones = {
    accent: "bg-accent-red/10 border-accent-red/20 text-accent-red",
    muted: "bg-white/5 border-white/10 text-white/60",
  };
  return (
    <span className={`px-2 py-0.5 border text-[9px] font-mono font-bold tracking-widest uppercase ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: `Input.tsx`**

```tsx
import { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`px-3 py-2.5 bg-surface-dim border border-white/10 hover:border-white/20 focus:border-accent-red/50 text-xs font-mono text-white placeholder-white/20 focus:outline-none ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 5: `SectionHeading.tsx`**

```tsx
export default function SectionHeading({
  className = "",
  children,
}: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={`font-display text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3 ${className}`}>
      <span className="w-1.5 h-6 bg-accent-red" />
      {children}
    </h2>
  );
}
```

- [ ] **Step 6: Verificare la compilazione dei tipi**

Run: `npx tsc --noEmit`
Expected: nessun errore.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui
git commit -m "feat(fase0): componenti UI condivisi (Button, Card, Badge, Input, SectionHeading)"
```

---

## Task 5: Layout — Header, Footer, MobileMenu, LocaleSwitcher

**Files:**
- Create: `src/components/layout/Header.tsx`, `Footer.tsx`, `MobileMenu.tsx`, `LocaleSwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx` (montare Header/Footer)
- Copy: `assets/logo-white.png`, `assets/logo-black.jpeg` → `public/`

**Interfaces:**
- Consumes: `Link` da `@/i18n/navigation`, `useTranslations`, componenti `ui`, token tema.
- Produces: `<Header/>`, `<Footer/>` montati nel locale layout; nav voci Home/Eventi/Garage/Gadget verso `/eventi`, `/garage`, `/gadget`, `/`.

- [ ] **Step 1: Copiare i loghi in `public/`**

Run:
```bash
cp assets/logo-white.png public/logo-white.png
cp assets/logo-black.jpeg public/logo-black.jpeg
```
Expected: i file esistono in `public/`.

- [ ] **Step 2: `Header.tsx` (logo bianco + nav + toggle mobile)**

```tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
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
          <Image src="/logo-white.png" alt={tb("name")} width={40} height={40} className="w-10 h-10 object-contain" priority />
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
            <Link key={l.href} href={l.href} className="px-4 py-2 rounded text-white/60 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <button onClick={() => setOpen(true)} className="lg:hidden p-2.5 bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-lg" aria-label="Menu">
          <Menu size={16} />
        </button>
      </div>
      {open && <MobileMenu links={links} onClose={() => setOpen(false)} />}
    </header>
  );
}
```

- [ ] **Step 3: `MobileMenu.tsx`**

```tsx
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
          <button onClick={onClose} aria-label="Chiudi" className="p-2 text-white/60 hover:text-white"><X size={18} /></button>
        </div>
        <nav className="flex flex-col gap-2 font-mono text-xs font-bold uppercase tracking-widest">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={onClose} className="px-4 py-3 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `LocaleSwitcher.tsx` (predisposto, solo IT)**

```tsx
"use client";
import { routing } from "@/i18n/routing";

// Con una sola lingua non si mostra nulla; predisposto per Fase 3 (EN).
export default function LocaleSwitcher() {
  if (routing.locales.length < 2) return null;
  return null;
}
```

- [ ] **Step 5: `Footer.tsx`**

```tsx
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const tb = useTranslations("brand");
  return (
    <footer className="mt-auto bg-surface-dim border-t border-white/5 py-6 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] font-mono text-white/40">
        <span>{t("copyright")}</span>
        <span className="uppercase tracking-widest text-accent-red">{tb("payoff")}</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Montare Header/Footer nel locale layout**

In `src/app/[locale]/layout.tsx`, sostituisci il `<body>`:
```tsx
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider>
          <Header />
          <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-10">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
```
Aggiungi gli import:
```tsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
```

- [ ] **Step 7: Verificare build e resa responsive**

Run: `npm run build`
Expected: build ok. In `npm run dev`, l'header mostra logo + "Marsica Car Meet" + payoff, nav desktop e drawer mobile funzionanti.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(fase0): layout header/footer/nav con logo e copy Marsica Car Meet"
```

---

## Task 6: Home (hero + CTA) + pagine placeholder + not-found

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Create: `src/app/[locale]/eventi/page.tsx`, `garage/page.tsx`, `gadget/page.tsx`, `login/page.tsx`, `registrati/page.tsx`, `privacy/page.tsx`, `cookie/page.tsx`
- Create: `src/app/[locale]/not-found.tsx`

**Interfaces:**
- Consumes: `useTranslations`, componenti `ui`, `Link`.
- Produces: home renderizzata con hero + banner CTA; 7 pagine placeholder navigabili.

- [ ] **Step 1: Home `page.tsx` (hero + CTA, solo token)**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function Home() {
  const t = useTranslations("home");
  return (
    <div className="space-y-16">
      <section className="relative border border-white/10 min-h-[420px] flex items-center overflow-hidden">
        <div className="absolute inset-0 racing-grid opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-accent-red/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl px-6 md:px-12 py-12 space-y-6">
          <Badge tone="accent">Prossimi raduni</Badge>
          <h1 className="font-display text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-white uppercase">
            {t("heroTitle")}
          </h1>
          <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl">{t("heroSubtitle")}</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/eventi"><Button>{useTranslations("nav")("eventi")}</Button></Link>
            <Link href="/garage"><Button variant="outline">{useTranslations("nav")("garage")}</Button></Link>
          </div>
        </div>
      </section>

      <section className="border border-white/10 relative p-8 md:p-12 text-center overflow-hidden">
        <div className="absolute inset-0 racing-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <h2 className="font-display text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase">{t("ctaTitle")}</h2>
          <Link href="/registrati"><Button>{t("ctaButton")}</Button></Link>
        </div>
      </section>
    </div>
  );
}
```
> Nota: se `useTranslations` annidato dà problemi di lint, estrai `const tn = useTranslations("nav")` in cima e usa `tn("eventi")`.

- [ ] **Step 2: Componente placeholder riusabile inline per le pagine**

Crea ogni pagina placeholder con questo schema (esempio `eventi/page.tsx`):
```tsx
import { useTranslations } from "next-intl";
import SectionHeading from "@/components/ui/SectionHeading";

export default function EventiPage() {
  const t = useTranslations("placeholder");
  return (
    <div className="space-y-6">
      <SectionHeading>Eventi</SectionHeading>
      <p className="font-mono text-xs text-white/40 uppercase tracking-widest">{t("comingSoon")}</p>
    </div>
  );
}
```
Ripeti per `garage` (titolo "Garage"), `gadget` ("Gadget"), `login` ("Accedi"), `registrati` ("Registrati"), `privacy` ("Privacy"), `cookie` ("Cookie") — cambiando solo il titolo dell'heading e il nome del componente.

- [ ] **Step 3: `not-found.tsx`**

```tsx
import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="text-center py-24 space-y-6">
      <h1 className="font-display text-6xl font-black italic text-white uppercase">404</h1>
      <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Pagina non trovata</p>
      <Link href="/"><Button>Torna alla home</Button></Link>
    </div>
  );
}
```

- [ ] **Step 4: Verificare navigazione**

Run: `npm run build`
Expected: tutte le rotte compilano. In `npm run dev`, navigare tra Home/Eventi/Garage/Gadget dall'header funziona; una URL inesistente mostra il 404 stilizzato.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(fase0): home (hero+CTA), pagine placeholder e 404 ribrandizzati"
```

---

## Task 7: Client Supabase (client/server) + env

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Create: `.env.local.example`
- Modify: `.gitignore` (assicurarsi `.env*.local` ignorato — di default sì con Next)

**Interfaces:**
- Produces: `createClient()` (browser) da `@/lib/supabase/client`; `createClient()` (server, async) da `@/lib/supabase/server`. Nessun consumo in Fase 0 (solo predisposizione).

- [ ] **Step 1: Installare @supabase/ssr e supabase-js**

Run: `npm install @supabase/ssr @supabase/supabase-js`

- [ ] **Step 2: `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: `src/lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // chiamato da un Server Component: ignorabile con middleware di refresh sessione
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: `.env.local.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR-ANON-KEY"
# Solo server (non esporre):
SUPABASE_SERVICE_ROLE_KEY="YOUR-SERVICE-ROLE-KEY"
# Cloudflare Turnstile (anti-bot, Fase 1)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
```

- [ ] **Step 5: Verificare che il build regga senza env reali**

Run: `npm run build`
Expected: build ok (i client non vengono istanziati a build-time).

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase .env.local.example
git commit -m "feat(fase0): predisposizione client Supabase (browser/server) ed env di esempio"
```

---

## Task 8: Pulizia finale, verifica e rimozione riferimento mockup

**Files:**
- Modify: `README.md` (nuovo, per il progetto Next)
- Delete: `_mockup-reference/` (opzionale: mantenerla fuori dal versionamento)

**Interfaces:**
- Produces: repo pulito, build/lint verdi, README aggiornato.

- [ ] **Step 1: Verificare l'assenza di dipendenze morte**

Run: `grep -E "@google/genai|\"motion\"|\"express\"|\"dotenv\"" package.json || echo "OK: nessuna dipendenza morta"`
Expected: `OK: nessuna dipendenza morta`.

- [ ] **Step 2: Lint + typecheck + build completi**

Run:
```bash
npm run lint
npx tsc --noEmit
npm run build
```
Expected: tutti verdi.

- [ ] **Step 3: Nuovo `README.md` del progetto**

```markdown
# Marsica Car Meet

Piattaforma web della community dei motori della Marsica.
Stack: Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS 4 · next-intl (IT) · Supabase.

## Sviluppo
```bash
npm install
cp .env.local.example .env.local   # inserisci le chiavi Supabase
npm run dev                        # http://localhost:3000/it
```

Documentazione completa in [`docs/`](./docs/README.md).
```

- [ ] **Step 4: Rimuovere il riferimento al mockup (dopo aver confermato che non serve più copiarne pezzi)**

Run:
```bash
rm -rf _mockup-reference
```
> Il mockup resta comunque nella storia git (commit iniziale). Saltare questo step se serve ancora come riferimento durante la Fase 1.

- [ ] **Step 5: Commit finale**

```bash
git add -A
git commit -m "chore(fase0): pulizia, README di progetto e rimozione riferimento mockup"
```

- [ ] **Step 6: Verifica manuale finale (checklist esito Fase 0)**

Avvia `npm run dev` e conferma:
- `/` redirige a `/it`.
- Header con logo bianco + "Marsica Car Meet" + payoff; nav e drawer mobile ok.
- Home: hero "LA MARSICA CORRE INSIEME" + banner "PRONTO A UNIRTI AL RADUNO?".
- Navigazione verso Eventi/Garage/Gadget mostra i placeholder.
- 404 stilizzato su URL inesistente.
- Nessun colore hardcoded introdotto (solo classi token).

---

## Self-Review

**Spec coverage (ROADMAP Fase 0 / TODO):**
- Scaffold Next.js 15 → Task 1 ✅
- Tailwind 4 + token + stile mockup → Task 2 ✅
- Componenti UI condivisi → Task 4 ✅
- i18n next-intl (IT, pronto EN) + `[locale]` → Task 3 ✅
- Supabase client/server + env → Task 7 ✅
- Migrazione header/footer/nav (useState → routing) → Task 5 ✅
- Rebranding VELOCITY → Marsica Car Meet (logo, testi, palette) → Task 2/5/6 ✅
- Rimozione dipendenze morte → Task 1 (scaffold pulito) + Task 8 (verifica) ✅
- Rimozione elementi mockup (carrello, telemetria, feed, chat) → non riportati nel nuovo codice (partiamo da zero) ✅
- Pagine placeholder responsive bilingue di base → Task 6 ✅

**Placeholder scan:** ogni step ha comando/codice concreto. Le pagine placeholder ripetute (Task 6 Step 2) hanno lo schema completo + istruzione esplicita di variazione (solo titolo). OK.

**Type consistency:** `createClient` usato coerentemente per browser/server (moduli distinti); `Button variant`/`Badge tone` coerenti tra definizione (Task 4) e uso (Task 6). `Link` sempre da `@/i18n/navigation`. `routing.locales` coerente tra routing/middleware/layout. OK.

**Note aperte per la Fase 1 (non in questo piano):** auth (Google/Turnstile/2FA), schema DB e RLS, garage/eventi/RSVP, album media, GDPR/cookie banner reale.
