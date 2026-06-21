"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// BBS for a straight bar with hooks/bends.
// Cutting length = L + 2 × hook_len − 4 × bend_deduction
// For 180° hook: hook = 9d (each), bend deduction = 2d at 90° bend

export function BbsCalc({ calc }: { calc: CalcMeta }) {
  const [dia, setDia] = useState(12);
  const [clearSpan, setClearSpan] = useState(3000);
  const [development, setDevelopment] = useState(47); // Ld in mm
  const [hooks, setHooks] = useState(2); // number of 180° hooks
  const [bends90, setBends90] = useState(0); // number of 90° bends

  const hookLen = 9 * dia;
  const totalHook = hooks * hookLen;
  const bendDeduction = bends90 * 2 * dia;
  // For a stirrup-like bar, development length on each end
  const cuttingLength = clearSpan + 2 * development + totalHook - bendDeduction;
  const unitWeight = (dia * dia) / 162;
  const totalWeight = (cuttingLength / 1000) * unitWeight;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Cutting length = ${fmt(cuttingLength, 0)} mm · ${fmt(totalWeight, 2)} kg/m`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Bar diameter" value={dia} onChange={setDia} unit="mm" />
          <NumberField label="Clear span" value={clearSpan} onChange={setClearSpan} unit="mm" />
          <NumberField label="Development L (Ld)" value={development} onChange={setDevelopment} unit="mm" />
          <NumberField label="180° hooks" value={hooks} onChange={setHooks} hint="0 / 2" />
          <NumberField label="90° bends" value={bends90} onChange={setBends90} hint="deduction = 2d each" />
        </FieldGrid>
      }
      formula={
        <FormulaBlock>
          Cutting L = span + 2·Ld + n_hooks × 9d − n_bends × 2d
        </FormulaBlock>
      }
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Hook length each: 9 × {dia} = {hookLen} mm</li>
          <li>2. Total hooks: {hooks} × {hookLen} = {totalHook} mm</li>
          <li>3. Bend deduction: {bends90} × 2 × {dia} = {bendDeduction} mm</li>
          <li>4. Cutting length = {clearSpan} + 2×{development} + {totalHook} − {bendDeduction} = <span className="text-foreground font-medium">{round(cuttingLength, 0)} mm</span></li>
          <li>5. Weight = ({round(cuttingLength, 0)}/1000) × {round(unitWeight, 3)} = <span className="text-foreground font-medium">{round(totalWeight, 3)} kg</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Cutting length" value={fmt(cuttingLength, 0)} unit="mm" highlight />
          <ResultLine label="In metres" value={fmt(cuttingLength / 1000, 3)} unit="m" />
          <ResultLine label="Unit weight" value={fmt(unitWeight, 3)} unit="kg/m" />
          <ResultLine label="Weight per bar" value={fmt(totalWeight, 3)} unit="kg" />
        </div>
      }
      notes={<p>Per IS 2502: hook allowance = 9d for 180° hook, 6d for 90° hook. Bend deduction = 2d at 90°, 4d at 180° (per IS code).</p>}
    />
  );
}
