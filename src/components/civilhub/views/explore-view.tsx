"use client";

// CivilHub — Explore view (Phase 2 feature discovery)
//
// The platform has 30+ calculators across 6 categories plus surveying, GPA, and
// estimation modules. The Explore view is the "map of the ocean" — it groups
// everything by what the student is actually trying to do (use-cases like
// "Coursework", "Site work", "Lab", "Exam prep", etc.) so they can find the
// right tool in seconds, not minutes.
//
// Layout:
//   1. Hero with quick filters (chips)
//   2. Popular tools strip (most-reached-for calculators)
//   3. Use-case cards → expand to show matching tools
//   4. Browse-by-category grid (the classic way)
//   5. Recently used (from localStorage history)

import { useMemo, useState } from "react";
import {
  Compass,
  Calculator as CalcIcon,
  GraduationCap,
  Compass as CompassIcon,
  FolderTree,
  BookOpen,
  HardHat,
  FlaskConical,
  PencilRuler,
  ClipboardList,
  Trophy,
  FileText,
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNav } from "../lib/nav";
import {
  CALCULATORS,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  USE_CASE_LABELS,
  USE_CASE_DESCRIPTIONS,
  calculatorsByCategory,
  calculatorsByUseCase,
  getPopularCalculators,
  type UseCaseId,
  type CalcMetaExt,
} from "../lib/registry";
import { SectionHeader, Tag, EmptyState, QuietLink } from "../lib/ui";
import { useCivilStore, getHistory } from "../lib/storage";

const USE_CASE_ICONS: Record<UseCaseId, React.ReactNode> = {
  coursework: <BookOpen className="h-4 w-4" />,
  "site-work": <HardHat className="h-4 w-4" />,
  estimating: <ClipboardList className="h-4 w-4" />,
  design: <PencilRuler className="h-4 w-4" />,
  "field-survey": <Compass className="h-4 w-4" />,
  "exam-prep": <Trophy className="h-4 w-4" />,
  lab: <FlaskConical className="h-4 w-4" />,
  thesis: <FileText className="h-4 w-4" />,
};

// Non-calculator destinations surfaced as "tools" in Explore
const FEATURED_MODULES = [
  {
    id: "ioe-marks",
    title: "IOE Internal Marks Calculator",
    description: "Compute semester GPA from internal + final marks using the IOE grading scale.",
    icon: <GraduationCap className="h-4 w-4" />,
    useCases: ["coursework", "exam-prep"] as UseCaseId[],
    action: { view: "gpa" as const },
  },
  {
    id: "surveying",
    title: "Surveying Toolkit",
    description: "Rise & Fall, HI Method, RL, and Bearing calcs — now with Excel import.",
    icon: <CompassIcon className="h-4 w-4" />,
    useCases: ["field-survey", "coursework", "thesis"] as UseCaseId[],
    action: { view: "surveying" as const },
  },
  {
    id: "estimation",
    title: "Estimation & BOQ",
    description: "Quantity takeoffs and bill-of-quantities helpers for rate analysis.",
    icon: <FolderTree className="h-4 w-4" />,
    useCases: ["estimating", "site-work", "thesis"] as UseCaseId[],
    action: { view: "estimation" as const },
  },
  {
    id: "dashboard",
    title: "Student Dashboard",
    description: "CGPA progression, recent calculations, and saved semesters at a glance.",
    icon: <TrendingUp className="h-4 w-4" />,
    useCases: ["coursework", "exam-prep"] as UseCaseId[],
    action: { view: "dashboard" as const },
  },
];

