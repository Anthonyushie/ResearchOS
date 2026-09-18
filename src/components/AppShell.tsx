"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Auth + public routes render without workspace chrome
  if (pathname === "/login") {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
