"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Standard brick sizes (mm)
const BRICK_SIZES = [
  { value: "nepal-standard", label: "Nepal standard (240 × 115 × 57 mm)", w: 0.24, h: 0.115, t: 0.057 },
  { value: "indian-standard", label: "Indian standard (190 × 90 × 90 mm)", w: 0.19, h: 0.09, t: 0.09 },
  { value: "modular", label: "Modular (200 × 100 × 100 mm)", w: 0.2, h: 0.1, t: 0.1 },
  { value: "imperial", label: "Imperial (9 × 4.5 × 3 in)", w: 0.2286, h: 0.1143, t: 0.0762 },
];

export function BrickworkCalc({ calc }: { calc: CalcMeta }) {
  const [size, setSize] = useState("nepal-standard");
  const [wallL, setWallL] = useState(5);
  const [wallH, setWallH] = useState(3);
  const [wallT, setWallT] = useState(0.23);
  const [mortar, setMortar] = useState(15); // %

  const brick = BRICK_SIZES.find((s) => s.value === size)!;
  const wallVolume = wallL * wallH * wallT;
  const brickVolume = brick.w * brick.h * brick.t;
  const brickVolWithMortar = brickVolume * (1 + mortar / 100);
  const bricksNeeded = Math.ceil(wallVolume / brickVolWithMortar);
  const mortarVolume = wallVolume - bricksNeeded * brickVolume;
  // mortar mix 1:6 → cement : sand
  const dryMortar = mortarVolume * 1.3; // dry factor
  const cementBags = (dryMortar * (1 / 7)) / 0.035; // 1 part cement of 7, 0.035 m³ per bag
  const sandVolume = dryMortar * (6 / 7);

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${bricksNeeded} bricks · ${fmt(mortarVolume)} m³ mortar`}
      inputs={
        <div className="space-y-3">
          <SelectField
            label="Brick size"
            value={size}
            onChange={setSize}
            options={BRICK_SIZES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <FieldGrid cols={2}>
            <NumberField label="Wall length" value={wallL} onChange={setWallL} unit="m" />
            <NumberField label="Wall height" value={wallH} onChange={setWallH} unit="m" />
            <NumberField label="Wall thickness" value={wallT} onChange={setWallT} unit="m" />
            <NumberField label="Mortar joint" value={mortar} onChange={setMortar} unit="%" hint="vol %" />
          </FieldGrid>
        </div>
      }
      formula={
        <FormulaBlock>
          N = (L × H × T) ÷ (brickVol × (1 + mortar%))
        </FormulaBlock>
      }
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Wall volume: {wallL} × {wallH} × {wallT} = {round(wallVolume, 4)} m³</li>
          <li>2. Brick vol + mortar: {round(brickVolume, 5)} × 1.{mortar.toString().padStart(2, "0")} = {round(brickVolWithMortar, 5)} m³</li>
          <li>3. Bricks = {round(wallVolume, 4)} / {round(brickVolWithMortar, 5)} = <span className="text-foreground font-medium">{bricksNeeded}</span></li>
          <li>4. Mortar volume: {round(mortarVolume, 4)} m³ (1:6 mix)</li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Bricks required" value={bricksNeeded} unit="pcs" highlight />
          <ResultLine label="Mortar volume" value={fmt(mortarVolume)} unit="m³" />
          <ResultLine label="Cement (1:6)" value={fmt(cementBags, 1)} unit="bags" />
          <ResultLine label="Sand (1:6)" value={fmt(sandVolume)} unit="m³" />
        </div>
      }
    />
  );
}
