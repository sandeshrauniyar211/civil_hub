"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock, Tag } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Simplified USCS classification from % fines, LL, PI
export function SoilClassificationCalc({ calc }: { calc: CalcMeta }) {
  const [fines, setFines] = useState(35); // % passing #200 sieve
  const [liquidLimit, setLiquidLimit] = useState(45);
  const [plasticIndex, setPlasticIndex] = useState(20);

  const isFine = fines >= 50;
  // Coarse: gravel vs sand split at #4 (4.75 mm) — assume known
  // Fine: ML/CL/MH/CH based on LL and PI

  let group = "";
  let name = "";
  if (isFine) {
    const aboveA = plasticIndex >= 0.73 * (liquidLimit - 20);
    const highLL = liquidLimit >= 50;
    if (aboveA && highLL) {
      group = "CH";
      name = "Inorganic clay, high plasticity";
    } else if (aboveA && !highLL) {
      group = "CL";
      name = "Inorganic clay, low plasticity";
    } else if (!aboveA && highLL) {
      group = "MH";
      name = "Inorganic silt, high plasticity";
    } else {
      group = "ML";
      name = "Inorganic silt, low plasticity";
    }
  } else {
    // Coarse-grained — use PI for grading
    group = plasticIndex > 7 ? "SC/SC-SM" : "SM/SP-SM";
    name = plasticIndex > 7 ? "Clayey sand" : "Silty sand";
  }

  const activity = plasticIndex / Math.max(1, fines);
  const uscsChartPos = liquidLimit;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${group} — ${name}`}
      inputs={
        <FieldGrid cols={3}>
          <NumberField label="Fines (% < #200)" value={fines} onChange={setFines} unit="%" />
          <NumberField label="Liquid limit (LL)" value={liquidLimit} onChange={setLiquidLimit} unit="%" />
          <NumberField label="Plasticity index (PI)" value={plasticIndex} onChange={setPlasticIndex} unit="%" />
        </FieldGrid>
      }
      formula={<FormulaBlock>If %fines ≥ 50 → fine-grained; A-line: PI = 0.73 × (LL − 20)</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. % fines = {fines} → {isFine ? "fine-grained" : "coarse-grained"}</li>
          <li>2. A-line: PI = 0.73 × ({liquidLimit} − 20) = {round(0.73 * (liquidLimit - 20), 2)}</li>
          <li>3. PI ({plasticIndex}) vs A-line ({round(0.73 * (liquidLimit - 20), 2)}): {plasticIndex >= 0.73 * (liquidLimit - 20) ? "above (clayey)" : "below (silty)"}</li>
          <li>4. LL ({liquidLimit}) vs 50: {liquidLimit >= 50 ? "high" : "low"} plasticity</li>
          <li>5. Classification: <span className="text-foreground font-medium">{group}</span></li>
        </ol>
      }
      results={
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 rounded-md bg-primary/5 border border-primary/15">
            <span className="text-xs text-muted-foreground">USCS Group</span>
            <span className="text-base font-semibold text-primary">{group}</span>
          </div>
          <ResultLine label="Soil name" value={name} />
          <ResultLine label="A-line PI" value={fmt(0.73 * (liquidLimit - 20), 2)} />
          <ResultLine label="Activity" value={fmt(activity, 2)} hint={activity < 0.75 ? "inactive" : activity < 1.25 ? "normal" : "active"} />
          <ResultLine label="Plasticity" value={liquidLimit >= 50 ? "High (LL ≥ 50)" : "Low (LL < 50)"} />
        </div>
      }
      notes={<p>USCS per ASTM D2487. For full classification you also need gradation (% gravel vs sand). Organic soils (OL/OH/PT) require visual assessment.</p>}
    />
  );
}
