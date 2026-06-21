"use client";

// CivilHub — Surveying Toolkit
// Tools: Rise & Fall method, HI (Height of Instrument) method, RL calculator, Bearing calculator

import { useMemo, useState } from "react";
import { Plus, Trash2, Compass, ArrowDownUp, Mountain, Navigation, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SectionHeader, EmptyState, ResultLine, FieldLabel, Tag, Divider } from "../lib/ui";
import { useNav } from "../lib/nav";

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
        description="Field reduction tools for levelling and traversing. Table inputs, auto calculation, and exportable results — built for site work."
        meta={<Tag tone="primary">4 tools</Tag>}
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

  const handleExport = () => {
    const csv = [
      "Station,BS,IS,FS,Rise,Fall,RL",
      ...computed.map((r) => `${r.station},${r.bs},${r.is_},${r.fs},${r.rise.toFixed(3)},${r.fall.toFixed(3)},${r.rl.toFixed(3)}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rise-fall-reduction.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Rise & fall reduction saved as CSV." });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Rise & Fall Reduction</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Enter staff readings. RL, rise, and fall update live.</p>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExport}>
              <FileDown className="h-3 w-3 mr-1.5" />
              CSV
            </Button>
          </div>
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
      </div>

      <div className="space-y-4">
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
    </div>
  );
}

// ============ HI Method ============

function HiMethodTool() {
  const { toast } = useToast();
  const [benchmark, setBenchmark] = useState(100.0);
  const [rows, setRows] = useState<RfRow[]>([
    newRow("A", 1.5, 0, 0),
    newRow("B", 0, 1.2, 0),
    newRow("C", 1.0, 0, 1.4),
    newRow("D", 0, 0, 0.9),
  ]);

  const computed = useMemo(() => {
    const acc = { hi: benchmark };
    return rows.map((r, idx) => {
      if (idx === 0) {
        acc.hi = benchmark + r.bs;
        return { ...r, hi: round(acc.hi, 4), rl: round(acc.hi - (r.is_ || r.fs), 4) };
      }
      if (r.bs > 0) {
        const prev = rows[idx - 1];
        const prevRl = (prev.is_ || prev.fs) > 0 ? acc.hi - (prev.is_ || prev.fs) : acc.hi;
        acc.hi = prevRl + r.bs;
      }
      const reading = r.is_ || r.fs;
      const rl = reading > 0 ? acc.hi - reading : 0;
      return { ...r, hi: round(acc.hi, 4), rl: round(rl, 4) };
    });
  }, [rows, benchmark]);

  const updateRow = (id: string, patch: Partial<RfRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Height of Instrument Method</h3>
              <p className="text-xs text-muted-foreground mt-0.5">HI = Benchmark RL + BS, then RL = HI − (IS or FS).</p>
            </div>
          </div>
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
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Method</h3>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li><span className="text-foreground font-medium">1.</span> At each setup, take BS on a benchmark → HI = BM_RL + BS</li>
            <li><span className="text-foreground font-medium">2.</span> Take IS / FS on staff → RL = HI − reading</li>
            <li><span className="text-foreground font-medium">3.</span> At turning point (FS + new BS), shift instrument and recompute HI</li>
          </ol>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
          HI method is preferred when many intermediate sights exist between benchmarks. Rise/Fall is preferred for closed-loop checks.
        </div>
      </div>
    </div>
  );
}

// ============ RL Calculator (single station) ============

function RlCalculator() {
  const [bmRl, setBmRl] = useState(100);
  const [bs, setBs] = useState(1.5);
  const [fs, setFs] = useState(1.2);

  const hi = bmRl + bs;
  const rl = hi - fs;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Single-station RL</h3>
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
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Result</h3>
        <div className="space-y-1">
          <ResultLine label="HI" value={round(hi, 3)} />
          <ResultLine label="New RL" value={round(rl, 3)} highlight />
        </div>
      </div>
    </div>
  );
}

// ============ Bearing Calculator ============

function BearingCalculator() {
  const [b1, setB1] = useState(45); // degrees
  const [b2, setB2] = useState(135);
  const [bearingIn, setBearingIn] = useState(125.5);
  const [convertTo, setConvertTo] = useState<"rb" | "wcb">("rb");

  // Included angle between two WCBs (clockwise from B1 to B2)
  const includedAngle = ((b2 - b1) + 360) % 360;

  // WCB ↔ RB (Quadrantal Bearing) conversion
  const converted = (() => {
    const wcb = ((bearingIn % 360) + 360) % 360;
    let rb = "";
    if (convertTo === "rb") {
      if (wcb <= 90) rb = `N ${round(wcb, 2)}° E`;
      else if (wcb <= 180) rb = `S ${round(180 - wcb, 2)}° E`;
      else if (wcb <= 270) rb = `S ${round(wcb - 180, 2)}° W`;
      else rb = `N ${round(360 - wcb, 2)}° W`;
      return { out: rb, label: "Quadrantal Bearing" };
    } else {
      // input is RB — convert to WCB
      // simple parse: e.g. "N 45 E"
      const match = bearingIn.toString().toUpperCase().match(/([NS])\s*(\d+(?:\.\d+)?)\s*([EW])/);
      if (!match) return { out: "Invalid format. Use: N 45 E", label: "WCB" };
      const [, ns, angleStr, ew] = match;
      let w = parseFloat(angleStr);
      if (ns === "S") w = 180 - w;
      if (ew === "W") w = 360 - w;
      return { out: `${round(w, 2)}°`, label: "Whole Circle Bearing" };
    }
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">Included Angle between two WCBs</h3>
          <p className="text-xs text-muted-foreground mb-3">Compute the clockwise interior angle between two whole-circle bearings.</p>
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
