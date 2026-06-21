"use client";

// CivilHub — Resources view.
// Formula sheets and reference material for civil engineering students.

import { useState } from "react";
import { BookOpen, ChevronRight, ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader, Tag, FormulaBlock } from "../lib/ui";
import { useNav } from "../lib/nav";

type Category = "formulas" | "codes" | "textbooks" | "conversions";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "formulas", label: "Formula Sheets" },
  { id: "codes", label: "Codes & Standards" },
  { id: "textbooks", label: "Textbook References" },
  { id: "conversions", label: "Conversion Tables" },
];

const FORMULA_SHEETS = [
  {
    title: "Structural Analysis",
    items: [
      { label: "BM (simply supported, point load at center)", formula: "M_max = PL/4" },
      { label: "BM (simply supported, UDL)", formula: "M_max = wL²/8" },
      { label: "SF (point load at center)", formula: "V_max = P/2" },
      { label: "Column capacity (IS 456)", formula: "P_u = 0.4·f_ck·A_c + 0.67·f_y·A_sc" },
      { label: "Slab L/D ratio", formula: "t = span / (L/D)_basic" },
    ],
  },
  {
    title: "Hydraulics",
    items: [
      { label: "Continuity", formula: "Q = A·V" },
      { label: "Manning's", formula: "V = (1/n)·R^(2/3)·S^(1/2)" },
      { label: "Rectangular weir", formula: "Q = (2/3)·Cd·b·√(2g)·H^(3/2)" },
      { label: "Bernoulli", formula: "P/γ + V²/2g + z = constant" },
    ],
  },
  {
    title: "Geotechnical",
    items: [
      { label: "Terzaghi bearing", formula: "q_u = c·N_c + q·N_q + 0.5·γ·B·N_γ" },
      { label: "Bearing factors", formula: "N_q = e^(π·tan φ)·tan²(45°+φ/2)" },
      { label: "Void ratio", formula: "e = V_v / V_s" },
      { label: "Degree of saturation", formula: "S = V_w / V_v × 100%" },
    ],
  },
  {
    title: "Surveying",
    items: [
      { label: "Rise/Fall", formula: "Rise = prev_reading − current_reading" },
      { label: "HI method", formula: "RL = HI − (IS or FS)" },
      { label: "HI calculation", formula: "HI = BM_RL + BS" },
      { label: "Included angle", formula: "θ = (B₂ − B₁) mod 360°" },
    ],
  },
  {
    title: "Transportation",
    items: [
      { label: "Stopping sight distance", formula: "SSD = 0.278·V·t + V²/(254·(f±G))" },
      { label: "Superelevation", formula: "e + f = V²/(127·R)" },
      { label: "Traffic flow", formula: "q = k·v" },
      { label: "Greenshields max flow", formula: "q_max = v_f·k_j / 4" },
    ],
  },
];

const CODES = [
  { code: "IS 456:2000", title: "Plain and Reinforced Concrete — Code of Practice", scope: "RCC design" },
  { code: "IS 800:2007", title: "General Construction in Steel — Code of Practice", scope: "Steel design" },
  { code: "IS 875 (Parts 1–5)", title: "Code of Practice for Design Loads", scope: "DL, LL, WL, SL" },
  { code: "IS 1080", title: "Code of Practice for Shallow Foundations", scope: "Foundation design" },
  { code: "IS 2911 (Parts 1–4)", title: "Code of Practice for Design and Construction of Pile Foundations", scope: "Pile design" },
  { code: "IRC 5:1998", title: "Standard Specifications and Code of Practice for Road Bridges", scope: "Bridge design" },
  { code: "IRC 37:2018", title: "Guidelines for the Design of Flexible Pavements", scope: "Pavement design" },
  { code: "IRC 73", title: "Geometric Design Standards for Rural Highways", scope: "Highway geometry" },
];

