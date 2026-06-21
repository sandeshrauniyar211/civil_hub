"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

const SECTIONS = [
  { value: "rectangular", label: "Rectangular" },
  { value: "trapezoidal", label: "Trapezoidal (1:1 side)" },
  { value: "triangular", label: "Triangular (90°)" },
  { value: "circular", label: "Circular (full)" },
];

const N_VALUES = [
  { value: "0.013", label: "Concrete (finished) — n=0.013" },
  { value: "0.015", label: "Concrete (rough) — n=0.015" },
  { value: "0.020", label: "Brick — n=0.020" },
  { value: "0.025", label: "Earth, straight — n=0.025" },
  { value: "0.030", label: "Earth, winding — n=0.030" },
];

export function ManningCalc({ calc }: { calc: CalcMeta }) {
  const [section, setSection] = useState("rectangular");
  const [b, setB] = useState(2); // m
  const [d, setD] = useState(1); // depth m
  const [dia, setDia] = useState(1); // m
  const [slope, setSlope] = useState(0.001); // m/m
  const [n, setN] = useState("0.013");

  const nNum = parseFloat(n);
  const { A, P } = (() => {
    if (section === "rectangular") return { A: b * d, P: b + 2 * d };
    if (section === "trapezoidal") return { A: (b + d) * d, P: b + 2 * d * Math.sqrt(2) };
    if (section === "triangular") return { A: d * d, P: 2 * d * Math.sqrt(2) };
    return { A: (Math.PI / 4) * dia * dia, P: Math.PI * dia };
  })();
  const R = A / P;
  const V = (1 / nNum) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);
  const Q = A * V;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`V = ${fmt(V, 3)} m/s · Q = ${fmt(Q, 3)} m³/s`}
      inputs={
        <div className="space-y-3">
          <FieldGrid cols={2}>
            <SelectField label="Cross-section" value={section} onChange={setSection} options={SECTIONS} />
            <SelectField label="Manning's n" value={n} onChange={setN} options={N_VALUES} />
          </FieldGrid>
          <FieldGrid cols={2}>
            {section !== "circular" && <NumberField label="Bottom width (b)" value={b} onChange={setB} unit="m" />}
            {section === "circular" ? (
              <NumberField label="Diameter" value={dia} onChange={setDia} unit="m" />
            ) : (
              <NumberField label="Flow depth (d)" value={d} onChange={setD} unit="m" />
            )}
            <NumberField label="Bed slope (S)" value={slope} onChange={setSlope} step={0.0005} hint="m/m" />
          </FieldGrid>
        </div>
      }
      formula={<FormulaBlock>V = (1/n) × R^(2/3) × S^(1/2)   ·   R = A / P   ·   Q = A × V</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Area A = {round(A, 4)} m²,  Wetted perimeter P = {round(P, 4)} m</li>
          <li>2. Hydraulic radius R = A/P = {round(R, 4)} m</li>
          <li>3. V = (1/{nNum}) × {round(R, 4)}^(2/3) × {slope}^(1/2) = <span className="text-foreground font-medium">{round(V, 4)} m/s</span></li>
          <li>4. Q = A × V = <span className="text-foreground font-medium">{round(Q, 4)} m³/s</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Velocity (V)" value={fmt(V, 3)} unit="m/s" highlight />
          <ResultLine label="Discharge (Q)" value={fmt(Q, 3)} unit="m³/s" highlight />
          <ResultLine label="Area" value={fmt(A, 4)} unit="m²" />
          <ResultLine label="Wetted perimeter" value={fmt(P, 4)} unit="m" />
          <ResultLine label="Hydraulic radius" value={fmt(R, 4)} unit="m" />
        </div>
      }
      notes={<p>Manning's equation for uniform open-channel flow. Valid for steady, fully developed flow. For natural streams, calibrate n against observed discharge.</p>}
    />
  );
}
