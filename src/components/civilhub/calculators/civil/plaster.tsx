"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

const MIXES = [
  { value: "1:3", label: "1:3 (rich)", cement: 1, sand: 3 },
  { value: "1:4", label: "1:4", cement: 1, sand: 4 },
  { value: "1:5", label: "1:5", cement: 1, sand: 5 },
  { value: "1:6", label: "1:6 (common)", cement: 1, sand: 6 },
];

export function PlasterCalc({ calc }: { calc: CalcMeta }) {
  const [area, setArea] = useState(100);
  const [thickness, setThickness] = useState(12);
  const [mix, setMix] = useState("1:4");

  const m = MIXES.find((x) => x.value === mix)!;
  const wetVolume = (area * thickness) / 1000; // m³
  const dryVolume = wetVolume * 1.3; // 30% bulking + voids
  const sum = m.cement + m.sand;
  const cementVol = (dryVolume * m.cement) / sum;
  const sandVol = (dryVolume * m.sand) / sum;
  const cementBags = cementVol / 0.035;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${fmt(cementBags, 1)} bags · ${fmt(sandVol)} m³ sand`}
      inputs={
        <FieldGrid cols={3}>
          <NumberField label="Area" value={area} onChange={setArea} unit="m²" />
          <NumberField label="Thickness" value={thickness} onChange={setThickness} unit="mm" />
          <SelectField label="Mix" value={mix} onChange={setMix} options={MIXES} />
        </FieldGrid>
      }
      formula={<FormulaBlock>Wet = Area × t   ·   Dry = 1.3 × Wet   ·   Cement = Dry × (c / (c+s))</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Wet vol = {area} × {thickness}/1000 = {round(wetVolume, 4)} m³</li>
          <li>2. Dry vol = 1.3 × {round(wetVolume, 4)} = {round(dryVolume, 4)} m³</li>
          <li>3. Cement = {round(dryVolume, 4)} × {m.cement}/{sum} = {round(cementVol, 4)} m³ → {round(cementBags, 2)} bags</li>
          <li>4. Sand = {round(dryVolume, 4)} × {m.sand}/{sum} = {round(sandVol, 4)} m³</li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Cement" value={fmt(cementBags, 1)} unit="bags" highlight />
          <ResultLine label="Sand" value={fmt(sandVol)} unit="m³" />
          <ResultLine label="Wet mortar" value={fmt(wetVolume)} unit="m³" />
          <ResultLine label="Dry mortar" value={fmt(dryVolume)} unit="m³" />
        </div>
      }
    />
  );
}
