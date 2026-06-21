"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

type Shape = "cube" | "cylinder" | "sphere" | "cone" | "prism";

export function VolumeCalc({ calc }: { calc: CalcMeta }) {
  const [shape, setShape] = useState<Shape>("cylinder");
  const [r, setR] = useState(5);
  const [h, setH] = useState(10);
  const [l, setL] = useState(8);
  const [w, setW] = useState(4);

  const { volume, surface, formula, steps } = (() => {
    switch (shape) {
      case "cube":
        return {
          volume: l ** 3,
          surface: 6 * l * l,
          formula: "V = side³",
          steps: `V = ${l}³ = ${round(l ** 3, 4)}`,
        };
      case "cylinder":
        return {
          volume: Math.PI * r * r * h,
          surface: 2 * Math.PI * r * (r + h),
          formula: "V = π × r² × h",
          steps: `V = π × ${r}² × ${h} = ${round(Math.PI * r * r * h, 4)}`,
        };
      case "sphere":
        return {
          volume: (4 / 3) * Math.PI * r ** 3,
          surface: 4 * Math.PI * r * r,
          formula: "V = (4/3) × π × r³",
          steps: `V = (4/3) × π × ${r}³ = ${round((4 / 3) * Math.PI * r ** 3, 4)}`,
        };
      case "cone":
        return {
          volume: (1 / 3) * Math.PI * r * r * h,
          surface: Math.PI * r * (r + Math.sqrt(r * r + h * h)),
          formula: "V = (1/3) × π × r² × h",
          steps: `V = (1/3) × π × ${r}² × ${h} = ${round((1 / 3) * Math.PI * r * r * h, 4)}`,
        };
      case "prism":
        return {
          volume: l * w * h,
          surface: 2 * (l * w + l * h + w * h),
          formula: "V = length × width × height",
          steps: `V = ${l} × ${w} × ${h} = ${round(l * w * h, 4)}`,
        };
    }
  })();

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Volume = ${fmt(volume)} m³`}
      inputs={
        <div className="space-y-3">
          <SelectField
            label="Shape"
            value={shape}
            onChange={(v) => setShape(v as Shape)}
            options={[
              { value: "cube", label: "Cube" },
              { value: "cylinder", label: "Cylinder" },
              { value: "sphere", label: "Sphere" },
              { value: "cone", label: "Cone" },
              { value: "prism", label: "Rectangular Prism" },
            ]}
          />
          <FieldGrid cols={2}>
            {shape === "cube" && <NumberField label="Side" value={l} onChange={setL} unit="m" />}
            {(shape === "cylinder" || shape === "sphere" || shape === "cone") && (
              <NumberField label="Radius" value={r} onChange={setR} unit="m" />
            )}
            {(shape === "cylinder" || shape === "cone") && (
              <NumberField label="Height" value={h} onChange={setH} unit="m" />
            )}
            {shape === "prism" && (
              <>
                <NumberField label="Length" value={l} onChange={setL} unit="m" />
                <NumberField label="Width" value={w} onChange={setW} unit="m" />
                <NumberField label="Height" value={h} onChange={setH} unit="m" />
              </>
            )}
          </FieldGrid>
        </div>
      }
      formula={<FormulaBlock>{formula}</FormulaBlock>}
      steps={<div className="text-xs text-muted-foreground font-mono">{steps}</div>}
      results={
        <div className="space-y-1">
          <ResultLine label="Volume" value={fmt(volume)} unit="m³" highlight />
          <ResultLine label="Surface area" value={fmt(surface)} unit="m²" />
        </div>
      }
    />
  );
}
