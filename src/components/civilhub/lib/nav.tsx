"use client";

// Navigation context — single source of truth for the active view + sub-route.
// We use hash routing so the user can deep-link / refresh and stay on the same view.

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CalculatorId, ViewId } from "./types";

export interface NavState {
  view: ViewId;
  calculatorId?: CalculatorId;
  // optional secondary context (e.g. surveying tool id)
  sub?: string;
}

interface NavContextValue {
  state: NavState;
  go: (view: ViewId, opts?: { calculatorId?: CalculatorId; sub?: string }) => void;
  openCalculator: (id: CalculatorId) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

const DEFAULT: NavState = { view: "dashboard" };

function parseHash(): NavState {
  if (typeof window === "undefined") return DEFAULT;
  const h = window.location.hash.replace(/^#\/?/, "");
  if (!h) return DEFAULT;
  const [view, second, sub] = h.split("/");
  const validViews: ViewId[] = [
    "dashboard",
    "gpa",
    "surveying",
    "estimation",
    "calculators",
    "resources",
  ];
  if (!validViews.includes(view as ViewId)) return DEFAULT;
  const out: NavState = { view: view as ViewId };
  if (view === "calculators" && second) out.calculatorId = second as CalculatorId;
  if (view === "surveying" && second) out.sub = second;
  if (view === "estimation" && second) out.sub = second;
  if (view === "gpa" && second) out.sub = second;
  if (sub) out.sub = sub;
  return out;
}

function toHash(s: NavState): string {
  let h = `#/${s.view}`;
  if (s.view === "calculators" && s.calculatorId) h += `/${s.calculatorId}`;
  if (s.view === "surveying" && s.sub) h += `/${s.sub}`;
  if (s.view === "estimation" && s.sub) h += `/${s.sub}`;
  if (s.view === "gpa" && s.sub) h += `/${s.sub}`;
  return h;
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavState>(DEFAULT);

  // Initial hydrate from hash
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(parseHash());
  }, []);

  // Listen to hashchange (back/forward)
  useEffect(() => {
    const onHash = () => setState(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback(
    (view: ViewId, opts?: { calculatorId?: CalculatorId; sub?: string }) => {
      const next: NavState = {
        view,
        ...(opts?.calculatorId ? { calculatorId: opts.calculatorId } : {}),
        ...(opts?.sub ? { sub: opts.sub } : {}),
      };
      const hash = toHash(next);
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
      setState(next);
      // Scroll main content to top on view change
      requestAnimationFrame(() => {
        const main = document.getElementById("civilhub-main");
        if (main) main.scrollTo({ top: 0, behavior: "instant" });
      });
    },
    [],
  );

  const openCalculator = useCallback(
    (id: CalculatorId) => {
      go("calculators", { calculatorId: id });
    },
    [go],
  );

  return (
    <NavContext.Provider value={{ state, go, openCalculator }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}
