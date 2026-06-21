// CivilHub — Nepal residential BOQ templates
// Default line items + rates based on standard Nepal construction practice
// (1.5-storey residential house, ~1000 sqft footprint).
// Rates are approximate market rates (NPR, 2024-25) and intended as a starting
// point — users should adjust to their local rates.

import type { Boq, BoqSection, BoqItem } from "./estimation-types";
import { uid } from "./estimation-types";

export interface TemplateItem {
  description: string;
  unit: string;
  quantity: number;
  rate: number;
}

export interface TemplateSection {
  code: string;
  title: string;
  items: TemplateItem[];
}

// -------------------------------------------------------------
// Standard Nepal residential BOQ template
// -------------------------------------------------------------
// Sections mirror the structure used by Nepali contractors and
// consultants: Substructure → Superstructure → Finishing → Optional.
// -------------------------------------------------------------

export const NEPAL_RESIDENTIAL_TEMPLATE: TemplateSection[] = [
  {
    code: "A",
    title: "Substructure",
    items: [
      { description: "Excavation in ordinary soil for foundation trenches", unit: "m³", quantity: 60, rate: 350 },
      { description: "Plain Cement Concrete (PCC) 1:4:8 in foundation base", unit: "m³", quantity: 12, rate: 6500 },
      { description: "RCC M20 in footing (cast-in-situ)", unit: "m³", quantity: 15, rate: 12000 },
      { description: "RCC M20 in plinth beam", unit: "m³", quantity: 8, rate: 12000 },
      { description: "Foundation masonry in brickwork 1:6 cement mortar", unit: "m³", quantity: 22, rate: 9000 },
      { description: "Backfilling with selected excavated soil, compacted in layers", unit: "m³", quantity: 30, rate: 200 },
      { description: "Damp-proof course (DPC) 1:2:4, 25mm thick", unit: "m²", quantity: 35, rate: 350 },
    ],
  },
  {
    code: "B",
    title: "Superstructure",
    items: [
      { description: "RCC M20 in columns (cast-in-situ)", unit: "m³", quantity: 9, rate: 12000 },
      { description: "RCC M20 in beams (cast-in-situ)", unit: "m³", quantity: 12, rate: 12000 },
      { description: "RCC M20 in slabs (cast-in-situ, 125mm thick)", unit: "m³", quantity: 18, rate: 11500 },
      { description: "Brick masonry walls in 1:6 cement mortar, 230mm thick", unit: "m³", quantity: 45, rate: 9000 },
      { description: "Brick masonry walls in 1:6 cement mortar, 115mm thick", unit: "m³", quantity: 8, rate: 9000 },
      { description: "RCC M20 staircase construction including waist slab, steps & landing", unit: "m³", quantity: 4, rate: 12500 },
      { description: "Lintel & chajja RCC M20", unit: "m³", quantity: 3, rate: 12000 },
      { description: "Parapet wall brickwork 1:6, 115mm thick", unit: "m³", quantity: 2, rate: 9000 },
    ],
  },
  {
    code: "C",
    title: "Finishing",
    items: [
      { description: "Internal cement plaster 1:4, 12mm thick", unit: "m²", quantity: 320, rate: 350 },
      { description: "External cement plaster 1:4, 20mm thick", unit: "m²", quantity: 180, rate: 450 },
      { description: "Ceiling plaster 1:3, 10mm thick", unit: "m²", quantity: 110, rate: 320 },
      { description: "Floor tiles (600×600mm vitrified) including laying & jointing", unit: "m²", quantity: 95, rate: 1200 },
      { description: "Wall tiles in bathroom & kitchen (ceramic 250×350mm)", unit: "m²", quantity: 45, rate: 1100 },
      { description: "Internal acrylic emulsion paint — 2 coats over 1 primer", unit: "m²", quantity: 320, rate: 250 },
      { description: "External weatherproof paint — 2 coats", unit: "m²", quantity: 180, rate: 320 },
      { description: "Doors — flush / panelled including frame & hardware", unit: "nos", quantity: 8, rate: 15000 },
      { description: "Windows — aluminium sliding with glass", unit: "nos", quantity: 10, rate: 12000 },
      { description: "Main entrance door (teak frame + shutter)", unit: "nos", quantity: 1, rate: 45000 },
    ],
  },
  {
    code: "D",
    title: "Optional Services",
    items: [
      { description: "Electrical work — point wiring, switchboard, MCB, earthing (lumpsum basis)", unit: "lot", quantity: 1, rate: 150000 },
      { description: "Plumbing work — supply, drainage, fixtures (lumpsum basis)", unit: "lot", quantity: 1, rate: 80000 },
      { description: "Septic tank — 2000L RCC single-chamber with cover slab", unit: "nos", quantity: 1, rate: 45000 },
      { description: "Boundary wall — brickwork with RCC post & gate", unit: "m", quantity: 30, rate: 3500 },
      { description: "Overhead water tank 1000L with tower", unit: "nos", quantity: 1, rate: 25000 },
      { description: "Solar water heating system (100L)", unit: "nos", quantity: 1, rate: 35000 },
    ],
  },
];

