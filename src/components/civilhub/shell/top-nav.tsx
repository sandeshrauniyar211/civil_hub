"use client";

// CivilHub top navigation.
// Linear / Notion / GitHub style — flat, dense, no decoration.

import { useEffect, useState } from "react";
import { Menu, Search, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNav } from "../lib/nav";
import { BrandCombo } from "../branding/brand";
import { Kbd } from "../lib/ui";
import type { ViewId } from "../lib/types";

interface NavItem {
  id: ViewId;
  label: string;
}

const PRIMARY_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "gpa", label: "GPA Tools" },
  { id: "surveying", label: "Surveying" },
  { id: "estimation", label: "Estimation" },
  { id: "calculators", label: "Calculators" },
  { id: "resources", label: "Resources" },
];

export function TopNav({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { state, go } = useNav();
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Scroll listener — apply subtle border when scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Theme init + toggle
  useEffect(() => {
    const saved = (localStorage.getItem("civilhub.theme") as "light" | "dark") || "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("civilhub.theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleNav = (id: ViewId) => {
    go(id);
    setMobileOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 transition-colors",
        scrolled ? "border-b border-border" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <button
            onClick={() => handleNav("dashboard")}
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
            aria-label="CivilHub home"
          >
            <BrandCombo />
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Primary">
            {PRIMARY_NAV.map((item) => {
              const active = state.view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                    active
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right side: search + theme + profile */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSearch}
              className="hidden md:inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted transition-colors w-44 lg:w-56"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search…</span>
              <Kbd>⌘K</Kbd>
            </button>

            <button
              onClick={onOpenSearch}
              className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Profile chip — guest mode */}
            <div
              className="hidden md:flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors cursor-default"
              title="Guest mode — no account required"
            >
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                G
              </div>
              <span className="text-xs text-muted-foreground">Guest</span>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="mx-auto max-w-[1280px] px-4 py-2 flex flex-col" aria-label="Mobile">
            {PRIMARY_NAV.map((item) => {
              const active = state.view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium rounded-md text-left transition-colors",
                    active
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="px-3 py-2 mt-1 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
                  G
                </div>
                <span>Guest mode — all tools free, no account</span>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
