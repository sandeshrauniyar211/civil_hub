"use client";

import { useState } from "react";
import { CalculatorShell } from "../shell";
import { NumberField, SelectField, FieldGrid, fmt } from "../fields";
import { ResultLine, FormulaBlock } from "../../lib/ui";
import type { CalcMeta } from "../../lib/types";

type Category = "length" | "mass" | "area" | "volume" | "pressure" | "temperature";

const UNITS: Record<Category, { value: string; label: string; toBase: number }[]> = {
  length: [
    { value: "mm", label: "Millimetre (mm)", toBase: 0.001 },
    { value: "cm", label: "Centimetre (cm)", toBase: 0.01 },
    { value: "m", label: "Metre (m)", toBase: 1 },
    { value: "km", label: "Kilometre (km)", toBase: 1000 },
    { value: "in", label: "Inch (in)", toBase: 0.0254 },
    { value: "ft", label: "Foot (ft)", toBase: 0.3048 },
    { value: "yd", label: "Yard (yd)", toBase: 0.9144 },
  ],
  mass: [
    { value: "g", label: "Gram (g)", toBase: 0.001 },
    { value: "kg", label: "Kilogram (kg)", toBase: 1 },
    { value: "t", label: "Tonne (t)", toBase: 1000 },
    { value: "lb", label: "Pound (lb)", toBase: 0.45359237 },
    { value: "oz", label: "Ounce (oz)", toBase: 0.028349523 },
  ],
  area: [
    { value: "mm2", label: "mm²", toBase: 1e-6 },
    { value: "cm2", label: "cm²", toBase: 1e-4 },
    { value: "m2", label: "m²", toBase: 1 },
    { value: "ha", label: "Hectare", toBase: 10000 },
    { value: "ft2", label: "ft²", toBase: 0.09290304 },
    { value: "ac", label: "Acre", toBase: 4046.8564224 },
  ],
  volume: [
    { value: "ml", label: "Millilitre (ml)", toBase: 1e-6 },
    { value: "l", label: "Litre (L)", toBase: 1e-3 },
    { value: "m3", label: "m³", toBase: 1 },
    { value: "ft3", label: "ft³", toBase: 0.028316846 },
    { value: "gal", label: "US gallon", toBase: 0.003785412 },
  ],
  pressure: [
    { value: "pa", label: "Pascal (Pa)", toBase: 1 },
    { value: "kpa", label: "kPa", toBase: 1000 },
    { value: "mpa", label: "MPa", toBase: 1e6 },
    { value: "bar", label: "Bar", toBase: 1e5 },
    { value: "atm", label: "Atmosphere", toBase: 101325 },
    { value: "psi", label: "psi", toBase: 6894.757 },
  ],
  temperature: [
    { value: "c", label: "Celsius (°C)", toBase: 1 },
    { value: "f", label: "Fahrenheit (°F)", toBase: 1 },
    { value: "k", label: "Kelvin (K)", toBase: 1 },
  ],
};

export function UnitConverterCalc({ calc }: { calc: CalcMeta }) {
  const [category, setCategory] = useState<Category>("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const [value, setValue] = useState(1);

  const result = (() => {
    if (category === "temperature") {
      // convert to C first
      let celsius: number;
      if (from === "c") celsius = value;
      else if (from === "f") celsius = (value - 32) * (5 / 9);
      else celsius = value - 273.15;

      if (to === "c") return celsius;
      if (to === "f") return celsius * (9 / 5) + 32;
      return celsius + 273.15;
    }
    const fromU = UNITS[category].find((u) => u.value === from)!;
    const toU = UNITS[category].find((u) => u.value === to)!;
    return (value * fromU.toBase) / toU.toBase;
  })();

  return (
    <CalculatorShell
      calc={calc}
      resultSummary={`${value} ${from} = ${fmt(result, 6)} ${to}`}
      inputs={
        <div className="space-y-3">
          <SelectField
            label="Category"
            value={category}
            onChange={(v) => {
              const cat = v as Category;
              setCategory(cat);
              const opts = UNITS[cat];
              setFrom(opts[0].value);
              setTo(opts[1].value);
            }}
            options={(Object.keys(UNITS) as Category[]).map((c) => ({
              value: c,
              label: c.charAt(0).toUpperCase() + c.slice(1),
            }))}
          />
          <FieldGrid cols={2}>
            <NumberField label="Value" value={value} onChange={setValue} />
            <div />
            <SelectField
              label="From"
              value={from}
              onChange={setFrom}
              options={UNITS[category].map((u) => ({ value: u.value, label: u.label }))}
            />
            <SelectField
              label="To"
              value={to}
              onChange={setTo}
              options={UNITS[category].map((u) => ({ value: u.value, label: u.label }))}
            />
          </FieldGrid>
        </div>
      }
      formula={
        <FormulaBlock>
          {category === "temperature"
            ? "C = (F − 32) × 5/9   ·   K = C + 273.15"
            : "result = value × (fromBase ÷ toBase)"}
        </FormulaBlock>
      }
      results={
        <div className="space-y-1">
          <ResultLine label="Result" value={fmt(result, 6)} unit={to} highlight />
          <ResultLine label="Input" value={fmt(value, 4)} unit={from} />
        </div>
      }
    />
  );
}
