"use client";

// CivilHub — Excel / CSV import + export helpers for Surveying.
// Supports .xlsx, .xls, .csv (auto-detect). All parsing happens in-browser
// via the `xlsx` library; no file ever leaves the client.

import * as XLSX from "xlsx";

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
  raw: unknown[][];
}

/**
 * Read an uploaded File into a 2D array of cell values.
 * - .xlsx / .xls  → parsed via XLSX
 * - .csv           → parsed via XLSX with FS=',' (auto-detects delimiters)
 * - .txt           → treated as CSV
 */
export async function parseFileToRows(file: File): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [], raw: [] };
  const ws = wb.Sheets[sheetName];

  // header: 1 → array of arrays
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: true,
  }) as unknown[][];

  if (raw.length === 0) return { headers: [], rows: [], raw: [] };

  const headers = (raw[0] ?? []).map((h) => String(h ?? "").trim());
  const body = raw.slice(1).filter((r) => Array.isArray(r) && r.some((c) => c !== "" && c != null));

  const rows: Record<string, unknown>[] = body.map((r) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });

  return { headers, rows, raw: body };
}

/**
 * Smart column-matcher: given a list of candidate header names, find the
 * first header in the parsed sheet that matches (case-insensitive, trimmed).
 */
export function matchColumn(headers: string[], candidates: string[]): string | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_\-./]/g, "");
  const normed = headers.map(norm);
  for (const c of candidates) {
    const cn = norm(c);
    const idx = normed.findIndex((h) => h === cn);
    if (idx >= 0) return headers[idx];
  }
  // partial match (e.g., "BS (m)" matches "bs")
  for (const c of candidates) {
    const cn = norm(c);
    const idx = normed.findIndex((h) => h.includes(cn));
    if (idx >= 0) return headers[idx];
  }
  return undefined;
}

/** Coerce a value to a number, returning 0 for blank/invalid input. */
export function toNum(v: unknown): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.\-+eE]/g, ""));
    return isFinite(n) ? n : 0;
  }
  return 0;
}

/** Coerce a value to a string, trimmed. */
export function toStr(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v).trim();
}

/** Download a 2D array as a CSV file. */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? "");
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download a workbook (.xlsx) from a 2D array. */
export function downloadXLSX(filename: string, rows: (string | number)[][], sheetName = "Sheet1") {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
