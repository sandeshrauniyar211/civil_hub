"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Q = A × V
const SHAPES = [
  { value: "circular", label: "Circular (full)" },
  { value: "rectangular", label: "Rectangular" },
];

export function PipeFlowCalc({ calc }: { calc: CalcMeta }) {
  const [shape, setShape] = useState("circular");
  const [d, setD] = useState(200); // mm
  const [w, setW] = useState(200); // mm
  const [h, setH] = useState(200); // mm
  const [v, setV] = useState(1.5); // m/s

  const area = (() => {
    if (shape === "circular") return (Math.PI / 4) * (d / 1000) ** 2;
    return (w / 1000) * (h / 1000);
  })(); // m²

  const Q = area * v; // m³/s

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Q = ${fmt(Q, 4)} m³/s · ${fmt(Q * 1000, 1)} L/s`}
      inputs={
        <div className="space-y-3">
          <SelectField label="Pipe shape" value={shape} onChange={setShape} options={SHAPES} />
          <FieldGrid cols={2}>
            {shape === "circular" ? (
              <NumberField label="Diameter" value={d} onChange={setD} unit="mm" />
            ) : (
              <>
                <NumberField label="Width" value={w} onChange={setW} unit="mm" />
                <NumberField label="Height" value={h} onChange={setH} unit="mm" />
              </>
            )}
            <NumberField label="Velocity" value={v} onChange={setV} unit="m/s" />
          </FieldGrid>
        </div>
      }
      formula={<FormulaBlock>Q = A × V   (continuity)</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Area: {round(area, 6)} m²</li>
          <li>2. Q = A × V = {round(area, 6)} × {v} = <span className="text-foreground font-medium">{round(Q, 6)} m³/s</span></li>
          <li>3. In L/s: {round(Q * 1000, 3)}</li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Flow rate Q" value={fmt(Q, 4)} unit="m³/s" highlight />
          <ResultLine label="In L/s" value={fmt(Q * 1000, 2)} unit="L/s" />
          <ResultLine label="In m³/hr" value={fmt(Q * 3600, 1)} unit="m³/hr" />
          <ResultLine label="Cross-section area" value={fmt(area, 5)} unit="m²" />
        </div>
      }
    />
  );
}
