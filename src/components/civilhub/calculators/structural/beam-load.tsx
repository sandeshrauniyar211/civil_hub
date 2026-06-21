"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

type LoadType = "point-center" | "udl";

export function BeamLoadCalc({ calc }: { calc: CalcMeta }) {
  const [type, setType] = useState<LoadType>("point-center");
  const [span, setSpan] = useState(6);
  const [load, setLoad] = useState(20); // kN point or kN/m UDL

  const { R, Mmax, Mloc, Smax } = (() => {
    if (type === "point-center") {
      return {
        R: load / 2,
        Mmax: (load * span) / 4,
        Mloc: "mid-span",
        Smax: load / 2,
      };
    }
    return {
      R: (load * span) / 2,
      Mmax: (load * span * span) / 8,
      Mloc: "mid-span",
      Smax: (load * span) / 2,
    };
  })();

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`R = ${fmt(R)} kN · M_max = ${fmt(Mmax)} kN·m @ ${Mloc}`}
      inputs={
        <div className="space-y-3">
          <SelectField
            label="Load type"
            value={type}
            onChange={(v) => setType(v as LoadType)}
            options={[
              { value: "point-center", label: "Point load at mid-span" },
              { value: "udl", label: "Uniformly distributed load (UDL)" },
            ]}
          />
          <FieldGrid cols={2}>
            <NumberField label="Span (L)" value={span} onChange={setSpan} unit="m" />
            <NumberField label={type === "point-center" ? "Point load (P)" : "UDL (w)"} value={load} onChange={setLoad} unit={type === "point-center" ? "kN" : "kN/m"} />
          </FieldGrid>
        </div>
      }
      formula={
        <FormulaBlock>
          {type === "point-center"
            ? "R = P/2   ·   M_max = PL/4   @ mid-span"
            : "R = wL/2   ·   M_max = wL²/8   @ mid-span"}
        </FormulaBlock>
      }
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Reaction each support: {round(R, 3)} kN</li>
          <li>2. Max BM: {round(Mmax, 3)} kN·m at {Mloc}</li>
          <li>3. Max SF: {round(Smax, 3)} kN</li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Reaction (each)" value={fmt(R)} unit="kN" />
          <ResultLine label="Max shear" value={fmt(Smax)} unit="kN" />
          <ResultLine label="Max bending moment" value={fmt(Mmax)} unit="kN·m" highlight />
        </div>
      }
      notes={<p>Simply supported beam assumptions. For other load cases (point off-center, two-point, cantilever), use a structural analysis package.</p>}
    />
  );
}
