// CivilHub — calculator registry & helpers

import type { CalcMeta, CalculatorCategory } from "./types";

export const CATEGORY_LABELS: Record<CalculatorCategory, string> = {
  basic: "Basic Engineering",
  civil: "Civil Engineering",
  structural: "Structural Engineering",
  hydraulics: "Hydraulics & Water Resources",
  transportation: "Transportation Engineering",
  geotechnical: "Geotechnical Engineering",
};

export const CATEGORY_DESCRIPTIONS: Record<CalculatorCategory, string> = {
  basic: "General-purpose utilities every engineering student reaches for daily.",
  civil: "Quantity, mix, and material takeoffs for civil construction work.",
  structural: "Loads, members, and section checks for structural analysis coursework.",
  hydraulics: "Flow, discharge, and capacity calcs for water resources.",
  transportation: "Highway geometric and traffic fundamentals.",
  geotechnical: "Soil classification, bearing capacity, and earthwork.",
};

// Phase 2 — "use case" tags for the Explore view.
// Each calculator can be tagged with the academic course or site-work scenario
// it serves. The Explore view groups calculators by use-case, not just category,
// to help students find what they need for a given subject or task.
export type UseCaseId =
  | "coursework"
  | "site-work"
  | "estimating"
  | "design"
  | "field-survey"
  | "exam-prep"
  | "lab"
  | "thesis";

export const USE_CASE_LABELS: Record<UseCaseId, string> = {
  coursework: "Coursework & assignments",
  "site-work": "Site work",
  estimating: "Estimating & BOQ",
  design: "Design & analysis",
  "field-survey": "Field surveying",
  "exam-prep": "Exam prep",
  lab: "Lab work",
  thesis: "Thesis / project",
};

export const USE_CASE_DESCRIPTIONS: Record<UseCaseId, string> = {
  coursework: "Tools you'll reach for in weekly problem sets and tutorials.",
  "site-work": "Tools that survive dust, sun, and a clipboard — used on real sites.",
  estimating: "Quantity takeoffs, mix designs, and bill-of-quantities helpers.",
  design: "Structural, hydraulic, and geotechnical design calculations.",
  "field-survey": "Levelling, traversing, and bearing tools for survey camp.",
  "exam-prep": "Quick-reference calcs you'll need in numerical exams.",
  lab: "Companion tools for fluid mechanics and soil mechanics labs.",
  thesis: "Reusable building blocks for your final-year project.",
};

// Recommended "popular" calculators — surfaced on the Explore landing.
export const POPULAR_CALC_IDS: string[] = [
  "concrete-volume",
  "cement-sand-aggregate",
  "beam-load",
  "bbs",
  "soil-classification",
  "manning",
  "sight-distance",
  "percentage",
];

export interface CalcMetaExt extends CalcMeta {
  useCases?: UseCaseId[];
}

