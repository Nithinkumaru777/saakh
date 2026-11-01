"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  FileCheck,
  SlidersHorizontal,
  Users,
  CloudUpload,
  ChartColumnIncreasing,
  Brain,
  CircleHelp,
  SunMoon,
  Search,
} from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Personas" | "Preferences";
  onSelect: () => void;
  icon?: React.ReactNode;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => [
    {
      id: "nav-assess",
      title: "Assess Application",
      subtitle: "Full loan underwriting worksheet",
      category: "Navigation",
      icon: <AnimatedIcon icon={FileCheck} preset="draw" size={16} />,
      onSelect: () => router.push("/assess"),
    },
    {
      id: "nav-what-if",
      title: "What-If Simulator",
      subtitle: "Live sensitivity sliders and counterfactual advice",
      category: "Navigation",
      icon: <AnimatedIcon icon={SlidersHorizontal} preset="nudge-x" size={16} />,
      onSelect: () => router.push("/what-if"),
    },
    {
      id: "nav-applicants",
      title: "Applicants Table",
      subtitle: "Portfolio ledger with search and outcome filters",
      category: "Navigation",
      icon: <AnimatedIcon icon={Users} preset="pop" size={16} />,
      onSelect: () => router.push("/applicants"),
    },
    {
      id: "nav-batch",
      title: "Batch Assessment",
      subtitle: "CSV upload and portfolio scoring",
      category: "Navigation",
      icon: <AnimatedIcon icon={CloudUpload} preset="nudge-y" size={16} />,
      onSelect: () => router.push("/batch"),
    },
    {
      id: "nav-portfolio",
      title: "Portfolio Analytics",
      subtitle: "Executive risk metrics and distribution charts",
      category: "Navigation",
      icon: <AnimatedIcon icon={ChartColumnIncreasing} preset="draw" size={16} />,
      onSelect: () => router.push("/portfolio"),
    },
    {
      id: "nav-model",
      title: "Model Transparency",
      subtitle: "Architecture, SHAP, ROC, and Model Card",
      category: "Navigation",
      icon: <AnimatedIcon icon={Brain} preset="pop" size={16} />,
      onSelect: () => router.push("/model"),
    },
    {
      id: "nav-about",
      title: "About the Project",
      subtitle: "Course credentials: NITHIN KUMAR U · 2102508611",
      category: "Navigation",
      icon: <AnimatedIcon icon={CircleHelp} preset="pop" size={16} />,
      onSelect: () => router.push("/about"),
    },
    {
      id: "pref-theme",
      title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
      subtitle: "Toggle Ink & Haldi / Night ledger",
      category: "Preferences",
      icon: <AnimatedIcon icon={SunMoon} preset="spin" size={16} />,
      onSelect: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    // Personas
    {
      id: "persona-1",
      title: "Load Persona: Priya Sharma",
      subtitle: "Prime salaried home loan · Target: Sanctioned A",
      category: "Personas",
      onSelect: () => router.push("/assess?persona=priya_sharma"),
    },
    {
      id: "persona-2",
      title: "Load Persona: Rajesh Patel",
      subtitle: "Thin-file shop owner · Target: Refer B",
      category: "Personas",
      onSelect: () => router.push("/assess?persona=rajesh_patel"),
    },
    {
      id: "persona-3",
      title: "Load Persona: Vikram Malhotra",
      subtitle: "Over-leveraged corporate manager · Target: Refer C",
      category: "Personas",
      onSelect: () => router.push("/assess?persona=vikram_malhotra"),
    },
    {
      id: "persona-4",
      title: "Load Persona: Ananya Iyer",
      subtitle: "New to credit fresher · Target: Sanctioned B",
      category: "Personas",
      onSelect: () => router.push("/assess?persona=ananya_iyer"),
    },
    {
      id: "persona-5",
      title: "Load Persona: Sunita Verma",
      subtitle: "FOIR knockout candidate · Target: Declined E",
      category: "Personas",
      onSelect: () => router.push("/assess?persona=sunita_verma"),
    },
  ], [router, theme, setTheme]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].onSelect();
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[var(--scrim)]"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="relative w-full max-w-lg bg-[var(--sheet)] border-[1.5px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--edge)] rounded-[2px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search header */}
        <div className="flex items-center px-3 py-2.5 border-b border-[var(--rule)] bg-[var(--sheet)]">
          <Search size={18} className="text-[var(--ink-3)] mr-2 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page, or persona..."
            className="w-full bg-transparent text-sm text-[var(--ink)] placeholder-[var(--ink-3)] outline-none font-medium"
          />
          <kbd className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-[var(--rule-strong)] text-[var(--ink-3)] rounded-[2px] bg-[var(--sheet-2)] shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-1 divide-y divide-[var(--rule)]">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--ink-3)]">
              No matching commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-xs rounded-[1px] ${
                    isSelected
                      ? "bg-[var(--haldi-wash)] text-[var(--ink)] font-semibold"
                      : "text-[var(--ink-2)] hover:bg-[var(--sheet-2)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-[var(--ink)]">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[10px] text-[var(--ink-3)] font-normal truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--ink-3)] shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-3 py-1.5 border-t border-[var(--rule)] bg-[var(--sheet-2)] flex items-center justify-between text-[10px] text-[var(--ink-3)] font-mono">
          <span>Navigate: ↑ ↓ · Select: ↵</span>
          <span>Saakh v1.0</span>
        </div>
      </div>
    </div>
  );
}
