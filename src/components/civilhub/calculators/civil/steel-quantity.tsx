"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Unit weight of steel = 7850 kg/m³
// Weight per metre for a bar of diameter d (mm): d²/162 kg/m

export function SteelQuantityCalc({ calc }: { calc: CalcMeta }) {
  const [dia, setDia] = useState(12);
  const [length, setLength] = useState(12);
  const [count, setCount] = useState(20);

  const unitWeight = (dia * dia) / 162; // kg/m
  const totalLength = length * count;
  const totalWeight = unitWeight * totalLength;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${fmt(totalWeight, 1)} kg of ${dia}mm Ø bar (${count} pcs × ${length} m)`}
      inputs={
        <FieldGrid cols={3}>
          <NumberField label="Diameter" value={dia} onChange={setDia} unit="mm" />
          <NumberField label="Length each" value={length} onChange={setLength} unit="m" />
          <NumberField label="Count" value={count} onChange={setCount} min={1} />
        </FieldGrid>
      }
      formula={<FormulaBlock>Unit wt = d² / 162 kg/m   ·   Total = unit_wt × L × n</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Unit weight = {dia}² / 162 = {round(unitWeight, 4)} kg/m</li>
          <li>2. Total length = {length} × {count} = {round(totalLength, 2)} m</li>
          <li>3. Total weight = {round(unitWeight, 4)} × {round(totalLength, 2)} = <span className="text-foreground font-medium">{round(totalWeight, 2)} kg</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Unit weight" value={fmt(unitWeight, 3)} unit="kg/m" />
          <ResultLine label="Total length" value={fmt(totalLength, 2)} unit="m" />
          <ResultLine label="Total weight" value={fmt(totalWeight, 1)} unit="kg" highlight />
          <ResultLine label="In tonnes" value={fmt(totalWeight / 1000, 3)} unit="t" />
        </div>
      }
      notes={<p>Derived from steel density (7850 kg/m³): wt/m = (π/4 × d² × 10⁻⁶) × 7850 = d²/162. Use for any round rebar.</p>}
    />
  );
}
