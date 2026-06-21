"use client";

// CivilHub — Rate Analysis tool (Phase 2 estimation)
// Material + labour + equipment breakdown per unit of work.
// Predefined templates (brickwork, RCC, plaster, etc.) with editable lines.
// Save analyses to localStorage. Excel export.

import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  FolderOpen,
  FileDown,
  FileSpreadsheet,
  Copy,
  Pencil,
  Wrench,
  HardHat,
  Package,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FieldLabel, Tag, ResultLine, Divider, EmptyState } from "../lib/ui";
import { downloadXLSX } from "../lib/excel";
import { ProcessPanel, type ProcessStep } from "../lib/process-panel";
import { fmt, round, uid, type RateAnalysis, type RateLine } from "../lib/estimation-types";
import {
  getRateAnalyses,
  saveRateAnalysis,
  deleteRateAnalysis,
  useEstimationStore,
} from "../lib/estimation-store";

// ============================================================
// Templates — typical Nepal rates (NPR), editable after load.
// ============================================================

interface RateTemplate {
  id: string;
  name: string;
  unit: string;
  analysisQuantity: number;
  materials: RateLine[];
  labour: RateLine[];
  equipment: RateLine[];
}

function line(description: string, quantity: number, unit: string, rate: number): RateLine {
  return { id: uid("ln"), description, quantity, unit, rate };
}

export const RATE_TEMPLATES: RateTemplate[] = [
  {
    id: "tpl-brickwork-1-6",
    name: "Brickwork in 1:6 cement mortar",
    unit: "per m³",
    analysisQuantity: 1,
    materials: [
      line("Bricks (class A, 230×110×70 mm)", 500, "nos", 12),
      line("Cement (OPC 53)", 1.3, "bag", 1000),
      line("Sand (fine)", 0.3, "m³", 2200),
    ],
    labour: [
      line("Mason (1st class)", 0.94, "day", 1500),
      line("Mason (2nd class)", 0.94, "day", 1100),
      line("Helper", 1.4, "day", 900),
    ],
    equipment: [
      line("Mortar mixer", 0.5, "hour", 350),
    ],
  },
  {
    id: "tpl-rcc-m20",
    name: "RCC M20 (1:1.5:3) in structural members",
    unit: "per m³",
    analysisQuantity: 1,
    materials: [
      line("Cement (OPC 53)", 7.0, "bag", 1000),
      line("Sand (fine)", 0.42, "m³", 2200),
      line("Coarse aggregate 20mm", 0.84, "m³", 1700),
      line("Reinforcement steel (TMT)", 80, "kg", 110),
    ],
    labour: [
      line("Mason", 0.5, "day", 1500),
      line("Helper", 1.0, "day", 900),
    ],
    equipment: [
      line("Concrete mixer", 0.8, "hour", 500),
      line("Needle vibrator", 0.5, "hour", 300),
    ],
  },
  {
    id: "tpl-pcc-1-4-8",
    name: "PCC 1:4:8 in foundation",
    unit: "per m³",
    analysisQuantity: 1,
    materials: [
      line("Cement (OPC 53)", 3.4, "bag", 1000),
      line("Sand (fine)", 0.47, "m³", 2200),
      line("Coarse aggregate 40mm", 0.94, "m³", 1700),
    ],
    labour: [
      line("Mason", 0.3, "day", 1500),
      line("Helper", 0.6, "day", 900),
    ],
    equipment: [
      line("Concrete mixer", 0.6, "hour", 500),
    ],
  },
  {
    id: "tpl-plaster-12mm",
    name: "Plaster 12mm thick in 1:4 CM",
    unit: "per 10 m²",
    analysisQuantity: 10,
    materials: [
      line("Cement (OPC 53)", 1.3, "bag", 1000),
      line("Sand (fine)", 0.13, "m³", 2200),
    ],
    labour: [
      line("Mason", 1.0, "day", 1500),
      line("Helper", 1.2, "day", 900),
    ],
    equipment: [],
  },
  {
    id: "tile-flooring",
    name: "Vitrified tile flooring 600×600mm",
    unit: "per 10 m²",
    analysisQuantity: 10,
    materials: [
      line("Vitrified tiles 600×600", 11, "m²", 1200),
      line("Cement (OPC 53)", 1.5, "bag", 1000),
      line("Sand (fine)", 0.15, "m³", 2200),
      line("Tile adhesive", 5, "kg", 80),
    ],
    labour: [
      line("Tile mason", 1.5, "day", 1800),
      line("Helper", 1.0, "day", 900),
    ],
    equipment: [
      line("Tile cutter", 0.5, "hour", 200),
    ],
  },
  {
    id: "painting-acrylic",
    name: "Acrylic emulsion paint (2 coats)",
    unit: "per 10 m²",
    analysisQuantity: 10,
    materials: [
      line("Acrylic emulsion paint", 1.5, "L", 450),
      line("Primer", 0.5, "L", 350),
      line("Putty", 2.0, "kg", 60),
    ],
    labour: [
      line("Painter", 1.0, "day", 1300),
      line("Helper", 0.5, "day", 900),
    ],
    equipment: [],
  },
];

