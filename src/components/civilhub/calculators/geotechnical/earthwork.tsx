"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Earthwork volume between chainages — trapezoidal and prismoidal
export function EarthworkCalc({ calc }: { calc: CalcMeta }) {
  // 3 cross-sections (start, mid, end) — areas A1, A2, A3
  const [a1, setA1] = useState(15); // m² cut
  const [a2, setA2] = useState(20);
  const [a3, setA3] = useState(12);
  const [spacing, setSpacing] = useState(20); // m between sections

  // Trapezoidal: V = (d/2) × [A1 + A3 + 2·A2]  (for 2 sub-spans)
  const trapezoidal = (spacing / 2) * (a1 + a3 + 2 * a2);
  // Prismoidal: V = (d/6) × [A1 + A3 + 4·A2]  (one prismoid over 2d)
  const prismoidal = ((spacing * 2) / 6) * (a1 + 4 * a2 + a3);

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Cut volume: trap ${fmt(trapezoidal, 1)} m³ · prism ${fmt(prismoidal, 1)} m³`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Area @ ch. 1 (A₁)" value={a1} onChange={setA1} unit="m²" />
          <NumberField label="Area @ ch. 2 (A₂)" value={a2} onChange={setA2} unit="m²" />
          <NumberField label="Area @ ch. 3 (A₃)" value={a3} onChange={setA3} unit="m²" />
          <NumberField label="Section spacing" value={spacing} onChange={setSpacing} unit="m" />
        </FieldGrid>
      }
      formula={
        <FormulaBlock>
          V_trap = (d/2) × [A₁ + Aₙ + 2·ΣA_mid]   ·   V_prism = (d/6) × [A₁ + Aₙ + 4·A_mid]
        </FormulaBlock>
      }
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Sections A₁={a1}, A₂={a2}, A₃={a3} m²</li>
          <li>2. Trapezoidal: ({spacing}/2) × ({a1} + {a3} + 2×{a2}) = <span className="text-foreground font-medium">{round(trapezoidal, 2)} m³</span></li>
          <li>3. Prismoidal: (2×{spacing}/6) × ({a1} + 4×{a2} + {a3}) = <span className="text-foreground font-medium">{round(prismoidal, 2)} m³</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Trapezoidal volume" value={fmt(trapezoidal, 1)} unit="m³" highlight />
          <ResultLine label="Prismoidal volume" value={fmt(prismoidal, 1)} unit="m³" highlight />
          <ResultLine label="Difference" value={fmt(trapezoidal - prismoidal, 2)} unit="m³" />
          <ResultLine label="In cu-ft" value={fmt(trapezoidal * 35.3147, 1)} unit="ft³" />
        </div>
      }
      notes={<p>Prismoidal formula is more accurate when cross-sections vary smoothly. Use trapezoidal for rapid field estimates. For long alignments sum across all section pairs.</p>}
    />
  );
}