export const CALCULATORS: CalcMetaExt[] = [
  // ---------- Basic ----------
  {
    id: "percentage",
    name: "Percentage Calculator",
    category: "basic",
    description: "Compute percentage of a value, or the percent change between two values.",
    keywords: ["percent", "ratio", "change"],
    useCases: ["coursework", "exam-prep"],
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    category: "basic",
    description: "Convert length, mass, area, volume, pressure, and temperature units.",
    keywords: ["convert", "metric", "imperial"],
    useCases: ["coursework", "site-work", "lab"],
  },
  {
    id: "area",
    name: "Area Calculator",
    category: "basic",
    description: "Areas of rectangles, circles, triangles, trapezoids, and parallelograms.",
    keywords: ["geometry", "shape"],
    useCases: ["coursework", "estimating"],
  },
  {
    id: "volume",
    name: "Volume Calculator",
    category: "basic",
    description: "Volumes of cubes, cylinders, spheres, cones, and rectangular prisms.",
    keywords: ["geometry", "3d"],
    useCases: ["coursework", "estimating"],
  },
  {
    id: "density",
    name: "Density Calculator",
    category: "basic",
    description: "Density = mass / volume, plus mass and volume back-solve.",
    keywords: ["mass", "weight"],
    useCases: ["coursework", "lab"],
  },
  {
    id: "slope",
    name: "Slope Calculator",
    category: "basic",
    description: "Slope, gradient, and angle between two points.",
    keywords: ["gradient", "incline"],
    useCases: ["coursework", "field-survey"],
  },

  // ---------- Civil ----------
  {
    id: "concrete-volume",
    name: "Concrete Volume Calculator",
    category: "civil",
    description: "Volume of concrete for slabs, columns, beams, and footings.",
    keywords: ["cement", "pour"],
    useCases: ["estimating", "site-work", "design"],
  },
  {
    id: "brickwork",
    name: "Brickwork Estimator",
    category: "civil",
    description: "Number of bricks and mortar for a wall of given dimensions.",
    keywords: ["brick", "masonry", "wall"],
    useCases: ["estimating", "site-work"],
  },
  {
    id: "cement-sand-aggregate",
    name: "Cement, Sand & Aggregate Calculator",
    category: "civil",
    description: "Material quantities for a given concrete grade and volume.",
    keywords: ["mix", "ratio", "grade"],
    useCases: ["estimating", "site-work", "design"],
  },
  {
    id: "water-cement-ratio",
    name: "Water-Cement Ratio Calculator",
    category: "civil",
    description: "Water content from cement weight and w/c ratio.",
    keywords: ["wc", "mix", "workability"],
    useCases: ["design", "lab", "site-work"],
  },
  {
    id: "steel-quantity",
    name: "Reinforcement Steel Quantity",
    category: "civil",
    description: "Weight of steel bars from diameter, length, and number.",
    keywords: ["rebar", "reinforcement"],
    useCases: ["estimating", "design"],
  },
  {
    id: "bbs",
    name: "Bar Bending Schedule (BBS)",
    category: "civil",
    description: "Cutting length and weight for various bar shapes.",
    keywords: ["rebar", "schedule", "cutting"],
    useCases: ["estimating", "site-work", "thesis"],
  },
  {
    id: "excavation",
    name: "Excavation Volume Calculator",
    category: "civil",
    description: "Earthwork excavation volume with side slopes.",
    keywords: ["earthwork", "trench"],
    useCases: ["estimating", "site-work"],
  },
  {
    id: "plaster",
    name: "Plaster Quantity Calculator",
    category: "civil",
    description: "Cement and sand required for plastering a wall area.",
    keywords: ["plastering", "finish"],
    useCases: ["estimating", "site-work"],
  },
  {
    id: "paint",
    name: "Paint Quantity Estimator",
    category: "civil",
    description: "Litres of paint needed for a given wall area and coats.",
    keywords: ["coating", "finish"],
    useCases: ["estimating", "site-work"],
  },
  {
    id: "tile",
    name: "Tile Quantity Calculator",
    category: "civil",
    description: "Number of tiles for a floor or wall area, with waste allowance.",
    keywords: ["flooring", "ceramic"],
    useCases: ["estimating", "site-work"],
  },

  // ---------- Structural ----------
  {
    id: "beam-load",
    name: "Beam Load Calculator",
    category: "structural",
    description: "Reactions and max bending moment for simply supported beams.",
    keywords: ["beam", "reaction", "moment"],
    useCases: ["design", "coursework", "exam-prep"],
  },
  {
    id: "column-load",
    name: "Column Load Calculator",
    category: "structural",
    description: "Axial load capacity of a short RCC column.",
    keywords: ["column", "axial"],
    useCases: ["design", "coursework", "thesis"],
  },
  {
    id: "dead-load",
    name: "Dead Load Calculator",
    category: "structural",
    description: "Unit-area dead load from slab, finish, and wall self-weight.",
    keywords: ["dl", "permanent"],
    useCases: ["design", "coursework"],
  },
  {
    id: "live-load",
    name: "Live Load Calculator",
    category: "structural",
    description: "Design live load from occupancy and area reduction.",
    keywords: ["ll", "occupancy"],
    useCases: ["design", "coursework"],
  },
  {
    id: "slab-thickness",
    name: "Slab Thickness Estimator",
    category: "structural",
    description: "Minimum slab thickness by span/depth ratio.",
    keywords: ["slab", "span"],
    useCases: ["design", "coursework"],
  },
  {
    id: "steel-weight",
    name: "Steel Weight Calculator",
    category: "structural",
    description: "Unit weight of steel sections from dimensions.",
    keywords: ["section", "weight"],
    useCases: ["design", "estimating"],
  },

  // ---------- Hydraulics ----------
  {
    id: "pipe-flow",
    name: "Pipe Flow Calculator",
    category: "hydraulics",
    description: "Continuity-based flow rate from area and velocity.",
    keywords: ["pipe", "continuity"],
    useCases: ["design", "coursework", "lab"],
  },
  {
    id: "discharge",
    name: "Discharge Calculator",
    category: "hydraulics",
    description: "Discharge from a notch or weir (rectangular / V-notch).",
    keywords: ["weir", "notch"],
    useCases: ["lab", "coursework"],
  },
  {
    id: "manning",
    name: "Manning's Equation Calculator",
    category: "hydraulics",
    description: "Open-channel velocity and discharge via Manning's n.",
    keywords: ["channel", "open", "n"],
    useCases: ["design", "coursework", "exam-prep"],
  },
  {
    id: "reservoir",
    name: "Reservoir Capacity Calculator",
    category: "hydraulics",
    description: "Storage volume from contour area vs elevation.",
    keywords: ["storage", "contour"],
    useCases: ["design", "thesis", "coursework"],
  },

  // ---------- Transportation ----------
  {
    id: "sight-distance",
    name: "Sight Distance Calculator",
    category: "transportation",
    description: "Stopping sight distance on level and inclined roads.",
    keywords: ["ssd", "stopping"],
    useCases: ["design", "coursework", "exam-prep"],
  },
  {
    id: "superelevation",
    name: "Superelevation Calculator",
    category: "transportation",
    description: "Required superelevation for a horizontal curve.",
    keywords: ["curve", "banking"],
    useCases: ["design", "coursework", "exam-prep"],
  },
  {
    id: "traffic-flow",
    name: "Traffic Flow Calculator",
    category: "transportation",
    description: "Flow, density, and speed relationships.",
    keywords: ["density", "speed"],
    useCases: ["coursework", "exam-prep"],
  },

  // ---------- Geotechnical ----------
  {
    id: "soil-classification",
    name: "Soil Classification Tool",
    category: "geotechnical",
    description: "USCS classification from grain size and plasticity.",
    keywords: ["uscs", "atterberg"],
    useCases: ["lab", "coursework", "thesis"],
  },
  {
    id: "bearing-capacity",
    name: "Bearing Capacity Calculator",
    category: "geotechnical",
    description: "Terzaghi's ultimate bearing capacity for shallow foundations.",
    keywords: ["foundation", "terzaghi"],
    useCases: ["design", "coursework", "exam-prep"],
  },
  {
    id: "earthwork",
    name: "Earthwork Volume Calculator",
    category: "geotechnical",
    description: "Volume between two cross-sections (trapezoidal / prismoidal).",
    keywords: ["cut", "fill", "embankment"],
    useCases: ["estimating", "site-work", "coursework"],
  },
];

export const CALC_BY_ID = Object.fromEntries(
  CALCULATORS.map((c) => [c.id, c]),
) as Record<string, CalcMetaExt>;

export function calculatorsByCategory(): Record<CalculatorCategory, CalcMetaExt[]> {
  const grouped: Record<CalculatorCategory, CalcMetaExt[]> = {
    basic: [],
    civil: [],
    structural: [],
    hydraulics: [],
    transportation: [],
    geotechnical: [],
  };
  for (const c of CALCULATORS) grouped[c.category].push(c);
  return grouped;
}

// Phase 2 — feature discovery helpers
export function calculatorsByUseCase(): Record<UseCaseId, CalcMetaExt[]> {
  const grouped: Record<UseCaseId, CalcMetaExt[]> = {
    coursework: [],
    "site-work": [],
    estimating: [],
    design: [],
    "field-survey": [],
    "exam-prep": [],
    lab: [],
    thesis: [],
  };
  for (const c of CALCULATORS) {
    if (!c.useCases) continue;
    for (const uc of c.useCases) grouped[uc].push(c);
  }
  return grouped;
}

export function getPopularCalculators(): CalcMetaExt[] {
  return POPULAR_CALC_IDS.map((id) => CALC_BY_ID[id]).filter(Boolean);
}
