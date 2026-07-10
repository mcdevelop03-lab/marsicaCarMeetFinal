import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Anybody, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getProfile } from "@/lib/auth";
import "../globals.css";

const anybody = Anybody({
  subsets: ["latin"],
  variable: "--font-anybody",
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

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

  const profile = await getProfile();

  return (
    <html
      lang={locale}
      className={`${anybody.variable} ${hanken.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <Header isAuthenticated={!!profile} avatar={profile?.avatar_url ?? null} />
          <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-10">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
