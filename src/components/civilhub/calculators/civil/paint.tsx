"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

export function PaintCalc({ calc }: { calc: CalcMeta }) {
  const [area, setArea] = useState(100);
  const [coats, setCoats] = useState(2);
  const [coverage, setCoverage] = useState(10); // m²/L per coat
  const [waste, setWaste] = useState(10); // %

  const litresPerCoat = area / coverage;
  const totalLitres = litresPerCoat * coats * (1 + waste / 100);
  const gallons = totalLitres / 3.785;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${fmt(totalLitres, 1)} L of paint (${coats} coats)`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Paintable area" value={area} onChange={setArea} unit="m²" />
          <NumberField label="Coats" value={coats} onChange={setCoats} min={1} />
          <NumberField label="Coverage" value={coverage} onChange={setCoverage} unit="m²/L" hint="per coat" />
          <NumberField label="Waste allowance" value={waste} onChange={setWaste} unit="%" />
        </FieldGrid>
      }
      formula={<FormulaBlock>L = (Area ÷ Coverage) × coats × (1 + waste%)</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Per coat: {area} / {coverage} = {round(litresPerCoat, 3)} L</li>
          <li>2. {coats} coats: × {coats} = {round(litresPerCoat * coats, 3)} L</li>
          <li>3. + {waste}% waste: × {1 + waste / 100} = <span className="text-foreground font-medium">{round(totalLitres, 3)} L</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Paint required" value={fmt(totalLitres, 1)} unit="L" highlight />
          <ResultLine label="In US gallons" value={fmt(gallons, 2)} unit="gal" />
          <ResultLine label="Per coat" value={fmt(litresPerCoat, 2)} unit="L" />
        </div>
      }
      notes={<p>Typical coverage: 10–12 m²/L per coat for emulsion on smooth surface. Rough surfaces reduce coverage by ~30%.</p>}
    />
  );
}
