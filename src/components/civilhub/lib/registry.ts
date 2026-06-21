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

export const CALCULATORS: CalcMeta[] = [
  // ---------- Basic ----------
  {
    id: "percentage",
    name: "Percentage Calculator",
    category: "basic",
    description: "Compute percentage of a value, or the percent change between two values.",
    keywords: ["percent", "ratio", "change"],
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    category: "basic",
    description: "Convert length, mass, area, volume, pressure, and temperature units.",
    keywords: ["convert", "metric", "imperial"],
  },
  {
    id: "area",
    name: "Area Calculator",
    category: "basic",
    description: "Areas of rectangles, circles, triangles, trapezoids, and parallelograms.",
    keywords: ["geometry", "shape"],
  },
  {
    id: "volume",
    name: "Volume Calculator",
    category: "basic",
    description: "Volumes of cubes, cylinders, spheres, cones, and rectangular prisms.",
    keywords: ["geometry", "3d"],
  },
  {
    id: "density",
    name: "Density Calculator",
    category: "basic",
    description: "Density = mass / volume, plus mass and volume back-solve.",
    keywords: ["mass", "weight"],
  },
  {
    id: "slope",
    name: "Slope Calculator",
    category: "basic",
    description: "Slope, gradient, and angle between two points.",
    keywords: ["gradient", "incline"],
  },

  // ---------- Civil ----------
  {
    id: "concrete-volume",
    name: "Concrete Volume Calculator",
    category: "civil",
    description: "Volume of concrete for slabs, columns, beams, and footings.",
    keywords: ["cement", "pour"],
  },
  {
    id: "brickwork",
    name: "Brickwork Estimator",
    category: "civil",
    description: "Number of bricks and mortar for a wall of given dimensions.",
    keywords: ["brick", "masonry", "wall"],
  },
  {
    id: "cement-sand-aggregate",
    name: "Cement, Sand & Aggregate Calculator",
    category: "civil",
    description: "Material quantities for a given concrete grade and volume.",
    keywords: ["mix", "ratio", "grade"],
  },
  {
    id: "water-cement-ratio",
    name: "Water-Cement Ratio Calculator",
    category: "civil",
    description: "Water content from cement weight and w/c ratio.",
    keywords: ["wc", "mix", "workability"],
  },
  {
    id: "steel-quantity",
    name: "Reinforcement Steel Quantity",
    category: "civil",
    description: "Weight of steel bars from diameter, length, and number.",
    keywords: ["rebar", "reinforcement"],
  },
  {
    id: "bbs",
    name: "Bar Bending Schedule (BBS)",
    category: "civil",
    description: "Cutting length and weight for various bar shapes.",
    keywords: ["rebar", "schedule", "cutting"],
  },
  {
    id: "excavation",
    name: "Excavation Volume Calculator",
    category: "civil",
    description: "Earthwork excavation volume with side slopes.",
    keywords: ["earthwork", "trench"],
  },
  {
    id: "plaster",
    name: "Plaster Quantity Calculator",
    category: "civil",
    description: "Cement and sand required for plastering a wall area.",
    keywords: ["plastering", "finish"],
  },
  {
    id: "paint",
    name: "Paint Quantity Estimator",
    category: "civil",
    description: "Litres of paint needed for a given wall area and coats.",
    keywords: ["coating", "finish"],
  },
  {
    id: "tile",
    name: "Tile Quantity Calculator",
    category: "civil",
    description: "Number of tiles for a floor or wall area, with waste allowance.",
    keywords: ["flooring", "ceramic"],
  },

  // ---------- Structural ----------
  {
    id: "beam-load",
    name: "Beam Load Calculator",
    category: "structural",
    description: "Reactions and max bending moment for simply supported beams.",
    keywords: ["beam", "reaction", "moment"],
  },
  {
    id: "column-load",
    name: "Column Load Calculator",
    category: "structural",
    description: "Axial load capacity of a short RCC column.",
    keywords: ["column", "axial"],
  },
  {
    id: "dead-load",
    name: "Dead Load Calculator",
    category: "structural",
    description: "Unit-area dead load from slab, finish, and wall self-weight.",
    keywords: ["dl", "permanent"],
  },
  {
    id: "live-load",
    name: "Live Load Calculator",
    category: "structural",
    description: "Design live load from occupancy and area reduction.",
    keywords: ["ll", "occupancy"],
  },
  {
    id: "slab-thickness",
    name: "Slab Thickness Estimator",
    category: "structural",
    description: "Minimum slab thickness by span/depth ratio.",
    keywords: ["slab", "span"],
  },
  {
    id: "steel-weight",
    name: "Steel Weight Calculator",
    category: "structural",
    description: "Unit weight of steel sections from dimensions.",
    keywords: ["section", "weight"],
  },

  // ---------- Hydraulics ----------
  {
    id: "pipe-flow",
    name: "Pipe Flow Calculator",
    category: "hydraulics",
    description: "Continuity-based flow rate from area and velocity.",
    keywords: ["pipe", "continuity"],
  },
  {
    id: "discharge",
    name: "Discharge Calculator",
    category: "hydraulics",
    description: "Discharge from a notch or weir (rectangular / V-notch).",
    keywords: ["weir", "notch"],
  },
  {
    id: "manning",
    name: "Manning's Equation Calculator",
    category: "hydraulics",
    description: "Open-channel velocity and discharge via Manning's n.",
    keywords: ["channel", "open", "n"],
  },
  {
    id: "reservoir",
    name: "Reservoir Capacity Calculator",
    category: "hydraulics",
    description: "Storage volume from contour area vs elevation.",
    keywords: ["storage", "contour"],
  },

  // ---------- Transportation ----------
  {
    id: "sight-distance",
    name: "Sight Distance Calculator",
    category: "transportation",
    description: "Stopping sight distance on level and inclined roads.",
    keywords: ["ssd", "stopping"],
  },
  {
    id: "superelevation",
    name: "Superelevation Calculator",
    category: "transportation",
    description: "Required superelevation for a horizontal curve.",
    keywords: ["curve", "banking"],
  },
  {
    id: "traffic-flow",
    name: "Traffic Flow Calculator",
    category: "transportation",
    description: "Flow, density, and speed relationships.",
    keywords: ["density", "speed"],
  },

  // ---------- Geotechnical ----------
  {
    id: "soil-classification",
    name: "Soil Classification Tool",
    category: "geotechnical",
    description: "USCS classification from grain size and plasticity.",
    keywords: ["uscs", "atterberg"],
  },
  {
    id: "bearing-capacity",
    name: "Bearing Capacity Calculator",
    category: "geotechnical",
    description: "Terzaghi's ultimate bearing capacity for shallow foundations.",
    keywords: ["foundation", "terzaghi"],
  },
  {
    id: "earthwork",
    name: "Earthwork Volume Calculator",
    category: "geotechnical",
    description: "Volume between two cross-sections (trapezoidal / prismoidal).",
    keywords: ["cut", "fill", "embankment"],
  },
];

export const CALC_BY_ID = Object.fromEntries(
  CALCULATORS.map((c) => [c.id, c]),
) as Record<string, CalcMeta>;

export function calculatorsByCategory(): Record<CalculatorCategory, CalcMeta[]> {
  const grouped: Record<CalculatorCategory, CalcMeta[]> = {
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
