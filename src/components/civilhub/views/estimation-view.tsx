"use client";

// CivilHub — Estimation view (Phase 2)
// Three sub-tools, mirroring the Surveying toolkit's layout:
//   1. Quantity Takeoff — item-wise quantity takeoff from drawings
//   2. BOQ Generator — bill of quantities with rates + adjustments
//   3. Rate Analysis — material/labour/equipment breakdown with templates

import { FolderTree, ClipboardList, PencilRuler, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNav } from "../lib/nav";
import { SectionHeader, Tag } from "../lib/ui";
import { QuantityTakeoff } from "../estimation/quantity-takeoff";
import { BoqGenerator } from "../estimation/boq-generator";
import { RateAnalysisTool } from "../estimation/rate-analysis";

type Tool = "takeoff" | "boq" | "rate";

const TOOLS: { id: Tool; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "takeoff",
    label: "Quantity Takeoff",
    description: "Item-wise quantity from dimensions. Multi-trade. Auto-calculated formulas.",
    icon: <FolderTree className="h-4 w-4" />,
  },
  {
    id: "boq",
    label: "BOQ Generator",
    description: "Nepal-residential template, multi-section BOQ with rates, contingency, overhead, VAT. Export to Excel, CSV, and PDF.",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    id: "rate",
    label: "Rate Analysis",
    description: "Material + labour + equipment breakdown. Pre-built templates for common work types.",
    icon: <PencilRuler className="h-4 w-4" />,
  },
];

export function EstimationView() {
  const { state, go } = useNav();
  const activeTool = (state.sub as Tool) || "takeoff";

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Estimation"
        title="Quantity Estimation & BOQ"
        description="Three connected tools for civil estimation: takeoff quantities from drawings, build a priced BOQ, and analyse rates line-by-line. All saved locally — no account required."
        meta={<Tag tone="primary">3 tools · Excel + PDF · Nepal templates</Tag>}
      />

      {/* Tool selector — horizontal scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {TOOLS.map((t) => {
          const active = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => go("estimation", { sub: t.id })}
              className={cn(
                "flex items-start gap-2.5 p-3 rounded-lg border text-left min-w-[240px] shrink-0 transition-all",
                active
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
              )}
            >
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md border shrink-0",
                active ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground",
              )}>
                {t.icon}
              </div>
              <div className="min-w-0">
                <div className={cn("text-sm font-medium", active ? "text-foreground" : "text-foreground")}>{t.label}</div>
                <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{t.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        {activeTool === "takeoff" && <QuantityTakeoff />}
        {activeTool === "boq" && <BoqGenerator />}
        {activeTool === "rate" && <RateAnalysisTool />}
      </div>

      {/* Workflow guide */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Suggested workflow
        </h3>
        <ol className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[10px] font-semibold text-foreground nums tabular-nums mt-0.5">1</span>
            <span>
              <strong className="text-foreground">Quantity Takeoff</strong> — measure each item from the drawing (L×W×H×N or other formula). Group by trade. Save the project.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[10px] font-semibold text-foreground nums tabular-nums mt-0.5">2</span>
            <span>
              <strong className="text-foreground">Rate Analysis</strong> — for every priced item, build a rate-per-unit breakdown (materials + labour + equipment). Start from a template and tweak. Save it.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[10px] font-semibold text-foreground nums tabular-nums mt-0.5">3</span>
            <span>
              <strong className="text-foreground">BOQ Generator</strong> — start from the <em>Nepal Residential</em> template (or paste quantities from step 1 and rates from step 2). Add contingency, overhead, VAT → grand total. Export to Excel, CSV, or print-ready PDF.
            </span>
          </li>
        </ol>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          <span>Each tool saves to your browser's localStorage — your data never leaves your device.</span>
        </div>
      </div>
    </div>
  );
}
