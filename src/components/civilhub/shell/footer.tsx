"use client";

// CivilHub footer — minimal, bottom-anchored, sticky-bottom compliant.

import { BrandCombo } from "../branding/brand";
import { useNav } from "../lib/nav";
import type { ViewId } from "../lib/types";

const FOOTER_LINKS: { label: string; view: ViewId }[] = [
  { label: "Dashboard", view: "dashboard" },
  { label: "GPA Tools", view: "gpa" },
  { label: "Calculators", view: "calculators" },
  { label: "Surveying", view: "surveying" },
  { label: "Resources", view: "resources" },
];

export function Footer() {
  const { go } = useNav();
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <BrandCombo className="text-sm" />
            <p className="text-[11px] text-muted-foreground">
              Precision engineering tools for IOE students in Nepal.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label="Footer">
            {FOOTER_LINKS.map((l) => (
              <button
                key={l.view}
                onClick={() => go(l.view)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-5 pt-4 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} CivilHub. Built for engineers, by engineers.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Guest mode · All tools free · No account required
          </p>
        </div>
      </div>
    </footer>
  );
}