export function ExploreView() {
  const { go, openCalculator } = useNav();
  const [history] = useCivilStore(getHistory, []);
  const [activeFilter, setActiveFilter] = useState<UseCaseId | "all" | "popular">("all");

  const byUseCase = useMemo(() => calculatorsByUseCase(), []);
  const byCategory = useMemo(() => calculatorsByCategory(), []);
  const popular = useMemo(() => getPopularCalculators(), []);

  // Recently used calculator IDs (deduped, last 4)
  const recentIds = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const h of history) {
      if (!h?.calculatorId || seen.has(h.calculatorId)) continue;
      seen.add(h.calculatorId);
      out.push(h.calculatorId);
      if (out.length >= 4) break;
    }
    return out;
  }, [history]);

  const recentCalcs = recentIds
    .map((id) => CALCULATORS.find((c) => c.id === id))
    .filter(Boolean) as CalcMetaExt[];

  const filters: { id: UseCaseId | "all" | "popular"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "popular", label: "Popular" },
    ...(Object.keys(USE_CASE_LABELS) as UseCaseId[]).map((uc) => ({
      id: uc,
      label: USE_CASE_LABELS[uc],
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Explore"
        title="Find the right tool, fast"
        description="30+ calculators plus surveying, GPA, and estimation. Browse by what you're trying to do — coursework, site work, lab, design — or scroll the full list by category."
        meta={<Tag tone="primary">{CALCULATORS.length} calculators · 4 modules</Tag>}
      />

      {/* Quick filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {filters.map((f) => {
          const active = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Popular tools strip */}
      {(activeFilter === "all" || activeFilter === "popular") && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Most-used tools</h2>
            <span className="text-[11px] text-muted-foreground">— the 8 tools that get opened 80% of the time</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {popular.map((c) => (
              <ToolCard
                key={c.id}
                title={c.name}
                description={c.description}
                categoryLabel={CATEGORY_LABELS[c.category]}
                icon={<CalcIcon className="h-4 w-4" />}
                onClick={() => openCalculator(c.id as any)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently used (only if any) */}
      {recentCalcs.length > 0 && activeFilter === "all" && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Pick up where you left off</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentCalcs.map((c) => (
              <ToolCard
                key={c.id}
                title={c.name}
                description={c.description}
                categoryLabel={CATEGORY_LABELS[c.category]}
                icon={<CalcIcon className="h-4 w-4" />}
                onClick={() => openCalculator(c.id as any)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Use-case sections */}
      {activeFilter !== "popular" ? (
        <>
          <div className="flex items-center gap-2 pt-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Browse by what you're doing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(USE_CASE_LABELS) as UseCaseId[])
              .filter((uc) => activeFilter === "all" || activeFilter === uc)
              .map((uc) => {
                const calcs = byUseCase[uc];
                const modules = FEATURED_MODULES.filter((m) => m.useCases.includes(uc));
                return (
                  <UseCaseCard
                    key={uc}
                    useCase={uc}
                    calculators={calcs}
                    modules={modules}
                    onOpenCalc={(id) => openCalculator(id as any)}
                    onOpenModule={(view) => go(view)}
                  />
                );
              })}
          </div>
        </>
      ) : null}

      {/* Browse by category — full grid */}
      <section className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Browse by category</h2>
          <span className="text-[11px] text-muted-foreground">— the classic taxonomic view</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(byCategory) as (keyof typeof byCategory)[]).map((cat) => {
            const calcs = byCategory[cat];
            // Hide categories that don't match the active use-case filter
            const visibleCalcs =
              activeFilter === "all" || activeFilter === "popular"
                ? calcs
                : calcs.filter((c) => c.useCases?.includes(activeFilter as UseCaseId));
            if (visibleCalcs.length === 0) return null;
            return (
              <div
                key={cat}
                className="rounded-lg border border-border bg-card p-4 hover:border-foreground/20 transition-colors"
              >
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">{CATEGORY_LABELS[cat]}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {CATEGORY_DESCRIPTIONS[cat]}
                  </p>
                </div>
                <ul className="space-y-0.5">
                  {visibleCalcs.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => openCalculator(c.id as any)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 text-left transition-colors group"
                      >
                        <CalcIcon className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
                        <span className="text-xs font-medium text-foreground flex-1 truncate">{c.name}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Search prompt */}
      <section className="rounded-lg border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shrink-0">
          <Search className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Still can't find it?</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Press <kbd className="text-[10px] font-mono px-1 py-0.5 rounded border border-border bg-background">⌘K</kbd> (or <kbd className="text-[10px] font-mono px-1 py-0.5 rounded border border-border bg-background">Ctrl+K</kbd>) anywhere to open the command palette and search every calculator, formula, and module by name or keyword.
          </p>
        </div>
      </section>
    </div>
  );
}

// ============ ToolCard ============

function ToolCard({
  title,
  description,
  categoryLabel,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  categoryLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-lg border border-border bg-card p-3 hover:border-foreground/20 hover:bg-muted/30 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground truncate">
          {categoryLabel}
        </span>
      </div>
      <div className="text-sm font-medium text-foreground mb-0.5 leading-tight">{title}</div>
      <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{description}</div>
    </button>
  );
}

// ============ UseCaseCard ============

function UseCaseCard({
  useCase,
  calculators,
  modules,
  onOpenCalc,
  onOpenModule,
}: {
  useCase: UseCaseId;
  calculators: CalcMetaExt[];
  modules: typeof FEATURED_MODULES;
  onOpenCalc: (id: string) => void;
  onOpenModule: (view: "gpa" | "surveying" | "estimation" | "dashboard") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalItems = calculators.length + modules.length;
  const previewCalcs = calculators.slice(0, 4);
  const restCalcs = calculators.slice(4);

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shrink-0">
          {USE_CASE_ICONS[useCase]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{USE_CASE_LABELS[useCase]}</h3>
            <Tag tone="neutral">{totalItems}</Tag>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {USE_CASE_DESCRIPTIONS[useCase]}
          </p>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => onOpenModule(m.action.view)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/5 border border-primary/15 bg-primary/[0.03] text-left transition-colors group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary shrink-0">
              {m.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{m.title}</div>
              <div className="text-[10px] text-muted-foreground truncate">{m.description}</div>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
          </button>
        ))}
      </div>

      {previewCalcs.length > 0 && (
        <div className="space-y-0.5">
          {previewCalcs.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpenCalc(c.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 text-left transition-colors group"
            >
              <CalcIcon className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground flex-1 truncate">{c.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{CATEGORY_LABELS[c.category].split(" ")[0]}</span>
            </button>
          ))}

          {restCalcs.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-left px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? "− Hide" : `+ ${restCalcs.length} more`}
            </button>
          )}

          {expanded &&
            restCalcs.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenCalc(c.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 text-left transition-colors group animate-fade-in"
              >
                <CalcIcon className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground flex-1 truncate">{c.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{CATEGORY_LABELS[c.category].split(" ")[0]}</span>
              </button>
            ))}
        </div>
      )}

      {totalItems === 0 && (
        <EmptyState
          icon={<Compass className="h-4 w-4" />}
          title="No tools here yet"
          description="This use-case doesn't have any tools tagged yet."
        />
      )}
    </div>
  );
}
