"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, BarChart3, MessageCircle, Bot, LogOut, Sun, Moon } from "lucide-react";
import { createBrowserClient } from "@/lib/auth/supabase-browser";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/first-watch", label: "First Watch", icon: Sun },
  { href: "/night-watch", label: "Night Watch", icon: Moon },
  { href: "/chat", label: "AI Coach", icon: Bot },
  { href: "/routine", label: "My Routine", icon: ListChecks },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/checkin", label: "Check-in", icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
          <h1 className="text-lg font-semibold text-primary">Daily Coach</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
