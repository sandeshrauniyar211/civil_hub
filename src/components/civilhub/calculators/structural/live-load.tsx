"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// IS 875 Part 2 live load values (kN/m²)
const OCCUPANCY = [
  { value: "residential", label: "Residential dwelling", ll: 2.0 },
  { value: "office", label: "Office", ll: 2.5 },
  { value: "school", label: "School / classroom", ll: 3.0 },
  { value: "restaurant", label: "Restaurant", ll: 3.0 },
  { value: "shop", label: "Retail shop", ll: 4.0 },
  { value: "warehouse", label: "Warehouse / storage", ll: 5.0 },
  { value: "balcony", label: "Balcony", ll: 3.0 },
  { value: "stair", label: "Stairs / corridor", ll: 3.0 },
  { value: "garage", label: "Garage (cars)", ll: 4.0 },
];

export function LiveLoadCalc({ calc }: { calc: CalcMeta }) {
  const [occ, setOcc] = useState("residential");
  const [area, setArea] = useState(50);
  const [reduction, setReduction] = useState(0); // %

  const o = OCCUPANCY.find((x) => x.value === occ)!;
  const baseLoad = o.ll * area * (1 - reduction / 100);
  const unitLoad = o.ll * (1 - reduction / 100);

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${fmt(unitLoad, 2)} kN/m² × ${area} m² = ${fmt(baseLoad, 1)} kN total`}
      inputs={
        <div className="space-y-3">
          <SelectField label="Occupancy" value={occ} onChange={setOcc} options={OCCUPANCY} />
          <FieldGrid cols={2}>
            <NumberField label="Floor area" value={area} onChange={setArea} unit="m²" />
            <NumberField label="Reduction factor" value={reduction} onChange={setReduction} unit="%" hint="IS 875 cl. 3.2.2" />
          </FieldGrid>
        </div>
      }
      formula={<FormulaBlock>LL = occupancy × Area × (1 − reduction)</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Base LL for "{o.label}": {o.ll} kN/m²</li>
          <li>2. After {reduction}% reduction: {round(unitLoad, 3)} kN/m²</li>
          <li>3. Total = {round(unitLoad, 3)} × {area} = <span className="text-foreground font-medium">{round(baseLoad, 2)} kN</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Unit live load" value={fmt(unitLoad, 2)} unit="kN/m²" highlight />
          <ResultLine label="Total live load" value={fmt(baseLoad, 1)} unit="kN" />
          <ResultLine label="Base value" value={fmt(o.ll, 2)} unit="kN/m²" />
        </div>
      }
      notes={<p>Per IS 875 Part 2. Reduction allowed for members supporting more than 50 m² floor area (cl. 3.2.2). Not for warehouses or garages.</p>}
    />
  );
}
