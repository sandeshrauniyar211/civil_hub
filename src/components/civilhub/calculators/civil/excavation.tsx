"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

export function ExcavationCalc({ calc }: { calc: CalcMeta }) {
  const [topL, setTopL] = useState(10);
  const [topW, setTopW] = useState(5);
  const [bottomL, setBottomL] = useState(9);
  const [bottomW, setBottomW] = useState(4);
  const [depth, setDepth] = useState(2);
  const [slope, setSlope] = useState(1); // 1:1 = 1 horizontal : 1 vertical

  // Sloped excavation — trapezoidal prismoidal formula
  // V = (h/6) × [(A_top + A_bottom) + 4 × A_mid]
  const areaTop = topL * topW;
  const areaBottom = bottomL * bottomW;
  const midL = (topL + bottomL) / 2;
  const midW = (topW + bottomW) / 2;
  const areaMid = midL * midW;
  const volume = (depth / 6) * (areaTop + areaBottom + 4 * areaMid);

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Excavation = ${fmt(volume)} m³`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Top length" value={topL} onChange={setTopL} unit="m" />
          <NumberField label="Top width" value={topW} onChange={setTopW} unit="m" />
          <NumberField label="Bottom length" value={bottomL} onChange={setBottomL} unit="m" />
          <NumberField label="Bottom width" value={bottomW} onChange={setBottomW} unit="m" />
          <NumberField label="Depth" value={depth} onChange={setDepth} unit="m" />
          <NumberField label="Slope (H:V)" value={slope} onChange={setSlope} hint="1:1 = 1" />
        </FieldGrid>
      }
      formula={<FormulaBlock>V = (h/6) × [A_top + A_bot + 4·A_mid]   (prismoidal)</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. A_top = {topL} × {topW} = {round(areaTop, 2)} m²</li>
          <li>2. A_bot = {bottomL} × {bottomW} = {round(areaBottom, 2)} m²</li>
          <li>3. A_mid = {round(midL, 2)} × {round(midW, 2)} = {round(areaMid, 2)} m²</li>
          <li>4. V = ({depth}/6) × ({round(areaTop, 2)} + {round(areaBottom, 2)} + 4×{round(areaMid, 2)}) = <span className="text-foreground font-medium">{round(volume, 3)} m³</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Top area" value={fmt(areaTop)} unit="m²" />
          <ResultLine label="Bottom area" value={fmt(areaBottom)} unit="m²" />
          <ResultLine label="Mid area" value={fmt(areaMid)} unit="m²" />
          <ResultLine label="Volume (prismoidal)" value={fmt(volume)} unit="m³" highlight />
          <ResultLine label="In cubic feet" value={fmt(volume * 35.3147)} unit="ft³" />
        </div>
      }
    />
  );
}
