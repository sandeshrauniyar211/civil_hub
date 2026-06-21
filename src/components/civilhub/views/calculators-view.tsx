"use client";

// CivilHub — Engineering Calculators hub.
// Sidebar with categories, calculator content area, and result panel.
// Linear / Notion-style sidebar.

import { useMemo, useState } from "react";
import { ChevronRight, Calculator as CalcIcon, Star, History, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNav } from "../lib/nav";
import {
  CALCULATORS,
  calculatorsByCategory,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
} from "../lib/registry";
import type { CalcMeta, CalculatorCategory, CalculatorId } from "../lib/types";
import { useCivilStore, getHistory, removeHistory, clearHistory } from "../lib/storage";
import { SectionHeader, EmptyState, Tag } from "../lib/ui";
import { CalculatorRouter } from "../calculators/router";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_ORDER: CalculatorCategory[] = [
  "basic",
  "civil",
  "structural",
  "hydraulics",
  "transportation",
  "geotechnical",
];

const CATEGORY_ICONS: Record<CalculatorCategory, React.ReactNode> = {
  basic: <CalcIcon className="h-3.5 w-3.5" />,
  civil: <CalcIcon className="h-3.5 w-3.5" />,
  structural: <CalcIcon className="h-3.5 w-3.5" />,
  hydraulics: <CalcIcon className="h-3.5 w-3.5" />,
  transportation: <CalcIcon className="h-3.5 w-3.5" />,
  geotechnical: <CalcIcon className="h-3.5 w-3.5" />,
};

export function CalculatorsView() {
  const { state, openCalculator } = useNav();
  const { toast } = useToast();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const grouped = useMemo(() => calculatorsByCategory(), []);
  const activeCalc = state.calculatorId
    ? CALCULATORS.find((c) => c.id === state.calculatorId)
    : undefined;

  const [history] = useCivilStore(getHistory, []);

  const handleClearHistory = () => {
    clearHistory();
    toast({ title: "History cleared" });
  };

  const handleSelect = (id: CalculatorId) => {
    openCalculator(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        eyebrow="Calculators"
        title="Engineering Calculators Suite"
        description="A comprehensive toolkit for civil engineering coursework and fieldwork. Real-time calculation, formula explanations, step-by-step solutions, and exportable history — all client-side."
        meta={
          <span className="flex items-center gap-1.5">
            <Tag tone="primary">{CALCULATORS.length} tools</Tag>
            <span>·</span>
            <span>{CATEGORY_ORDER.length} categories</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <CalculatorSidebar
            grouped={grouped}
            activeId={state.calculatorId}
            onSelect={handleSelect}
            onShowHistory={() => setShowHistory(true)}
            historyCount={history.length}
          />
        </aside>

        {/* Mobile sidebar trigger */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileSidebarOpen(true)}
            className="w-full justify-start"
          >
            <CalcIcon className="h-4 w-4 mr-2" />
            {activeCalc ? activeCalc.name : "Browse calculators"}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>

        {/* Main content */}
        <main className="min-w-0">
          {activeCalc ? (
            <div className="animate-fade-in">
              <CalculatorRouter calc={activeCalc} />
            </div>
          ) : (
            <CalculatorHub grouped={grouped} onSelect={handleSelect} />
          )}
        </main>
      </div>

      {/* Mobile sidebar sheet */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-[280px] max-w-[80vw] bg-background border-r border-border overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-semibold">Calculators</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <CalculatorSidebar
              grouped={grouped}
              activeId={state.calculatorId}
              onSelect={handleSelect}
              onShowHistory={() => {
                setShowHistory(true);
                setMobileSidebarOpen(false);
              }}
              historyCount={history.length}
              flat
            />
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-popover shadow-soft-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 h-12 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Calculation History</span>
                <Tag tone="neutral">{history.length}</Tag>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={handleClearHistory}>
                    <Trash2 className="h-3 w-3 mr-1.5" />
                    Clear all
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowHistory(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin p-2">
              {history.length === 0 ? (
                <EmptyState
                  icon={<History className="h-4 w-4" />}
                  title="No history yet"
                  description="Run any calculation and it'll show up here for quick reference."
                />
              ) : (
                <div className="space-y-1">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted/60 transition-colors group">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shrink-0">
                        <CalcIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{h.calculatorName}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {new Date(h.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {Object.entries(h.inputs).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </div>
                        <div className="text-xs text-foreground font-medium mt-0.5">{h.result}</div>
                      </div>
                      <button
                        onClick={() => {
                          removeHistory(h.id);
                          toast({ title: "Removed" });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-[oklch(0.5_0.2_27)] transition-all"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalculatorSidebar({
  grouped,
  activeId,
  onSelect,
  onShowHistory,
  historyCount,
  flat = false,
}: {
  grouped: Record<CalculatorCategory, CalcMeta[]>;
  activeId?: CalculatorId;
  onSelect: (id: CalculatorId) => void;
  onShowHistory: () => void;
  historyCount: number;
  flat?: boolean;
}) {
  return (
    <div className={cn(!flat && "sticky top-20")}>
      <div className="space-y-1">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat];
          return (
            <div key={cat} className="mb-1">
              <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {CATEGORY_ICONS[cat]}
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="space-y-0.5">
                {items.map((c) => {
                  const active = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c.id)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-colors flex items-center justify-between gap-2",
                        active
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <span className="truncate">{c.name}</span>
                      {active && <ChevronRight className="h-3 w-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="pt-2 mt-2 border-t border-border">
          <button
            onClick={onShowHistory}
            className="w-full text-left px-2.5 py-1.5 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              History
            </span>
            {historyCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CalculatorHub({
  grouped,
  onSelect,
}: {
  grouped: Record<CalculatorCategory, CalcMeta[]>;
  onSelect: (id: CalculatorId) => void;
}) {
  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        return (
          <section key={cat}>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-foreground">{CATEGORY_LABELS[cat]}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{CATEGORY_DESCRIPTIONS[cat]}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className="group text-left rounded-lg border border-border bg-card hover:border-foreground/20 hover:bg-muted/30 transition-all p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                      <CalcIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                        {c.description}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
