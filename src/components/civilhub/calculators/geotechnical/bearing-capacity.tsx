"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

// Terzaghi's bearing capacity
// General shear: q_u = c·Nc + q·Nq + 0.5·γ·B·Nγ
// q = γ·D_f (surcharge)
// Nc, Nq, Nγ are functions of φ

const FOUNDATIONS = [
  { value: "strip", label: "Strip footing", nc: 1, nq: 1, ngMult: 0.5 },
  { value: "square", label: "Square footing", nc: 1.3, nq: 1, ngMult: 0.4 },
  { value: "circular", label: "Circular footing", nc: 1.3, nq: 1, ngMult: 0.3 },
];

export function BearingCapacityCalc({ calc }: { calc: CalcMeta }) {
  const [type, setType] = useState("strip");
  const [c, setC] = useState(20); // kPa cohesion
  const [phi, setPhi] = useState(25); // degrees
  const [gamma, setGamma] = useState(18); // kN/m³
  const [B, setB] = useState(2); // width m
  const [Df, setDf] = useState(1.5); // depth m

  // Bearing capacity factors (Terzaghi)
  const phiRad = (phi * Math.PI) / 180;
  const Nq = Math.exp(Math.PI * Math.tan(phiRad)) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
  const Nc = phi > 0 ? (Nq - 1) / Math.tan(phiRad) : 5.7;
  const Ng = 2 * (Nq + 1) * Math.tan(phiRad);

  const f = FOUNDATIONS.find((x) => x.value === type)!;
  const surcharge = gamma * Df;
  const qu = f.nc * c * Nc + surcharge * f.nq * Nq + f.ngMult * gamma * B * Ng;
  const qsafe = qu / 3; // FOS = 3
  const qnet = qu - surcharge;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`q_ultimate = ${fmt(qu, 1)} kPa · q_safe = ${fmt(qsafe, 1)} kPa (FOS 3)`}
      inputs={
        <div className="space-y-3">
          <SelectField label="Footing shape" value={type} onChange={setType} options={FOUNDATIONS} />
          <FieldGrid cols={2}>
            <NumberField label="Cohesion (c)" value={c} onChange={setC} unit="kPa" />
            <NumberField label="Friction angle (φ)" value={phi} onChange={setPhi} unit="°" />
            <NumberField label="Unit weight (γ)" value={gamma} onChange={setGamma} unit="kN/m³" />
            <NumberField label="Width / Dia (B)" value={B} onChange={setB} unit="m" />
            <NumberField label="Depth (D_f)" value={Df} onChange={setDf} unit="m" />
          </FieldGrid>
        </div>
      }
      formula={<FormulaBlock>q_u = sc·c·N_c + q·N_q + sγ·0.5·γ·B·N_γ   ·   q = γ·D_f</FormulaBlock>}
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. N_q = e^(π·tan φ)·tan²(45°+φ/2) = {round(Nq, 2)}</li>
          <li>2. N_c = (N_q−1)/tan φ = {round(Nc, 2)}</li>
          <li>3. N_γ = 2(N_q+1)·tan φ = {round(Ng, 2)}</li>
          <li>4. Surcharge q = γ·D_f = {gamma}×{Df} = {round(surcharge, 2)} kPa</li>
          <li>5. q_u = {round(f.nc * c * Nc, 1)} + {round(surcharge * f.nq * Nq, 1)} + {round(f.ngMult * gamma * B * Ng, 1)} = <span className="text-foreground font-medium">{round(qu, 2)} kPa</span></li>
          <li>6. q_safe = q_u / 3 = <span className="text-foreground font-medium">{round(qsafe, 2)} kPa</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Ultimate capacity" value={fmt(qu, 1)} unit="kPa" highlight />
          <ResultLine label="Net ultimate" value={fmt(qnet, 1)} unit="kPa" />
          <ResultLine label="Safe bearing (FOS 3)" value={fmt(qsafe, 1)} unit="kPa" highlight />
          <ResultLine label="N_c" value={fmt(Nc, 2)} />
          <ResultLine label="N_q" value={fmt(Nq, 2)} />
          <ResultLine label="N_γ" value={fmt(Ng, 2)} />
        </div>
      }
      notes={<p>Terzaghi's equation for shallow foundations under vertical, concentric load. Shape factors: strip (1, 1, 0.5), square/circular (1.3, 1, 0.4/0.3). For local shear failure, reduce c and tan φ by 2/3.</p>}
    />
  );
}
