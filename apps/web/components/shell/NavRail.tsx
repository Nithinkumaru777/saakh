"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  FileCheck,
  SlidersHorizontal,
  Users,
  CloudUpload,
  ChartColumnIncreasing,
  Brain,
  CircleHelp,
} from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { spring, useMotionPreset } from "@/lib/motion";

interface NavItem {
  name: string;
  href: string;
  icon: typeof FileCheck;
  preset: "draw" | "nudge-x" | "pop" | "nudge-y" | "spin";
}

const NAV_ITEMS: NavItem[] = [
  { name: "Assess", href: "/assess", icon: FileCheck, preset: "draw" },
  { name: "What-If", href: "/what-if", icon: SlidersHorizontal, preset: "nudge-x" },
  { name: "Applicants", href: "/applicants", icon: Users, preset: "pop" },
  { name: "Batch", href: "/batch", icon: CloudUpload, preset: "nudge-y" },
  { name: "Portfolio", href: "/portfolio", icon: ChartColumnIncreasing, preset: "draw" },
  { name: "Model", href: "/model", icon: Brain, preset: "pop" },
  { name: "About", href: "/about", icon: CircleHelp, preset: "pop" },
];

export function NavRail() {
  const pathname = usePathname();
  const { reduced } = useMotionPreset();

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-16 lg:w-[232px] shrink-0 min-h-screen bg-[var(--sheet)] border-r border-[var(--rule)] transition-all">
        {/* Brand header */}
        <div className="p-4 border-b border-[var(--rule)]">
          <Link href="/" className="flex flex-col group outline-none">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-semibold text-xl tracking-tight text-[var(--ink)] group-hover:text-[var(--ink-2)] transition-colors">
                Saakh
              </span>
              <span className="text-xs font-serif text-[var(--ink-3)] hidden lg:inline">
                साख
              </span>
            </div>
            <span className="text-[11px] font-mono text-[var(--ink-3)] hidden lg:inline tracking-wider mt-0.5">
              RISK ENGINE
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-[2px] text-xs font-medium transition-colors select-none outline-none focus-visible:ring-1 focus-visible:ring-[var(--ink)] ${
                  isActive
                    ? "text-[var(--ink)] font-semibold"
                    : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sheet-2)]"
                }`}
              >
                {/* Active marker: haldi-wash band + 3px haldi bar on left */}
                {isActive && (
                  <motion.div
                    layoutId={reduced ? undefined : "nav-marker"}
                    transition={spring.snappy}
                    className="absolute inset-0 bg-[var(--haldi-wash)] border-l-[3px] border-l-[var(--haldi)] rounded-[2px] -z-10"
                  />
                )}
                <AnimatedIcon
                  icon={item.icon}
                  preset={item.preset}
                  size={18}
                  className="shrink-0"
                />
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Academic credentials footer */}
        <div className="p-3 border-t border-[var(--rule)] hidden lg:flex flex-col gap-1 text-[11px] text-[var(--ink-3)] bg-[var(--sheet-2)]">
          <div className="font-semibold text-[var(--ink)] text-xs">
            NITHIN KUMAR U
          </div>
          <div className="font-mono text-[10px]">
            USN: 2102508611
          </div>
          <div className="text-[10px] leading-tight text-[var(--ink-3)]">
            AI for Finance — CIA-2 · Topic 4
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--sheet)] border-t border-[var(--rule)] flex items-center justify-around py-1.5 px-2">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-[var(--ink)] font-bold" : "text-[var(--ink-3)]"
              }`}
            >
              <AnimatedIcon icon={item.icon} preset={item.preset} size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
