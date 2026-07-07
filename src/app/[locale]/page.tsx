import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");
  return (
    <main className="p-12">
      <h1 className="font-display text-5xl font-black italic uppercase text-white">
        {t("heroTitle")}
      </h1>
    </main>
  );
}
