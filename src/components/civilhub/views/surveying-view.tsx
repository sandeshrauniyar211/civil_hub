"use client";

// CivilHub — Surveying Toolkit (Phase 2)
// Tools: Rise & Fall, HI (Height of Instrument) method, RL calculator, Bearing calculator
// Phase 2 additions:
//   • Excel / CSV import for every table-based tool (no more manual entry)
//   • Step-by-step "How it's calculated" panel showing live worked example
//   • Template downloads so users know the expected column layout

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Compass,
  ArrowDownUp,
  Mountain,
  Navigation,
  FileDown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SectionHeader, EmptyState, ResultLine, FieldLabel, Tag, Divider } from "../lib/ui";
import { useNav } from "../lib/nav";
import { ExcelUploadButton, TemplateDownloadButton } from "../lib/excel-upload-button";
import { ProcessPanel, ImportSummary, type ProcessStep } from "../lib/process-panel";
import { matchColumn, toNum, toStr, downloadCSV, downloadXLSX, type ParsedSheet } from "../lib/excel";

type Tool = "rise-fall" | "hi" | "rl" | "bearing";

const TOOLS: { id: Tool; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "rise-fall", label: "Rise & Fall Method", description: "Levelling reduction by computing rise/fall between consecutive stations.", icon: <ArrowDownUp className="h-4 w-4" /> },
  { id: "hi", label: "HI Method", description: "Height of Instrument method — RL = HI − FS for each turning point.", icon: <Mountain className="h-4 w-4" /> },
  { id: "rl", label: "RL Calculator", description: "Quick single-station RL from known benchmark and readings.", icon: <Mountain className="h-4 w-4" /> },
  { id: "bearing", label: "Bearing Calculator", description: "Compute included angles and convert between whole-circle bearings.", icon: <Navigation className="h-4 w-4" /> },
];

