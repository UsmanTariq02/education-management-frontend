import * as XLSX from "xlsx";
import type { AttendanceStatus } from "@/types/domain";

export const attendanceImportHeaders = ["studentId", "batchId", "attendanceDate", "status", "remarks"] as const;

export type AttendanceImportHeader = (typeof attendanceImportHeaders)[number];

export interface AttendanceImportDraftRow {
  studentId: string;
  batchId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks: string;
}

export interface AttendanceImportPreviewRow {
  rowNumber: number;
  values: Record<AttendanceImportHeader, string>;
  errors: string[];
  isValid: boolean;
}

export interface AttendanceImportPreview {
  headers: string[];
  rows: AttendanceImportPreviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

const requiredHeaders = ["studentId", "batchId", "attendanceDate", "status"] as const;
const validStatuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "LEAVE"];

export function buildAttendanceImportCsv(rows: AttendanceImportDraftRow[]): string {
  const headerLine = attendanceImportHeaders.join(",");
  const body = rows.map((row) => attendanceImportHeaders.map((header) => csvEscape(row[header] ?? "")).join(",")).join("\n");
  return `${headerLine}\n${body}${body ? "\n" : ""}`;
}

export async function readAttendanceImportFile(file: File): Promise<string> {
  const normalizedName = file.name.toLowerCase();

  if (normalizedName.endsWith(".xlsx") || normalizedName.endsWith(".xls") || file.type.includes("spreadsheet")) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("The spreadsheet does not contain any sheets");
    }

    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
  }

  return file.text();
}

export function parseAttendanceImportPreview(text: string): AttendanceImportPreview {
  const content = normalizeText(text);

  if (!content) {
    return { headers: [], rows: [], totalRows: 0, validRows: 0, invalidRows: 0 };
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, validRows: 0, invalidRows: 0 };
  }

  const headers = parseCsvLine(lines[0]).map((value) => value.trim());
  const rows: AttendanceImportPreviewRow[] = [];

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const values = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex]?.trim() ?? ""])) as Record<string, string>;
    const rowValues = attendanceImportHeaders.reduce((acc, header) => {
      acc[header] = record[header] ?? "";
      return acc;
    }, {} as Record<AttendanceImportHeader, string>);
    const errors = validateAttendanceImportRow(rowValues, headers);

    rows.push({
      rowNumber,
      values: rowValues,
      errors,
      isValid: errors.length === 0,
    });
  });

  return {
    headers,
    rows,
    totalRows: rows.length,
    validRows: rows.filter((row) => row.isValid).length,
    invalidRows: rows.filter((row) => !row.isValid).length,
  };
}

export function attendanceImportPreviewToDraftRows(preview: AttendanceImportPreview): AttendanceImportDraftRow[] {
  return preview.rows.map((row) => ({
    studentId: row.values.studentId,
    batchId: row.values.batchId,
    attendanceDate: row.values.attendanceDate,
    status: row.values.status as AttendanceStatus,
    remarks: row.values.remarks,
  }));
}

export function hasRequiredAttendanceHeaders(headers: string[]): boolean {
  return requiredHeaders.every((header) => headers.includes(header));
}

function validateAttendanceImportRow(values: Record<AttendanceImportHeader, string>, headers: string[]): string[] {
  const errors: string[] = [];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      errors.push(`Missing required header "${header}"`);
      return errors;
    }
  }

  if (!values.studentId || !values.batchId || !values.attendanceDate || !values.status) {
    errors.push("Missing one or more required fields");
  }

  if (values.status && !validStatuses.includes(values.status as AttendanceStatus)) {
    errors.push(`Invalid status "${values.status}"`);
  }

  if (values.attendanceDate && Number.isNaN(new Date(values.attendanceDate).getTime())) {
    errors.push(`Invalid attendance date "${values.attendanceDate}"`);
  }

  return errors;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function csvEscape(value: string): string {
  const normalized = value ?? "";
  if (/[",\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function normalizeText(text: string): string {
  return text.replace(/^\uFEFF/, "").trim();
}
