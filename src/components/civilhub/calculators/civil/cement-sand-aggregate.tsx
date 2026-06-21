"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Nominal concrete mixes (cement : sand : aggregate) by volume
const MIXES = [
  { value: "M5", label: "M5 (1:5:10)", cement: 1, sand: 5, agg: 10 },
  { value: "M7.5", label: "M7.5 (1:4:8)", cement: 1, sand: 4, agg: 8 },
  { value: "M10", label: "M10 (1:3:6)", cement: 1, sand: 3, agg: 6 },
  { value: "M15", label: "M15 (1:2:4)", cement: 1, sand: 2, agg: 4 },
  { value: "M20", label: "M20 (1:1.5:3)", cement: 1, sand: 1.5, agg: 3 },
  { value: "M25", label: "M25 (1:1:2)", cement: 1, sand: 1, agg: 2 },
];

export function CementSandAggregateCalc({ calc }: { calc: CalcMeta }) {
  const [mix, setMix] = useState("M20");
  const [volume, setVolume] = useState(1);

  const m = MIXES.find((x) => x.value === mix)!;
  const dryVolume = volume * 1.54;
  const sum = m.cement + m.sand + m.agg;
  const cementVol = (dryVolume * m.cement) / sum;
  const sandVol = (dryVolume * m.sand) / sum;
  const aggVol = (dryVolume * m.agg) / sum;
  const cementBags = cementVol / 0.035; // 1 bag = 50 kg = 0.035 m³
  const sandMass = sandVol * 1600; // kg/m³
  const aggMass = aggVol * 1450;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${fmt(cementBags, 1)} bags · ${fmt(sandVol)} m³ sand · ${fmt(aggVol)} m³ aggregate`}
      inputs={
        <div className="space-y-3">
          <SelectField label="Concrete grade" value={mix} onChange={setMix} options={MIXES} />
          <NumberField label="Wet concrete volume" value={volume} onChange={setVolume} unit="m³" />
        </div>
      }
      formula={
        <FormulaBlock>
          Dry = 1.54 × Wet   ·   Cement = (Dry × cement_part) / sum   ·   bags = cement_vol / 0.035
        </FormulaBlock>
      }
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Dry volume: 1.54 × {volume} = {round(dryVolume, 4)} m³</li>
          <li>2. Sum of parts: {m.cement} + {m.sand} + {m.agg} = {sum}</li>
          <li>3. Cement vol: {round(cementVol, 4)} m³ → {round(cementBags, 2)} bags</li>
          <li>4. Sand vol: {round(sandVol, 4)} m³</li>
          <li>5. Aggregate vol: {round(aggVol, 4)} m³</li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Cement" value={fmt(cementBags, 1)} unit="bags (50 kg)" highlight />
          <ResultLine label="Sand" value={fmt(sandVol)} unit="m³" />
          <ResultLine label="Aggregate" value={fmt(aggVol)} unit="m³" />
          <ResultLine label="Cement weight" value={fmt(cementBags * 50, 0)} unit="kg" />
          <ResultLine label="Sand weight" value={fmt(sandMass, 0)} unit="kg" />
          <ResultLine label="Aggregate weight" value={fmt(aggMass, 0)} unit="kg" />
        </div>
      }
      notes={
        <p>The 1.54 factor accounts for voids in dry mix. Cement bag = 50 kg ≈ 0.035 m³. Densities: sand 1600 kg/m³, aggregate 1450 kg/m³.</p>
      }
    />
  );
}
