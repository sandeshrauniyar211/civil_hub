"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// SSD = 0.278 × V × t + V² / (254 × (f ± G))
// V in km/h, G in %, f = coefficient of friction
export function SightDistanceCalc({ calc }: { calc: CalcMeta }) {
  const [speed, setSpeed] = useState(80); // km/h design speed
  const [reactionTime, setReactionTime] = useState(2.5); // s
  const [friction, setFriction] = useState(0.35);
  const [grade, setGrade] = useState(0); // % (positive uphill)

  const lag = 0.278 * speed * reactionTime;
  const braking = (speed * speed) / (254 * (friction + grade / 100));
  const ssd = lag + braking;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`SSD = ${fmt(ssd, 1)} m`}
      inputs={
        <FieldGrid cols={2}>
          <NumberField label="Design speed (V)" value={speed} onChange={setSpeed} unit="km/h" />
          <NumberField label="Reaction time (t)" value={reactionTime} onChange={setReactionTime} unit="s" hint="IRC: 2.5 s" />
          <NumberField label="Friction (f)" value={friction} onChange={setFriction} step={0.05} hint="0.35 – 0.40" />
          <NumberField label="Grade (G)" value={grade} onChange={setGrade} unit="%" hint="+ uphill, − downhill" />
        </FieldGrid>
      }
      formula={<FormulaBlock>SSD = 0.278·V·t + V² / [254·(f ± G/100)]</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Lag distance = 0.278 × {speed} × {reactionTime} = {round(lag, 2)} m</li>
          <li>2. Braking distance = {speed}² / [254 × ({friction} + {grade / 100})] = {round(braking, 2)} m</li>
          <li>3. SSD = {round(lag, 2)} + {round(braking, 2)} = <span className="text-foreground font-medium">{round(ssd, 2)} m</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Lag distance" value={fmt(lag, 1)} unit="m" />
          <ResultLine label="Braking distance" value={fmt(braking, 1)} unit="m" />
          <ResultLine label="Stopping sight distance" value={fmt(ssd, 1)} unit="m" highlight />
        </div>
      }
      notes={<p>IRC formula for stopping sight distance on highways. Use 2.5 s reaction time, f = 0.35–0.40. For overtaking SSD, use IRC cl. 9 of IRC:73.</p>}
    />
  );
}
