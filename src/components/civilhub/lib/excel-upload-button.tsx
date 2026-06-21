"use client";

// CivilHub — Reusable Excel/CSV upload button.
// Renders a file input disguised as a button. Calls onParsed with the
// resulting ParsedSheet, or onError with a message.

import * as React from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseFileToRows, type ParsedSheet } from "./excel";

export interface ExcelUploadButtonProps {
  onParsed: (sheet: ParsedSheet, file: File) => void;
  onError?: (message: string) => void;
  /** Accept attribute for the file input. Defaults to .xlsx,.xls,.csv,.txt */
  accept?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  className?: string;
}

export function ExcelUploadButton({
  onParsed,
  onError,
  accept = ".xlsx,.xls,.csv,.txt",
  label = "Import Excel / CSV",
  variant = "outline",
  size = "default",
  className,
}: ExcelUploadButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const sheet = await parseFileToRows(file);
      if (sheet.rows.length === 0) {
        onError?.("The file appears to be empty or has no data rows.");
        return;
      }
      onParsed(sheet, file);
    } catch (err) {
      console.error(err);
      onError?.("Could not read this file. Please check the format and try again.");
    } finally {
      setLoading(false);
      // reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const variantClass = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary",
    outline: "border-border bg-background hover:bg-muted/50 text-foreground",
    ghost: "bg-transparent hover:bg-muted/50 text-foreground border-transparent",
  }[variant];

  const sizeClass = {
    default: "h-9 px-3 text-sm",
    sm: "h-8 px-2.5 text-xs",
  }[size];

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          variantClass,
          sizeClass,
          className,
        )}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5" />
        )}
        {loading ? "Reading…" : label}
      </button>
    </>
  );
}

/** Template download button — generates a starter CSV/XLSX file. */
export function TemplateDownloadButton({
  onDownload,
  label = "Download template",
  size = "sm",
}: {
  onDownload: () => void;
  label?: string;
  size?: "default" | "sm";
}) {
  const sizeClass = size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm";
  return (
    <button
      type="button"
      onClick={onDownload}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors",
        sizeClass,
      )}
    >
      <Upload className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
