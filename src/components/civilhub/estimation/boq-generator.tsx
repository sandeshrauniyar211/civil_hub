"use client";

// CivilHub — BOQ Generator (Phase 2 estimation)
// Multi-section bill of quantities with rates, contingency/overhead/VAT, totals.
// Save BOQs to localStorage. Excel import/export.

import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  FolderOpen,
  FileDown,
  FileSpreadsheet,
  Copy,
  Pencil,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FieldLabel, Tag, ResultLine, Divider, EmptyState } from "../lib/ui";
import { ExcelUploadButton, TemplateDownloadButton } from "../lib/excel-upload-button";
import { downloadCSV, downloadXLSX, matchColumn, toNum, toStr, type ParsedSheet } from "../lib/excel";
import { ProcessPanel, type ProcessStep } from "../lib/process-panel";
import { fmt, round, uid, type Boq, type BoqSection, type BoqItem } from "../lib/estimation-types";
import {
  getBoqs,
  saveBoq,
  deleteBoq,
  useEstimationStore,
} from "../lib/estimation-store";
import { BOQ_TEMPLATES } from "../lib/boq-templates";
import { printBoqAsPdf, type PdfBoq, type PdfSection } from "../lib/pdf-export";

function emptyItem(): BoqItem {
  return { id: uid("bi"), description: "", unit: "m³", quantity: 0, rate: 0 };
}

function emptySection(code = "A", title = "Earthwork"): BoqSection {
  return {
    id: uid("sec"),
    code,
    title,
    items: [emptyItem()],
  };
}

