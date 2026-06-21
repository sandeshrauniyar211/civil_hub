"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// q = k × v   (flow = density × speed)
// Free flow speed v_f, jam density k_j
export function TrafficFlowCalc({ calc }: { calc: CalcMeta }) {
  const [flow, setFlow] = useState(1200); // veh/hr
  const [speed, setSpeed] = useState(60); // km/hr
  const [vf, setVf] = useState(80); // free flow speed
  const [kj, setKj] = useState(100); // jam density veh/km

  const density = speed > 0 ? flow / speed : 0;
  // Greenshields: q = v_f × k − (v_f/k_j) × k²
  // max flow occurs at v = v_f/2, k = k_j/2 → q_max = v_f × k_j / 4
  const qmax = (vf * kj) / 4;
  const kMax = kj / 2;
  const vMax = vf / 2;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Density = ${fmt(density, 1)} veh/km · Max flow = ${fmt(qmax, 0)} veh/hr`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Flow (q)" value={flow} onChange={setFlow} unit="veh/hr" />
          <NumberField label="Speed (v)" value={speed} onChange={setSpeed} unit="km/hr" />
          <NumberField label="Free-flow speed (v_f)" value={vf} onChange={setVf} unit="km/hr" />
          <NumberField label="Jam density (k_j)" value={kj} onChange={setKj} unit="veh/km" />
        </FieldGrid>
      }
      formula={<FormulaBlock>q = k × v   ·   q_max = (v_f × k_j) / 4   (Greenshields)</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Density k = q / v = {flow} / {speed} = <span className="text-foreground font-medium">{round(density, 2)} veh/km</span></li>
          <li>2. Greenshields q_max = ({vf} × {kj}) / 4 = <span className="text-foreground font-medium">{round(qmax, 0)} veh/hr</span></li>
          <li>3. At max flow: v = v_f/2 = {round(vMax, 1)} km/hr, k = k_j/2 = {round(kMax, 1)} veh/km</li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Density" value={fmt(density, 1)} unit="veh/km" highlight />
          <ResultLine label="Max flow capacity" value={fmt(qmax, 0)} unit="veh/hr" />
          <ResultLine label="Speed at max flow" value={fmt(vMax, 1)} unit="km/hr" />
          <ResultLine label="Density at max flow" value={fmt(kMax, 1)} unit="veh/km" />
        </div>
      }
      notes={<p>Greenshields linear model. Other models (Greenberg, Underwood) suit different regimes. Use field data to calibrate v_f and k_j.</p>}
    />
  );
}
