"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Per IS 456 cl. 24.1 — minimum slab thickness by span/depth ratio
const SUPPORT = [
  { value: "simply", label: "Simply supported", ratio: 35 },
  { value: "continuous", label: "Continuous", ratio: 40 },
  { value: "cantilever", label: "Cantilever", ratio: 12 },
];

export function SlabThicknessCalc({ calc }: { calc: CalcMeta }) {
  const [span, setSpan] = useState(4); // m, shorter span
  const [support, setSupport] = useState("simply");
  const [fck, setFck] = useState(25);
  const [fy, setFy] = useState(415);

  const s = SUPPORT.find((x) => x.value === support)!;
  const baseThickness = (span * 1000) / s.ratio;
  // Modification factor (simplified) — assume ~1.0 for fy=415, fck=25
  const modFactor = 1.0;
  const required = baseThickness / modFactor;
  const minAbsolute = 100; // mm — minimum for RCC slabs
  const final = Math.max(required, minAbsolute);

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Required slab thickness = ${fmt(final, 0)} mm (min 100 mm)`}
      inputs={
        <div className="space-y-3">
          <FieldGrid cols={2}>
            <NumberField label="Shorter span" value={span} onChange={setSpan} unit="m" />
            <SelectField label="Support condition" value={support} onChange={setSupport} options={SUPPORT} />
            <NumberField label="f_ck" value={fck} onChange={setFck} unit="MPa" />
            <NumberField label="f_y" value={fy} onChange={setFy} unit="MPa" />
          </FieldGrid>
        </div>
      }
      formula={<FormulaBlock>t_min = (span ÷ (L/D)_basic) ÷ MF   ·   t ≥ 100 mm</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Basic L/D ratio ({s.label}): {s.ratio}</li>
          <li>2. Modification factor (assumed): {modFactor}</li>
          <li>3. Required t = ({span}×1000) / {s.ratio} = {round(required, 1)} mm</li>
          <li>4. Apply minimum 100 mm → max({round(required, 1)}, 100) = <span className="text-foreground font-medium">{round(final, 1)} mm</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Required thickness" value={fmt(final, 0)} unit="mm" highlight />
          <ResultLine label="L/D used" value={fmt(s.ratio, 0)} />
          <ResultLine label="Effective depth" value={fmt(final - 20, 0)} unit="mm" hint="assuming 20 mm cover" />
        </div>
      }
      notes={<p>Per IS 456:2000 Table 4. Modification factor depends on % steel and service stress — refine for final design.</p>}
    />
  );
}