// -------------------------------------------------------------
// Convert template → live Boq object (fresh IDs, current date)
// -------------------------------------------------------------

export function buildBoqFromTemplate(
  template: TemplateSection[],
  name = "Nepal Residential BOQ",
): Boq {
  const sections: BoqSection[] = template.map((sec) => ({
    id: uid("sec"),
    code: sec.code,
    title: sec.title,
    items: sec.items.map<BoqItem>((it) => ({
      id: uid("bi"),
      description: it.description,
      unit: it.unit,
      quantity: it.quantity,
      rate: it.rate,
    })),
  }));

  return {
    id: uid("boq"),
    name,
    client: "",
    contractor: "",
    date: new Date().toISOString().slice(0, 10),
    sections,
    contingencyPct: 3,
    overheadPct: 7,
    vatPct: 13,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// -------------------------------------------------------------
// Catalog of available BOQ templates (for the picker UI)
// -------------------------------------------------------------

export interface BoqTemplateMeta {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  sectionCount: number;
  builder: () => Boq;
}

export const BOQ_TEMPLATES: BoqTemplateMeta[] = [
  {
    id: "nepal-residential",
    name: "Nepal Residential House",
    description:
      "Standard 1.5-storey residential house, ~1000 sqft footprint. Covers substructure, superstructure, finishing & optional services with default Nepal market rates.",
    itemCount: NEPAL_RESIDENTIAL_TEMPLATE.reduce((s, sec) => s + sec.items.length, 0),
    sectionCount: NEPAL_RESIDENTIAL_TEMPLATE.length,
    builder: () => buildBoqFromTemplate(NEPAL_RESIDENTIAL_TEMPLATE, "Nepal Residential BOQ"),
  },
  {
    id: "nepal-substructure-only",
    name: "Substructure Only (Foundation)",
    description: "Foundation-only scope — excavation, PCC, RCC, masonry, backfill. Useful for staged tendering.",
    itemCount: NEPAL_RESIDENTIAL_TEMPLATE[0].items.length,
    sectionCount: 1,
    builder: () =>
      buildBoqFromTemplate([NEPAL_RESIDENTIAL_TEMPLATE[0]], "Substructure BOQ"),
  },
  {
    id: "nepal-empty",
    name: "Blank BOQ (build from scratch)",
    description: "Three empty sections (Earthwork, Concrete, Brickwork) with one line each. Use this when you have your own item list.",
    itemCount: 3,
    sectionCount: 3,
    builder: () => {
      return {
        id: uid("boq"),
        name: "Untitled BOQ",
        client: "",
        contractor: "",
        date: new Date().toISOString().slice(0, 10),
        sections: [
          {
            id: uid("sec"),
            code: "A",
            title: "Earthwork",
            items: [{ id: uid("bi"), description: "", unit: "m³", quantity: 0, rate: 0 }],
          },
          {
            id: uid("sec"),
            code: "B",
            title: "Concrete",
            items: [{ id: uid("bi"), description: "", unit: "m³", quantity: 0, rate: 0 }],
          },
          {
            id: uid("sec"),
            code: "C",
            title: "Brickwork & Masonry",
            items: [{ id: uid("bi"), description: "", unit: "m³", quantity: 0, rate: 0 }],
          },
        ],
        contingencyPct: 3,
        overheadPct: 7,
        vatPct: 13,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    },
  },
];
