"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

export function WaterCementRatioCalc({ calc }: { calc: CalcMeta }) {
  const [cement, setCement] = useState(425); // kg
  const [ratio, setRatio] = useState(0.5);
  const [solveFor, setSolveFor] = useState<"water" | "cement" | "ratio">("water");

  const [water, setWater] = useState(212.5);

  const result = (() => {
    if (solveFor === "water") return cement * ratio;
    if (solveFor === "cement") return ratio > 0 ? water / ratio : 0;
    return cement > 0 ? water / cement : 0;
  })();

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={solveFor === "water" ? `Water = ${fmt(result)} kg` : solveFor === "cement" ? `Cement = ${fmt(result)} kg` : `w/c = ${fmt(result, 3)}`}
      inputs={
        <div className="space-y-3">
          <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/40">
            {(["water", "cement", "ratio"] as const).map((s) => (
              <button key={s} onClick={() => setSolveFor(s)} className={`px-3 py-1 text-xs font-medium rounded capitalize ${solveFor === s ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}>
                Solve {s}
              </button>
            ))}
          </div>
          <FieldGrid cols={2}>
            {solveFor !== "cement" && <NumberField label="Cement" value={cement} onChange={setCement} unit="kg" />}
            {solveFor !== "water" && <NumberField label="Water" value={water} onChange={setWater} unit="kg" />}
            {solveFor !== "ratio" && <NumberField label="w/c ratio" value={ratio} onChange={setRatio} step={0.05} hint="0.35 – 0.6" />}
          </FieldGrid>
        </div>
      }
      formula={<FormulaBlock>W = C × (w/c)   ·   w/c = W / C</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          {solveFor === "water" && <li>W = {cement} × {ratio} = <span className="text-foreground font-medium">{round(result, 3)} kg</span></li>}
          {solveFor === "cement" && <li>C = {water} / {ratio} = <span className="text-foreground font-medium">{round(result, 3)} kg</span></li>}
          {solveFor === "ratio" && <li>w/c = {water} / {cement} = <span className="text-foreground font-medium">{round(result, 4)}</span></li>}
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine
            label={solveFor === "water" ? "Water" : solveFor === "cement" ? "Cement" : "w/c ratio"}
            value={fmt(result, solveFor === "ratio" ? 3 : 2)}
            unit={solveFor === "ratio" ? "" : "kg"}
            highlight
          />
          {solveFor === "water" && (
            <>
              <ResultLine label="Water in litres" value={fmt(result, 1)} unit="L" />
              <ResultLine label="Status" value={ratio <= 0.55 ? "Good" : "High — strength loss"} />
            </>
          )}
        </div>
      }
      notes={<p>Typical w/c range: 0.40–0.55 for structural concrete. Lower = stronger but less workable. IS 456 caps w/c at 0.55 for RCC exposed to mild environment.</p>}
    />
  );
}
