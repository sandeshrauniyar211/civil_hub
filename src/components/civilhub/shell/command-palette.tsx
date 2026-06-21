"use client";

// CivilHub command palette — Ctrl/Cmd + K global search.
// Linear / Raycast style — keyboard-first, instant filtering.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Calculator,
  Compass,
  GraduationCap,
  BookOpen,
  FolderTree,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNav } from "../lib/nav";
import { CALCULATORS, CATEGORY_LABELS } from "../lib/registry";
import type { CalculatorId, ViewId } from "../lib/types";

interface SearchItem {
  id: string;
  label: string;
  description?: string;
  group: string;
  icon: React.ReactNode;
  keywords?: string[];
  action: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { go, openCalculator } = useNav();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Build search index
  const items = useMemo<SearchItem[]>(() => {
    const navItems: SearchItem[] = [
      {
        id: "nav-dashboard",
        label: "Dashboard",
        description: "Your CGPA, recent calculations, and saved semesters",
        group: "Navigation",
        icon: <LayoutDashboard className="h-4 w-4" />,
        action: () => go("dashboard"),
      },
      {
        id: "nav-gpa",
        label: "GPA Tools",
        description: "IOE Internal Marks Calculator and semester management",
        group: "Navigation",
        icon: <GraduationCap className="h-4 w-4" />,
        action: () => go("gpa"),
      },
      {
        id: "nav-surveying",
        label: "Surveying",
        description: "Rise & Fall, HI Method, RL, Bearing calculations",
        group: "Navigation",
        icon: <Compass className="h-4 w-4" />,
        action: () => go("surveying"),
      },
      {
        id: "nav-estimation",
        label: "Estimation",
        description: "Quantity estimation and BOQ tools",
        group: "Navigation",
        icon: <FolderTree className="h-4 w-4" />,
        action: () => go("estimation"),
      },
      {
        id: "nav-calculators",
        label: "Calculators",
        description: "Browse all engineering calculators",
        group: "Navigation",
        icon: <Calculator className="h-4 w-4" />,
        action: () => go("calculators"),
      },
      {
        id: "nav-resources",
        label: "Resources",
        description: "Formula sheets and reference material",
        group: "Navigation",
        icon: <BookOpen className="h-4 w-4" />,
        action: () => go("resources"),
      },
    ];

    const calcItems: SearchItem[] = CALCULATORS.map((c) => ({
      id: `calc-${c.id}`,
      label: c.name,
      description: `${CATEGORY_LABELS[c.category]} — ${c.description}`,
      group: "Calculators",
      icon: <Calculator className="h-4 w-4" />,
      keywords: [c.category, ...(c.keywords ?? [])],
      action: () => openCalculator(c.id as CalculatorId),
    }));

    return [...navItems, ...calcItems];
  }, [go, openCalculator]);

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = [
        it.label,
        it.description ?? "",
        it.group,
        ...(it.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  // Group filtered items
  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    for (const it of filtered) {
      const list = map.get(it.group) ?? [];
      list.push(it);
      map.set(it.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Reset active index when query changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setActiveIndex(0), [query]);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) {
        item.action();
        onOpenChange(false);
      }
    }
  };

  // Scroll active into view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-popover shadow-soft-md overflow-hidden animate-fade-in">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search calculators, tools, formulas…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto scrollbar-thin p-1.5"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No matches for <span className="text-foreground">"{query}"</span>
            </div>
          ) : (
            grouped.map(([group, list]) => (
              <div key={group} className="mb-2 last:mb-0">
                <div className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {group}
                </div>
                {list.map((it) => {
                  const idx = filtered.indexOf(it);
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={it.id}
                      data-idx={idx}
                      onClick={() => {
                        it.action();
                        onOpenChange(false);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-colors",
                        active ? "bg-muted" : "hover:bg-muted/60",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md border shrink-0",
                          active
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {it.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {it.label}
                        </div>
                        {it.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {it.description}
                          </div>
                        )}
                      </div>
                      {active && (
                        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              open
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}