export function SurveyingView() {
  const { state, go } = useNav();
  const activeTool = (state.sub as Tool) || "rise-fall";

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Surveying"
        title="Surveying Toolkit"
        description="Field reduction tools for levelling and traversing. Import staff readings from Excel, see the worked steps live, and export results — built for site work."
        meta={<Tag tone="primary">4 tools · Excel import</Tag>}
      />

      {/* Tool selector — horizontal scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {TOOLS.map((t) => {
          const active = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => go("surveying", { sub: t.id })}
              className={cn(
                "flex items-start gap-2.5 p-3 rounded-lg border text-left min-w-[220px] shrink-0 transition-all",
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
        {activeTool === "rise-fall" && <RiseFallTool />}
        {activeTool === "hi" && <HiMethodTool />}
        {activeTool === "rl" && <RlCalculator />}
        {activeTool === "bearing" && <BearingCalculator />}
      </div>
    </div>
  );
}

// ============ Rise & Fall Method ============

interface RfRow {
  id: string;
  station: string;
  bs: number; // back sight
  is_: number; // intermediate sight
  fs: number; // fore sight
}

function newRow(station = "", bs = 0, is_ = 0, fs = 0): RfRow {
  return { id: `r_${Math.random().toString(36).slice(2, 8)}`, station, bs, is_, fs };
}

function RiseFallTool() {
  const { toast } = useToast();
  const [benchmark, setBenchmark] = useState(100.0);
  const [importedFile, setImportedFile] = useState<{ name: string; columns: { label: string; matched: string | undefined }[] } | null>(null);
  const [rows, setRows] = useState<RfRow[]>([
    newRow("A", 1.5, 0, 0),
    newRow("B", 0.8, 0, 1.2),
    newRow("C", 0, 1.6, 0),
    newRow("D", 0, 0, 0.9),
  ]);

  const computed = useMemo(() => {
    const acc = { prevReading: 0, rl: benchmark };
    return rows.map((r, idx) => {
      const reading = r.bs > 0 ? r.bs : r.is_ > 0 ? r.is_ : r.fs;
      let rise = 0;
      let fall = 0;
      if (idx !== 0) {
        const diff = acc.prevReading - reading;
        if (diff > 0) rise = diff;
        else fall = -diff;
        acc.rl = acc.rl + rise - fall;
      }
      acc.prevReading = reading;
      return { ...r, reading, rise, fall, rl: round(acc.rl, 4) };
    });
  }, [rows, benchmark]);

  const check = useMemo(() => {
    const sumBs = computed.reduce((s, r) => s + r.bs, 0);
    const sumFs = computed.reduce((s, r) => s + r.fs, 0);
    const sumRise = computed.reduce((s, r) => s + r.rise, 0);
    const sumFall = computed.reduce((s, r) => s + r.fall, 0);
    const lastRl = computed.length ? computed[computed.length - 1].rl : benchmark;
    const expectedLastRl = benchmark + sumRise - sumFall;
    const arithmeticCheck = Math.abs((sumBs - sumFs) - (lastRl - benchmark)) < 0.001;
    return { sumBs, sumFs, sumRise, sumFall, lastRl, expectedLastRl, arithmeticCheck };
  }, [computed, benchmark]);

  const updateRow = (id: string, patch: Partial<RfRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  // ---- Excel import ----
  const handleImport = (sheet: ParsedSheet, file: File) => {
    const colStation = matchColumn(sheet.headers, ["station", "point", "stn"]);
    const colBs = matchColumn(sheet.headers, ["bs", "backsight", "back sight", "back-sight"]);
    const colIs = matchColumn(sheet.headers, ["is", "isight", "intermediate", "intermediate sight"]);
    const colFs = matchColumn(sheet.headers, ["fs", "foresight", "fore sight", "fore-sight"]);

    // Fall back to positional if no headers matched
    const usePositional = !colBs && !colFs;
    const imported: RfRow[] = sheet.rows.map((r, idx) => {
      const vals = Object.values(r);
      return newRow(
        colStation ? toStr(r[colStation], `Stn ${idx + 1}`) : `Stn ${idx + 1}`,
        colBs ? toNum(r[colBs]) : usePositional ? toNum(vals[0]) : 0,
        colIs ? toNum(r[colIs]) : usePositional ? toNum(vals[1]) : 0,
        colFs ? toNum(r[colFs]) : usePositional ? toNum(vals[2]) : 0,
      );
    });

    if (imported.length === 0) {
      toast({ title: "Import failed", description: "No data rows found in the file.", variant: "destructive" });
      return;
    }

    setRows(imported);
    setImportedFile({
      name: file.name,
      columns: [
        { label: "Station", matched: colStation },
        { label: "BS", matched: colBs },
        { label: "IS", matched: colIs },
        { label: "FS", matched: colFs },
      ],
    });
    toast({
      title: "Imported successfully",
      description: `${imported.length} rows loaded from ${file.name}`,
    });
  };

  const handleExportCSV = () => {
    downloadCSV("rise-fall-reduction.csv", [
      ["Station", "BS", "IS", "FS", "Rise", "Fall", "RL"],
      ...computed.map((r) => [
        r.station,
        r.bs,
        r.is_,
        r.fs,
        r.rise.toFixed(3),
        r.fall.toFixed(3),
        r.rl.toFixed(3),
      ]),
      ["Σ", check.sumBs.toFixed(3), "", check.sumFs.toFixed(3), check.sumRise.toFixed(3), check.sumFall.toFixed(3), check.lastRl.toFixed(3)],
    ]);
    toast({ title: "Exported", description: "Rise & fall reduction saved as CSV." });
  };

  const handleExportXLSX = () => {
    downloadXLSX(
      "rise-fall-reduction.xlsx",
      [
        ["Station", "BS", "IS", "FS", "Rise", "Fall", "RL"],
        ...computed.map((r) => [
          r.station,
          r.bs,
          r.is_,
          r.fs,
          +r.rise.toFixed(3),
          +r.fall.toFixed(3),
          +r.rl.toFixed(3),
        ]),
        ["Σ", +check.sumBs.toFixed(3), "", +check.sumFs.toFixed(3), +check.sumRise.toFixed(3), +check.sumFall.toFixed(3), +check.lastRl.toFixed(3)],
      ],
      "Rise & Fall",
    );
    toast({ title: "Exported", description: "Rise & fall reduction saved as XLSX." });
  };

  const handleDownloadTemplate = () => {
    downloadCSV("rise-fall-template.csv", [
      ["Station", "BS", "IS", "FS"],
      ["A", 1.5, "", ""],
      ["B", 0.8, "", 1.2],
      ["C", "", 1.6, ""],
      ["D", "", "", 0.9],
    ]);
    toast({ title: "Template downloaded", description: "Fill in your readings and re-import." });
  };

  // ---- Process steps (live values from row 1→2) ----
  const firstPair = computed.length >= 2 ? [computed[0], computed[1]] : null;
  const processSteps: ProcessStep[] = firstPair
    ? [
        {
          title: "Identify the reading at each station",
          formula: `Station ${firstPair[0].station}: BS=${firstPair[0].bs}, IS=${firstPair[0].is_}, FS=${firstPair[0].fs} → reading = ${firstPair[0].reading.toFixed(3)}`,
          note: "For each station, only one of BS / IS / FS is typically taken. The reading used is whichever is non-zero (priority: BS → IS → FS).",
        },
        {
          title: "Compute rise or fall between consecutive stations",
          formula: `diff = prev_reading − current_reading = ${firstPair[0].reading.toFixed(3)} − ${firstPair[1].reading.toFixed(3)} = ${(firstPair[0].reading - firstPair[1].reading).toFixed(3)}`,
          note: "If diff > 0 → Rise (ground went up). If diff < 0 → Fall (ground went down).",
          result:
            firstPair[0].reading - firstPair[1].reading > 0
              ? `Rise = ${firstPair[1].rise.toFixed(3)}`
              : `Fall = ${firstPair[1].fall.toFixed(3)}`,
        },
        {
          title: "Update the Reduced Level (RL)",
          formula: `RL_${firstPair[1].station} = RL_${firstPair[0].station} + Rise − Fall = ${firstPair[0].rl.toFixed(3)} + ${firstPair[1].rise.toFixed(3)} − ${firstPair[1].fall.toFixed(3)} = ${firstPair[1].rl.toFixed(3)}`,
          note: "The first station inherits the benchmark RL. Every subsequent station's RL is derived from the previous one.",
        },
        {
          title: "Arithmetic check at the end",
          formula: `ΣBS − ΣFS = ${check.sumBs.toFixed(3)} − ${check.sumFs.toFixed(3)} = ${(check.sumBs - check.sumFs).toFixed(3)}    |    Last_RL − BM_RL = ${check.lastRl.toFixed(3)} − ${benchmark.toFixed(3)} = ${(check.lastRl - benchmark).toFixed(3)}`,
          note: "These two values must match for the levelling to be arithmetically correct.",
          result: check.arithmeticCheck ? "Check PASS" : "Check FAIL",
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Import bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold">Rise & Fall Reduction</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Enter staff readings manually or import from Excel — RL, rise, and fall update live.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
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

        {importedFile && (
          <div className="mb-3">
            <ImportSummary
              fileName={importedFile.name}
              rowCount={rows.length}
              detectedColumns={importedFile.columns}
              onClear={() => setImportedFile(null)}
            />
          </div>
        )}

        <div className="mb-3">
          <FieldLabel hint="Known RL">Benchmark RL</FieldLabel>
          <Input
            type="number"
            step={0.001}
            value={benchmark}
            onChange={(e) => setBenchmark(Number(e.target.value))}
            className="h-9 w-40"
          />
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/40 text-[11px] text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-2 py-2">Station</th>
                <th className="text-right font-medium px-2 py-2">BS</th>
                <th className="text-right font-medium px-2 py-2">IS</th>
                <th className="text-right font-medium px-2 py-2">FS</th>
                <th className="text-right font-medium px-2 py-2">Rise</th>
                <th className="text-right font-medium px-2 py-2">Fall</th>
                <th className="text-right font-medium px-2 py-2">RL</th>
                <th className="w-10 px-1 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const c = computed[idx];
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-2 py-1">
                      <input
                        value={r.station}
                        onChange={(e) => updateRow(r.id, { station: e.target.value })}
                        placeholder={`Stn ${idx + 1}`}
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <NumCell value={r.bs} onChange={(v) => updateRow(r.id, { bs: v })} />
                    </td>
                    <td className="px-1 py-1">
                      <NumCell value={r.is_} onChange={(v) => updateRow(r.id, { is_: v })} />
                    </td>
                    <td className="px-1 py-1">
                      <NumCell value={r.fs} onChange={(v) => updateRow(r.id, { fs: v })} />
                    </td>
                    <td className="px-2 py-1 text-right nums tabular-nums text-[oklch(0.45_0.13_150)]">
                      {c.rise > 0 ? c.rise.toFixed(3) : ""}
                    </td>
                    <td className="px-2 py-1 text-right nums tabular-nums text-[oklch(0.5_0.18_27)]">
                      {c.fall > 0 ? c.fall.toFixed(3) : ""}
                    </td>
                    <td className="px-2 py-1 text-right nums tabular-nums font-medium">
                      {c.rl.toFixed(3)}
                    </td>
                    <td className="px-1 py-1 text-center">
                      <button
                        onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))}
                        disabled={rows.length <= 2}
                        className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] disabled:opacity-30"
                        aria-label="Remove row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/40 text-xs font-medium border-t-2 border-border">
              <tr>
                <td className="px-2 py-2 text-muted-foreground">Σ</td>
                <td className="px-2 py-2 text-right nums tabular-nums">{check.sumBs.toFixed(3)}</td>
                <td></td>
                <td className="px-2 py-2 text-right nums tabular-nums">{check.sumFs.toFixed(3)}</td>
                <td className="px-2 py-2 text-right nums tabular-nums text-[oklch(0.45_0.13_150)]">{check.sumRise.toFixed(3)}</td>
                <td className="px-2 py-2 text-right nums tabular-nums text-[oklch(0.5_0.18_27)]">{check.sumFall.toFixed(3)}</td>
                <td className="px-2 py-2 text-right nums tabular-nums">{check.lastRl.toFixed(3)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-2">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setRows((p) => [...p, newRow()])}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add station
          </Button>
        </div>
      </div>

      {/* Side-by-side: check + process panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Arithmetic Check</h3>
          <div className="space-y-1">
            <ResultLine label="Σ BS − Σ FS" value={round(check.sumBs - check.sumFs, 3)} />
            <ResultLine label="Last RL − Bench RL" value={round(check.lastRl - benchmark, 3)} />
            <Divider />
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Check status</span>
              <Tag tone={check.arithmeticCheck ? "success" : "danger"}>
                {check.arithmeticCheck ? "Pass" : "Fail"}
              </Tag>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Rise/Fall method:</strong> For each station pair, rise = previous reading − current (if positive), fall = current − previous (if positive). New RL = previous RL + rise − fall.
        </div>
      </div>

      <ProcessPanel
        steps={processSteps}
        intro={
          <>
            The <strong>Rise & Fall</strong> method computes the elevation difference between consecutive staff stations. Below is a worked example using your <em>first two stations</em>. Every other row follows the same logic.
          </>
        }
      />
    </div>
  );
}

// ============ HI Method ============

function HiMethodTool() {
  const { toast } = useToast();
  const [benchmark, setBenchmark] = useState(100.0);
  const [importedFile, setImportedFile] = useState<{ name: string; columns: { label: string; matched: string | undefined }[] } | null>(null);
  const [rows, setRows] = useState<RfRow[]>([
    newRow("A", 1.5, 0, 0),
    newRow("B", 0, 1.2, 0),
    newRow("C", 1.0, 0, 1.4),
    newRow("D", 0, 0, 0.9),
  ]);

  const computed = useMemo(() => {
    const acc = { hi: benchmark, lastRl: benchmark };
    return rows.map((r, idx) => {
      if (idx === 0) {
        acc.hi = benchmark + r.bs;
        const rl = r.is_ > 0 ? acc.hi - r.is_ : r.fs > 0 ? acc.hi - r.fs : acc.hi;
        acc.lastRl = rl;
        return { ...r, hi: round(acc.hi, 4), rl: round(rl, 4) };
      }
      if (r.bs > 0) {
        // Turning point — new HI from previous RL + new BS
        acc.hi = acc.lastRl + r.bs;
      }
      const reading = r.is_ || r.fs;
      const rl = reading > 0 ? acc.hi - reading : acc.lastRl;
      acc.lastRl = rl;
      return { ...r, hi: round(acc.hi, 4), rl: round(rl, 4) };
    });
  }, [rows, benchmark]);

  const updateRow = (id: string, patch: Partial<RfRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleImport = (sheet: ParsedSheet, file: File) => {
    const colStation = matchColumn(sheet.headers, ["station", "point", "stn"]);
    const colBs = matchColumn(sheet.headers, ["bs", "backsight", "back sight"]);
    const colIs = matchColumn(sheet.headers, ["is", "isight", "intermediate"]);
    const colFs = matchColumn(sheet.headers, ["fs", "foresight", "fore sight"]);
    const usePositional = !colBs && !colFs;

    const imported: RfRow[] = sheet.rows.map((r, idx) => {
      const vals = Object.values(r);
      return newRow(
        colStation ? toStr(r[colStation], `Stn ${idx + 1}`) : `Stn ${idx + 1}`,
        colBs ? toNum(r[colBs]) : usePositional ? toNum(vals[0]) : 0,
        colIs ? toNum(r[colIs]) : usePositional ? toNum(vals[1]) : 0,
        colFs ? toNum(r[colFs]) : usePositional ? toNum(vals[2]) : 0,
      );
    });

    if (imported.length === 0) {
      toast({ title: "Import failed", description: "No data rows found in the file.", variant: "destructive" });
      return;
    }

    setRows(imported);
    setImportedFile({
      name: file.name,
      columns: [
        { label: "Station", matched: colStation },
        { label: "BS", matched: colBs },
        { label: "IS", matched: colIs },
        { label: "FS", matched: colFs },
      ],
    });
    toast({ title: "Imported successfully", description: `${imported.length} rows loaded from ${file.name}` });
  };

  const handleDownloadTemplate = () => {
    downloadCSV("hi-method-template.csv", [
      ["Station", "BS", "IS", "FS"],
      ["A", 1.5, "", ""],
      ["B", "", 1.2, ""],
      ["C", 1.0, "", 1.4],
      ["D", "", "", 0.9],
    ]);
    toast({ title: "Template downloaded", description: "Fill in your readings and re-import." });
  };

  const handleExportCSV = () => {
    downloadCSV("hi-method-reduction.csv", [
      ["Station", "BS", "IS", "FS", "HI", "RL"],
      ...computed.map((r) => [r.station, r.bs, r.is_, r.fs, r.hi.toFixed(3), r.rl.toFixed(3)]),
    ]);
    toast({ title: "Exported", description: "HI method reduction saved as CSV." });
  };

  // Process steps — use first row as worked example
  const firstRow = computed[0];
  const processSteps: ProcessStep[] = firstRow
    ? [
        {
          title: "Compute Height of Instrument (HI) at the first setup",
          formula: `HI = Benchmark_RL + BS = ${benchmark.toFixed(3)} + ${firstRow.bs.toFixed(3)} = ${firstRow.hi.toFixed(3)}`,
          note: "The instrument is set up, a back-sight is taken on a benchmark of known RL. HI is the elevation of the instrument's line of sight.",
          result: `HI = ${firstRow.hi.toFixed(3)}`,
        },
        {
          title: "Compute RL of each staff station from HI",
          formula: `RL = HI − Reading  →  RL_${firstRow.station} = ${firstRow.hi.toFixed(3)} − ${(firstRow.is_ || firstRow.fs).toFixed(3)} = ${firstRow.rl.toFixed(3)}`,
          note: "Reading can be either an intermediate sight (IS) or a fore sight (FS). Both reduce directly from HI.",
          result: `RL_${firstRow.station} = ${firstRow.rl.toFixed(3)}`,
        },
        {
          title: "At a turning point, shift the instrument and recompute HI",
          formula: `New HI = previous RL (of TP) + new BS`,
          note: "A turning point (TP) is where a FS is followed by a BS — the instrument is moved, and HI must be recomputed because the line of sight has changed.",
        },
        {
          title: "Repeat until the last station",
          formula: `Final RL = HI_last − FS_last`,
          note: "HI method is preferred when many intermediate sights exist between benchmarks because each IS reduces directly without affecting the cumulative check.",
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold">Height of Instrument Method</h3>
            <p className="text-xs text-muted-foreground mt-0.5">HI = Benchmark RL + BS, then RL = HI − (IS or FS). Import staff readings from Excel.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
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
          </div>
        </div>

        {importedFile && (
          <div className="mb-3">
            <ImportSummary
              fileName={importedFile.name}
              rowCount={rows.length}
              detectedColumns={importedFile.columns}
              onClear={() => setImportedFile(null)}
            />
          </div>
        )}

        <div className="mb-3">
          <FieldLabel hint="Known RL">Benchmark RL</FieldLabel>
          <Input
            type="number"
            step={0.001}
            value={benchmark}
            onChange={(e) => setBenchmark(Number(e.target.value))}
            className="h-9 w-40"
          />
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/40 text-[11px] text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-2 py-2">Station</th>
                <th className="text-right font-medium px-2 py-2">BS</th>
                <th className="text-right font-medium px-2 py-2">IS</th>
                <th className="text-right font-medium px-2 py-2">FS</th>
                <th className="text-right font-medium px-2 py-2">HI</th>
                <th className="text-right font-medium px-2 py-2">RL</th>
                <th className="w-10 px-1 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const c = computed[idx];
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-2 py-1">
                      <input value={r.station} onChange={(e) => updateRow(r.id, { station: e.target.value })} placeholder={`Stn ${idx + 1}`} className="w-full bg-transparent text-sm outline-none" />
                    </td>
                    <td className="px-1 py-1"><NumCell value={r.bs} onChange={(v) => updateRow(r.id, { bs: v })} /></td>
                    <td className="px-1 py-1"><NumCell value={r.is_} onChange={(v) => updateRow(r.id, { is_: v })} /></td>
                    <td className="px-1 py-1"><NumCell value={r.fs} onChange={(v) => updateRow(r.id, { fs: v })} /></td>
                    <td className="px-2 py-1 text-right nums tabular-nums text-muted-foreground">{c.hi.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right nums tabular-nums font-medium">{c.rl.toFixed(3)}</td>
                    <td className="px-1 py-1 text-center">
                      <button onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))} disabled={rows.length <= 2} className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] disabled:opacity-30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setRows((p) => [...p, newRow()])}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add station
          </Button>
        </div>
      </div>

      <ProcessPanel
        steps={processSteps}
        intro={
          <>
            The <strong>Height of Instrument (HI)</strong> method first establishes the elevation of the instrument's line of sight, then computes each station's RL by subtracting the staff reading from HI. Below is the worked example using your first row.
          </>
        }
      />
    </div>
  );
}

// ============ RL Calculator (single station) ============

function RlCalculator() {
  const { toast } = useToast();
  const [bmRl, setBmRl] = useState(100);
  const [bs, setBs] = useState(1.5);
  const [fs, setFs] = useState(1.2);

  const hi = bmRl + bs;
  const rl = hi - fs;

  const handleImport = (sheet: ParsedSheet, file: File) => {
    if (sheet.rows.length === 0) return;
    const r = sheet.rows[0];
    const colBm = matchColumn(sheet.headers, ["benchmark", "bm rl", "bm_rl", "known rl"]);
    const colBs = matchColumn(sheet.headers, ["bs", "backsight"]);
    const colFs = matchColumn(sheet.headers, ["fs", "foresight"]);

    if (colBm) setBmRl(toNum(r[colBm]));
    if (colBs) setBs(toNum(r[colBs]));
    if (colFs) setFs(toNum(r[colFs]));

    toast({ title: "Imported successfully", description: `Loaded values from ${file.name}` });
  };

  const handleDownloadTemplate = () => {
    downloadCSV("rl-calculator-template.csv", [
      ["Benchmark", "BS", "FS"],
      [100, 1.5, 1.2],
    ]);
    toast({ title: "Template downloaded", description: "Fill in your values and re-import." });
  };

  const processSteps: ProcessStep[] = [
    {
      title: "Compute Height of Instrument (HI)",
      formula: `HI = Benchmark_RL + BS = ${bmRl} + ${bs} = ${round(hi, 3)}`,
      note: "The instrument is set up over a known benchmark. The back-sight reading on the benchmark staff gives the elevation of the line of sight.",
      result: `HI = ${round(hi, 3)}`,
    },
    {
      title: "Compute Reduced Level (RL) of the new station",
      formula: `RL = HI − FS = ${round(hi, 3)} − ${fs} = ${round(rl, 3)}`,
      note: "The fore-sight is the staff reading on the new (unknown) point. Subtracting it from HI yields the point's RL.",
      result: `RL = ${round(rl, 3)}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold">Single-station RL</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Quick RL from a benchmark and two staff readings.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ExcelUploadButton
              size="sm"
              onParsed={handleImport}
              onError={(m) => toast({ title: "Import failed", description: m, variant: "destructive" })}
            />
            <TemplateDownloadButton size="sm" onDownload={handleDownloadTemplate} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <FieldLabel hint="Known RL">Benchmark RL</FieldLabel>
            <Input type="number" step={0.001} value={bmRl} onChange={(e) => setBmRl(Number(e.target.value))} />
          </div>
          <div>
            <FieldLabel>Back Sight (BS)</FieldLabel>
            <Input type="number" step={0.001} value={bs} onChange={(e) => setBs(Number(e.target.value))} />
          </div>
          <div>
            <FieldLabel>Fore Sight (FS)</FieldLabel>
            <Input type="number" step={0.001} value={fs} onChange={(e) => setFs(Number(e.target.value))} />
          </div>
        </div>

        <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs font-mono text-muted-foreground">
          HI = BM_RL + BS = {bmRl} + {bs} = <span className="text-foreground font-semibold">{round(hi, 3)}</span>
          <br />
          RL = HI − FS = {round(hi, 3)} − {fs} = <span className="text-foreground font-semibold">{round(rl, 3)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Result</h3>
          <div className="space-y-1">
            <ResultLine label="HI" value={round(hi, 3)} />
            <ResultLine label="New RL" value={round(rl, 3)} highlight />
          </div>
        </div>
      </div>

      <ProcessPanel
        steps={processSteps}
        intro={
          <>
            This is the simplest levelling case — one setup, one benchmark, one unknown point. The same logic underpins both the Rise & Fall and HI methods, just repeated across many stations.
          </>
        }
      />
    </div>
  );
}

// ============ Bearing Calculator ============

function BearingCalculator() {
  const { toast } = useToast();
  const [b1, setB1] = useState(45);
  const [b2, setB2] = useState(135);
  const [bearingIn, setBearingIn] = useState<number | string>(125.5);
  const [convertTo, setConvertTo] = useState<"rb" | "wcb">("rb");

  // Included angle between two WCBs (clockwise from B1 to B2)
  const includedAngle = ((b2 - b1) + 360) % 360;

  // WCB ↔ RB (Quadrantal Bearing) conversion
  const converted = (() => {
    const wcb = ((Number(bearingIn) % 360) + 360) % 360;
    let rb = "";
    if (convertTo === "rb") {
      if (wcb <= 90) rb = `N ${round(wcb, 2)}° E`;
      else if (wcb <= 180) rb = `S ${round(180 - wcb, 2)}° E`;
      else if (wcb <= 270) rb = `S ${round(wcb - 180, 2)}° W`;
      else rb = `N ${round(360 - wcb, 2)}° W`;
      return { out: rb, label: "Quadrantal Bearing", wcb };
    } else {
      const match = bearingIn.toString().toUpperCase().match(/([NS])\s*(\d+(?:\.\d+)?)\s*([EW])/);
      if (!match) return { out: "Invalid format. Use: N 45 E", label: "WCB", wcb: NaN };
      const [, ns, angleStr, ew] = match;
      let w = parseFloat(angleStr);
      if (ns === "S") w = 180 - w;
      if (ew === "W") w = 360 - w;
      return { out: `${round(w, 2)}°`, label: "Whole Circle Bearing", wcb: w };
    }
  })();

  const handleImport = (sheet: ParsedSheet, file: File) => {
    if (sheet.rows.length === 0) return;
    const r = sheet.rows[0];
    const colB1 = matchColumn(sheet.headers, ["b1", "wcb1", "bearing1", "wcb of line 1"]);
    const colB2 = matchColumn(sheet.headers, ["b2", "wcb2", "bearing2", "wcb of line 2"]);

    if (colB1) setB1(toNum(r[colB1]));
    if (colB2) setB2(toNum(r[colB2]));

    toast({ title: "Imported successfully", description: `Loaded bearings from ${file.name}` });
  };

  const handleDownloadTemplate = () => {
    downloadCSV("bearing-template.csv", [
      ["B1", "B2"],
      [45, 135],
    ]);
    toast({ title: "Template downloaded", description: "Fill in your bearings and re-import." });
  };

  // Determine quadrant for process step
  const quadrant =
    convertTo === "rb"
      ? (() => {
          const wcb = ((Number(bearingIn) % 360) + 360) % 360;
          if (wcb <= 90) return "NE (1st quadrant)";
          if (wcb <= 180) return "SE (2nd quadrant)";
          if (wcb <= 270) return "SW (3rd quadrant)";
          return "NW (4th quadrant)";
        })()
      : "—";

  const processSteps: ProcessStep[] =
    convertTo === "rb"
      ? [
          {
            title: "Identify which quadrant the WCB falls in",
            formula: `WCB = ${((Number(bearingIn) % 360) + 360) % 360}°  →  ${quadrant}`,
            note: "Whole Circle Bearings are measured clockwise from North (0°) and range from 0° to 360°. Quadrantal Bearings are measured from the nearer of N or S, toward E or W.",
          },
          {
            title: "Apply the conversion rule for that quadrant",
            formula:
              quadrant.startsWith("NE")
                ? `RB = N (WCB) E = N ${round(((Number(bearingIn) % 360) + 360) % 360, 2)}° E`
                : quadrant.startsWith("SE")
                  ? `RB = S (180° − WCB) E = S ${round(180 - ((Number(bearingIn) % 360) + 360) % 360, 2)}° E`
                  : quadrant.startsWith("SW")
                    ? `RB = S (WCB − 180°) W = S ${round(((Number(bearingIn) % 360) + 360) % 360 - 180, 2)}° W`
                    : `RB = N (360° − WCB) W = N ${round(360 - ((Number(bearingIn) % 360) + 360) % 360, 2)}° W`,
            result: converted.out,
          },
        ]
      : [
          {
            title: "Parse the quadrantal bearing",
            formula: `Input: ${bearingIn}  →  parse NS, angle, EW`,
            note: "Quadrantal bearings look like N 45° E or S 30° W. The first letter (N/S) is the reference meridian; the last letter (E/W) is the direction of measurement.",
          },
          {
            title: "Convert to WCB based on quadrant",
            formula:
              (() => {
                const m = bearingIn.toString().toUpperCase().match(/([NS])\s*(\d+(?:\.\d+)?)\s*([EW])/);
                if (!m) return "Invalid input";
                const [, ns, angleStr, ew] = m;
                let w = parseFloat(angleStr);
                let step = `Start: ${ns} ${angleStr}° ${ew} → WCB = ${angleStr}°`;
                if (ns === "S") {
                  w = 180 - w;
                  step = `NS=S → WCB = 180° − ${angleStr}° = ${w}°`;
                }
                if (ew === "W") {
                  w = 360 - w;
                  step += ` → EW=W → WCB = 360° − ${w}° = ${360 - w}°`;
                }
                return step;
              })(),
            result: converted.out,
          },
        ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Included Angle between two WCBs</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Clockwise interior angle between two whole-circle bearings.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <ExcelUploadButton
                size="sm"
                onParsed={handleImport}
                onError={(m) => toast({ title: "Import failed", description: m, variant: "destructive" })}
              />
              <TemplateDownloadButton size="sm" onDownload={handleDownloadTemplate} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>WCB of line 1</FieldLabel>
              <Input type="number" value={b1} onChange={(e) => setB1(Number(e.target.value))} />
            </div>
            <div>
              <FieldLabel>WCB of line 2</FieldLabel>
              <Input type="number" value={b2} onChange={(e) => setB2(Number(e.target.value))} />
            </div>
          </div>
          <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
            Included angle = <span className="text-primary font-semibold">{round(includedAngle, 2)}°</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-1">WCB ↔ Quadrantal Bearing</h3>
          <p className="text-xs text-muted-foreground mb-3">Convert between whole-circle bearing (0°–360°) and quadrantal bearing (N/S ° E/W).</p>
          <div className="flex items-center gap-1 mb-3">
            <button onClick={() => setConvertTo("rb")} className={cn("px-3 py-1 text-xs font-medium rounded", convertTo === "rb" ? "bg-muted text-foreground" : "text-muted-foreground")}>WCB → RB</button>
            <button onClick={() => setConvertTo("wcb")} className={cn("px-3 py-1 text-xs font-medium rounded", convertTo === "wcb" ? "bg-muted text-foreground" : "text-muted-foreground")}>RB → WCB</button>
          </div>
          <div className="mb-3">
            <FieldLabel hint={convertTo === "rb" ? "0–360°" : "e.g. N 45 E"}>
              {convertTo === "rb" ? "Whole Circle Bearing" : "Quadrantal Bearing"}
            </FieldLabel>
            <Input
              type={convertTo === "rb" ? "number" : "text"}
              value={bearingIn}
              onChange={(e) => setBearingIn(convertTo === "rb" ? Number(e.target.value) : e.target.value)}
            />
          </div>
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
            {converted.label}: <span className="text-primary font-semibold">{converted.out}</span>
          </div>
        </div>
      </div>

      <ProcessPanel
        steps={processSteps}
        intro={
          <>
            <strong>Included angle</strong> between two lines = (WCB₂ − WCB₁) mod 360°. <strong>Quadrantal bearings</strong> are shorter to write in the field but require a quadrant letter (N/S + E/W). The conversion below shows your input's worked step.
          </>
        }
      />
    </div>
  );
}

// ============ Shared cell input ============

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

function round(v: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}
