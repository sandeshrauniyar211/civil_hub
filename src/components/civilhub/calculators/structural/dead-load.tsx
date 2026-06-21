"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Dead load per unit area = sum(thickness × density)
export function DeadLoadCalc({ calc }: { calc: CalcMeta }) {
  const [slabT, setSlabT] = useState(150);
  const [slabDensity, setSlabDensity] = useState(24);
  const [finishT, setFinishT] = useState(50);
  const [finishDensity, setFinishDensity] = useState(22);
  const [wallHeight, setWallHeight] = useState(3);
  const [wallThickness, setWallThickness] = useState(230);
  const [wallDensity, setWallDensity] = useState(20);
  const [wallSpacing, setWallSpacing] = useState(3);

  const slabLoad = (slabT / 1000) * slabDensity;
  const finishLoad = (finishT / 1000) * finishDensity;
  const wallLoad = (wallThickness / 1000) * wallHeight * wallDensity / wallSpacing;
  const total = slabLoad + finishLoad + wallLoad;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Total dead load = ${fmt(total, 2)} kN/m²`}
      inputs={
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Slab</h4>
            <FieldGrid cols={2}>
              <NumberField label="Thickness" value={slabT} onChange={setSlabT} unit="mm" />
              <NumberField label="Density" value={slabDensity} onChange={setSlabDensity} unit="kN/m³" />
            </FieldGrid>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Floor finish</h4>
            <FieldGrid cols={2}>
              <NumberField label="Thickness" value={finishT} onChange={setFinishT} unit="mm" />
              <NumberField label="Density" value={finishDensity} onChange={setFinishDensity} unit="kN/m³" />
            </FieldGrid>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Partition wall (distributed)</h4>
            <FieldGrid cols={3}>
              <NumberField label="Height" value={wallHeight} onChange={setWallHeight} unit="m" />
              <NumberField label="Thickness" value={wallThickness} onChange={setWallThickness} unit="mm" />
              <NumberField label="Density" value={wallDensity} onChange={setWallDensity} unit="kN/m³" />
              <NumberField label="Wall spacing" value={wallSpacing} onChange={setWallSpacing} unit="m" hint="perpendicular" />
            </FieldGrid>
          </div>
        </div>
      }
      formula={<FormulaBlock>w_DL = Σ(tᵢ × γᵢ) + (t_wall × h_wall × γ_wall) / spacing</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Slab: {slabT}/1000 × {slabDensity} = {round(slabLoad, 3)} kN/m²</li>
          <li>2. Finish: {finishT}/1000 × {finishDensity} = {round(finishLoad, 3)} kN/m²</li>
          <li>3. Wall distributed: ({wallThickness}/1000 × {wallHeight} × {wallDensity}) / {wallSpacing} = {round(wallLoad, 3)} kN/m²</li>
          <li>4. Total = <span className="text-foreground font-medium">{round(total, 3)} kN/m²</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Slab" value={fmt(slabLoad, 2)} unit="kN/m²" />
          <ResultLine label="Finish" value={fmt(finishLoad, 2)} unit="kN/m²" />
          <ResultLine label="Walls" value={fmt(wallLoad, 2)} unit="kN/m²" />
          <ResultLine label="Total dead load" value={fmt(total, 2)} unit="kN/m²" highlight />
        </div>
      }
    />
  );
}
