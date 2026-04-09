"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, BarChart3, MessageCircle, Bot, LogOut, Sun, Moon, Lightbulb, Compass } from "lucide-react";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { useRouter } from "next/navigation";
import { useDimCount } from "@/lib/hooks/use-dim-count";
import { useGpsStatus } from "@/lib/hooks/use-gps-status";
import { useLocale } from "@/lib/i18n/locale-context";
import { LanguageSwitcher } from "@/components/settings/LanguageSwitcher";

const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: Home },
  { href: "/first-watch", labelKey: "nav.firstWatch", icon: Sun },
  { href: "/night-watch", labelKey: "nav.nightWatch", icon: Moon },
  { href: "/hourly-gps", labelKey: "nav.hourlyGps", icon: Compass },
  { href: "/dims", labelKey: "nav.dims", icon: Lightbulb },
  { href: "/chat", labelKey: "nav.chat", icon: Bot },
  { href: "/routine", labelKey: "nav.routine", icon: ListChecks },
  { href: "/progress", labelKey: "nav.progress", icon: BarChart3 },
  { href: "/checkin", labelKey: "nav.checkin", icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dimCount = useDimCount();
  const gpsStatus = useGpsStatus();
  const { t } = useLocale();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <h1 className="text-lg font-semibold text-primary">{t("nav.appName")}</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const showBadge = item.href === "/dims" && dimCount > 0;
            const showGpsDot = item.href === "/hourly-gps" && gpsStatus.enabled && gpsStatus.isReady;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
                {showBadge && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {dimCount}
                  </span>
                )}
                {showGpsDot && (
                  <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Language + Sign out */}
        <div className="px-3 py-4 border-t border-border space-y-2">
          <LanguageSwitcher />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            {t("common.signOut")}
          </button>
        </div>
      </div>
    </aside>
  );
}
