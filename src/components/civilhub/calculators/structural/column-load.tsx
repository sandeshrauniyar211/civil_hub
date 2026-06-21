"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Short RCC column axial capacity (IS 456 cl. 39.3)
// P_u = 0.4 × f_ck × A_c + 0.67 × f_y × A_sc

export function ColumnLoadCalc({ calc }: { calc: CalcMeta }) {
  const [b, setB] = useState(300);
  const [d, setD] = useState(300);
  const [steelPct, setSteelPct] = useState(2); // %
  const [fck, setFck] = useState(25);
  const [fy, setFy] = useState(415);

  const areaConcrete = b * d; // mm²
  const areaSteel = (areaConcrete * steelPct) / 100;
  const Pu = 0.4 * fck * (areaConcrete - areaSteel) + 0.67 * fy * areaSteel;
  const Pn = Pu / 1.5; // factored safe load

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Ultimate capacity = ${fmt(Pu / 1000, 1)} kN · Safe = ${fmt(Pn / 1000, 1)} kN`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Width (b)" value={b} onChange={setB} unit="mm" />
          <NumberField label="Depth (d)" value={d} onChange={setD} unit="mm" />
          <NumberField label="Steel % (A_sc)" value={steelPct} onChange={setSteelPct} unit="%" hint="0.8 – 6 %" />
          <NumberField label="f_ck" value={fck} onChange={setFck} unit="MPa" />
          <NumberField label="f_y" value={fy} onChange={setFy} unit="MPa" />
        </FieldGrid>
      }
      formula={<FormulaBlock>P_u = 0.4·f_ck·(A_c − A_sc) + 0.67·f_y·A_sc</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. A_c = {b} × {d} = {round(areaConcrete, 0)} mm²</li>
          <li>2. A_sc = {round(areaConcrete, 0)} × {steelPct}% = {round(areaSteel, 0)} mm²</li>
          <li>3. P_u = 0.4×{fck}×{round(areaConcrete - areaSteel, 0)} + 0.67×{fy}×{round(areaSteel, 0)} = <span className="text-foreground font-medium">{round(Pu / 1000, 2)} kN</span></li>
          <li>4. Safe load = P_u / 1.5 = <span className="text-foreground font-medium">{round(Pn / 1000, 2)} kN</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Ultimate axial load" value={fmt(Pu / 1000, 1)} unit="kN" highlight />
          <ResultLine label="Safe working load" value={fmt(Pn / 1000, 1)} unit="kN" />
          <ResultLine label="Concrete area" value={fmt(areaConcrete - areaSteel, 0)} unit="mm²" />
          <ResultLine label="Steel area" value={fmt(areaSteel, 0)} unit="mm²" />
        </div>
      }
      notes={<p>Valid for short concentrically loaded columns (slenderness ≤ 12). Per IS 456:2000 cl. 39.3. For eccentric / slender columns use interaction equations.</p>}
    />
  );
}