function emptyBoq(): Boq {
  return {
    id: uid("boq"),
    name: "Untitled BOQ",
    client: "",
    contractor: "",
    date: new Date().toISOString().slice(0, 10),
    sections: [
      emptySection("A", "Earthwork"),
      emptySection("B", "Concrete"),
      emptySection("C", "Brickwork & Masonry"),
    ],
    contingencyPct: 3,
    overheadPct: 7,
    vatPct: 13,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function BoqGenerator() {
  const { toast } = useToast();
  const [boqs] = useEstimationStore(getBoqs, []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [boq, setBoq] = useState<Boq>(emptyBoq());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [importedFile, setImportedFile] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  useEffect(() => {
    if (!activeId) return;
    const found = boqs.find((b) => b.id === activeId);
    if (found) setBoq(found);
  }, [activeId, boqs]);

  // Compute amounts
  const computed = useMemo(() => {
    return boq.sections.map((sec) => {
      const items = sec.items.map((it) => ({ ...it, amount: it.quantity * it.rate }));
      const subtotal = items.reduce((s, it) => s + it.amount, 0);
      return { ...sec, items, subtotal };
    });
  }, [boq]);

  const totals = useMemo(() => {
    const base = computed.reduce((s, sec) => s + sec.subtotal, 0);
    const contingency = (base * boq.contingencyPct) / 100;
    const overhead = (base * boq.overheadPct) / 100;
    const subtotalWithAdds = base + contingency + overhead;
    const vat = (subtotalWithAdds * boq.vatPct) / 100;
    const grand = subtotalWithAdds + vat;
    return { base, contingency, overhead, subtotalWithAdds, vat, grand };
  }, [computed, boq.contingencyPct, boq.overheadPct, boq.vatPct]);

  // ---- Header field updates ----
  const updateBoq = (patch: Partial<Boq>) => setBoq((prev) => ({ ...prev, ...patch }));

  // ---- Section operations ----
  const addSection = () => {
    const nextCode = String.fromCharCode(65 + boq.sections.length); // A, B, C...
    setBoq((prev) => ({
      ...prev,
      sections: [...prev.sections, emptySection(nextCode, "New section")],
    }));
  };

  const updateSection = (id: string, patch: Partial<BoqSection>) => {
    setBoq((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const removeSection = (id: string) => {
    setBoq((prev) => ({
      ...prev,
      sections: prev.sections.length <= 1 ? prev.sections : prev.sections.filter((s) => s.id !== id),
    }));
  };

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- Item operations ----
  const addItem = (sectionId: string) => {
    setBoq((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, items: [...s.items, emptyItem()] } : s,
      ),
    }));
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<BoqItem>) => {
    setBoq((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
          : s,
      ),
    }));
  };

  const duplicateItem = (sectionId: string, itemId: string) => {
    setBoq((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const idx = s.items.findIndex((it) => it.id === itemId);
        if (idx < 0) return s;
        const copy = { ...s.items[idx], id: uid("bi") };
        const items = [...s.items];
        items.splice(idx + 1, 0, copy);
        return { ...s, items };
      }),
    }));
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setBoq((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.length <= 1 ? s.items : s.items.filter((it) => it.id !== itemId) }
          : s,
      ),
    }));
  };

  // ---- Save / Load ----
  const handleSave = () => {
    if (!boq.name.trim()) {
      toast({ title: "BOQ needs a name", variant: "destructive" });
      return;
    }
    const toSave = { ...boq, updatedAt: Date.now() };
    saveBoq(toSave);
    setActiveId(toSave.id);
    toast({ title: "Saved", description: `BOQ "${toSave.name}" saved locally.` });
  };

  const handleNew = () => {
    setActiveId(null);
    setBoq(emptyBoq());
    setImportedFile(null);
  };

  const handleDelete = (id: string) => {
    deleteBoq(id);
    if (activeId === id) handleNew();
    toast({ title: "BOQ deleted" });
  };

  // ---- Template loading ----
  const handleLoadTemplate = (templateId: string) => {
    const tpl = BOQ_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const fresh = tpl.builder();
    setBoq(fresh);
    setActiveId(null);
    setImportedFile(null);
    setShowTemplatePicker(false);
    toast({
      title: "Template loaded",
      description: `${tpl.name} — ${fresh.sections.length} sections, ${fresh.sections.reduce(
        (s, sec) => s + sec.items.length,
        0,
      )} items. Adjust quantities & rates to your project.`,
    });
  };

  // ---- PDF export ----
  const handleExportPDF = () => {
    // Build the PDF-friendly structure from the live computed BOQ
    let sr = 1;
    const pdfSections: PdfSection[] = computed.map((sec) => {
      const items = sec.items.map((it) => {
        const out = {
          sr: sr++,
          description: it.description,
          unit: it.unit,
          quantity: it.quantity,
          rate: it.rate,
          amount: round(it.quantity * it.rate, 2),
        };
        return out;
      });
      return {
        code: sec.code,
        title: sec.title,
        items,
        subtotal: round(sec.subtotal, 2),
      };
    });

    const doc: PdfBoq = {
      name: boq.name,
      client: boq.client,
      contractor: boq.contractor,
      date: boq.date,
      sections: pdfSections,
      base: round(totals.base, 2),
      contingencyPct: boq.contingencyPct,
      contingency: round(totals.contingency, 2),
      overheadPct: boq.overheadPct,
      overhead: round(totals.overhead, 2),
      subtotalWithAdds: round(totals.subtotalWithAdds, 2),
      vatPct: boq.vatPct,
      vat: round(totals.vat, 2),
      grand: round(totals.grand, 2),
    };

    printBoqAsPdf(doc);
    toast({
      title: "Print dialog opened",
      description: "Choose 'Save as PDF' as the destination to download your BOQ.",
    });
  };

  // ---- Excel import (single flat sheet) ----
  const handleImport = (sheet: ParsedSheet, file: File) => {
    const colSection = matchColumn(sheet.headers, ["section", "section code", "sec"]);
    const colSr = matchColumn(sheet.headers, ["sr", "sr.no", "no", "sno"]);
    const colDesc = matchColumn(sheet.headers, ["description", "item", "particulars"]);
    const colUnit = matchColumn(sheet.headers, ["unit"]);
    const colQty = matchColumn(sheet.headers, ["qty", "quantity"]);
    const colRate = matchColumn(sheet.headers, ["rate", "unit rate"]);

    // Group rows by section
    const sectionMap = new Map<string, BoqItem[]>();
    let currentSection = "A · General";
    for (const r of sheet.rows) {
      const secVal = colSection ? toStr(r[colSection]) : "";
      if (secVal) currentSection = secVal;
      const desc = colDesc ? toStr(r[colDesc]) : "";
      if (!desc) continue; // skip blank rows
      const item: BoqItem = {
        id: uid("bi"),
        description: desc,
        unit: colUnit ? toStr(r[colUnit]) || "nos" : "nos",
        quantity: colQty ? toNum(r[colQty]) : 0,
        rate: colRate ? toNum(r[colRate]) : 0,
      };
      const list = sectionMap.get(currentSection) ?? [];
      list.push(item);
      sectionMap.set(currentSection, list);
    }

    if (sectionMap.size === 0) {
      toast({ title: "Import failed", description: "No valid rows found.", variant: "destructive" });
      return;
    }

    const sections: BoqSection[] = Array.from(sectionMap.entries()).map(([key, items], idx) => {
      const [code, ...titleParts] = key.split(/[·\.\-:]/);
      return {
        id: uid("sec"),
        code: code.trim() || String.fromCharCode(65 + idx),
        title: titleParts.join(" ").trim() || key,
        items,
      };
    });

    setBoq((prev) => ({ ...prev, sections, name: file.name.replace(/\.[^.]+$/, "") }));
    setImportedFile(file.name);
    setActiveId(null);
    toast({ title: "Imported", description: `${sections.length} sections loaded from ${file.name}` });
  };

  const handleDownloadTemplate = () => {
    downloadCSV("boq-template.csv", [
      ["Section", "Description", "Unit", "Quantity", "Rate"],
      ["A · Earthwork", "Excavation in ordinary soil", "m³", 50, 350],
      ["A · Earthwork", "Refilling with selected excavated soil", "m³", 20, 200],
      ["B · Concrete", "PCC 1:4:8 in foundation", "m³", 10, 6500],
      ["B · Concrete", "RCC M20 in footing", "m³", 15, 12000],
      ["C · Brickwork", "Brickwork in 1:6 CM", "m³", 25, 9000],
    ]);
    toast({ title: "Template downloaded" });
  };

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [["BOQ Name:", boq.name]];
    rows.push(["Client:", boq.client]);
    rows.push(["Contractor:", boq.contractor]);
    rows.push(["Date:", boq.date]);
    rows.push([]);
    rows.push(["Section", "Sr.No", "Description", "Unit", "Quantity", "Rate", "Amount"]);

    let sr = 1;
    for (const sec of computed) {
      rows.push([`${sec.code} · ${sec.title}`, "", "", "", "", "", ""]);
      for (const it of sec.items) {
        rows.push([`${sec.code} · ${sec.title}`, sr, it.description, it.unit, it.quantity, it.rate, round(it.amount, 2)]);
        sr += 1;
      }
      rows.push(["", "", `Subtotal — ${sec.title}`, "", "", "", round(sec.subtotal, 2)]);
      rows.push([]);
    }

    rows.push([]);
    rows.push(["", "", "Base total", "", "", "", round(totals.base, 2)]);
    rows.push(["", "", `Contingency (${boq.contingencyPct}%)`, "", "", "", round(totals.contingency, 2)]);
    rows.push(["", "", `Overhead (${boq.overheadPct}%)`, "", "", "", round(totals.overhead, 2)]);
    rows.push(["", "", "Subtotal", "", "", "", round(totals.subtotalWithAdds, 2)]);
    rows.push(["", "", `VAT (${boq.vatPct}%)`, "", "", "", round(totals.vat, 2)]);
    rows.push(["", "", "GRAND TOTAL", "", "", "", round(totals.grand, 2)]);

    downloadCSV(`boq-${boq.name.replace(/\s+/g, "-").toLowerCase()}.csv`, rows);
    toast({ title: "Exported", description: "BOQ saved as CSV." });
  };

  const handleExportXLSX = () => {
    const header: (string | number)[][] = [
      ["Bill of Quantities (BOQ)"],
      ["Project:", boq.name, "", "Date:", boq.date],
      ["Client:", boq.client, "", "Contractor:", boq.contractor],
      [],
      ["Section", "Sr.No", "Description", "Unit", "Quantity", "Rate", "Amount"],
    ];
    const body: (string | number)[][] = [];
    let sr = 1;
    for (const sec of computed) {
      body.push([`${sec.code} · ${sec.title}`, "", "", "", "", "", ""]);
      for (const it of sec.items) {
        body.push([`${sec.code} · ${sec.title}`, sr, it.description, it.unit, it.quantity, it.rate, +round(it.amount, 2).toFixed(2)]);
        sr += 1;
      }
      body.push(["", "", `Subtotal — ${sec.title}`, "", "", "", +round(sec.subtotal, 2).toFixed(2)]);
      body.push([]);
    }
    body.push([]);
    body.push(["", "", "Base total", "", "", "", +round(totals.base, 2).toFixed(2)]);
    body.push(["", "", `Contingency (${boq.contingencyPct}%)`, "", "", "", +round(totals.contingency, 2).toFixed(2)]);
    body.push(["", "", `Overhead (${boq.overheadPct}%)`, "", "", "", +round(totals.overhead, 2).toFixed(2)]);
    body.push(["", "", "Subtotal", "", "", "", +round(totals.subtotalWithAdds, 2).toFixed(2)]);
    body.push(["", "", `VAT (${boq.vatPct}%)`, "", "", "", +round(totals.vat, 2).toFixed(2)]);
    body.push(["", "", "GRAND TOTAL", "", "", "", +round(totals.grand, 2).toFixed(2)]);

    downloadXLSX(`boq-${boq.name.replace(/\s+/g, "-").toLowerCase()}.xlsx`, [...header, ...body], "BOQ");
    toast({ title: "Exported", description: "BOQ saved as XLSX." });
  };

  return (
    <div className="space-y-4">
      {/* BOQ header + actions */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-[200px]">
            <FieldLabel hint="Project name">BOQ name</FieldLabel>
            <Input value={boq.name} onChange={(e) => updateBoq({ name: e.target.value })} className="h-9" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleNew}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setShowTemplatePicker(true)}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Templates
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
            <ExcelUploadButton
              size="sm"
              onParsed={handleImport}
              onError={(m) => toast({ title: "Import failed", description: m, variant: "destructive" })}
            />
            <TemplateDownloadButton size="sm" onDownload={handleDownloadTemplate} />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportCSV}>
              <FileDown className="h-3 w-3 mr-1.5" />
              CSV
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportXLSX}>
              <FileSpreadsheet className="h-3 w-3 mr-1.5" />
              XLSX
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleExportPDF}
            >
              <FileText className="h-3 w-3 mr-1.5" />
              PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <FieldLabel>Client</FieldLabel>
            <Input value={boq.client} onChange={(e) => updateBoq({ client: e.target.value })} className="h-9" placeholder="Client name" />
          </div>
          <div>
            <FieldLabel>Contractor</FieldLabel>
            <Input value={boq.contractor} onChange={(e) => updateBoq({ contractor: e.target.value })} className="h-9" placeholder="Contractor name" />
          </div>
          <div>
            <FieldLabel>Date</FieldLabel>
            <Input type="date" value={boq.date} onChange={(e) => updateBoq({ date: e.target.value })} className="h-9" />
          </div>
        </div>

        {importedFile && (
          <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span>
                <FileSpreadsheet className="h-3 w-3 inline mr-1" />
                Imported from <strong>{importedFile}</strong>
              </span>
              <button onClick={() => setImportedFile(null)} className="text-muted-foreground hover:text-foreground">
                dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Saved BOQs */}
      {boqs.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Saved BOQs</h3>
            <Tag tone="neutral">{boqs.length}</Tag>
          </div>
          <div className="space-y-1">
            {boqs.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "flex items-center gap-3 px-2 py-1.5 rounded-md",
                  activeId === b.id ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50",
                )}
              >
                <button
                  onClick={() => setActiveId(b.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {b.sections.length} sections · {b.sections.reduce((s, sec) => s + sec.items.length, 0)} items · {new Date(b.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] text-xs px-1.5"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {computed.map((sec) => {
          const isCollapsed = collapsed.has(sec.id);
          return (
            <div key={sec.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
                <button
                  onClick={() => toggleCollapse(sec.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <input
                  value={sec.code}
                  onChange={(e) => updateSection(sec.id, { code: e.target.value })}
                  className="w-10 h-7 text-sm font-semibold bg-transparent outline-none rounded px-1 hover:bg-muted/60 focus:bg-muted text-center"
                  placeholder="A"
                />
                <span className="text-muted-foreground">·</span>
                <input
                  value={sec.title}
                  onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                  className="flex-1 h-7 text-sm font-medium bg-transparent outline-none rounded px-2 hover:bg-muted/60 focus:bg-muted"
                  placeholder="Section title"
                />
                <Tag tone="neutral">{sec.items.length} items</Tag>
                <span className="text-sm font-semibold nums tabular-nums min-w-[100px] text-right">
                  {fmt(sec.subtotal, 2)}
                </span>
                <button
                  onClick={() => removeSection(sec.id)}
                  disabled={boq.sections.length <= 1}
                  className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] disabled:opacity-30 p-1"
                  aria-label="Remove section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Items table */}
              {!isCollapsed && (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-muted/20 text-[11px] text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium px-3 py-1.5 w-10">Sr.</th>
                        <th className="text-left font-medium px-2 py-1.5 min-w-[300px]">Description</th>
                        <th className="text-left font-medium px-2 py-1.5 w-20">Unit</th>
                        <th className="text-right font-medium px-2 py-1.5 w-24">Qty</th>
                        <th className="text-right font-medium px-2 py-1.5 w-28">Rate</th>
                        <th className="text-right font-medium px-2 py-1.5 w-28">Amount</th>
                        <th className="w-16 px-1 py-1.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.items.map((it, idx) => (
                        <tr key={it.id} className="border-t border-border hover:bg-muted/20 align-top">
                          <td className="px-3 py-1.5 text-muted-foreground nums tabular-nums">{idx + 1}</td>
                          <td className="px-2 py-1.5">
                            <input
                              value={it.description}
                              onChange={(e) => updateItem(sec.id, it.id, { description: e.target.value })}
                              placeholder="e.g. RCC M20 in footing"
                              className="w-full bg-transparent text-sm outline-none rounded px-1.5 py-0.5 hover:bg-muted/60 focus:bg-muted"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={it.unit}
                              onChange={(e) => updateItem(sec.id, it.id, { unit: e.target.value })}
                              className="w-full h-7 bg-transparent text-sm outline-none rounded px-1.5 hover:bg-muted/60 focus:bg-muted"
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <NumCell value={it.quantity} onChange={(v) => updateItem(sec.id, it.id, { quantity: v })} />
                          </td>
                          <td className="px-1 py-1.5">
                            <NumCell value={it.rate} onChange={(v) => updateItem(sec.id, it.id, { rate: v })} />
                          </td>
                          <td className="px-2 py-1.5 text-right nums tabular-nums font-medium">
                            {fmt(it.quantity * it.rate, 2)}
                          </td>
                          <td className="px-1 py-1.5">
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => duplicateItem(sec.id, it.id)}
                                className="text-muted-foreground hover:text-foreground p-1"
                                aria-label="Duplicate"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeItem(sec.id, it.id)}
                                disabled={sec.items.length <= 1}
                                className="text-muted-foreground hover:text-[oklch(0.5_0.2_27)] disabled:opacity-30 p-1"
                                aria-label="Remove"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 text-xs font-medium border-t border-border">
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-right text-muted-foreground">
                          Subtotal — {sec.title}
                        </td>
                        <td className="px-2 py-2 text-right nums tabular-nums font-semibold text-primary">
                          {fmt(sec.subtotal, 2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="px-3 py-2 border-t border-border">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => addItem(sec.id)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add item
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Button size="sm" variant="outline" className="h-9 text-xs" onClick={addSection}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add section
        </Button>
      </div>

      {/* Process panel — how the grand total is built up */}
      <ProcessPanel
        intro={
          <>
            A BOQ grand total is built up in layers: <strong>line amounts</strong> →{" "}
            <strong>section subtotals</strong> → <strong>base total</strong> → add{" "}
            <strong>contingency</strong> and <strong>overhead</strong> → apply <strong>VAT</strong>.
            The numbers below are live — change any rate, quantity, or percentage above and these
            update immediately.
          </>
        }
        steps={(() => {
          const steps: ProcessStep[] = [];

          // Step 1: per-line amount
          const sampleSection = computed[0];
          const sampleItem = sampleSection?.items[0];
          steps.push({
            title: "Each line: amount = quantity × rate",
            formula:
              sampleItem != null
                ? `${sampleItem.quantity} ${sampleItem.unit} × ${sampleItem.rate} = ${fmt(sampleItem.amount, 2)}`
                : "Add a line item to see the calculation",
            result:
              sampleItem != null
                ? `Line amount = ${fmt(sampleItem.amount, 2)}`
                : "—",
            note: "This is the basic BOQ row. Sum of all line amounts in a section = that section's subtotal.",
          });

          // Step 2: section subtotals → base
          steps.push({
            title: "Sum every section's subtotal → base total",
            formula:
              computed.length > 0
                ? computed.map((s) => `${s.code || s.title}: ${fmt(s.subtotal, 2)}`).join("  +  ")
                : "No sections yet",
            result: `Base total = ${fmt(totals.base, 2)}`,
            note: "The base total is the raw cost of all work measured — before any percentage additions.",
          });

          // Step 3: contingency + overhead
          steps.push({
            title: "Add contingency and overhead (each computed on the base)",
            formula:
              `Contingency = ${boq.contingencyPct}% × ${fmt(totals.base, 2)} = ${fmt(totals.contingency, 2)}    ` +
              `Overhead = ${boq.overheadPct}% × ${fmt(totals.base, 2)} = ${fmt(totals.overhead, 2)}`,
            result: `Subtotal (before tax) = ${fmt(totals.subtotalWithAdds, 2)}`,
            note: "Contingency covers unforeseen cost overruns (typically 2–5%). Overhead covers contractor's indirect costs — office, supervision, insurance (typically 5–10%). Both are computed on the base total, not on each other.",
          });

          // Step 4: VAT
          steps.push({
            title: "Apply VAT on the subtotal",
            formula: `VAT = ${boq.vatPct}% × ${fmt(totals.subtotalWithAdds, 2)} = ${fmt(totals.vat, 2)}`,
            result: `VAT = ${fmt(totals.vat, 2)}`,
            note: "VAT (Nepal: 13%) is applied AFTER contingency and overhead are added — not on the base total alone. Always check the tender conditions to confirm whether VAT is included or to be added.",
          });

          // Step 5: grand total
          steps.push({
            title: "Add VAT to the subtotal → grand total",
            formula: `${fmt(totals.subtotalWithAdds, 2)} + ${fmt(totals.vat, 2)} = ${fmt(totals.grand, 2)}`,
            result: `GRAND TOTAL = ${fmt(totals.grand, 2)}`,
            note: "This is the figure that goes on the bid cover sheet. Round it to the nearest rupee in the final submission — most tenders explicitly forbid paisa amounts.",
          });

          return steps;
        })()}
      />

      {/* Grand total summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Bill summary</h3>
          <div className="space-y-1">
            <ResultLine label="Base total (all sections)" value={fmt(totals.base, 2)} />
            <ResultLine label={`Contingency (${boq.contingencyPct}%)`} value={fmt(totals.contingency, 2)} />
            <ResultLine label={`Overhead (${boq.overheadPct}%)`} value={fmt(totals.overhead, 2)} />
            <Divider />
            <ResultLine label="Subtotal (before tax)" value={fmt(totals.subtotalWithAdds, 2)} />
            <ResultLine label={`VAT (${boq.vatPct}%)`} value={fmt(totals.vat, 2)} />
            <Divider />
            <ResultLine label="GRAND TOTAL" value={fmt(totals.grand, 2)} highlight />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Adjustments</h3>
          <div className="space-y-3">
            <div>
              <FieldLabel hint="%">Contingency</FieldLabel>
              <Input
                type="number"
                value={boq.contingencyPct}
                onChange={(e) => updateBoq({ contingencyPct: Number(e.target.value) })}
                className="h-9"
              />
            </div>
            <div>
              <FieldLabel hint="%">Overhead</FieldLabel>
              <Input
                type="number"
                value={boq.overheadPct}
                onChange={(e) => updateBoq({ overheadPct: Number(e.target.value) })}
                className="h-9"
              />
            </div>
            <div>
              <FieldLabel hint="%">VAT</FieldLabel>
              <Input
                type="number"
                value={boq.vatPct}
                onChange={(e) => updateBoq({ vatPct: Number(e.target.value) })}
                className="h-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Template picker modal */}
      {showTemplatePicker && (
        <TemplatePicker
          onClose={() => setShowTemplatePicker(false)}
          onPick={handleLoadTemplate}
        />
      )}
    </div>
  );
}

// ============ Template picker modal ============

function TemplatePicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (templateId: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold">Start from a template</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pre-built BOQs with default Nepal market rates. You can edit every line after loading.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Template cards */}
        <div className="p-4 overflow-y-auto scrollbar-thin space-y-2.5">
          {BOQ_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onPick(tpl.id)}
              className="w-full text-left rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 p-4 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{tpl.name}</h4>
                    <span className="text-[10px] text-muted-foreground nums tabular-nums">
                      {tpl.sectionCount} sections · {tpl.itemCount} items
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                    {tpl.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
          Loading a template replaces the current BOQ. Save your work first if you don&apos;t want to lose it.
        </div>
      </div>
    </div>
  );
}

// ============ Small numeric input cell ============

function NumCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      step={0.01}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 h-7 text-right bg-transparent text-sm outline-none rounded px-1.5 nums tabular-nums hover:bg-muted/60 focus:bg-muted focus:ring-1 focus:ring-ring"
    />
  );
}
