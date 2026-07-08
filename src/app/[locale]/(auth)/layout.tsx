import { requireUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
