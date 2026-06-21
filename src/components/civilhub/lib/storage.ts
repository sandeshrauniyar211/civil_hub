// CivilHub — LocalStorage-backed persistence layer
// All data lives in the browser per the PRD (Guest Mode, no auth, no backend).

import { useEffect, useState, useCallback } from "react";
import type { HistoryEntry, SavedSemester, Settings } from "./types";
import { IOE_GRADING_SCALE } from "./types";

const KEYS = {
  history: "civilhub.history.v1",
  semesters: "civilhub.semesters.v1",
  settings: "civilhub.settings.v1",
} as const;

// SSR-safe getter
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
    // Notify same-tab listeners
    window.dispatchEvent(new CustomEvent("civilhub:storage", { detail: { key } }));
  } catch {
    // ignore quota errors
  }
}

// ---- History ----

export function getHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(KEYS.history, []);
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  const all = getHistory();
  const next = [full, ...all].slice(0, 200); // cap at 200
  write(KEYS.history, next);
  return full;
}

export function clearHistory() {
  write(KEYS.history, []);
}

export function removeHistory(id: string) {
  const next = getHistory().filter((h) => h.id !== id);
  write(KEYS.history, next);
}

// ---- Semesters ----

export function getSemesters(): SavedSemester[] {
  return read<SavedSemester[]>(KEYS.semesters, []);
}

export function saveSemester(sem: SavedSemester) {
  const all = getSemesters();
  const idx = all.findIndex((s) => s.id === sem.id);
  const updated = { ...sem, updatedAt: Date.now() };
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.unshift(updated);
  }
  write(KEYS.semesters, all);
}

export function deleteSemester(id: string) {
  write(KEYS.semesters, getSemesters().filter((s) => s.id !== id));
}

// ---- Settings ----

export function getSettings(): Settings {
  return read<Settings>(KEYS.settings, {
    theme: "system",
    gradingScale: IOE_GRADING_SCALE,
  });
}

export function saveSettings(s: Settings) {
  write(KEYS.settings, s);
}

// ---- React hook: subscribe to storage changes ----

export function useCivilStore<T>(
  getter: () => T,
  defaultValue: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  // Hydrate after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(getter());
  }, []);

  // Listen for storage events (cross-tab + same-tab custom event)
  useEffect(() => {
    const handler = () => setValue(getter());
    window.addEventListener("civilhub:storage", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("civilhub:storage", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = useCallback(
    (next: T) => {
      // next can be value or function
      if (typeof next === "function") {
        const fn = next as (prev: T) => T;
        setValue((prev: T) => fn(prev));
      } else {
        setValue(next);
      }
    },
    [],
  );

  return [value, update];
}