const TEXTBOOKS = [
  { author: "B.C. Punmia et al.", title: "Reinforced Concrete Structures Vol. I & II", subject: "RCC" },
  { author: "Ramamrutham", title: "Strength of Materials", subject: "SOM" },
  { author: "S.K. Duggal", title: "Building Materials", subject: "Materials" },
  { author: "B.N. Dutta", title: "Estimating and Costing in Civil Engineering", subject: "Estimation" },
  { author: "Punmia, Jain", title: "Soil Mechanics and Foundations", subject: "Geotech" },
  { author: "Modi", title: "Irrigation, Water Resources and Water Power Engineering", subject: "Hydraulics" },
  { author: "Khurmi", title: "Textbook of Civil Engineering", subject: "General" },
  { author: "S.K. Garg", title: "Hydraulics and Fluid Mechanics", subject: "Fluid mechanics" },
];

const CONVERSIONS = [
  { from: "1 m", to: "3.281 ft", category: "Length" },
  { from: "1 m²", to: "10.764 ft²", category: "Area" },
  { from: "1 m³", to: "35.315 ft³", category: "Volume" },
  { from: "1 kg", to: "2.205 lb", category: "Mass" },
  { from: "1 kN", to: "224.81 lbf", category: "Force" },
  { from: "1 MPa", to: "145.04 psi", category: "Pressure" },
  { from: "1 kN/m²", to: "20.885 lbf/ft²", category: "Pressure" },
  { from: "1 t", to: "1000 kg", category: "Mass" },
  { from: "1 acre", to: "4046.86 m²", category: "Area" },
  { from: "1 hectare", to: "10000 m²", category: "Area" },
  { from: "1 bag cement", to: "50 kg = 0.035 m³", category: "Material" },
  { from: "1 cft", to: "0.0283 m³", category: "Volume" },
  { from: "1 ft", to: "0.3048 m", category: "Length" },
  { from: "1 in", to: "25.4 mm", category: "Length" },
];

export function ResourcesView() {
  const [active, setActive] = useState<Category>("formulas");
  const { openCalculator } = useNav();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Resources"
        title="Reference & Formula Sheets"
        description="Quick-reference formula sheets, IS/IRC codes, textbook recommendations, and unit conversion tables — curated for IOE civil engineering coursework."
        meta={<Tag tone="primary">{CATEGORIES.length} sections</Tag>}
      />

      {/* Category tabs */}
      <div className="flex items-center gap-0.5 border-b border-border overflow-x-auto scrollbar-thin">
        {CATEGORIES.map((c) => {
          const isActive = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                "px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        {active === "formulas" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FORMULA_SHEETS.map((sheet) => (
              <div key={sheet.title} className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3">{sheet.title}</h3>
                <div className="space-y-2">
                  {sheet.items.map((item, idx) => (
                    <div key={idx}>
                      <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                      <FormulaBlock>{item.formula}</FormulaBlock>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {active === "codes" && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-3 py-2.5 w-[140px]">Code</th>
                  <th className="text-left font-medium px-3 py-2.5">Title</th>
                  <th className="text-left font-medium px-3 py-2.5 w-[140px]">Scope</th>
                </tr>
              </thead>
              <tbody>
                {CODES.map((c) => (
                  <tr key={c.code} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium text-primary">{c.code}</td>
                    <td className="px-3 py-2.5">{c.title}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{c.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {active === "textbooks" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEXTBOOKS.map((t, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground">{t.author}</div>
                </div>
                <Tag tone="neutral">{t.subject}</Tag>
              </div>
            ))}
          </div>
        )}

        {active === "conversions" && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-3 py-2.5">From</th>
                  <th className="text-left font-medium px-3 py-2.5">To</th>
                  <th className="text-left font-medium px-3 py-2.5 w-[140px]">Category</th>
                </tr>
              </thead>
              <tbody>
                {CONVERSIONS.map((c, idx) => (
                  <tr key={idx} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-mono text-xs">{c.from}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{c.to}</td>
                    <td className="px-3 py-2.5"><Tag tone="neutral">{c.category}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
