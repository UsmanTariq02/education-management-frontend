"use client";

export interface ExportRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ExportConfig {
  filename: string;
  rows: ExportRow[];
}

export function exportRowsToCsv(config: ExportConfig) {
  const headers = collectHeaders(config.rows);
  const lines = [
    headers.join(","),
    ...config.rows.map((row) =>
      headers
        .map((header) => escapeCsvValue(row[header]))
        .join(","),
    ),
  ];

  downloadBlob(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }), `${config.filename}.csv`);
}

export function exportRowsToPdf(config: ExportConfig) {
  if (typeof window === "undefined") {
    return;
  }

  const headers = collectHeaders(config.rows);
  const rowsHtml = config.rows
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => `<td>${escapeHtml(String(row[header] ?? ""))}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(config.filename)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 22px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 12px; vertical-align: top; }
          th { background: #e2e8f0; font-weight: 700; }
          tr:nth-child(even) { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(config.filename)}</h1>
        <table>
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function collectHeaders(rows: ExportRow[]) {
  const headerSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });
  return Array.from(headerSet);
}

function escapeCsvValue(value: ExportRow[string]) {
  const stringValue = String(value ?? "");
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadBlob(blob: Blob, filename: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
