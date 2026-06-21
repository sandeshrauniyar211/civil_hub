"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

type Solve = "density" | "mass" | "volume";

export function DensityCalc({ calc }: { calc: CalcMeta }) {
  const [solve, setSolve] = useState<Solve>("density");
  const [mass, setMass] = useState(500);
  const [volume, setVolume] = useState(0.2);
  const [density, setDensity] = useState(2500);

  const result = (() => {
    switch (solve) {
      case "density":
        return volume > 0 ? mass / volume : 0;
      case "mass":
        return density * volume;
      case "volume":
        return density > 0 ? mass / density : 0;
    }
  })();

  const resultLabel = solve === "density" ? "Density" : solve === "mass" ? "Mass" : "Volume";
  const resultUnit = solve === "density" ? "kg/m³" : solve === "mass" ? "kg" : "m³";

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${resultLabel} = ${fmt(result)} ${resultUnit}`}
      inputs={
        <div className="space-y-3">
          <SelectField
            label="Solve for"
            value={solve}
            onChange={(v) => setSolve(v as Solve)}
            options={[
              { value: "density", label: "Density (ρ = m/V)" },
              { value: "mass", label: "Mass (m = ρ × V)" },
              { value: "volume", label: "Volume (V = m/ρ)" },
            ]}
          />
          <FieldGrid cols={2}>
            {solve !== "mass" && <NumberField label="Mass" value={mass} onChange={setMass} unit="kg" />}
            {solve !== "volume" && <NumberField label="Volume" value={volume} onChange={setVolume} unit="m³" />}
            {solve !== "density" && <NumberField label="Density" value={density} onChange={setDensity} unit="kg/m³" />}
          </FieldGrid>
        </div>
      }
      formula={
        <FormulaBlock>
          {solve === "density" && "ρ = m / V"}
          {solve === "mass" && "m = ρ × V"}
          {solve === "volume" && "V = m / ρ"}
        </FormulaBlock>
      }
      steps={
        <div className="text-xs text-muted-foreground font-mono">
          {solve === "density" && `ρ = ${mass} / ${volume} = ${round(result, 4)} kg/m³`}
          {solve === "mass" && `m = ${density} × ${volume} = ${round(result, 4)} kg`}
          {solve === "volume" && `V = ${mass} / ${density} = ${round(result, 4)} m³`}
        </div>
      }
      results={
        <div className="space-y-1">
          <ResultLine label={resultLabel} value={fmt(result)} unit={resultUnit} highlight />
        </div>
      }
    />
  );
}
