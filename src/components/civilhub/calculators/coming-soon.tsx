"use client";

import { Construction } from "lucide-react";
import type { CalcMeta } from "../lib/types";
import { EmptyState } from "../lib/ui";

export function ComingSoonCalc({ calc }: { calc: CalcMeta }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20">
      <EmptyState
        icon={<Construction className="h-4 w-4" />}
        title={`${calc.name} is being finalized`}
        description="The formula is drafted and being validated against textbook examples. It'll be live shortly."
      />
    </div>
  );
}
