import React from "react";
import { NavRail } from "@/components/shell/NavRail";
import { Header } from "@/components/shell/Header";
import { CommandPalette } from "@/components/ui/CommandPalette";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      {/* Sidebar Navigation Rail */}
      <NavRail />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header />
        <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
