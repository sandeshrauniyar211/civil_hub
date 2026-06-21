"use client";

// CivilHub — IOE Internal Marks Calculator (flagship)
//
// Reference: https://ioe.bibeksubedi0001.com.np/
//
// Design intent: keep the official IOE marksheet structure 100% familiar to students
// (Subject | Attendance | Assignment | Practical | Internal | Final | Total | Grade),
// but modernize the usability — live calculation, validation, reverse calc, GPA impact,
// and a clean Linear-style results panel.
//
// IOE Internal Marks composition (typical):
//   Internal (out of 20) = Attendance (4) + Assignment (8) + Practical (8)  ... but variations exist
//   The most common IOE convention:
//     - Internal marks (20% of total, scaled to 20)
//     - Final exam marks (80% of total, scaled to 80)
//     - Subject total = Internal + Final, out of 100
//
// We model this flexibly — the student enters Attendance, Assignment, Practical
// (the three IOE internal components), and Final marks. Internal = Attendance + Assignment + Practical.

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Target,
  TrendingDown,
  TrendingUp,
  Calculator as CalcIcon,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  SectionHeader,
  StatFigure,
  ResultLine,
  Tag,
  FieldLabel,
  Divider,
  EmptyState,
} from "../lib/ui";
import {
  gradeFor,
  gpaForSubjects,
  IOE_GRADING_SCALE,
  type SubjectEntry,
  type SavedSemester,
} from "../lib/types";
import { getSemesters, saveSemester, deleteSemester, getHistory, addHistory } from "../lib/storage";
import { useNav } from "../lib/nav";

const MAX_ATTENDANCE = 4;
const MAX_ASSIGNMENT = 8;
const MAX_PRACTICAL = 8;
const MAX_INTERNAL = 20;
const MAX_FINAL = 80;

type Tab = "predict" | "reduction" | "reverse" | "gpa";

type Row = SubjectEntry;

function newSubject(name = "", creditHours = 3): Row {
  return {
    id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    creditHours,
    internalMarks: 0,
    finalMarks: 0,
    totalMarks: 0,
    gradePoint: 0,
    letterGrade: "F",
    attendance: 0,
    assignment: 0,
    practical: 0,
  };
}

function recompute(row: Row): Row {
  const attendance = clampNum(row.attendance ?? 0, 0, MAX_ATTENDANCE);
  const assignment = clampNum(row.assignment ?? 0, 0, MAX_ASSIGNMENT);
  const practical = clampNum(row.practical ?? 0, 0, MAX_PRACTICAL);
  const final = clampNum(row.finalMarks ?? 0, 0, MAX_FINAL);
  const internal = round1(attendance + assignment + practical);
  const total = round1(internal + final);
  const grade = gradeFor(total);
  return {
    ...row,
    attendance,
    assignment,
    practical,
    internalMarks: internal,
    finalMarks: final,
    totalMarks: total,
    gradePoint: grade.point,
    letterGrade: grade.letter,
  };
}

