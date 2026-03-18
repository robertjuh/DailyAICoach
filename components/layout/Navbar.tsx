"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Bot, Sun, Moon } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/first-watch", label: "Morning", icon: Sun },
  { href: "/night-watch", label: "Evening", icon: Moon },
  { href: "/chat", label: "Coach", icon: Bot },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
