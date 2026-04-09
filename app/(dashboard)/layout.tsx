import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/auth/supabase";
import { prisma } from "@/lib/db/client";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { Locale } from "@/lib/i18n/locale-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check onboarding status
  const dbUser = await prisma.user.findUnique({
    where: { supabase_id: user.id },
  });

  if (!dbUser || !dbUser.onboarding_done) {
    redirect("/onboarding");
  }

  const locale = (dbUser.locale ?? "en") as Locale;

  return (
    <DashboardShell locale={locale}>
      {children}
    </DashboardShell>
  );
}
