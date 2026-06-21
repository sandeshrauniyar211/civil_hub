"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// e + f = V² / (127 × R)
// V in km/h, R in m, e in decimal, f = side friction (0.10 – 0.18)
export function SuperelevationCalc({ calc }: { calc: CalcMeta }) {
  const [speed, setSpeed] = useState(80); // km/h
  const [radius, setRadius] = useState(250); // m
  const [friction, setFriction] = useState(0.15);
  const [maxE, setMaxE] = useState(0.07); // 7% max superelevation

  const ePlusF = (speed * speed) / (127 * radius);
  const eRequired = Math.max(0, ePlusF - friction);
  const eApplied = Math.min(eRequired, maxE);
  const fUsed = ePlusF - eApplied;
  const camberToBeRemoved = 0.025; // typical 2.5% camber

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`e = ${fmt(eApplied * 100, 2)}% (${eApplied >= maxE ? "max" : "calculated"})`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Design speed (V)" value={speed} onChange={setSpeed} unit="km/h" />
          <NumberField label="Radius (R)" value={radius} onChange={setRadius} unit="m" />
          <NumberField label="Side friction (f)" value={friction} onChange={setFriction} step={0.01} hint="0.10 – 0.18" />
          <NumberField label="Max superelevation" value={maxE * 100} onChange={(v) => setMaxE(v / 100)} unit="%" hint="7% plain, 10% hills" />
        </FieldGrid>
      }
      formula={<FormulaBlock>e + f = V² / (127·R)   ·   e ≤ e_max</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. e + f = {speed}² / (127 × {radius}) = {round(ePlusF, 4)}</li>
          <li>2. e_required = {round(ePlusF, 4)} − {friction} = {round(eRequired, 4)} ({round(eRequired * 100, 2)}%)</li>
          <li>3. Cap at e_max = {round(maxE * 100, 2)}% → e_applied = <span className="text-foreground font-medium">{round(eApplied * 100, 2)}%</span></li>
          <li>4. Friction used: f = {round(fUsed, 4)}</li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Superelevation applied" value={fmt(eApplied * 100, 2)} unit="%" highlight />
          <ResultLine label="e + f required" value={fmt(ePlusF * 100, 2)} unit="%" />
          <ResultLine label="Friction used" value={fmt(fUsed, 3)} />
          <ResultLine label="Camber to remove" value={fmt(camberToBeRemoved * 100, 1)} unit="%" />
        </div>
      }
      notes={<p>IRC:73 — e_max = 7% (plain & rolling), 10% (mountaneous). Runoff length = (e × width) / rate of change. For radii below certain limits, full superelevation with no friction may not be achievable — reduce speed.</p>}
    />
  );
}
