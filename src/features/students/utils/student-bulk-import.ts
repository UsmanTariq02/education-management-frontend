import * as XLSX from "xlsx";
import type { StudentStatus } from "@/types/domain";

export const studentImportHeaders = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "guardianName",
  "guardianEmail",
  "guardianPhone",
  "address",
  "dateOfBirth",
  "admissionDate",
  "status",
  "batchCodes",
] as const;

export type StudentImportHeader = (typeof studentImportHeaders)[number];

export interface StudentImportDraftRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  address: string;
  dateOfBirth: string;
  admissionDate: string;
  status: string;
  batchCodes: string;
}

export interface StudentImportPreviewRow {
  rowNumber: number;
  values: Record<StudentImportHeader, string>;
  errors: string[];
  isValid: boolean;
}

export interface StudentImportPreview {
  headers: string[];
  rows: StudentImportPreviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

const requiredHeaders = ["firstName", "lastName", "phone", "guardianName", "guardianPhone", "admissionDate"] as const;
const csvEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validStatuses: StudentStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED"];

export function buildStudentImportCsv(rows: StudentImportDraftRow[]): string {
  const headerLine = studentImportHeaders.join(",");
  const body = rows.map((row) => studentImportHeaders.map((header) => csvEscape(row[header] ?? "")).join(",")).join("\n");
  return `${headerLine}\n${body}${body ? "\n" : ""}`;
}

export async function readStudentImportFile(file: File): Promise<string> {
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

export function parseStudentImportPreview(text: string): StudentImportPreview {
  const content = normalizeText(text);

  if (!content) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    };
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    };
  }

  const headers = parseCsvLine(lines[0]).map((value) => value.trim());
  const rows: StudentImportPreviewRow[] = [];

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const values = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex]?.trim() ?? ""])) as Record<string, string>;
    const rowValues = studentImportHeaders.reduce((acc, header) => {
      acc[header] = record[header] ?? "";
      return acc;
    }, {} as Record<StudentImportHeader, string>);
    const errors = validateStudentImportRow(rowValues, headers);

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

export function studentImportPreviewToCsv(preview: StudentImportPreview): string {
  const rows = preview.rows.map((row) =>
    studentImportHeaders.map((header) => csvEscape(row.values[header] ?? "")).join(","),
  );
  return `${studentImportHeaders.join(",")}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
}

export function studentImportPreviewToDraftRows(preview: StudentImportPreview): StudentImportDraftRow[] {
  return preview.rows.map((row) => ({
    firstName: row.values.firstName,
    lastName: row.values.lastName,
    email: row.values.email,
    phone: row.values.phone,
    guardianName: row.values.guardianName,
    guardianEmail: row.values.guardianEmail,
    guardianPhone: row.values.guardianPhone,
    address: row.values.address,
    dateOfBirth: row.values.dateOfBirth,
    admissionDate: row.values.admissionDate,
    status: row.values.status || "ACTIVE",
    batchCodes: row.values.batchCodes,
  }));
}

export function hasRequiredHeaders(headers: string[]): boolean {
  return requiredHeaders.every((header) => headers.includes(header));
}

function validateStudentImportRow(values: Record<StudentImportHeader, string>, headers: string[]): string[] {
  const errors: string[] = [];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      errors.push(`Missing required header "${header}"`);
      return errors;
    }
  }

  if (!values.firstName || !values.lastName || !values.phone || !values.guardianName || !values.guardianPhone || !values.admissionDate) {
    errors.push("Missing one or more required fields");
  }

  if (values.status && !validStatuses.includes(values.status as StudentStatus)) {
    errors.push(`Invalid status "${values.status}"`);
  }

  if (values.email && !csvEmailPattern.test(values.email)) {
    errors.push(`Invalid email "${values.email}"`);
  }

  if (values.guardianEmail && !csvEmailPattern.test(values.guardianEmail)) {
    errors.push(`Invalid guardian email "${values.guardianEmail}"`);
  }

  if (values.admissionDate && Number.isNaN(new Date(values.admissionDate).getTime())) {
    errors.push(`Invalid admission date "${values.admissionDate}"`);
  }

  if (values.dateOfBirth && Number.isNaN(new Date(values.dateOfBirth).getTime())) {
    errors.push(`Invalid date of birth "${values.dateOfBirth}"`);
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
