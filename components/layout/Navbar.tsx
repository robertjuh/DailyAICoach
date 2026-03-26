"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, Sun, Moon, Lightbulb, Compass } from "lucide-react";
import { useDimCount } from "@/lib/hooks/use-dim-count";
import { useGpsStatus } from "@/lib/hooks/use-gps-status";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/first-watch", label: "Morning", icon: Sun },
  { href: "/hourly-gps", label: "GPS", icon: Compass },
  { href: "/night-watch", label: "Evening", icon: Moon },
  { href: "/dims", label: "DIMs", icon: Lightbulb },
  { href: "/chat", label: "Coach", icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();
  const dimCount = useDimCount();
  const gpsStatus = useGpsStatus();

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
              <span>{item.label}</span>
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
