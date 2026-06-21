// CivilHub — Estimation storage layer (localStorage-backed)
// Persists Quantity Takeoff projects, BOQs, and Rate Analyses.

import { useEffect, useState, useCallback } from "react";
import type { TakeoffProject, Boq, RateAnalysis } from "./estimation-types";

const KEYS = {
  takeoff: "civilhub.estimation.takeoff.v1",
  boq: "civilhub.estimation.boq.v1",
  rates: "civilhub.estimation.rates.v1",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("civilhub:storage", { detail: { key } }));
  } catch {
    // ignore quota
  }
}

// ---- Quantity Takeoff projects ----

export function getTakeoffProjects(): TakeoffProject[] {
  return read<TakeoffProject[]>(KEYS.takeoff, []);
}

export function saveTakeoffProject(p: TakeoffProject) {
  const all = getTakeoffProjects();
  const idx = all.findIndex((x) => x.id === p.id);
  const updated = { ...p, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  write(KEYS.takeoff, all);
}

export function deleteTakeoffProject(id: string) {
  write(KEYS.takeoff, getTakeoffProjects().filter((x) => x.id !== id));
}

// ---- BOQs ----

export function getBoqs(): Boq[] {
  return read<Boq[]>(KEYS.boq, []);
}

export function saveBoq(b: Boq) {
  const all = getBoqs();
  const idx = all.findIndex((x) => x.id === b.id);
  const updated = { ...b, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  write(KEYS.boq, all);
}

export function deleteBoq(id: string) {
  write(KEYS.boq, getBoqs().filter((x) => x.id !== id));
}

// ---- Rate Analyses ----

export function getRateAnalyses(): RateAnalysis[] {
  return read<RateAnalysis[]>(KEYS.rates, []);
}

export function saveRateAnalysis(r: RateAnalysis) {
  const all = getRateAnalyses();
  const idx = all.findIndex((x) => x.id === r.id);
  const updated = { ...r, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  write(KEYS.rates, all);
}

export function deleteRateAnalysis(id: string) {
  write(KEYS.rates, getRateAnalyses().filter((x) => x.id !== id));
}

// ---- React hook: subscribe to storage changes (mirrors useCivilStore) ----

export function useEstimationStore<T>(
  getter: () => T,
  defaultValue: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(getter());
  }, []);

  useEffect(() => {
    const handler = () => setValue(getter());
    window.addEventListener("civilhub:storage", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("civilhub:storage", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = useCallback((next: T) => {
    setValue(next);
  }, []);

  return [value, update];
}
