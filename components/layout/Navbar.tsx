"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, Sun, Moon, Lightbulb, Compass } from "lucide-react";
import { useDimCount } from "@/lib/hooks/use-dim-count";
import { useGpsStatus } from "@/lib/hooks/use-gps-status";
import { useLocale } from "@/lib/i18n/locale-context";

const navItems = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/first-watch", labelKey: "nav.morning", icon: Sun },
  { href: "/hourly-gps", labelKey: "nav.gps", icon: Compass },
  { href: "/night-watch", labelKey: "nav.evening", icon: Moon },
  { href: "/dims", labelKey: "nav.dims", icon: Lightbulb },
  { href: "/chat", labelKey: "nav.coach", icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();
  const dimCount = useDimCount();
  const gpsStatus = useGpsStatus();
  const { t } = useLocale();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.href === "/dims" && dimCount > 0;
          const showGpsDot = item.href === "/hourly-gps" && gpsStatus.enabled && gpsStatus.isReady;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
              {showBadge && (
                <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[10px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
                  {dimCount}
                </span>
              )}
              {showGpsDot && (
                <span className="absolute -top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
