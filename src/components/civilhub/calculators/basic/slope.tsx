"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

export function SlopeCalc({ calc }: { calc: CalcMeta }) {
  const [x1, setX1] = useState(0);
  const [y1, setY1] = useState(0);
  const [x2, setX2] = useState(10);
  const [y2, setY2] = useState(3);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const slope = dx !== 0 ? dy / dx : 0;
  const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const percent = dx !== 0 ? (dy / Math.abs(dx)) * 100 : 0;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Slope = ${fmt(slope, 4)} · ${fmt(percent, 2)}% · ${fmt(angleDeg, 2)}°`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Point 1 — X" value={x1} onChange={setX1} />
          <NumberField label="Point 1 — Y" value={y1} onChange={setY1} />
          <NumberField label="Point 2 — X" value={x2} onChange={setX2} />
          <NumberField label="Point 2 — Y" value={y2} onChange={setY2} />
        </FieldGrid>
      }
      formula={
        <FormulaBlock>
          m = (y₂ − y₁) ÷ (x₂ − x₁)   ·   θ = arctan(m)   ·   % = (Δy / |Δx|) × 100
        </FormulaBlock>
      }
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Δx = {x2} − {x1} = {round(dx, 4)}</li>
          <li>2. Δy = {y2} − {y1} = {round(dy, 4)}</li>
          <li>3. m = {round(dy, 4)} / {round(dx, 4)} = <span className="text-foreground font-medium">{round(slope, 4)}</span></li>
          <li>4. θ = arctan({round(slope, 4)}) = <span className="text-foreground font-medium">{round(angleDeg, 4)}°</span></li>
          <li>5. Distance = √(Δx² + Δy²) = <span className="text-foreground font-medium">{round(distance, 4)}</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Slope (m)" value={fmt(slope, 4)} highlight />
          <ResultLine label="Grade" value={fmt(percent, 2)} unit="%" />
          <ResultLine label="Angle" value={fmt(angleDeg, 2)} unit="°" />
          <ResultLine label="Distance" value={fmt(distance, 4)} />
        </div>
      }
    />
  );
}