function fromTemplate(tpl: RateTemplate): RateAnalysis {
  return {
    id: uid("ra"),
    workType: tpl.name,
    unit: tpl.unit,
    analysisQuantity: tpl.analysisQuantity,
    materials: tpl.materials.map((l) => ({ ...l, id: uid("ln") })),
    labour: tpl.labour.map((l) => ({ ...l, id: uid("ln") })),
    equipment: tpl.equipment.map((l) => ({ ...l, id: uid("ln") })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function emptyAnalysis(): RateAnalysis {
  return fromTemplate(RATE_TEMPLATES[0]);
}

export function RateAnalysisTool() {
  const { toast } = useToast();
  const [saved] = useEstimationStore(getRateAnalyses, []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RateAnalysis>(emptyAnalysis());
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  useEffect(() => {
    if (!activeId) return;
    const found = saved.find((r) => r.id === activeId);
    if (found) setAnalysis(found);
  }, [activeId, saved]);

  // Compute totals
  const computed = useMemo(() => {
    const matLines = analysis.materials.map((l) => ({ ...l, amount: l.quantity * l.rate }));
    const labLines = analysis.labour.map((l) => ({ ...l, amount: l.quantity * l.rate }));
    const eqpLines = analysis.equipment.map((l) => ({ ...l, amount: l.quantity * l.rate }));
    const matTotal = matLines.reduce((s, l) => s + l.amount, 0);
    const labTotal = labLines.reduce((s, l) => s + l.amount, 0);
    const eqpTotal = eqpLines.reduce((s, l) => s + l.amount, 0);
    const grand = matTotal + labTotal + eqpTotal;
    const perUnit = analysis.analysisQuantity > 0 ? grand / analysis.analysisQuantity : 0;
    return { matLines, labLines, eqpLines, matTotal, labTotal, eqpTotal, grand, perUnit };
  }, [analysis]);

  const update = (patch: Partial<RateAnalysis>) => setAnalysis((prev) => ({ ...prev, ...patch }));

  const updateLine = (group: "materials" | "labour" | "equipment", id: string, patch: Partial<RateLine>) => {
    setAnalysis((prev) => ({
      ...prev,
      [group]: prev[group].map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const addLine = (group: "materials" | "labour" | "equipment") => {
    setAnalysis((prev) => ({
      ...prev,
      [group]: [...prev[group], line("", 0, "", 0)],
    }));
  };

  const duplicateLine = (group: "materials" | "labour" | "equipment", id: string) => {
    setAnalysis((prev) => ({
      ...prev,
      [group]: (() => {
        const idx = prev[group].findIndex((l) => l.id === id);
        if (idx < 0) return prev[group];
        const copy = { ...prev[group][idx], id: uid("ln") };
        const next = [...prev[group]];
        next.splice(idx + 1, 0, copy);
        return next;
      })(),
    }));
  };

  const removeLine = (group: "materials" | "labour" | "equipment", id: string) => {
    setAnalysis((prev) => ({
      ...prev,
      [group]: prev[group].length <= 1 ? prev[group] : prev[group].filter((l) => l.id !== id),
    }));
  };

  // ---- Save / Load ----
  const handleSave = () => {
    if (!analysis.workType.trim()) {
      toast({ title: "Work type required", variant: "destructive" });
      return;
    }
    const toSave = { ...analysis, updatedAt: Date.now() };
    saveRateAnalysis(toSave);
    setActiveId(toSave.id);
    toast({ title: "Saved", description: `Rate analysis for "${toSave.workType}" saved.` });
  };

  const handleNew = () => {
    setActiveId(null);
    setShowTemplatePicker(true);
  };

  const handleDelete = (id: string) => {
    deleteRateAnalysis(id);
    if (activeId === id) {
      setActiveId(null);
      setAnalysis(emptyAnalysis());
    }
    toast({ title: "Analysis deleted" });
  };

  const handleApplyTemplate = (tpl: RateTemplate) => {
    setAnalysis(fromTemplate(tpl));
    setActiveId(null);
    setShowTemplatePicker(false);
  };

  const handleExportXLSX = () => {
    const header: (string | number)[][] = [
      ["Rate Analysis"],
      ["Work:", analysis.workType, "", "Basis:", `${analysis.analysisQuantity} ${analysis.unit.replace("per ", "")}`],
      [],
      ["Group", "Description", "Quantity", "Unit", "Rate", "Amount"],
    ];
    const body: (string | number)[][] = [];
    for (const l of computed.matLines) body.push(["Material", l.description, l.quantity, l.unit, l.rate, +round(l.amount, 2).toFixed(2)]);
    body.push(["", "Subtotal — Materials", "", "", "", +round(computed.matTotal, 2).toFixed(2)]);
    body.push([]);
    for (const l of computed.labLines) body.push(["Labour", l.description, l.quantity, l.unit, l.rate, +round(l.amount, 2).toFixed(2)]);
    body.push(["", "Subtotal — Labour", "", "", "", +round(computed.labTotal, 2).toFixed(2)]);
    body.push([]);
    for (const l of computed.eqpLines) body.push(["Equipment", l.description, l.quantity, l.unit, l.rate, +round(l.amount, 2).toFixed(2)]);
    body.push(["", "Subtotal — Equipment", "", "", "", +round(computed.eqpTotal, 2).toFixed(2)]);
    body.push([]);
    body.push(["", "TOTAL", "", "", "", +round(computed.grand, 2).toFixed(2)]);
    body.push(["", `Rate per ${analysis.unit.replace("per ", "")}`, "", "", "", +round(computed.perUnit, 2).toFixed(2)]);

    downloadXLSX(`rate-analysis-${analysis.workType.replace(/\s+/g, "-").toLowerCase()}.xlsx`, [...header, ...body], "Rate Analysis");
    toast({ title: "Exported", description: "Rate analysis saved as XLSX." });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-[200px]">
            <FieldLabel hint="Work type / item">Work</FieldLabel>
            <Input
              value={analysis.workType}
              onChange={(e) => update({ workType: e.target.value })}
              className="h-9"
              placeholder="e.g. Brickwork in 1:6 CM"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleNew}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowTemplatePicker(true)}>
              <Calculator className="h-3.5 w-3.5 mr-1" />
              Templates
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportXLSX}>
              <FileDown className="h-3 w-3 mr-1.5" />
              XLSX
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <FieldLabel hint="e.g. per m³, per 10 m²">Basis unit</FieldLabel>
            <Input
              value={analysis.unit}
              onChange={(e) => update({ unit: e.target.value })}
              className="h-9"
            />
          </div>
          <div>
            <FieldLabel hint="Quantity basis">Analysis quantity</FieldLabel>
            <Input
              type="number"
              step={0.001}
              value={analysis.analysisQuantity}
              onChange={(e) => update({ analysisQuantity: Number(e.target.value) })}
              className="h-9"
            />
          </div>
          <div className="flex flex-col justify-end">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Rate per unit</div>
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-lg font-semibold nums tabular-nums text-primary">
              {fmt(computed.perUnit, 2)}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">/ {analysis.unit.replace("per ", "")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Template picker */}
      {showTemplatePicker && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Pick a template</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Pre-built analyses with Nepal-typical rates. Editable after load.</p>
            </div>
            <button
              onClick={() => setShowTemplatePicker(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {RATE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleApplyTemplate(tpl)}
                className="group text-left rounded-md border border-border bg-background p-3 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-start gap-2 mb-1">
                  <Calculator className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground leading-tight">{tpl.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {tpl.materials.length + tpl.labour.length + tpl.equipment.length} lines · {tpl.unit}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Saved analyses */}
      {saved.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Saved analyses</h3>
            <Tag tone="neutral">{saved.length}</Tag>
          </div>
          <div className="space-y-1">
            {saved.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 px-2 py-1.5 rounded-md",
                  activeId === r.id ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50",
                )}
              >
                <button
                  onClick={() => setActiveId(r.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.workType}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.materials.length + r.labour.length + r.equipment.length} lines · {new Date(r.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] text-xs px-1.5"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Material / Labour / Equipment tables */}
      <LineTable
        title="Materials"
        icon={<Package className="h-3.5 w-3.5" />}
        lines={computed.matLines}
        onAdd={() => addLine("materials")}
        onUpdate={(id, patch) => updateLine("materials", id, patch)}
        onDuplicate={(id) => duplicateLine("materials", id)}
        onRemove={(id) => removeLine("materials", id)}
        subtotal={computed.matTotal}
      />
      <LineTable
        title="Labour"
        icon={<HardHat className="h-3.5 w-3.5" />}
        lines={computed.labLines}
        onAdd={() => addLine("labour")}
        onUpdate={(id, patch) => updateLine("labour", id, patch)}
        onDuplicate={(id) => duplicateLine("labour", id)}
        onRemove={(id) => removeLine("labour", id)}
        subtotal={computed.labTotal}
      />
      <LineTable
        title="Equipment & Tools"
        icon={<Wrench className="h-3.5 w-3.5" />}
        lines={computed.eqpLines}
        onAdd={() => addLine("equipment")}
        onUpdate={(id, patch) => updateLine("equipment", id, patch)}
        onDuplicate={(id) => duplicateLine("equipment", id)}
        onRemove={(id) => removeLine("equipment", id)}
        subtotal={computed.eqpTotal}
        allowEmpty
      />

      {/* Process panel — how the per-unit rate is built up */}
      <ProcessPanel
        intro={
          <>
            Rate analysis builds up a <strong>per-unit rate</strong> by summing everything spent on{" "}
            <strong>materials</strong>, <strong>labour</strong>, and <strong>equipment</strong> for a
            chosen basis quantity (e.g. <em>1 m³</em> or <em>10 m²</em>), then dividing the grand
            total by that basis quantity. The numbers below are live — they update with your edits
            above.
          </>
        }
        steps={(() => {
          const basisUnit = analysis.unit.replace("per ", "");
          const steps: ProcessStep[] = [];

          steps.push({
            title: "Sum the materials — quantity × rate, line by line",
            formula:
              computed.matLines
                .map(
                  (l) =>
                    `${l.description || "(line)"}: ${round(l.quantity, 3)} × ${round(l.rate, 2)} = ${round(l.amount, 2)}`,
                )
                .join("   +   ") || "No material lines",
            result: `Materials subtotal = ${fmt(computed.matTotal, 2)}`,
            note: "Each material line is its quantity consumed for the basis quantity, multiplied by its unit rate.",
          });

          steps.push({
            title: "Sum the labour and equipment the same way",
            formula:
              `Labour: ${computed.labLines.map((l) => `${round(l.quantity, 3)} × ${round(l.rate, 2)}`).join(" + ") || "0"} = ${fmt(computed.labTotal, 2)}    ` +
              `Equipment: ${computed.eqpLines.map((l) => `${round(l.quantity, 3)} × ${round(l.rate, 2)}`).join(" + ") || "0"} = ${fmt(computed.eqpTotal, 2)}`,
            result: `Labour + Equipment = ${fmt(computed.labTotal + computed.eqpTotal, 2)}`,
            note: "Labour and equipment are billed per day / per hour consumed for the basis quantity — not for the whole project.",
          });

          steps.push({
            title: "Add the three subtotals → grand total for the basis quantity",
            formula: `${fmt(computed.matTotal, 2)} (mat) + ${fmt(computed.labTotal, 2)} (lab) + ${fmt(computed.eqpTotal, 2)} (eqp) = ${fmt(computed.grand, 2)}`,
            result: `Grand total for ${analysis.analysisQuantity} ${basisUnit} = ${fmt(computed.grand, 2)}`,
            note: "This is the cost of producing the basis quantity — e.g. casting 1 m³ of M20 concrete or plastering 10 m² of wall.",
          });

          steps.push({
            title: "Divide by the basis quantity → rate per unit",
            formula: `${fmt(computed.grand, 2)} ÷ ${analysis.analysisQuantity} ${basisUnit} = ${fmt(computed.perUnit, 2)} per ${basisUnit}`,
            result: `Rate per ${basisUnit} = ${fmt(computed.perUnit, 2)}`,
            note: "This is the number that goes into the BOQ as the unit rate for this item. If the basis quantity is 10 m², dividing by 10 gives the rate per m².",
          });

          steps.push({
            title: "Sanity check — what's the biggest cost driver?",
            formula:
              `Materials share = ${fmt((computed.matTotal / Math.max(1, computed.grand)) * 100, 1)}%   ` +
              `Labour share = ${fmt((computed.labTotal / Math.max(1, computed.grand)) * 100, 1)}%   ` +
              `Equipment share = ${fmt((computed.eqpTotal / Math.max(1, computed.grand)) * 100, 1)}%`,
            note: "For RCC, materials (cement + aggregate + steel) usually dominate. For plaster, labour is a larger share. If a share looks off, double-check the rate or quantity you entered.",
          });

          return steps;
        })()}
      />

      {/* Grand total */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Rate summary</h3>
        <div className="space-y-1">
          <ResultLine label="Materials total" value={fmt(computed.matTotal, 2)} />
          <ResultLine label="Labour total" value={fmt(computed.labTotal, 2)} />
          <ResultLine label="Equipment total" value={fmt(computed.eqpTotal, 2)} />
          <Divider />
          <ResultLine
            label={`Total for ${analysis.analysisQuantity} ${analysis.unit.replace("per ", "")}`}
            value={fmt(computed.grand, 2)}
          />
          <ResultLine
            label={`Rate per ${analysis.unit.replace("per ", "")}`}
            value={fmt(computed.perUnit, 2)}
            highlight
          />
        </div>
      </div>
    </div>
  );
}

// ============ Line table ============

function LineTable({
  title,
  icon,
  lines,
  onAdd,
  onUpdate,
  onDuplicate,
  onRemove,
  subtotal,
  allowEmpty = false,
}: {
  title: string;
  icon: React.ReactNode;
  lines: (RateLine & { amount: number })[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<RateLine>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  subtotal: number;
  allowEmpty?: boolean;
}) {
  if (!allowEmpty && lines.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          {icon}
        </div>
        <h3 className="text-sm font-semibold flex-1">{title}</h3>
        <Tag tone="neutral">{lines.length}</Tag>
        <span className="text-sm font-semibold nums tabular-nums min-w-[100px] text-right">{fmt(subtotal, 2)}</span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/20 text-[11px] text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-1.5 min-w-[280px]">Description</th>
              <th className="text-right font-medium px-2 py-1.5 w-24">Quantity</th>
              <th className="text-left font-medium px-2 py-1.5 w-20">Unit</th>
              <th className="text-right font-medium px-2 py-1.5 w-28">Rate</th>
              <th className="text-right font-medium px-2 py-1.5 w-28">Amount</th>
              <th className="w-16 px-1 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-muted/20 align-top">
                <td className="px-2 py-1.5">
                  <input
                    value={l.description}
                    onChange={(e) => onUpdate(l.id, { description: e.target.value })}
                    placeholder="e.g. Cement (OPC 53)"
                    className="w-full bg-transparent text-sm outline-none rounded px-1.5 py-0.5 hover:bg-muted/60 focus:bg-muted"
                  />
                </td>
                <td className="px-1 py-1.5">
                  <NumCell value={l.quantity} onChange={(v) => onUpdate(l.id, { quantity: v })} />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={l.unit}
                    onChange={(e) => onUpdate(l.id, { unit: e.target.value })}
                    className="w-full h-7 bg-transparent text-sm outline-none rounded px-1.5 hover:bg-muted/60 focus:bg-muted"
                  />
                </td>
                <td className="px-1 py-1.5">
                  <NumCell value={l.rate} onChange={(v) => onUpdate(l.id, { rate: v })} />
                </td>
                <td className="px-2 py-1.5 text-right nums tabular-nums font-medium">
                  {fmt(l.amount, 2)}
                </td>
                <td className="px-1 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onDuplicate(l.id)}
                      className="text-muted-foreground hover:text-foreground p-1"
                      aria-label="Duplicate"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onRemove(l.id)}
                      disabled={!allowEmpty && lines.length <= 1}
                      className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] disabled:opacity-30 p-1"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Plus className="h-4 w-4" />}
                    title="No lines yet"
                    description="Add a line item below."
                  />
                </td>
              </tr>
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot className="bg-muted/30 text-xs font-medium border-t border-border">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right text-muted-foreground">
                  Subtotal — {title}
                </td>
                <td className="px-2 py-2 text-right nums tabular-nums font-semibold text-primary">
                  {fmt(subtotal, 2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="px-3 py-2 border-t border-border">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onAdd}>
          <Plus className="h-3 w-3 mr-1" />
          Add line
        </Button>
      </div>
    </div>
  );
}

// ============ Small numeric input cell ============

function NumCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      step={0.001}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 h-7 text-right bg-transparent text-sm outline-none rounded px-1.5 nums tabular-nums hover:bg-muted/60 focus:bg-muted focus:ring-1 focus:ring-ring"
    />
  );
}
