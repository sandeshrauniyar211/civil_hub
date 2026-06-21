// CivilHub — Estimation types (Phase 2)
// Data models for the three estimation modules: Quantity Takeoff, BOQ, Rate Analysis.

// ============================================================
// Quantity Takeoff
// ============================================================

export type TradeId =
  | "earthwork"
  | "concrete"
  | "brickwork"
  | "plaster"
  | "flooring"
  | "steel"
  | "woodwork"
  | "painting"
  | "other";

export const TRADE_LABELS: Record<TradeId, string> = {
  earthwork: "Earthwork",
  concrete: "Concrete",
  brickwork: "Brickwork & Masonry",
  plaster: "Plaster & Finishes",
  flooring: "Flooring & Tiling",
  steel: "Steel & Reinforcement",
  woodwork: "Woodwork",
  painting: "Painting",
  other: "Other",
};

export const TRADE_UNITS: Record<TradeId, QtyUnit> = {
  earthwork: "m³",
  concrete: "m³",
  brickwork: "m³",
  plaster: "m²",
  flooring: "m²",
  steel: "kg",
  woodwork: "m³",
  painting: "m²",
  other: "nos",
};

export type QtyUnit = "m³" | "m²" | "m" | "nos" | "kg" | "tonne" | "bag" | "L";

export type QtyFormula =
  | "L×W×H×N"   // volume (concrete, brickwork, earthwork)
  | "L×W×N"     // area (plaster, flooring, painting)
  | "L×N"       // linear (woodwork, beams)
  | "π/4×d²×h×N" // circular column / pile
  | "N";        // count only

export const FORMULA_LABELS: Record<QtyFormula, string> = {
  "L×W×H×N": "L × W × H × N",
  "L×W×N": "L × W × N",
  "L×N": "L × N",
  "π/4×d²×h×N": "π/4 × d² × h × N",
  "N": "Count",
};

export interface TakeoffItem {
  id: string;
  trade: TradeId;
  description: string;
  length: number;
  width: number;
  height: number; // or depth, or diameter for circular
  count: number;
  formula: QtyFormula;
  unit: QtyUnit;
  remarks: string;
}

export interface TakeoffProject {
  id: string;
  name: string;
  description: string;
  items: TakeoffItem[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// BOQ (Bill of Quantities)
// ============================================================

export interface BoqItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  // amount = quantity × rate (derived)
}

export interface BoqSection {
  id: string;
  code: string; // "A", "B", "C-1"...
  title: string;
  items: BoqItem[];
}

export interface Boq {
  id: string;
  name: string;
  client: string;
  contractor: string;
  date: string; // ISO date string
  sections: BoqSection[];
  contingencyPct: number; // %
  overheadPct: number; // %
  vatPct: number; // %
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// Rate Analysis
// ============================================================

export interface RateLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

export interface RateAnalysis {
  id: string;
  workType: string;
  unit: string; // "per m³", "per 10 m²", etc.
  analysisQuantity: number; // quantity the analysis is based on (e.g., 1 m³ or 10 m²)
  materials: RateLine[];
  labour: RateLine[];
  equipment: RateLine[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// Compute helpers
// ============================================================

export function computeQty(item: Pick<TakeoffItem, "formula" | "length" | "width" | "height" | "count">): number {
  const { length: L, width: W, height: H, count: N, formula } = item;
  const n = N || 1;
  switch (formula) {
    case "L×W×H×N":
      return L * W * H * n;
    case "L×W×N":
      return L * W * n;
    case "L×N":
      return L * n;
    case "π/4×d²×h×N":
      return (Math.PI / 4) * W * W * H * n; // W used as diameter for circular
    case "N":
      return n;
    default:
      return 0;
  }
}

export function round(v: number, decimals = 2): number {
  if (!Number.isFinite(v)) return 0;
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

export function fmt(v: number, decimals = 2): string {
  if (!Number.isFinite(v)) return "—";
  return round(v, decimals).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
