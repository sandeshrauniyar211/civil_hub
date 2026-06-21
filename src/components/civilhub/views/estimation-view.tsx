"use client";

// CivilHub — Estimation view (Phase 2 placeholder + a couple of useful BOQ-style helpers)
// Per PRD: Phase 2 modules include Quantity Estimation, BOQ Generator, Cost Estimator.

import { useState } from "react";
import { Construction, ArrowRight, FolderTree, FileText } from "lucide-react";
import { useNav } from "../lib/nav";
import { SectionHeader, EmptyState, Tag } from "../lib/ui";
import { Button } from "@/components/ui/button";

export function EstimationView() {
  const { go, openCalculator } = useNav();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Estimation"
        title="Quantity Estimation & BOQ"
        description="Phase 2 modules — quantity estimation, BOQ generator, and cost estimator are being designed. The related calculators are already live in the Calculators suite."
        meta={<Tag tone="warning">Phase 2 — In progress</Tag>}
      />

      {/* Phase 2 modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: "Quantity Estimation", desc: "Item-wise quantity takeoff from drawings, organized by trade.", icon: <FolderTree className="h-4 w-4" /> },
          { title: "BOQ Generator", desc: "Bill of Quantities with abstract, rate analysis, and PDF export.", icon: <FileText className="h-4 w-4" /> },
          { title: "Cost Estimator", desc: "Rate analysis with material, labour, and equipment breakdown.", icon: <Construction className="h-4 w-4" /> },
        ].map((m) => (
          <div key={m.title} className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground mb-3">
              {m.icon}
            </div>
            <h3 className="text-sm font-semibold mb-1">{m.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
            <div className="mt-3">
              <Tag tone="warning">Coming soon</Tag>
            </div>
          </div>
        ))}
      </div>

      {/* Live related tools */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-1">Live estimation tools</h3>
        <p className="text-xs text-muted-foreground mb-4">
          These calculators are already available and feed into the future BOQ module.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { id: "concrete-volume" as const, label: "Concrete Volume", desc: "Member-wise pour volumes" },
            { id: "brickwork" as const, label: "Brickwork Estimator", desc: "Brick + mortar quantities" },
            { id: "cement-sand-aggregate" as const, label: "Cement, Sand, Aggregate", desc: "Per mix grade" },
            { id: "plaster" as const, label: "Plaster Quantity", desc: "Cement + sand per area" },
            { id: "tile" as const, label: "Tile Quantity", desc: "Tile count + waste" },
            { id: "steel-quantity" as const, label: "Steel Quantity", desc: "Rebar weight per diameter" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => openCalculator(t.id)}
              className="group flex items-start gap-3 p-3 rounded-md border border-border bg-background hover:border-foreground/20 hover:bg-muted/30 transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => go("calculators")}>
            Browse all calculators
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
