"use client";

import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function DashboardShell({ children }: { children: ReactNode }) {
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
