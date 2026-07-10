import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import ProfileForm from "@/components/features/profile/ProfileForm";
import { getProfile } from "@/lib/auth";
import { updateProfile } from "./actions";

export default async function ProfiloPage() {
  const t = await getTranslations("profile");
  const profile = await getProfile();
  if (!profile) redirect({ href: "/login", locale: "it" });

  return (
    <div className="space-y-8">
      <SectionHeading>{t("title")}</SectionHeading>
      <Card className="p-6">
        <ProfileForm action={updateProfile} profile={profile!} />
      </Card>
    </div>
  );
}
