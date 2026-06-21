"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, FieldGrid, fmt, round } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

type Mode = "of" | "change";

export function PercentageCalc({ calc }: { calc: CalcMeta }) {
  const [mode, setMode] = useState<Mode>("of");
  const [value, setValue] = useState(250);
  const [percent, setPercent] = useState(15);
  const [oldVal, setOldVal] = useState(180);
  const [newVal, setNewVal] = useState(225);

  const result =
    mode === "of"
      ? (value * percent) / 100
      : ((newVal - oldVal) / Math.abs(oldVal)) * 100;

  const resultSummary =
    mode === "of"
      ? `${percent}% of ${value} = ${fmt(result)}`
      : `Change from ${oldVal} to ${newVal} = ${fmt(result)}%`;

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={resultSummary}
      inputs={
        <div className="space-y-3">
          <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/40">
            <button
              onClick={() => setMode("of")}
              className={`px-3 py-1 text-xs font-medium rounded ${mode === "of" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
            >
              X% of value
            </button>
            <button
              onClick={() => setMode("change")}
              className={`px-3 py-1 text-xs font-medium rounded ${mode === "change" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
            >
              % change
            </button>
          </div>

          {mode === "of" ? (
            <FieldGrid cols={2}>
              <NumberField label="Value" value={value} onChange={setValue} unit="" />
              <NumberField label="Percentage" value={percent} onChange={setPercent} unit="%" />
            </FieldGrid>
          ) : (
            <FieldGrid cols={2}>
              <NumberField label="Old value" value={oldVal} onChange={setOldVal} />
              <NumberField label="New value" value={newVal} onChange={setNewVal} />
            </FieldGrid>
          )}
        </div>
      }
      formula={
        mode === "of" ? (
          <FormulaBlock>result = value × (percentage ÷ 100)</FormulaBlock>
        ) : (
          <FormulaBlock>% change = ((new − old) ÷ |old|) × 100</FormulaBlock>
        )
      }
      steps={
        mode === "of" ? (
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            <li>1. Convert {percent}% → {percent / 100}</li>
            <li>2. Multiply: {value} × {percent / 100} = <span className="text-foreground font-medium">{fmt(result)}</span></li>
          </ol>
        ) : (
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            <li>1. Difference: {newVal} − {oldVal} = {round(newVal - oldVal, 2)}</li>
            <li>2. Divide by |{oldVal}|: {round((newVal - oldVal) / Math.abs(oldVal), 4)}</li>
            <li>3. × 100 = <span className="text-foreground font-medium">{fmt(result)}%</span></li>
          </ol>
        )
      }
      results={
        <div className="space-y-1">
          <ResultLine label={mode === "of" ? "Result" : "% change"} value={fmt(result)} unit={mode === "of" ? "" : "%"} highlight />
        </div>
      }
      onSaveResult={(i, r) => ({ ...i, mode, result: r })}
    />
  );
}
