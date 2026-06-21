"use client";

// CivilHub — PDF export helper
// Uses the browser's native print engine (window.print() on a dedicated print
// window) to produce a print-quality PDF. This avoids adding a PDF library
// dependency and works on every modern browser (Chrome, Edge, Firefox, Safari).
// The user can "Save as PDF" from the print dialog.
//
// Helper is generic: takes a title + a fully-styled HTML body string + optional
// CSS overrides, opens a hidden iframe / new window, writes the document,
// triggers print, then cleans up.

export interface PdfSection {
  code: string;
  title: string;
  items: {
    sr: number;
    description: string;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
}

export interface PdfBoq {
  name: string;
  client: string;
  contractor: string;
  date: string;
  sections: PdfSection[];
  base: number;
  contingencyPct: number;
  contingency: number;
  overheadPct: number;
  overhead: number;
  subtotalWithAdds: number;
  vatPct: number;
  vat: number;
  grand: number;
}

function esc(s: string | number): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dateFmt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PDF_BASE_CSS = `
  @page {
    size: A4 portrait;
    margin: 14mm 14mm 16mm 14mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #0f172a;
    font-size: 10pt;
    line-height: 1.45;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .doc-title {
    font-size: 18pt;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #0f172a;
  }
  .doc-subtitle {
    font-size: 10pt;
    color: #475569;
    margin-top: 2px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 24px;
    margin: 10px 0 0;
  }
  .meta-row {
    display: flex;
    gap: 8px;
    font-size: 9.5pt;
  }
  .meta-label {
    color: #64748b;
    min-width: 80px;
    font-weight: 500;
  }
  .meta-value {
    color: #0f172a;
    font-weight: 600;
    flex: 1;
  }
  .section-block { margin-top: 14px; page-break-inside: auto; }
  .section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    background: #f1f5f9;
    border-left: 3px solid #1e3a8a;
    padding: 5px 10px;
    margin-top: 10px;
    font-weight: 700;
    font-size: 10pt;
    color: #0f172a;
  }
  .section-title-row .code {
    display: inline-block;
    background: #1e3a8a;
    color: #fff;
    padding: 1px 7px;
    border-radius: 3px;
    font-size: 8.5pt;
    margin-right: 6px;
  }
  table.boq {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0;
    font-size: 9.2pt;
  }
  table.boq thead th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 7.5pt;
    padding: 5px 6px;
    border-bottom: 1px solid #cbd5e1;
    text-align: left;
  }
  table.boq thead th.num { text-align: right; }
  table.boq tbody td {
    padding: 4px 6px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }
  table.boq tbody td.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  table.boq tbody td.sr { color: #64748b; width: 30px; }
  table.boq tbody td.desc { color: #0f172a; }
  table.boq tbody tr.section-subtotal-row td {
    background: #f8fafc;
    font-weight: 600;
    border-top: 1px solid #94a3b8;
    border-bottom: 1px solid #94a3b8;
  }
  .summary-block {
    margin-top: 18px;
    page-break-inside: avoid;
  }
  .summary-title {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
    margin-bottom: 6px;
    font-weight: 600;
  }
  .summary-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  .summary-table td {
    padding: 4px 8px;
    border-bottom: 1px dashed #cbd5e1;
  }
  .summary-table td.label { color: #475569; }
  .summary-table td.val {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    color: #0f172a;
  }
  .summary-table tr.grand td {
    border-top: 2px solid #0f172a;
    border-bottom: none;
    padding-top: 8px;
    font-weight: 700;
    font-size: 11pt;
    color: #0f172a;
    background: #f1f5f9;
  }
  .summary-table tr.grand td.val {
    color: #1e3a8a;
  }
  .doc-footer {
    margin-top: 22px;
    padding-top: 8px;
    border-top: 1px solid #cbd5e1;
    font-size: 7.5pt;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
  .amount-words {
    margin-top: 8px;
    padding: 8px 10px;
    background: #f8fafc;
    border-radius: 4px;
    font-size: 9pt;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  .amount-words strong { color: #0f172a; }
`;

function numberToWords(num: number): string {
  // Simple integer conversion for the "Amount in words" line.
  // Handles up to crores. Paisa appended as "/100" if non-zero.
  if (!Number.isFinite(num)) return "";
  const sign = num < 0 ? "Negative " : "";
  num = Math.abs(num);
  const rupees = Math.floor(num);
  const paisa = Math.round((num - rupees) * 100);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function below1000(n: number): string {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const r = n % 10;
    return tens[t] + (r ? " " + ones[r] : "");
  }

  function below100000(n: number): string {
    if (n < 1000) return below1000(n);
    const t = Math.floor(n / 1000);
    const r = n % 1000;
    return below1000(t) + " Thousand" + (r ? " " + below1000(r) : "");
  }

  function below10000000(n: number): string {
    if (n < 100000) return below100000(n);
    const t = Math.floor(n / 100000);
    const r = n % 100000;
    return below1000(t) + " Lakh" + (r ? " " + below100000(r) : "");
  }

  function below1000000000(n: number): string {
    if (n < 10000000) return below10000000(n);
    const t = Math.floor(n / 10000000);
    const r = n % 10000000;
    return below1000(t) + " Crore" + (r ? " " + below10000000(r) : "");
  }

  let words = below1000000000(rupees);
  if (!words) words = "Zero";
  let out = sign + words + (rupees === 1 ? " Rupee" : " Rupees");
  if (paisa > 0) out += ` and ${paisa}/100 only`;
  else out += " only";
  return out;
}

function renderBoqHtml(doc: PdfBoq): string {
  const sectionsHtml = doc.sections
    .map((sec) => {
      const itemRows = sec.items
        .map(
          (it) => `
        <tr>
          <td class="sr">${esc(it.sr)}</td>
          <td class="desc">${esc(it.description) || "&nbsp;"}</td>
          <td>${esc(it.unit)}</td>
          <td class="num">${esc(money(it.quantity))}</td>
          <td class="num">${esc(money(it.rate))}</td>
          <td class="num">${esc(money(it.amount))}</td>
        </tr>`,
        )
        .join("");
      return `
      <div class="section-block">
        <div class="section-title-row">
          <span><span class="code">${esc(sec.code)}</span>${esc(sec.title)}</span>
          <span>Subtotal: <strong>${esc(money(sec.subtotal))}</strong></span>
        </div>
        <table class="boq">
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Description</th>
              <th>Unit</th>
              <th class="num">Qty</th>
              <th class="num">Rate</th>
              <th class="num">Amount (NPR)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr class="section-subtotal-row">
              <td colspan="5" style="text-align: right;">Subtotal — ${esc(sec.title)}</td>
              <td class="num">${esc(money(sec.subtotal))}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
    })
    .join("");

  return `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(doc.name)} — BOQ</title>
<style>${PDF_BASE_CSS}</style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-title">Bill of Quantities</div>
    <div class="doc-subtitle">${esc(doc.name)}</div>
    <div class="meta-grid">
      <div class="meta-row"><span class="meta-label">Client</span><span class="meta-value">${esc(doc.client) || "—"}</span></div>
      <div class="meta-row"><span class="meta-label">Date</span><span class="meta-value">${esc(dateFmt(doc.date))}</span></div>
      <div class="meta-row"><span class="meta-label">Contractor</span><span class="meta-value">${esc(doc.contractor) || "—"}</span></div>
      <div class="meta-row"><span class="meta-label">Currency</span><span class="meta-value">NPR (Nepali Rupees)</span></div>
    </div>
  </div>

  ${sectionsHtml}

  <div class="summary-block">
    <div class="summary-title">Bill Summary</div>
    <table class="summary-table">
      <tr><td class="label">Base total (all sections)</td><td class="val">${esc(money(doc.base))}</td></tr>
      <tr><td class="label">Contingency (${esc(doc.contingencyPct)}%)</td><td class="val">${esc(money(doc.contingency))}</td></tr>
      <tr><td class="label">Overhead (${esc(doc.overheadPct)}%)</td><td class="val">${esc(money(doc.overhead))}</td></tr>
      <tr><td class="label">Subtotal (before tax)</td><td class="val">${esc(money(doc.subtotalWithAdds))}</td></tr>
      <tr><td class="label">VAT (${esc(doc.vatPct)}%)</td><td class="val">${esc(money(doc.vat))}</td></tr>
      <tr class="grand"><td class="label">GRAND TOTAL</td><td class="val">${esc(money(doc.grand))}</td></tr>
    </table>
    <div class="amount-words">
      <strong>In words:</strong> NPR ${numberToWords(doc.grand)}
    </div>
  </div>

  <div class="doc-footer">
    <span>Generated by CivilHub · IOE Engineering Toolkit</span>
    <span>Rates are approximate · Verify with current market rates before submission</span>
  </div>
</body>
</html>`;
}

/**
 * Open a print window with a fully-styled BOQ document and trigger the
 * browser's print dialog. The user can choose "Save as PDF" as the
 * destination to produce a PDF file.
 */
export function printBoqAsPdf(doc: PdfBoq): void {
  const html = renderBoqHtml(doc);

  // Use a hidden iframe so we don't navigate away from the current page
  // and the user stays in the app after printing.
  const existing = document.getElementById("__boq_print_frame__");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "__boq_print_frame__";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const docEl = iframe.contentDocument;
  if (!docEl) {
    // Fallback: open new window
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      alert("Please allow pop-ups to print the BOQ.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
    return;
  }

  docEl.open();
  docEl.write(html);
  docEl.close();

  // Wait for fonts/layout to settle before printing
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Print failed", err);
    }
  };

  // Some browsers fire onload synchronously after write().close();
  // trigger print as a fallback if onload doesn't fire in 600ms.
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      /* no-op */
    }
  }, 600);
}
