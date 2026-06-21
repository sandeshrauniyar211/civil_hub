"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

export function TileCalc({ calc }: { calc: CalcMeta }) {
  const [floorArea, setFloorArea] = useState(20);
  const [tileL, setTileL] = useState(60);
  const [tileW, setTileW] = useState(60);
  const [waste, setWaste] = useState(10);

  const tileArea = (tileL * tileW) / 1_000_000; // mm² → m²
  const tiles = Math.ceil(floorArea / tileArea * (1 + waste / 100));
  const boxes = Math.ceil(tiles / 10); // assume 10 tiles/box

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${tiles} tiles · ${boxes} boxes`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Floor area" value={floorArea} onChange={setFloorArea} unit="m²" />
          <NumberField label="Tile length" value={tileL} onChange={setTileL} unit="mm" />
          <NumberField label="Tile width" value={tileW} onChange={setTileW} unit="mm" />
          <NumberField label="Waste" value={waste} onChange={setWaste} unit="%" hint="10% recommended" />
        </FieldGrid>
      }
      formula={<FormulaBlock>N = ceil(Area × (1 + waste%) ÷ tileArea)</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Tile area = {tileL}×{tileW} mm = {round(tileArea, 4)} m²</li>
          <li>2. Adjusted area = {floorArea} × 1.{waste.toString().padStart(2, "0")} = {round(floorArea * (1 + waste / 100), 3)} m²</li>
          <li>3. Tiles = ceil({round(floorArea * (1 + waste / 100), 3)} / {round(tileArea, 4)}) = <span className="text-foreground font-medium">{tiles}</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Tiles required" value={tiles} unit="pcs" highlight />
          <ResultLine label="Boxes (10 pcs)" value={boxes} unit="box" />
          <ResultLine label="Tile area" value={fmt(tileArea, 4)} unit="m²" />
        </div>
      }
    />
  );
}
