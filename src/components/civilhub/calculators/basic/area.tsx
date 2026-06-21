"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

type Shape = "rectangle" | "circle" | "triangle" | "trapezoid" | "parallelogram";

export function AreaCalc({ calc }: { calc: CalcMeta }) {
  const [shape, setShape] = useState<Shape>("rectangle");
  const [a, setA] = useState(10);
  const [b, setB] = useState(6);
  const [c, setC] = useState(5);
  const [h, setH] = useState(4);

  const { area, formula, steps } = (() => {
    switch (shape) {
      case "rectangle":
        return {
          area: a * b,
          formula: "A = length × width",
          steps: `A = ${a} × ${b} = ${round(a * b, 4)}`,
        };
      case "circle":
        return {
          area: Math.PI * a * a,
          formula: "A = π × r²",
          steps: `A = π × ${a}² = ${round(Math.PI * a * a, 4)}`,
        };
      case "triangle":
        return {
          area: 0.5 * b * h,
          formula: "A = ½ × base × height",
          steps: `A = ½ × ${b} × ${h} = ${round(0.5 * b * h, 4)}`,
        };
      case "trapezoid":
        return {
          area: 0.5 * (a + b) * h,
          formula: "A = ½ × (a + b) × h",
          steps: `A = ½ × (${a} + ${b}) × ${h} = ${round(0.5 * (a + b) * h, 4)}`,
        };
      case "parallelogram":
        return {
          area: b * h,
          formula: "A = base × height",
          steps: `A = ${b} × ${h} = ${round(b * h, 4)}`,
        };
    }
  })();

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Area = ${fmt(area)} sq. units`}
      inputs={
        <div className="space-y-3">
          <SelectField
            label="Shape"
            value={shape}
            onChange={(v) => setShape(v as Shape)}
            options={[
              { value: "rectangle", label: "Rectangle" },
              { value: "circle", label: "Circle" },
              { value: "triangle", label: "Triangle" },
              { value: "trapezoid", label: "Trapezoid" },
              { value: "parallelogram", label: "Parallelogram" },
            ]}
          />
          <FieldGrid cols={2}>
            {shape === "rectangle" && (
              <>
                <NumberField label="Length" value={a} onChange={setA} unit="m" />
                <NumberField label="Width" value={b} onChange={setB} unit="m" />
              </>
            )}
            {shape === "circle" && (
              <NumberField label="Radius" value={a} onChange={setA} unit="m" />
            )}
            {shape === "triangle" && (
              <>
                <NumberField label="Base" value={b} onChange={setB} unit="m" />
                <NumberField label="Height" value={h} onChange={setH} unit="m" />
              </>
            )}
            {shape === "trapezoid" && (
              <>
                <NumberField label="Side a" value={a} onChange={setA} unit="m" />
                <NumberField label="Side b" value={b} onChange={setB} unit="m" />
                <NumberField label="Height" value={h} onChange={setH} unit="m" />
              </>
            )}
            {shape === "parallelogram" && (
              <>
                <NumberField label="Base" value={b} onChange={setB} unit="m" />
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
          <ResultLine label="Area" value={fmt(area)} unit="m²" highlight />
          {shape === "circle" && <ResultLine label="Circumference" value={fmt(2 * Math.PI * a)} unit="m" />}
        </div>
      }
    />
  );
}
