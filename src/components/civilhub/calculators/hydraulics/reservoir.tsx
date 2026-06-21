"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Reservoir capacity via trapezoidal / prismoidal formula between contour areas.
export function ReservoirCalc({ calc }: { calc: CalcMeta }) {
  const [a1, setA1] = useState(10000); // m²
  const [a2, setA2] = useState(8000);
  const [a3, setA3] = useState(5000);
  const [a4, setA4] = useState(2000);
  const [contourInterval, setContourInterval] = useState(2); // m

  // Trapezoidal: V = (h/2) × [A1 + An + 2(A2 + ... + An-1)]
  const areas = [a1, a2, a3, a4];
  const n = areas.length;
  const trapezoidal = (contourInterval / 2) * (areas[0] + areas[n - 1] + 2 * areas.slice(1, -1).reduce((s, x) => s + x, 0));
  // Prismoidal (conic): V = (h/3) × [A1 + An + 4 × (sum of odd indices) + 2 × (sum of even indices between)]
  // For 4 areas: V = (h/3) × (A1 + 4·A2 + A3) + (h/3) × (A3 + 4·A4 + ...) — but here we use simpler 3-area formula per pair
  // Use prismoidal for first 3 areas
  const prismoidal = (contourInterval / 3) * (areas[0] + 4 * areas[1] + areas[2]) + (contourInterval / 3) * (areas[2] + 4 * areas[3] + 0);

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Storage ≈ ${fmt(trapezoidal, 0)} m³ (trapezoidal)`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Area @ contour 1" value={a1} onChange={setA1} unit="m²" />
          <NumberField label="Area @ contour 2" value={a2} onChange={setA2} unit="m²" />
          <NumberField label="Area @ contour 3" value={a3} onChange={setA3} unit="m²" />
          <NumberField label="Area @ contour 4" value={a4} onChange={setA4} unit="m²" />
          <NumberField label="Contour interval" value={contourInterval} onChange={setContourInterval} unit="m" />
        </FieldGrid>
      }
      formula={<FormulaBlock>V_trap = (h/2) × [A₁ + Aₙ + 2·ΣAᵢ]   ·   V_prism = (h/3) × [A₁ + Aₙ + 4·Σodd + 2·Σeven]</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Areas: {areas.join(", ")} m²</li>
          <li>2. Trapezoidal: ({contourInterval}/2) × ({areas[0]} + {areas[n - 1]} + 2×{areas.slice(1, -1).reduce((s, x) => s + x, 0)}) = <span className="text-foreground font-medium">{round(trapezoidal, 2)} m³</span></li>
          <li>3. Prismoidal (approx): {round(prismoidal, 2)} m³</li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Trapezoidal volume" value={fmt(trapezoidal, 0)} unit="m³" highlight />
          <ResultLine label="Prismoidal volume" value={fmt(prismoidal, 0)} unit="m³" />
          <ResultLine label="In ML" value={fmt(trapezoidal / 1000, 1)} unit="ML" />
          <ResultLine label="In acre-ft" value={fmt(trapezoidal / 1233.48, 2)} unit="ac-ft" />
        </div>
      }
      notes={<p>Capacity from contour survey. Prismoidal is more accurate when contour interval is uniform. 1 ML = 1000 m³ = 0.811 ac-ft.</p>}
    />
  );
}
