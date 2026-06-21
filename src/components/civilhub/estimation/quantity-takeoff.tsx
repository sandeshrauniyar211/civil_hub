"use client";

// CivilHub — Quantity Takeoff tool (Phase 2 estimation)
// Multi-trade item entry. Quantity is auto-computed from dimensions + formula.
// Save projects to localStorage. Excel import/export.

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FieldLabel, Tag, ResultLine, Divider, EmptyState } from "../lib/ui";
import { ExcelUploadButton, TemplateDownloadButton } from "../lib/excel-upload-button";
import { downloadCSV, downloadXLSX, matchColumn, toNum, toStr, type ParsedSheet } from "../lib/excel";
import { ProcessPanel, type ProcessStep } from "../lib/process-panel";
import {
  computeQty,
  fmt,
  round,
  uid,
  TRADE_LABELS,
  TRADE_UNITS,
  FORMULA_LABELS,
  type TakeoffItem,
  type TakeoffProject,
  type TradeId,
  type QtyFormula,
  type QtyUnit,
} from "../lib/estimation-types";
import {
  getTakeoffProjects,
  saveTakeoffProject,
  deleteTakeoffProject,
  useEstimationStore,
} from "../lib/estimation-store";

const ALL_TRADES = Object.keys(TRADE_LABELS) as TradeId[];
const ALL_FORMULAS: QtyFormula[] = ["L×W×H×N", "L×W×N", "L×N", "π/4×d²×h×N", "N"];
const ALL_UNITS: QtyUnit[] = ["m³", "m²", "m", "nos", "kg", "tonne", "bag", "L"];

function emptyItem(trade: TradeId = "concrete"): TakeoffItem {
  return {
    id: uid("it"),
    trade,
    description: "",
    length: 0,
    width: 0,
    height: 0,
    count: 1,
    formula: "L×W×H×N",
    unit: TRADE_UNITS[trade],
    remarks: "",
  };
}

