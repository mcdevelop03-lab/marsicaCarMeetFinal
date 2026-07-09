import { getProfile } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { logout } from "../../(public)/auth/actions";

export default async function DashboardPage() {
  const profile = await getProfile();
  const t = await getTranslations("dashboard");
  return (
    <div className="space-y-6">
      <SectionHeading>{t("title")}</SectionHeading>
      <p className="font-mono text-xs text-white/60 uppercase tracking-widest">
        {t("greeting", { name: profile?.name ?? profile?.tag ?? "" })}
      </p>
      <form action={logout}>
        <Button variant="outline" type="submit">{t("logout")}</Button>
      </form>
    </div>
  );
}
