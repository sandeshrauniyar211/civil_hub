"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

const TYPES = [
  { value: "rectangular", label: "Rectangular weir" },
  { value: "vnotch", label: "V-notch (90°)" },
  { value: "cippoletti", label: "Cippoletti (trapezoidal)" },
];

// Cd values
export function DischargeCalc({ calc }: { calc: CalcMeta }) {
  const [type, setType] = useState("rectangular");
  const [b, setB] = useState(1); // crest width
  const [H, setH] = useState(0.3); // head above crest
  const [Cd, setCd] = useState(0.62);

  const Q = (() => {
    if (type === "rectangular") return (2 / 3) * Cd * b * Math.sqrt(2 * 9.81) * Math.pow(H, 1.5);
    if (type === "vnotch") return (8 / 15) * Cd * Math.sqrt(2 * 9.81) * Math.tan(Math.PI / 4) * Math.pow(H, 2.5);
    // Cippoletti: trapezoidal with 1:4 side slope
    return (2 / 3) * Cd * b * Math.sqrt(2 * 9.81) * Math.pow(H, 1.5);
  })();

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Q = ${fmt(Q, 4)} m³/s · ${fmt(Q * 1000, 2)} L/s`}
      inputs={
        <div className="space-y-3">
          <SelectField label="Weir / notch type" value={type} onChange={setType} options={TYPES} />
          <FieldGrid cols={2}>
            <NumberField label="Crest width (b)" value={b} onChange={setB} unit="m" hint="if applicable" />
            <NumberField label="Head (H)" value={H} onChange={setH} unit="m" step={0.05} />
            <NumberField label="Cd" value={Cd} onChange={setCd} step={0.01} hint="0.6 – 0.65" />
          </FieldGrid>
        </div>
      }
      formula={
        <FormulaBlock>
          {type === "vnotch"
            ? "Q = (8/15) × Cd × √(2g) × tan(θ/2) × H^(5/2)"
            : "Q = (2/3) × Cd × b × √(2g) × H^(3/2)"}
        </FormulaBlock>
      }
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. √(2g) = √(2 × 9.81) = {round(Math.sqrt(2 * 9.81), 4)}</li>
          <li>2. H^({type === "vnotch" ? "5/2" : "3/2"}) = {round(Math.pow(H, type === "vnotch" ? 2.5 : 1.5), 4)}</li>
          <li>3. Q = <span className="text-foreground font-medium">{round(Q, 5)} m³/s</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Discharge Q" value={fmt(Q, 4)} unit="m³/s" highlight />
          <ResultLine label="In L/s" value={fmt(Q * 1000, 2)} unit="L/s" />
          <ResultLine label="In m³/hr" value={fmt(Q * 3600, 1)} unit="m³/hr" />
        </div>
      }
      notes={<p>Standard suppressed-weir formulas. For contracted weirs apply Francis correction. g = 9.81 m/s².</p>}
    />
  );
}
