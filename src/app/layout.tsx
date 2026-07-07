import type { Metadata } from "next";
import { Anybody, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${anybody.variable} ${hanken.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
