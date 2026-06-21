"use client";

// CivilHub — main app shell.
// Renders top nav, active view, footer.
// Hash routing → no extra routes needed (Next.js only exposes `/`).

import { useState } from "react";
import { NavProvider, useNav } from "../lib/nav";
import { TopNav } from "./top-nav";
import { Footer } from "./footer";
import { CommandPalette } from "./command-palette";
import { DashboardView } from "../views/dashboard-view";
import { GpaView } from "../gpa/gpa-view";
import { SurveyingView } from "../views/surveying-view";
import { EstimationView } from "../views/estimation-view";
import { CalculatorsView } from "../views/calculators-view";
import { ResourcesView } from "../views/resources-view";

export function AppShell() {
  return (
    <NavProvider>
      <Shell />
    </NavProvider>
  );
}

function Shell() {
  const { state } = useNav();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav onOpenSearch={() => setSearchOpen(true)} />

      <main
        id="civilhub-main"
        className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 py-6 md:py-8"
      >
        {state.view === "dashboard" && <DashboardView />}
        {state.view === "gpa" && <GpaView />}
        {state.view === "surveying" && <SurveyingView />}
        {state.view === "estimation" && <EstimationView />}
        {state.view === "calculators" && <CalculatorsView />}
        {state.view === "resources" && <ResourcesView />}
      </main>

      <Footer />

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
