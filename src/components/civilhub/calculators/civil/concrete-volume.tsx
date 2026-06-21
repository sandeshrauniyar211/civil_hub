"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

type Member = "slab" | "column" | "beam" | "footing";

export function ConcreteVolumeCalc({ calc }: { calc: CalcMeta }) {
  const [member, setMember] = useState<Member>("slab");
  const [l, setL] = useState(5);
  const [w, setW] = useState(4);
  const [h, setH] = useState(0.15);
  const [dia, setDia] = useState(0.4);
  const [count, setCount] = useState(1);

  const volume = (() => {
    switch (member) {
      case "slab":
      case "footing":
        return l * w * h;
      case "beam":
        return l * w * h;
      case "column":
        return (Math.PI * dia * dia * 0.25 * h) * count;
    }
  })();

  // wet → dry factor for ordering materials (typical 1.54)
  const dryVolume = volume * 1.54;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`Wet concrete = ${fmt(volume)} m³ · Dry = ${fmt(dryVolume)} m³`}
      inputs={
        <div className="space-y-3">
          <SelectField
            label="Member type"
            value={member}
            onChange={(v) => setMember(v as Member)}
            options={[
              { value: "slab", label: "Slab" },
              { value: "column", label: "Circular Column" },
              { value: "beam", label: "Beam" },
              { value: "footing", label: "Footing" },
            ]}
          />
          {member === "column" ? (
            <FieldGrid cols={3}>
              <NumberField label="Diameter" value={dia} onChange={setDia} unit="m" step={0.05} />
              <NumberField label="Height" value={h} onChange={setH} unit="m" />
              <NumberField label="Count" value={count} onChange={setCount} min={1} />
            </FieldGrid>
          ) : (
            <FieldGrid cols={3}>
              <NumberField label="Length" value={l} onChange={setL} unit="m" />
              <NumberField label="Width" value={w} onChange={setW} unit="m" />
              <NumberField label="Depth / Height" value={h} onChange={setH} unit="m" />
            </FieldGrid>
          )}
        </div>
      }
      formula={
        <FormulaBlock>
          {member === "column"
            ? "V = (π/4) × d² × h × n   ·   Dry = 1.54 × V"
            : "V = L × W × H   ·   Dry = 1.54 × V"}
        </FormulaBlock>
      }
      steps={
        <ol className="space-y-1.5 text-xs text-muted-foreground">
          <li>1. Wet volume: {round(volume, 4)} m³</li>
          <li>2. Dry volume (× 1.54 for shrinkage): <span className="text-foreground font-medium">{round(dryVolume, 4)} m³</span></li>
        </ol>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Wet concrete" value={fmt(volume)} unit="m³" highlight />
          <ResultLine label="Dry volume" value={fmt(dryVolume)} unit="m³" />
          <ResultLine label="In cubic feet" value={fmt(volume * 35.3147)} unit="ft³" />
        </div>
      }
      notes={
        <p>
          The 1.54 factor accounts for voids in dry ingredients (cement + sand + aggregate) — when mixed with water, the volume shrinks to about 65% of the dry volume, so dry = 1/0.65 ≈ 1.54 × wet.
        </p>
      }
    />
  );
}
