import { LanguageToggle } from "@/components/settings/LanguageToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute right-4 top-4 z-10">
        <LanguageToggle />
      </div>
      {children}
    </div>
  );
}
