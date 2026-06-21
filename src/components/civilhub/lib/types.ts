// CivilHub — shared types

export type ViewId =
  | "dashboard"
  | "gpa"
  | "surveying"
  | "estimation"
  | "calculators"
  | "resources"
  | "explore";

export type CalculatorId =
  // Basic
  | "percentage"
  | "unit-converter"
  | "area"
  | "volume"
  | "density"
  | "slope"
  // Civil
  | "concrete-volume"
  | "brickwork"
  | "cement-sand-aggregate"
  | "water-cement-ratio"
  | "steel-quantity"
  | "bbs"
  | "excavation"
  | "plaster"
  | "paint"
  | "tile"
  // Structural
  | "beam-load"
  | "column-load"
  | "dead-load"
  | "live-load"
  | "slab-thickness"
  | "steel-weight"
  // Hydraulics
  | "pipe-flow"
  | "discharge"
  | "manning"
  | "reservoir"
  // Transportation
  | "sight-distance"
  | "superelevation"
  | "traffic-flow"
  // Geotechnical
  | "soil-classification"
  | "bearing-capacity"
  | "earthwork";

export type CalculatorCategory =
  | "basic"
  | "civil"
  | "structural"
  | "hydraulics"
  | "transportation"
  | "geotechnical";

export interface CalcMeta {
  id: CalculatorId;
  name: string;
  shortName?: string;
  category: CalculatorCategory;
  description: string;
  keywords?: string[];
}

export interface HistoryEntry {
  id: string;
  calculatorId: CalculatorId;
  calculatorName: string;
  inputs: Record<string, string | number>;
  result: string;
  resultValue?: number;
  unit?: string;
  createdAt: number; // epoch ms
}

export interface SavedSemester {
  id: string;
  name: string;
  semesterNumber: number;
  subjects: SubjectEntry[];
  gpa: number;
  totalMarks: number;
  createdAt: number;
  updatedAt: number;
}

export interface SubjectEntry {
  id: string;
  name: string;
  code?: string;
  creditHours: number;
  internalMarks: number;
  finalMarks: number;
  totalMarks: number;
  gradePoint: number;
  letterGrade: string;
  // IOE-specific marksheet fields
  attendance?: number;
  assignment?: number;
  practical?: number;
  // optional reverse-calc snapshot
  targetTotal?: number;
}

export interface Settings {
  theme: "light" | "dark" | "system";
  // IOE grading scale
  gradingScale: GradeBand[];
}

export interface GradeBand {
  min: number;
  max: number;
  letter: string;
  point: number;
}

// IOE standard grading scale
export const IOE_GRADING_SCALE: GradeBand[] = [
  { min: 90, max: 100, letter: "A+", point: 4.0 },
  { min: 80, max: 89, letter: "A", point: 4.0 },
  { min: 70, max: 79, letter: "B+", point: 3.5 },
  { min: 60, max: 69, letter: "B", point: 3.0 },
  { min: 50, max: 59, letter: "C+", point: 2.5 },
  { min: 40, max: 49, letter: "C", point: 2.0 },
  { min: 0, max: 39, letter: "F", point: 0.0 },
];

export function gradeFor(total: number, scale: GradeBand[] = IOE_GRADING_SCALE): GradeBand {
  const t = Math.max(0, Math.min(100, total));
  return scale.find((b) => t >= b.min && t <= b.max) ?? scale[scale.length - 1];
}

export function gpaForSubjects(subjects: SubjectEntry[]): number {
  const totCredits = subjects.reduce((s, x) => s + (x.creditHours || 0), 0);
  if (totCredits === 0) return 0;
  const weighted = subjects.reduce(
    (s, x) => s + (x.creditHours || 0) * (x.gradePoint || 0),
    0,
  );
  return Math.round((weighted / totCredits) * 100) / 100;
}
