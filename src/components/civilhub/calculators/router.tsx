"use client";

// CivilHub — calculator router.
// Maps a CalculatorId to its implementation component.

import type { CalcMeta } from "../lib/types";
import { PercentageCalc } from "./basic/percentage";
import { UnitConverterCalc } from "./basic/unit-converter";
import { AreaCalc } from "./basic/area";
import { VolumeCalc } from "./basic/volume";
import { DensityCalc } from "./basic/density";
import { SlopeCalc } from "./basic/slope";
import { ConcreteVolumeCalc } from "./civil/concrete-volume";
import { BrickworkCalc } from "./civil/brickwork";
import { CementSandAggregateCalc } from "./civil/cement-sand-aggregate";
import { WaterCementRatioCalc } from "./civil/water-cement-ratio";
import { SteelQuantityCalc } from "./civil/steel-quantity";
import { BbsCalc } from "./civil/bbs";
import { ExcavationCalc } from "./civil/excavation";
import { PlasterCalc } from "./civil/plaster";
import { PaintCalc } from "./civil/paint";
import { TileCalc } from "./civil/tile";
import { BeamLoadCalc } from "./structural/beam-load";
import { ColumnLoadCalc } from "./structural/column-load";
import { DeadLoadCalc } from "./structural/dead-load";
import { LiveLoadCalc } from "./structural/live-load";
import { SlabThicknessCalc } from "./structural/slab-thickness";
import { SteelWeightCalc } from "./structural/steel-weight";
import { PipeFlowCalc } from "./hydraulics/pipe-flow";
import { DischargeCalc } from "./hydraulics/discharge";
import { ManningCalc } from "./hydraulics/manning";
import { ReservoirCalc } from "./hydraulics/reservoir";
import { SightDistanceCalc } from "./transportation/sight-distance";
import { SuperelevationCalc } from "./transportation/superelevation";
import { TrafficFlowCalc } from "./transportation/traffic-flow";
import { SoilClassificationCalc } from "./geotechnical/soil-classification";
import { BearingCapacityCalc } from "./geotechnical/bearing-capacity";
import { EarthworkCalc } from "./geotechnical/earthwork";
import { ComingSoonCalc } from "./coming-soon";

const REGISTRY: Record<string, React.ComponentType<{ calc: CalcMeta }>> = {
  // Basic
  percentage: PercentageCalc,
  "unit-converter": UnitConverterCalc,
  area: AreaCalc,
  volume: VolumeCalc,
  density: DensityCalc,
  slope: SlopeCalc,

  // Civil
  "concrete-volume": ConcreteVolumeCalc,
  brickwork: BrickworkCalc,
  "cement-sand-aggregate": CementSandAggregateCalc,
  "water-cement-ratio": WaterCementRatioCalc,
  "steel-quantity": SteelQuantityCalc,
  bbs: BbsCalc,
  excavation: ExcavationCalc,
  plaster: PlasterCalc,
  paint: PaintCalc,
  tile: TileCalc,

  // Structural
  "beam-load": BeamLoadCalc,
  "column-load": ColumnLoadCalc,
  "dead-load": DeadLoadCalc,
  "live-load": LiveLoadCalc,
  "slab-thickness": SlabThicknessCalc,
  "steel-weight": SteelWeightCalc,

  // Hydraulics
  "pipe-flow": PipeFlowCalc,
  discharge: DischargeCalc,
  manning: ManningCalc,
  reservoir: ReservoirCalc,

  // Transportation
  "sight-distance": SightDistanceCalc,
  superelevation: SuperelevationCalc,
  "traffic-flow": TrafficFlowCalc,

  // Geotechnical
  "soil-classification": SoilClassificationCalc,
  "bearing-capacity": BearingCapacityCalc,
  earthwork: EarthworkCalc,
};

export function CalculatorRouter({ calc }: { calc: CalcMeta }) {
  const Impl = REGISTRY[calc.id] ?? ComingSoonCalc;
  return <Impl calc={calc} />;
}
