"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

const SHAPES = [
  { value: "round", label: "Round bar" },
  { value: "square", label: "Square bar" },
  { value: "flat", label: "Flat plate" },
  { value: "angle", label: "Equal angle (L)" },
  { value: "tube", label: "Hollow circular" },
];

// Steel density = 7850 kg/m³
export function SteelWeightCalc({ calc }: { calc: CalcMeta }) {
  const [shape, setShape] = useState("round");
  const [d, setD] = useState(16); // diameter or side
  const [w, setW] = useState(50); // width (flat) or leg (angle)
  const [t, setT] = useState(5); // thickness (flat/tube) or leg thickness
  const [length, setLength] = useState(1);

  const area = (() => {
    switch (shape) {
      case "round":
        return (Math.PI * d * d) / 4;
      case "square":
        return d * d;
      case "flat":
        return w * t;
      case "angle":
        return (w + d - t) * t;
      case "tube":
        return (Math.PI / 4) * (d * d - (d - 2 * t) * (d - 2 * t));
      default:
        return 0;
    }
  })(); // mm²

  const volume = (area / 1_000_000) * length; // m³
  const weight = volume * 7850; // kg

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${fmt(weight, 2)} kg · ${fmt(weight / length, 3)} kg/m`}
      inputs={
        <div className="space-y-3">
          <SelectField label="Section shape" value={shape} onChange={setShape} options={SHAPES} />
          <FieldGrid cols={3}>
            {shape === "round" && <NumberField label="Diameter" value={d} onChange={setD} unit="mm" />}
            {shape === "square" && <NumberField label="Side" value={d} onChange={setD} unit="mm" />}
            {shape === "flat" && (
              <>
                <NumberField label="Width" value={w} onChange={setW} unit="mm" />
                <NumberField label="Thickness" value={t} onChange={setT} unit="mm" />
              </>
            )}
            {shape === "angle" && (
              <>
                <NumberField label="Leg A" value={w} onChange={setW} unit="mm" />
                <NumberField label="Leg B" value={d} onChange={setD} unit="mm" />
                <NumberField label="Thickness" value={t} onChange={setT} unit="mm" />
              </>
            )}
            {shape === "tube" && (
              <>
                <NumberField label="OD" value={d} onChange={setD} unit="mm" />
                <NumberField label="Wall thickness" value={t} onChange={setT} unit="mm" />
              </>
            )}
            <NumberField label="Length" value={length} onChange={setLength} unit="m" />
          </FieldGrid>
        </div>
      }
      formula={<FormulaBlock>W = (Area × Length) × ρ_steel   ·   ρ = 7850 kg/m³</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Cross-section area: {round(area, 2)} mm²</li>
          <li>2. Volume: {round(area, 2)}/10⁶ × {length} = {round(volume, 6)} m³</li>
          <li>3. Weight: {round(volume, 6)} × 7850 = <span className="text-foreground font-medium">{round(weight, 3)} kg</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Unit weight" value={fmt(weight / length, 3)} unit="kg/m" />
          <ResultLine label="Total weight" value={fmt(weight, 2)} unit="kg" highlight />
          <ResultLine label="Section area" value={fmt(area, 1)} unit="mm²" />
        </div>
      }
    />
  );
}
