import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/auth/supabase";
import { prisma } from "@/lib/db/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <main className="p-4 md:p-8 pb-24 md:pb-8">{children}</main>
      </div>
      <Navbar />
    </div>
  );
}