export function QuantityTakeoff() {
  const { toast } = useToast();
  const [projects] = useEstimationStore(getTakeoffProjects, []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("Untitled project");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<TakeoffItem[]>([emptyItem("earthwork"), emptyItem("concrete")]);
  const [importedFile, setImportedFile] = useState<string | null>(null);

  // Load active project when it changes
  useEffect(() => {
    if (!activeId) return;
    const p = projects.find((x) => x.id === activeId);
    if (p) {
      setName(p.name);
      setDescription(p.description);
      setItems(p.items.length ? p.items : [emptyItem()]);
    }
  }, [activeId, projects]);

  const computed = useMemo(
    () => items.map((it) => ({ ...it, qty: computeQty(it) })),
    [items],
  );

  // Totals by trade
  const byTrade = useMemo(() => {
    const map = new Map<TradeId, { qty: number; unit: QtyUnit; count: number }>();
    for (const c of computed) {
      const existing = map.get(c.trade) ?? { qty: 0, unit: c.unit, count: 0 };
      if (existing.unit === c.unit) {
        existing.qty += c.qty;
      } else {
        existing.unit = c.unit;
      }
      existing.count += 1;
      map.set(c.trade, existing);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [computed]);

  const totalItems = computed.length;

  const updateItem = (id: string, patch: Partial<TakeoffItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addItem = (trade: TradeId = "concrete") => {
    setItems((prev) => [...prev, emptyItem(trade)]);
  };

  const duplicateItem = (id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx < 0) return prev;
      const copy = { ...prev[idx], id: uid("it") };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.id !== id)));
  };

  // ---- Save / Load ----
  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Project needs a name", variant: "destructive" });
      return;
    }
    const project: TakeoffProject = {
      id: activeId ?? uid("prj"),
      name: name.trim(),
      description,
      items: computed.map(({ qty: _qty, ...rest }) => rest),
      createdAt: activeId ? projects.find((p) => p.id === activeId)?.createdAt ?? Date.now() : Date.now(),
      updatedAt: Date.now(),
    };
    saveTakeoffProject(project);
    setActiveId(project.id);
    toast({ title: "Saved", description: `Project "${project.name}" saved locally.` });
  };

  const handleNew = () => {
    setActiveId(null);
    setName("Untitled project");
    setDescription("");
    setItems([emptyItem("earthwork"), emptyItem("concrete")]);
    setImportedFile(null);
  };

  const handleDelete = (id: string) => {
    deleteTakeoffProject(id);
    if (activeId === id) handleNew();
    toast({ title: "Project deleted" });
  };

  // ---- Excel import ----
  const handleImport = (sheet: ParsedSheet, file: File) => {
    const colTrade = matchColumn(sheet.headers, ["trade", "category"]);
    const colDesc = matchColumn(sheet.headers, ["description", "item", "desc", "particular"]);
    const colL = matchColumn(sheet.headers, ["length", "l", "l (m)"]);
    const colW = matchColumn(sheet.headers, ["width", "w", "breadth", "b", "w (m)"]);
    const colH = matchColumn(sheet.headers, ["height", "h", "depth", "d", "h (m)"]);
    const colN = matchColumn(sheet.headers, ["count", "n", "no", "nos", "quantity (nos)"]);
    const colFormula = matchColumn(sheet.headers, ["formula", "type"]);
    const colUnit = matchColumn(sheet.headers, ["unit"]);

    const validTrades = new Set(ALL_TRADES);
    const validFormulas = new Set(ALL_FORMULAS);

    const imported: TakeoffItem[] = sheet.rows.map((r) => {
      const tradeStr = colTrade ? toStr(r[colTrade]).toLowerCase() : "";
      const trade: TradeId = validTrades.has(tradeStr as TradeId)
        ? (tradeStr as TradeId)
        : "concrete";

      const formulaStr = colFormula ? toStr(r[colFormula]).trim() : "";
      const formula: QtyFormula = validFormulas.has(formulaStr as QtyFormula)
        ? (formulaStr as QtyFormula)
        : "L×W×H×N";

      const unitStr = colUnit ? toStr(r[colUnit]).toLowerCase() : "";
      const unit: QtyUnit = (ALL_UNITS as string[]).includes(unitStr)
        ? (unitStr as QtyUnit)
        : TRADE_UNITS[trade];

      return {
        id: uid("it"),
        trade,
        description: colDesc ? toStr(r[colDesc]) : "",
        length: colL ? toNum(r[colL]) : 0,
        width: colW ? toNum(r[colW]) : 0,
        height: colH ? toNum(r[colH]) : 0,
        count: colN ? toNum(r[colN]) || 1 : 1,
        formula,
        unit,
        remarks: "",
      };
    });

    if (imported.length === 0) {
      toast({ title: "Import failed", description: "No data rows found.", variant: "destructive" });
      return;
    }

    setItems(imported);
    setImportedFile(file.name);
    setActiveId(null);
    toast({ title: "Imported", description: `${imported.length} items loaded from ${file.name}` });
  };

  const handleDownloadTemplate = () => {
    downloadCSV("quantity-takeoff-template.csv", [
      ["Trade", "Description", "Length", "Width", "Height", "Count", "Formula", "Unit"],
      ["earthwork", "Excavation for footing", 2.5, 2.5, 1.5, 4, "L×W×H×N", "m³"],
      ["concrete", "PCC 1:4:8 in footing", 2.5, 2.5, 0.15, 4, "L×W×H×N", "m³"],
      ["brickwork", "Brick wall 230mm", 5.0, 0.23, 3.0, 1, "L×W×H×N", "m³"],
      ["plaster", "Inner wall plaster 12mm", 5.0, 3.0, 0, 2, "L×W×N", "m²"],
      ["flooring", "Tile flooring", 4.0, 3.5, 0, 1, "L×W×N", "m²"],
      ["steel", "TMT bars 16mm", 12.0, 1.58, 0, 25, "L×N", "kg"],
    ]);
    toast({ title: "Template downloaded" });
  };

  const handleExportCSV = () => {
    downloadCSV(`takeoff-${name.replace(/\s+/g, "-").toLowerCase()}.csv`, [
      ["Trade", "Description", "Length", "Width", "Height", "Count", "Formula", "Quantity", "Unit", "Remarks"],
      ...computed.map((c) => [
        c.trade,
        c.description,
        c.length,
        c.width,
        c.height,
        c.count,
        c.formula,
        round(c.qty, 3),
        c.unit,
        c.remarks,
      ]),
    ]);
    toast({ title: "Exported", description: "Takeoff saved as CSV." });
  };

  const handleExportXLSX = () => {
    const summaryRows: (string | number)[][] = [
      ["— Summary by trade —", "", "", ""],
      ["Trade", "Total Qty", "Unit", "Items"],
      ...byTrade.map(([t, v]) => [TRADE_LABELS[t], round(v.qty, 3), v.unit, v.count]),
    ];
    const itemRows: (string | number)[][] = [
      ["— Item-wise detail —", "", "", "", "", "", "", "", "", ""],
      ["Trade", "Description", "Length", "Width", "Height", "Count", "Formula", "Quantity", "Unit", "Remarks"],
      ...computed.map((c) => [
        c.trade,
        c.description,
        c.length,
        c.width,
        c.height,
        c.count,
        c.formula,
        round(c.qty, 3),
        c.unit,
        c.remarks,
      ]),
    ];
    downloadXLSX(`takeoff-${name.replace(/\s+/g, "-").toLowerCase()}.xlsx`, [...summaryRows, [], ...itemRows], "Takeoff");
    toast({ title: "Exported", description: "Takeoff saved as XLSX." });
  };

  return (
    <div className="space-y-4">
      {/* Project header + actions */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-[200px]">
            <FieldLabel hint="Project name">Name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="e.g. Residential building — Ground floor" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleNew}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
            <ExcelUploadButton
              size="sm"
              onParsed={handleImport}
              onError={(m) => toast({ title: "Import failed", description: m, variant: "destructive" })}
            />
            <TemplateDownloadButton size="sm" onDownload={handleDownloadTemplate} />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportCSV}>
              <FileDown className="h-3 w-3 mr-1.5" />
              CSV
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportXLSX}>
              <FileDown className="h-3 w-3 mr-1.5" />
              XLSX
            </Button>
          </div>
        </div>

        <div>
          <FieldLabel hint="Optional">Description</FieldLabel>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-9" placeholder="Notes, drawing refs, etc." />
        </div>

        {importedFile && (
          <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span>
                <FileSpreadsheet className="h-3 w-3 inline mr-1" />
                Imported from <strong>{importedFile}</strong> · {items.length} items
              </span>
              <button onClick={() => setImportedFile(null)} className="text-muted-foreground hover:text-foreground">
                dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Saved projects list */}
      {projects.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Saved projects</h3>
            <Tag tone="neutral">{projects.length}</Tag>
          </div>
          <div className="space-y-1">
            {projects.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 px-2 py-1.5 rounded-md",
                  activeId === p.id ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50",
                )}
              >
                <button
                  onClick={() => setActiveId(p.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.items.length} items · updated {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] text-xs px-1.5"
                  aria-label="Delete project"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Takeoff Items</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalItems} items · Quantity auto-computed from dimensions and formula.
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addItem("concrete")}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add item
          </Button>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-muted/40 text-[11px] text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-2 py-2">Trade</th>
                <th className="text-left font-medium px-2 py-2 min-w-[200px]">Description</th>
                <th className="text-right font-medium px-2 py-2 w-20">L</th>
                <th className="text-right font-medium px-2 py-2 w-20">W / d</th>
                <th className="text-right font-medium px-2 py-2 w-20">H</th>
                <th className="text-right font-medium px-2 py-2 w-16">N</th>
                <th className="text-left font-medium px-2 py-2 w-32">Formula</th>
                <th className="text-right font-medium px-2 py-2 w-24">Qty</th>
                <th className="text-left font-medium px-2 py-2 w-16">Unit</th>
                <th className="w-16 px-1 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {computed.map((it) => (
                <tr key={it.id} className="border-t border-border hover:bg-muted/20 align-top">
                  <td className="px-2 py-1.5">
                    <select
                      value={it.trade}
                      onChange={(e) => updateItem(it.id, { trade: e.target.value as TradeId, unit: TRADE_UNITS[e.target.value as TradeId] })}
                      className="w-full h-7 bg-transparent text-xs outline-none rounded px-1 hover:bg-muted/60"
                    >
                      {ALL_TRADES.map((t) => (
                        <option key={t} value={t}>{TRADE_LABELS[t]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={it.description}
                      onChange={(e) => updateItem(it.id, { description: e.target.value })}
                      placeholder="e.g. Footing F1 concrete"
                      className="w-full bg-transparent text-sm outline-none rounded px-1.5 py-0.5 hover:bg-muted/60 focus:bg-muted"
                    />
                  </td>
                  <td className="px-1 py-1.5"><NumCell value={it.length} onChange={(v) => updateItem(it.id, { length: v })} /></td>
                  <td className="px-1 py-1.5"><NumCell value={it.width} onChange={(v) => updateItem(it.id, { width: v })} /></td>
                  <td className="px-1 py-1.5"><NumCell value={it.height} onChange={(v) => updateItem(it.id, { height: v })} /></td>
                  <td className="px-1 py-1.5"><NumCell value={it.count} onChange={(v) => updateItem(it.id, { count: v })} /></td>
                  <td className="px-2 py-1.5">
                    <select
                      value={it.formula}
                      onChange={(e) => updateItem(it.id, { formula: e.target.value as QtyFormula })}
                      className="w-full h-7 bg-transparent text-[11px] outline-none rounded px-1 hover:bg-muted/60 font-mono"
                    >
                      {ALL_FORMULAS.map((f) => (
                        <option key={f} value={f}>{FORMULA_LABELS[f]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-right nums tabular-nums font-medium text-primary">
                    {fmt(it.qty, 3)}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={it.unit}
                      onChange={(e) => updateItem(it.id, { unit: e.target.value as QtyUnit })}
                      className="w-full h-7 bg-transparent text-[11px] outline-none rounded px-1 hover:bg-muted/60"
                    >
                      {ALL_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => duplicateItem(it.id)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label="Duplicate"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(it.id)}
                        disabled={items.length <= 1}
                        className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] disabled:opacity-30 p-1"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process panel — how a single item's quantity is computed (uses first non-empty item) */}
      {(() => {
        const sample = computed.find((c) => c.length > 0 || c.width > 0 || c.height > 0 || c.count > 0) ?? computed[0];
        if (!sample) return null;
        const steps: ProcessStep[] = [
          {
            title: `Pick the right formula for the trade — ${TRADE_LABELS[sample.trade]}`,
            formula: `Trade "${sample.trade}" → unit = ${sample.unit} → formula = ${FORMULA_LABELS[sample.formula]}`,
            note: "Volume trades (concrete, brickwork, earthwork) use L×W×H×N. Area trades (plaster, flooring, painting) use L×W×N. Circular columns use π/4×d²×h×N where W is the diameter. Count-only items (doors, windows, fixtures) use N.",
          },
          {
            title: "Substitute the dimensions into the formula",
            formula:
              sample.formula === "L×W×H×N"
                ? `${sample.length} × ${sample.width} × ${sample.height} × ${sample.count}`
                : sample.formula === "L×W×N"
                  ? `${sample.length} × ${sample.width} × ${sample.count}`
                  : sample.formula === "L×N"
                    ? `${sample.length} × ${sample.count}`
                    : sample.formula === "π/4×d²×h×N"
                      ? `π/4 × ${sample.width}² × ${sample.height} × ${sample.count}`
                      : `${sample.count}`,
            note: "All dimensions are in metres (or the unit shown in the column header). N is the count of identical members.",
          },
          {
            title: "Compute the quantity",
            formula: `= ${round(computeQty(sample), 4)} ${sample.unit}`,
            result: `Quantity = ${fmt(sample.qty, 3)} ${sample.unit}`,
            note: "This is the quantity that flows into the BOQ for this item. The summary above aggregates all items by trade when their units match.",
          },
        ];
        return (
          <ProcessPanel
            intro={
              <>
                Each takeoff row computes its quantity from <strong>dimensions</strong> and a{" "}
                <strong>formula</strong>. The example below uses{" "}
                <strong>{sample.description || "your first item"}</strong> ({TRADE_LABELS[sample.trade]}) —
                edit any cell in the table above and these numbers update live.
              </>
            }
            steps={steps}
          />
        );
      })()}

      {/* Summary by trade */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Summary by trade</h3>
          {byTrade.length === 0 ? (
            <EmptyState icon={<Plus className="h-4 w-4" />} title="No items yet" description="Add an item above to see trade-wise totals." />
          ) : (
            <div className="space-y-1">
              {byTrade.map(([trade, v]) => (
                <ResultLine
                  key={trade}
                  label={`${TRADE_LABELS[trade]}  (${v.count} item${v.count === 1 ? "" : "s"})`}
                  value={fmt(v.qty, 3)}
                  unit={v.unit}
                />
              ))}
              <Divider />
              <div className="flex items-center justify-between py-2 px-3">
                <span className="text-xs text-muted-foreground">Total items</span>
                <span className="text-sm font-semibold nums tabular-nums">{totalItems}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">How quantity is computed</strong>
          <ul className="mt-2 space-y-1 list-disc pl-4">
            <li><span className="font-mono">L×W×H×N</span> — volume (concrete, earthwork, brickwork)</li>
            <li><span className="font-mono">L×W×N</span> — area (plaster, flooring, painting)</li>
            <li><span className="font-mono">L×N</span> — linear (running metres)</li>
            <li><span className="font-mono">π/4×d²×h×N</span> — circular column / pile (use W as diameter)</li>
            <li><span className="font-mono">N</span> — count only (nos)</li>
          </ul>
          <p className="mt-3">Trade totals aggregate only when units match. Mismatched units are kept separate to avoid incorrect sums.</p>
        </div>
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
      className="w-16 h-7 text-right bg-transparent text-sm outline-none rounded px-1.5 nums tabular-nums hover:bg-muted/60 focus:bg-muted focus:ring-1 focus:ring-ring"
    />
  );
}
