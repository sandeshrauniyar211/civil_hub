"use client";

// CivilHub — calculator primitives shared across all calculators.
// Standard layout: header + 2-col grid (inputs left, results right).

import { useState, type ReactNode } from "react";
import { Save, RotateCcw, Info, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SectionHeader, FormulaBlock, ResultLine, Divider, FieldLabel } from "../lib/ui";
import type { CalcMeta, CalculatorId } from "../lib/types";
import { addHistory } from "../lib/storage";

export interface CalcProps<TInputs extends Record<string, string | number>> {
  calc: CalcMeta;
}

export function CalculatorShell({
  calc,
  inputs,
  results,
  formula,
  steps,
  notes,
  onReset,
  onSaveResult,
  resultSummary,
}: {
  calc: CalcMeta;
  inputs: ReactNode;
  results: ReactNode;
  formula?: ReactNode;
  steps?: ReactNode;
  notes?: ReactNode;
  onReset?: () => void;
  onSaveResult?: (inputs: Record<string, string | number>, result: string, resultValue?: number, unit?: string) => void;
  resultSummary?: string;
}) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!onSaveResult) return;
    // we don't actually know the inputs here — the parent should pass them through onSaveResult
    // We're just providing the UI; parent wires up real data.
    onSaveResult({}, resultSummary ?? "", undefined, undefined);
    addHistory({
      calculatorId: calc.id as CalculatorId,
      calculatorName: calc.name,
      inputs: {},
      result: resultSummary ?? "",
    });
    setSaved(true);
    toast({ title: "Saved to history", description: calc.name });
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow={`Calculators · ${calc.category}`}
        title={calc.name}
        description={calc.description}
        meta={
          <div className="flex items-center gap-1.5">
            {onReset && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onReset}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            {onSaveResult && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSave}>
                <Save className="h-3 w-3 mr-1" />
                {saved ? "Saved" : "Save"}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: inputs */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Inputs
            </h3>
            {inputs}
          </div>

          {formula && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                Formula
              </h3>
              {formula}
            </div>
          )}

          {steps && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                Step-by-step
              </h3>
              {steps}
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 sticky top-20">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Results
            </h3>
            {results}
            {resultSummary && (
              <>
                <Divider />
                <div className="mt-3 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 inline mr-1" />
                  {resultSummary}
                </div>
              </>
            )}
          </div>

          {notes && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
              {notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Re-export for convenience
export { FormulaBlock, ResultLine, FieldLabel };
