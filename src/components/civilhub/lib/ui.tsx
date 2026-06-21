"use client";

// CivilHub — small shared UI primitives tuned for the engineering aesthetic.

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import * as React from "react";

/** Section header — used at the top of every view */
export function SectionHeader({
  eyebrow,
  title,
  description,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 pb-6 border-b border-border">
      <div className="flex items-center justify-between gap-4">
        {eyebrow && (
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-sm md:text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

/** Mono numeric display — like Stripe's stat blocks */
export function StatFigure({
  value,
  unit,
  label,
  hint,
  tone = "default",
}: {
  value: React.ReactNode;
  unit?: string;
  label: string;
  hint?: string;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-[oklch(0.45_0.13_150)]",
    warning: "text-[oklch(0.55_0.15_75)]",
    danger: "text-[oklch(0.5_0.2_27)]",
  }[tone];

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("nums text-2xl md:text-3xl font-semibold tabular-nums", toneClass)}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground font-medium">{unit}</span>
        )}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** A clean "spec row" for showing label/value pairs (like Linear) */
export function SpecRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-foreground", mono && "nums tabular-nums")}>
        {value}
      </span>
    </div>
  );
}

/** Empty-state component — used widely in dashboard, history, etc. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Quiet link-button used for "View all →" type affordances */
export function QuietLink({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-3 w-3" />
    </button>
  );
}

/** Pill for tags / status */
export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-[oklch(0.95_0.05_150)] text-[oklch(0.4_0.13_150)] border-[oklch(0.85_0.08_150)]",
    warning: "bg-[oklch(0.95_0.08_75)] text-[oklch(0.4_0.13_75)] border-[oklch(0.85_0.12_75)]",
    danger: "bg-[oklch(0.95_0.08_27)] text-[oklch(0.45_0.2_27)] border-[oklch(0.85_0.12_27)]",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        tones,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Kbd hint — looks like Linear / Raycast shortcuts */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.25rem] h-[1.25rem] rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

/** Divider with optional label — like Notion callouts */
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-border" />;
  return (
    <div className="flex items-center gap-3">
      <div className="h-px bg-border flex-1" />
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <div className="h-px bg-border flex-1" />
    </div>
  );
}

/** Field label — for forms */
export function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-xs font-medium text-foreground">{children}</label>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** Result row with mono number + label */
export function ResultLine({
  label,
  value,
  unit,
  hint,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2.5 px-3 rounded-md",
        highlight ? "bg-primary/5 border border-primary/15" : "border-b border-border last:border-b-0",
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "nums text-sm font-semibold tabular-nums",
            highlight ? "text-primary" : "text-foreground",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
        {hint && (
          <span className="text-[10px] text-muted-foreground/70 italic">({hint})</span>
        )}
      </span>
    </div>
  );
}

/** Formula display block */
export function FormulaBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-foreground">
      {children}
    </div>
  );
}
