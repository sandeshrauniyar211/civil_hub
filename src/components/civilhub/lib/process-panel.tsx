"use client";

// CivilHub — Surveying step-by-step process panel.
// Shows how a calculation is performed, with live numbers from the user's
// actual inputs so the panel doubles as a worked example.

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Lightbulb } from "lucide-react";

export interface ProcessStep {
  /** short title for the step (e.g., "Compute HI") */
  title: string;
  /** formula in plain text, with live values substituted */
  formula: string;
  /** optional explanation of why this step matters */
  note?: string;
  /** optional result of the step (highlighted) */
  result?: string;
}

/**
 * Collapsible step-by-step process panel used across the surveying toolkit.
 * The user can show/hide it via a toggle; when expanded, each step renders
 * with its formula and result.
 */
export function ProcessPanel({
  steps,
  intro,
  defaultOpen = false,
}: {
  steps: ProcessStep[];
  intro?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Lightbulb className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold">How this is calculated</div>
            <div className="text-[11px] text-muted-foreground">
              {open ? "Tap to hide the worked steps" : "Tap to see step-by-step working with your values"}
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border p-4 animate-fade-in">
          {intro && (
            <div className="mb-4 text-xs text-muted-foreground leading-relaxed">
              {intro}
            </div>
          )}
          <ol className="space-y-3">
            {steps.map((s, idx) => (
              <li key={idx} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground nums tabular-nums">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="text-sm font-medium text-foreground">{s.title}</div>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-[12px] text-foreground break-words">
                    {s.formula}
                  </div>
                  {s.result && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">→ Result:</span>
                      <span className="font-semibold text-primary nums tabular-nums">{s.result}</span>
                    </div>
                  )}
                  {s.note && (
                    <div className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
                      {s.note}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/**
 * Compact summary card — used at the top of surveying tools when a file has
 * just been imported to confirm what was parsed.
 */
export function ImportSummary({
  fileName,
  rowCount,
  detectedColumns,
  onClear,
}: {
  fileName: string;
  rowCount: number;
  detectedColumns: { label: string; matched: string | undefined }[];
  onClear: () => void;
}) {
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground truncate">{fileName}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground nums tabular-nums">{rowCount} rows imported</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detectedColumns.map((c) => (
              <span
                key={c.label}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                  c.matched
                    ? "border-[oklch(0.85_0.08_150)] bg-[oklch(0.95_0.05_150)] text-[oklch(0.4_0.13_150)]"
                    : "border-border bg-muted/40 text-muted-foreground",
                )}
              >
                {c.label}: {c.matched ?? "auto"}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Remove file
        </button>
      </div>
    </div>
  );
}