function clampNum(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export function GpaView() {
  const { state, go } = useNav();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("predict");
  const [rows, setRows] = useState<Row[]>([newSubject("Engineering Mathematics I", 4), newSubject("Computer Programming", 3), newSubject("Engineering Drawing I", 2)]);
  const [semesterName, setSemesterName] = useState("Semester 1");
  const [semNumber, setSemNumber] = useState(1);
  const [savedSemesters, setSavedSemesters] = useState<SavedSemester[]>([]);

  // reverse-calc state
  const [reverseTarget, setReverseTarget] = useState<{ subjectIdx: number; targetTotal: number }>({
    subjectIdx: 0,
    targetTotal: 80,
  });

  // reduction-detection state (per-subject thresholds)
  const [reductionThreshold, setReductionThreshold] = useState(5);

  // hydrate saved semesters
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedSemesters(getSemesters());
  }, []);

  // refresh when navigated back
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedSemesters(getSemesters());
  }, [state]);

  // ---- Row operations ----
  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? recompute({ ...r, ...patch }) : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, newSubject()]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const resetAll = () => {
    setRows([newSubject()]);
    toast({ title: "Cleared", description: "All subject rows reset." });
  };

  // ---- Derived stats ----
  const stats = useMemo(() => {
    const computed = rows.map(recompute);
    const gpa = gpaForSubjects(computed);
    const totalCredits = computed.reduce((s, x) => s + x.creditHours, 0);
    const totalMarks = computed.reduce((s, x) => s + x.totalMarks, 0);
    const avgMarks = computed.length ? round1(totalMarks / computed.length) : 0;
    const passed = computed.filter((x) => x.letterGrade !== "F").length;
    const failed = computed.length - passed;
    const maxPossible = computed.length * 100;
    return { gpa, totalCredits, totalMarks, avgMarks, passed, failed, maxPossible, computed };
  }, [rows]);

  // Reduction detection
  const reductions = useMemo(() => {
    return stats.computed.map((r, idx) => {
      const maxInternal = MAX_INTERNAL;
      const loss = round1(maxInternal - r.internalMarks);
      const flagged = loss >= reductionThreshold;
      return { row: r, idx, loss, flagged };
    });
  }, [stats, reductionThreshold]);

  // Reverse calculation
  const reverseResult = useMemo(() => {
    const idx = Math.min(reverseTarget.subjectIdx, rows.length - 1);
    const row = stats.computed[idx];
    if (!row) return null;
    const target = clampNum(reverseTarget.targetTotal, 0, 100);
    const requiredFinal = round1(Math.max(0, target - row.internalMarks));
    const feasible = requiredFinal <= MAX_FINAL && requiredFinal >= 0;
    const projectedGrade = gradeFor(target);
    return {
      row,
      target,
      internal: row.internalMarks,
      requiredFinal,
      feasible,
      projectedGrade,
    };
  }, [reverseTarget, rows, stats.computed]);

  // ---- Save semester ----
  const handleSave = () => {
    if (!semesterName.trim()) {
      toast({ title: "Name required", description: "Give your semester a name before saving.", variant: "destructive" });
      return;
    }
    if (rows.length === 0) {
      toast({ title: "No subjects", description: "Add at least one subject row.", variant: "destructive" });
      return;
    }
    const sem: SavedSemester = {
      id: `sem_${Date.now().toString(36)}`,
      name: semesterName.trim(),
      semesterNumber: semNumber,
      subjects: stats.computed,
      gpa: stats.gpa,
      totalMarks: round1(stats.totalMarks),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSemester(sem);
    setSavedSemesters(getSemesters());
    addHistory({
      calculatorId: "percentage", // not a calculator; using nearest id for storage shape
      calculatorName: "IOE Internal Marks Calculator",
      inputs: { semester: sem.name, subjects: sem.subjects.length },
      result: `GPA ${sem.gpa.toFixed(2)} · ${sem.totalMarks}/100`,
      resultValue: sem.gpa,
    });
    toast({
      title: "Semester saved",
      description: `${sem.name} — GPA ${sem.gpa.toFixed(2)}`,
    });
  };

  const handleLoadSemester = (s: SavedSemester) => {
    setRows(s.subjects.map((x) => ({ ...x, id: x.id || `s_${Math.random().toString(36).slice(2, 8)}` })));
    setSemesterName(s.name);
    setSemNumber(s.semesterNumber);
    toast({ title: "Loaded", description: `${s.name} loaded into editor.` });
  };

  const handleDeleteSemester = (id: string) => {
    deleteSemester(id);
    setSavedSemesters(getSemesters());
    toast({ title: "Deleted", description: "Semester record removed." });
  };

  // ---- Tabs ----
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "predict", label: "Internal Marks", icon: <CalcIcon className="h-3.5 w-3.5" /> },
    { id: "reduction", label: "Reduction Detection", icon: <TrendingDown className="h-3.5 w-3.5" /> },
    { id: "reverse", label: "Reverse Calculation", icon: <Target className="h-3.5 w-3.5" /> },
    { id: "gpa", label: "GPA Impact", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="GPA Tools · IOE"
        title="IOE Internal Marks Calculator"
        description="Marksheet-style calculator that mirrors the official IOE internal assessment structure. Internal = Attendance (4) + Assignment (8) + Practical (8), Final = 80. Total = 100. Live calculation, reduction detection, reverse engineering, and GPA impact — all without page reloads."
        meta={
          <span className="flex items-center gap-1.5">
            <Tag tone="primary">Live</Tag>
            <span>·</span>
            <span>Out of 100 per subject</span>
          </span>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ---- Marks Sheet (shared editor) ---- */}
      {tab === "predict" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: input panel — keeps the Bibek layout pattern */}
          <div className="space-y-4">
            <MarksheetEditor
              rows={rows}
              onUpdate={updateRow}
              onAdd={addRow}
              onRemove={removeRow}
              onReset={resetAll}
              semesterName={semesterName}
              semNumber={semNumber}
              onSemesterNameChange={setSemesterName}
              onSemNumberChange={setSemNumber}
              onSave={handleSave}
            />
          </div>

          {/* Right: live results panel */}
          <div className="space-y-4">
            <ResultsPanel stats={stats} rowsCount={rows.length} />
          </div>
        </div>
      )}

      {/* ---- Reduction Detection ---- */}
      {tab === "reduction" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold">Reduction Detection</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Flags subjects where internal marks dropped significantly below the maximum (20).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <FieldLabel hint="0 – 20">Flag threshold (internal marks lost)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={reductionThreshold}
                  onChange={(e) => setReductionThreshold(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Subject</th>
                      <th className="text-right font-medium px-3 py-2">Internal</th>
                      <th className="text-right font-medium px-3 py-2">Lost</th>
                      <th className="text-right font-medium px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reductions.map(({ row, loss, flagged }) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-foreground">{row.name || "—"}</div>
                          <div className="text-[11px] text-muted-foreground">{row.creditHours} cr</div>
                        </td>
                        <td className="px-3 py-2.5 text-right nums tabular-nums">{row.internalMarks}/20</td>
                        <td className="px-3 py-2.5 text-right nums tabular-nums">
                          <span className={cn(loss >= reductionThreshold && "text-[oklch(0.5_0.2_27)] font-medium")}>
                            −{loss}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {flagged ? (
                            <Tag tone="danger">Reduced</Tag>
                          ) : (
                            <Tag tone="success">OK</Tag>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <MarksheetEditor
              rows={rows}
              onUpdate={updateRow}
              onAdd={addRow}
              onRemove={removeRow}
              onReset={resetAll}
              semesterName={semesterName}
              semNumber={semNumber}
              onSemesterNameChange={setSemesterName}
              onSemNumberChange={setSemNumber}
              onSave={handleSave}
              compact
            />
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Summary</h3>
              <div className="space-y-1">
                <ResultLine label="Subjects flagged" value={reductions.filter((r) => r.flagged).length} highlight />
                <ResultLine label="Total internal lost" value={`−${reductions.reduce((s, r) => s + r.loss, 0)}`} unit="marks" />
                <ResultLine label="Avg internal" value={round1(stats.computed.reduce((s, x) => s + x.internalMarks, 0) / Math.max(1, stats.computed.length))} unit="/ 20" />
                <ResultLine label="Threshold" value={reductionThreshold} unit="marks" />
              </div>
            </div>
            <ResultsPanel stats={stats} rowsCount={rows.length} />
          </div>
        </div>
      )}

      {/* ---- Reverse Calculation ---- */}
      {tab === "reverse" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary shrink-0">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Reverse Calculation</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pick a subject, set the target total (out of 100), and we'll tell you the minimum final-exam score needed.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <FieldLabel>Subject</FieldLabel>
                  <select
                    value={reverseTarget.subjectIdx}
                    onChange={(e) => setReverseTarget((s) => ({ ...s, subjectIdx: Number(e.target.value) }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {stats.computed.map((r, idx) => (
                      <option key={r.id} value={idx}>
                        {r.name || `Subject ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel hint="0 – 100">Target total marks</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={reverseTarget.targetTotal}
                    onChange={(e) => setReverseTarget((s) => ({ ...s, targetTotal: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {reverseResult && (
                <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Subject</div>
                    <div className="text-sm font-medium">{reverseResult.row.name || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-md border border-border bg-background p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Internal</div>
                      <div className="text-lg font-semibold nums tabular-nums">{reverseResult.internal}<span className="text-xs text-muted-foreground">/20</span></div>
                    </div>
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-primary">Required Final</div>
                      <div className="text-lg font-semibold text-primary nums tabular-nums">
                        {reverseResult.feasible ? reverseResult.requiredFinal : "—"}
                        <span className="text-xs text-primary/70">/80</span>
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Grade</div>
                      <div className="text-lg font-semibold nums tabular-nums">{reverseResult.projectedGrade.letter}</div>
                      <div className="text-[10px] text-muted-foreground">{reverseResult.projectedGrade.point} GP</div>
                    </div>
                  </div>
                  {!reverseResult.feasible && (
                    <div className="rounded-md border border-[oklch(0.85_0.12_27)] bg-[oklch(0.97_0.05_27)] px-3 py-2 text-xs text-[oklch(0.4_0.18_27)]">
                      Target not achievable — required final ({reverseResult.requiredFinal}/80) exceeds maximum possible.
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Formula: <span className="font-mono">Required Final = Target − Internal</span>
                  </p>
                </div>
              )}
            </div>

            <MarksheetEditor
              rows={rows}
              onUpdate={updateRow}
              onAdd={addRow}
              onRemove={removeRow}
              onReset={resetAll}
              semesterName={semesterName}
              semNumber={semNumber}
              onSemesterNameChange={setSemesterName}
              onSemNumberChange={setSemNumber}
              onSave={handleSave}
              compact
            />
          </div>
          <div className="space-y-4">
            <ResultsPanel stats={stats} rowsCount={rows.length} />
          </div>
        </div>
      )}

      {/* ---- GPA Impact ---- */}
      {tab === "gpa" && (
        <GpaImpact stats={stats} rows={rows} setRows={setRows} recompute={recompute} />
      )}

      {/* Saved semesters */}
      <div className="space-y-4">
        <Divider label="Saved Semesters" />
        {savedSemesters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20">
            <EmptyState
              icon={<Save className="h-4 w-4" />}
              title="No saved semesters yet"
              description="Fill in the marksheet above and click Save Semester to keep a record."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedSemesters.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">Semester {s.semesterNumber} · {s.subjects.length} subjects</div>
                  </div>
                  <Tag tone={s.gpa >= 3 ? "success" : s.gpa >= 2 ? "warning" : "danger"}>
                    {s.gpa.toFixed(2)}
                  </Tag>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Total</div>
                    <div className="nums font-medium tabular-nums">{s.totalMarks}</div>
                  </div>
                  <div className="rounded-md bg-muted/40 px-2 py-1.5">
                    <div className="text-muted-foreground">Avg</div>
                    <div className="nums font-medium tabular-nums">{round1(s.totalMarks / Math.max(1, s.subjects.length))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleLoadSemester(s)}>
                    Load
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-[oklch(0.5_0.2_27)]" onClick={() => handleDeleteSemester(s.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------- Sub-components -----------------

function MarksheetEditor({
  rows,
  onUpdate,
  onAdd,
  onRemove,
  onReset,
  semesterName,
  semNumber,
  onSemesterNameChange,
  onSemNumberChange,
  onSave,
  compact = false,
}: {
  rows: Row[];
  onUpdate: (id: string, patch: Partial<Row>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReset: () => void;
  semesterName: string;
  semNumber: number;
  onSemesterNameChange: (v: string) => void;
  onSemNumberChange: (v: number) => void;
  onSave: () => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header: semester info */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 border-b border-border">
          <div className="flex-1">
            <FieldLabel>Semester name</FieldLabel>
            <Input
              value={semesterName}
              onChange={(e) => onSemesterNameChange(e.target.value)}
              placeholder="e.g. Semester 1"
              className="h-9"
            />
          </div>
          <div className="w-full sm:w-32">
            <FieldLabel>Number</FieldLabel>
            <Input
              type="number"
              min={1}
              max={8}
              value={semNumber}
              onChange={(e) => onSemNumberChange(Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onReset} className="h-9">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button size="sm" onClick={onSave} className="h-9">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Marks sheet */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-muted/40 text-[11px] text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2.5 w-[28%]">Subject</th>
              <th className="text-right font-medium px-2 py-2.5" title="Attendance (out of 4)">Att.</th>
              <th className="text-right font-medium px-2 py-2.5" title="Assignment (out of 8)">Asg.</th>
              <th className="text-right font-medium px-2 py-2.5" title="Practical (out of 8)">Prac.</th>
              <th className="text-right font-medium px-2 py-2.5" title="Internal (out of 20)">Int.</th>
              <th className="text-right font-medium px-2 py-2.5" title="Final (out of 80)">Final</th>
              <th className="text-right font-medium px-2 py-2.5" title="Total (out of 100)">Total</th>
              <th className="text-center font-medium px-2 py-2.5">Grade</th>
              <th className="text-center font-medium px-2 py-2.5">Cr.</th>
              <th className="w-10 px-1 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const computed = recompute(row);
              return (
                <tr key={row.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-1.5">
                    <input
                      value={row.name}
                      onChange={(e) => onUpdate(row.id, { name: e.target.value })}
                      placeholder={`Subject ${idx + 1}`}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <CellInput
                      value={row.attendance ?? 0}
                      max={MAX_ATTENDANCE}
                      onChange={(v) => onUpdate(row.id, { attendance: v })}
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <CellInput
                      value={row.assignment ?? 0}
                      max={MAX_ASSIGNMENT}
                      onChange={(v) => onUpdate(row.id, { assignment: v })}
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <CellInput
                      value={row.practical ?? 0}
                      max={MAX_PRACTICAL}
                      onChange={(v) => onUpdate(row.id, { practical: v })}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right nums tabular-nums text-muted-foreground">
                    {computed.internalMarks}
                  </td>
                  <td className="px-1 py-1.5">
                    <CellInput
                      value={row.finalMarks}
                      max={MAX_FINAL}
                      onChange={(v) => onUpdate(row.id, { finalMarks: v })}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right nums tabular-nums font-semibold">
                    {computed.totalMarks}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <GradePill letter={computed.letterGrade} />
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={8}
                      value={row.creditHours}
                      onChange={(e) => onUpdate(row.id, { creditHours: Number(e.target.value) })}
                      className="w-12 bg-transparent text-center text-sm outline-none nums tabular-nums"
                    />
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <button
                      onClick={() => onRemove(row.id)}
                      disabled={rows.length <= 1}
                      className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                      aria-label="Remove subject"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: add row */}
      <div className="p-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-8 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add subject
        </Button>
      </div>
    </div>
  );
}

function CellInput({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(clampNum(Number(e.target.value), 0, max))}
      className={cn(
        "w-16 h-7 text-right bg-transparent text-sm outline-none rounded px-1.5 nums tabular-nums",
        "hover:bg-muted/60 focus:bg-muted focus:ring-1 focus:ring-ring",
      )}
    />
  );
}

function GradePill({ letter }: { letter: string }) {
  const tone =
    letter.startsWith("A")
      ? "success"
      : letter.startsWith("B")
        ? "primary"
        : letter.startsWith("C")
          ? "warning"
          : "danger";
  return <Tag tone={tone as any}>{letter}</Tag>;
}

function ResultsPanel({
  stats,
  rowsCount,
}: {
  stats: ReturnType<typeof useStatsType>;
  rowsCount: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 sticky top-20">
      <div>
        <h3 className="text-sm font-semibold mb-0.5">Live Results</h3>
        <p className="text-[11px] text-muted-foreground">Updates as you type.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatFigure label="GPA" value={stats.gpa.toFixed(2)} unit="/ 4.0" tone={stats.gpa >= 3 ? "success" : stats.gpa >= 2 ? "warning" : "danger"} />
        <StatFigure label="Average" value={stats.avgMarks} unit="/ 100" tone="primary" />
      </div>

      <div className="space-y-1">
        <ResultLine label="Subjects" value={rowsCount} />
        <ResultLine label="Total credits" value={stats.totalCredits} />
        <ResultLine label="Total marks" value={stats.totalMarks} unit={`/ ${rowsCount * 100}`} />
        <ResultLine label="Passed" value={stats.passed} highlight />
        <ResultLine label="Failed" value={stats.failed} highlight={stats.failed > 0} />
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">IOE Grading Scale</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          {IOE_GRADING_SCALE.slice().reverse().map((g) => (
            <div key={g.letter} className="flex items-center justify-between">
              <span className="text-muted-foreground">{g.letter}</span>
              <span className="nums tabular-nums text-foreground">{g.min}–{g.max} · {g.point}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper type hook (avoids circular type)
function useStatsType() {
  return {
    gpa: 0,
    totalCredits: 0,
    totalMarks: 0,
    avgMarks: 0,
    passed: 0,
    failed: 0,
    maxPossible: 0,
    computed: [] as SubjectEntry[],
  };
}

function GpaImpact({
  stats,
  rows,
  setRows,
  recompute: _recompute,
}: {
  stats: ReturnType<typeof useStatsType>;
  rows: Row[];
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
  recompute: (r: Row) => Row;
}) {
  const { toast } = useToast();
  // Simulate: what if all final marks increased by N points?
  const [bump, setBump] = useState(5);

  const simulation = useMemo(() => {
    const sim = rows.map((r) => {
      const newFinal = clampNum(r.finalMarks + bump, 0, MAX_FINAL);
      return recompute({ ...r, finalMarks: newFinal });
    });
    return {
      newGpa: gpaForSubjects(sim),
      newAvg: round1(sim.reduce((s, x) => s + x.totalMarks, 0) / Math.max(1, sim.length)),
    };
  }, [rows, bump]);

  const delta = round1(simulation.newGpa - stats.gpa);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">GPA Impact Analysis</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simulate how improving your final-exam marks across all subjects would affect your semester GPA.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <FieldLabel hint={`+${bump} marks per subject final`}>Improvement scenario</FieldLabel>
            <input
              type="range"
              min={0}
              max={20}
              value={bump}
              onChange={(e) => setBump(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>+0</span>
              <span>+10</span>
              <span>+20</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current GPA</div>
              <div className="text-lg font-semibold nums tabular-nums">{stats.gpa.toFixed(2)}</div>
            </div>
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-primary">Projected GPA</div>
              <div className="text-lg font-semibold text-primary nums tabular-nums">{simulation.newGpa.toFixed(2)}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Delta</div>
              <div className={cn("text-lg font-semibold nums tabular-nums", delta > 0 ? "text-[oklch(0.45_0.13_150)]" : delta < 0 ? "text-[oklch(0.5_0.2_27)]" : "text-muted-foreground")}>
                {delta > 0 ? "+" : ""}{delta.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Insight:</span> Improving every final-exam score by {bump} marks would raise your GPA by ~{delta.toFixed(2)} points. Average mark rises from <span className="nums font-medium text-foreground">{stats.avgMarks}</span> to <span className="nums font-medium text-foreground">{simulation.newAvg}</span>.
          </div>
        </div>

        <MarksheetEditor
          rows={rows}
          onUpdate={(id, patch) => setRows((prev) => prev.map((r) => (r.id === id ? recompute({ ...r, ...patch }) : r)))}
          onAdd={() => setRows((prev) => [...prev, newSubject()])}
          onRemove={(id) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))}
          onReset={() => {
            setRows([newSubject()]);
            toast({ title: "Cleared" });
          }}
          semesterName={""}
          semNumber={1}
          onSemesterNameChange={() => {}}
          onSemNumberChange={() => {}}
          onSave={() => {}}
          compact
        />
      </div>
      <div className="space-y-4">
        <ResultsPanel stats={stats} rowsCount={rows.length} />
      </div>
    </div>
  );
}
