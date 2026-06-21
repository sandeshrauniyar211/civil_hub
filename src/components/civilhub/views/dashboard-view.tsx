"use client";

// CivilHub — Student Dashboard.
// Analytical, not decorative. Shows CGPA, recent calculations, saved semesters, performance overview.

import { useEffect, useMemo, useState } from "react";
import {
  Calculator as CalcIcon,
  GraduationCap,
  Save,
  TrendingUp,
  History,
  ArrowRight,
  BookOpen,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNav } from "../lib/nav";
import { SectionHeader, StatFigure, EmptyState, Tag, QuietLink } from "../lib/ui";
import { useCivilStore, getHistory, getSemesters } from "../lib/storage";
import { CATEGORY_LABELS } from "../lib/registry";

export function DashboardView() {
  const { go, openCalculator } = useNav();
  const [history] = useCivilStore(getHistory, []);
  const [semesters] = useCivilStore(getSemesters, []);

  // Aggregate stats
  const stats = useMemo(() => {
    const safeSems = semesters.filter((s) => Array.isArray(s.subjects));
    const currentGpa = safeSems.length
      ? round(
          safeSems.reduce((s, x) => s + (x.gpa || 0) * x.subjects.reduce((a, b) => a + (b.creditHours || 0), 0), 0) /
            Math.max(1, safeSems.reduce((s, x) => s + x.subjects.reduce((a, b) => a + (b.creditHours || 0), 0), 0)),
          2,
        )
      : 0;
    const totalCredits = safeSems.reduce(
      (s, x) => s + x.subjects.reduce((a, b) => a + (b.creditHours || 0), 0),
      0,
    );
    const totalSubjects = safeSems.reduce((s, x) => s + x.subjects.length, 0);
    const bestSemester = safeSems.length
      ? safeSems.reduce((best, s) => ((s.gpa || 0) > (best.gpa || 0) ? s : best), safeSems[0])
      : null;
    const calcCount = history.length;
    return { currentGpa, totalCredits, totalSubjects, bestSemester, calcCount };
  }, [history, semesters]);

  // Per-semester mini chart data
  const chartData = useMemo(() => {
    return semesters
      .filter((s) => Array.isArray(s.subjects) && typeof s.gpa === "number")
      .slice()
      .sort((a, b) => a.semesterNumber - b.semesterNumber)
      .slice(-8)
      .map((s) => ({ name: `S${s.semesterNumber}`, gpa: s.gpa }));
  }, [semesters]);

  // Recently used calculators (deduped, last 5)
  const recentCalcs = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; name: string; ts: number }[] = [];
    for (const h of history) {
      if (!h?.calculatorId) continue;
      if (seen.has(h.calculatorId)) continue;
      seen.add(h.calculatorId);
      out.push({ id: h.calculatorId, name: h.calculatorName, ts: h.createdAt });
      if (out.length >= 5) break;
    }
    return out;
  }, [history]);

  const calcByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of history) {
      if (!h?.calculatorId) continue;
      map.set(h.calculatorId, (map.get(h.calculatorId) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [history]);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Dashboard"
        title="Engineering Overview"
        description="Your cumulative GPA, calculation history, and saved semester records — all in one analytical view."
        meta={<span>Guest mode · Stored locally</span>}
      />

      {/* Top stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="Current CGPA"
          value={stats.currentGpa.toFixed(2)}
          unit="/ 4.0"
          tone={stats.currentGpa >= 3 ? "success" : stats.currentGpa >= 2 ? "warning" : "default"}
          onClick={() => go("gpa")}
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Total credits"
          value={stats.totalCredits}
          onClick={() => go("gpa")}
        />
        <StatCard
          icon={<Save className="h-4 w-4" />}
          label="Saved semesters"
          value={semesters.length}
          onClick={() => go("gpa")}
        />
        <StatCard
          icon={<CalcIcon className="h-4 w-4" />}
          label="Calculations run"
          value={stats.calcCount}
          onClick={() => go("calculators")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPA progression */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">GPA Progression</h3>
              <p className="text-xs text-muted-foreground mt-0.5">CGPA across saved semesters</p>
            </div>
            <QuietLink onClick={() => go("gpa")}>Open GPA tools</QuietLink>
          </div>
          {chartData.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-4 w-4" />}
              title="No semester data yet"
              description="Save your first semester in the IOE Internal Marks Calculator to see progression here."
              action={
                <QuietLink onClick={() => go("gpa")}>
                  Open GPA tools
                </QuietLink>
              }
            />
          ) : (
            <MiniBarChart data={chartData} />
          )}
        </div>

        {/* Best semester */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-[oklch(0.5_0.13_150)]" />
            <h3 className="text-sm font-semibold">Best Semester</h3>
          </div>
          {stats.bestSemester ? (
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-semibold nums tabular-nums text-foreground">
                  {stats.bestSemester.gpa.toFixed(2)}
                  <span className="text-sm text-muted-foreground font-normal"> / 4.0</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{stats.bestSemester.name}</div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subjects</span>
                  <span className="nums tabular-nums">{stats.bestSemester.subjects.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total marks</span>
                  <span className="nums tabular-nums">{stats.bestSemester.totalMarks} / {stats.bestSemester.subjects.length * 100}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Average</span>
                  <span className="nums tabular-nums">{round(stats.bestSemester.totalMarks / Math.max(1, stats.bestSemester.subjects.length), 1)}</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Award className="h-4 w-4" />}
              title="No data"
              description="Save a semester to see your best performance here."
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent calculations */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Recent Calculations</h3>
            </div>
            <QuietLink onClick={() => go("calculators")}>All tools</QuietLink>
          </div>
          {recentCalcs.length === 0 ? (
            <EmptyState
              icon={<CalcIcon className="h-4 w-4" />}
              title="No calculations yet"
              description="Run any calculator and it will appear here for quick re-access."
              action={<QuietLink onClick={() => go("calculators")}>Browse calculators</QuietLink>}
            />
          ) : (
            <div className="space-y-1">
              {recentCalcs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openCalculator(c.id as any)}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shrink-0">
                    <CalcIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(c.ts).toLocaleString()}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Calculator usage */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Tool Usage</h3>
          </div>
          {calcByCategory.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-4 w-4" />}
              title="No usage data yet"
              description="Your calculator usage will appear here once you start using tools."
            />
          ) : (
            <div className="space-y-2">
              {calcByCategory.map(({ id, count }) => {
                const max = calcByCategory[0].count;
                const pct = (count / max) * 100;
                return (
                  <div key={id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-medium">{id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                      <span className="nums tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick access tiles */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Quick Access</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: "IOE Marks", icon: <GraduationCap className="h-4 w-4" />, view: "gpa" as const },
            { label: "Surveying", icon: <BookOpen className="h-4 w-4" />, view: "surveying" as const },
            { label: "Calculators", icon: <CalcIcon className="h-4 w-4" />, view: "calculators" as const },
            { label: "Estimation", icon: <Save className="h-4 w-4" />, view: "estimation" as const },
            { label: "Resources", icon: <BookOpen className="h-4 w-4" />, view: "resources" as const },
            { label: "Search", icon: <CalcIcon className="h-4 w-4" />, view: "dashboard" as const },
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => go(t.view)}
              className="group flex flex-col items-start gap-2 p-3 rounded-lg border border-border bg-card hover:border-foreground/20 hover:bg-muted/30 transition-all"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {t.icon}
              </div>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  tone = "default",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: "default" | "success" | "warning" | "danger";
  onClick?: () => void;
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-[oklch(0.45_0.13_150)]",
    warning: "text-[oklch(0.5_0.15_75)]",
    danger: "text-[oklch(0.5_0.2_27)]",
  }[tone];

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border border-border bg-card p-4 hover:border-foreground/20 hover:bg-muted/30 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          {icon}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-semibold nums tabular-nums", toneClass)}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </button>
  );
}

function MiniBarChart({ data }: { data: { name: string; gpa: number }[] }) {
  const maxGpa = 4;
  return (
    <div className="flex items-end justify-between gap-2 h-32 pt-2">
      {data.map((d, idx) => {
        const h = (d.gpa / maxGpa) * 100;
        const tone = d.gpa >= 3 ? "bg-[oklch(0.55_0.13_150)]" : d.gpa >= 2 ? "bg-[oklch(0.7_0.15_75)]" : "bg-[oklch(0.55_0.18_27)]";
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div className="text-[11px] font-medium nums tabular-nums text-foreground">{d.gpa.toFixed(2)}</div>
            <div className="w-full max-w-[40px] bg-muted rounded-md overflow-hidden" style={{ height: "100%" }}>
              <div
                className={cn("w-full rounded-md transition-all", tone)}
                style={{ height: `${h}%`, marginTop: `${100 - h}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground">{d.name}</div>
          </div>
        );
      })}
    </div>
  );
}

function round(v: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}
