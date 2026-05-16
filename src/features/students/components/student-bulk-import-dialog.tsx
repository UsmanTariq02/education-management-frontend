"use client";

import { useMemo, useRef, useState } from "react";
import type React from "react";
import * as XLSX from "xlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Copy, Download, FileSpreadsheet, Plus, RotateCcw, Trash2, Upload, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { aiApi } from "@/features/ai/api/ai-api";
import { studentsApi } from "@/features/students/api/students-api";
import type { Batch, StudentImportSummary, StudentStatus } from "@/types/domain";
import type { AiAdmissionExtraction } from "@/types/domain";
import { normalizeApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent as UiCardContent,
  CardDescription as UiCardDescription,
  CardHeader as UiCardHeader,
  CardTitle as UiCardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  readStudentImportFile,
  buildStudentImportCsv,
  parseStudentImportPreview,
  hasRequiredHeaders,
  studentImportHeaders,
  studentImportPreviewToDraftRows,
  type StudentImportDraftRow,
} from "@/features/students/utils/student-bulk-import";
import { ScrollArea } from "@/components/ui/scroll-area";

type ImportMode = "file" | "paste" | "wizard";

interface StudentBulkImportDialogProps {
  canCreate: boolean;
  canMutateWithinScope: boolean;
  studentLimitReached: boolean;
  batches: Batch[];
}

interface WizardRow extends StudentImportDraftRow {
  id: string;
  selectedBatchCodes: string[];
}

const emptyAdmissionExtraction = {
  rawText: "",
  sourceLabel: "",
  result: null as AiAdmissionExtraction | null,
};

const emptyWizardRow = (): WizardRow => ({
  id: crypto.randomUUID(),
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  guardianName: "",
  guardianEmail: "",
  guardianPhone: "",
  address: "",
  dateOfBirth: "",
  admissionDate: "",
  status: "ACTIVE",
  batchCodes: "",
  selectedBatchCodes: [],
});

export function StudentBulkImportDialog({ canCreate, canMutateWithinScope, studentLimitReached, batches }: StudentBulkImportDialogProps) {
  const queryClient = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("file");
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [pastedImportRows, setPastedImportRows] = useState("");
  const [wizardRows, setWizardRows] = useState<WizardRow[]>([emptyWizardRow()]);
  const [sharedBatchCodes, setSharedBatchCodes] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<StudentImportSummary | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDropActive, setIsDropActive] = useState(false);
  const [admissionRawText, setAdmissionRawText] = useState(emptyAdmissionExtraction.rawText);
  const [admissionSourceLabel, setAdmissionSourceLabel] = useState(emptyAdmissionExtraction.sourceLabel);
  const [admissionExtraction, setAdmissionExtraction] = useState<AiAdmissionExtraction | null>(emptyAdmissionExtraction.result);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const templateInputRef = useRef<HTMLInputElement | null>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => studentsApi.importCsv(file),
    onSuccess: (summary) => {
      setImportSummary(summary);
      setSelectedImportFile(null);
      setPastedImportRows("");
      setAdmissionRawText("");
      setAdmissionSourceLabel("");
      setAdmissionExtraction(null);
      setFileName("");
      setWizardRows([emptyWizardRow()]);
      setSharedBatchCodes([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success(`Imported ${summary.importedCount} student${summary.importedCount === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const admissionExtractionMutation = useMutation({
    mutationFn: async () => {
      if (!admissionRawText.trim()) {
        throw new Error("Admission text is required");
      }

      return aiApi.extractAdmissionForm({
        rawText: admissionRawText,
        sourceLabel: admissionSourceLabel || undefined,
      });
    },
    onSuccess: (result) => {
      setAdmissionExtraction(result);
      setWizardRows([admissionExtractionToWizardRow(result)]);
      setSharedBatchCodes(result.student.batchCodes ?? []);
      setImportMode("wizard");
      toast.success("Admission data extracted into the wizard");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const sharedBatchCodeValue = useMemo(() => {
    return sharedBatchCodes.join("|");
  }, [sharedBatchCodes]);

  const wizardCsvText = useMemo(() => {
    const rows = wizardRows.map((row) => ({
      ...row,
      batchCodes: mergeCodes(sharedBatchCodeValue, mergeCodes(row.selectedBatchCodes.join("|"), row.batchCodes)),
    }));
    return buildStudentImportCsv(rows);
  }, [sharedBatchCodeValue, wizardRows]);

  const sourceText = importMode === "wizard" ? wizardCsvText : pastedImportRows;
  const preview = useMemo(() => parseStudentImportPreview(sourceText), [sourceText]);
  const previewHasRequiredHeaders = hasRequiredHeaders(preview.headers);
  const hasAnyDataRows = preview.rows.some((row) => Object.values(row.values).some((value) => value.trim().length > 0));
  const importDisabled =
    importMutation.isPending ||
    !sourceText.trim() ||
    !previewHasRequiredHeaders ||
    preview.totalRows === 0 ||
    !hasAnyDataRows ||
    (importMode === "file" && !selectedImportFile);

  const downloadSampleCsv = async () => {
    try {
      const blob = await studentsApi.downloadImportSample();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "students-import-sample.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  const downloadWizardTemplateCsv = () => {
    const blob = new Blob([wizardCsvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students-bulk-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadWizardTemplateXlsx = () => {
    const workbook = XLSX.utils.book_new();
    const rows = parseStudentImportPreview(wizardCsvText);
    const sheet = XLSX.utils.json_to_sheet(rows.rows.map((row) => row.values));
    XLSX.utils.book_append_sheet(workbook, sheet, "Students");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "students-bulk-template.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const loadImportFile = async (file: File | null) => {
    setSelectedImportFile(file);
    setImportSummary(null);
    setPastedImportRows("");
    setAdmissionExtraction(null);
    setFileName(file?.name ?? "");
    setImportMode("file");

    if (!file) {
      return;
    }

    try {
      const text = await readStudentImportFile(file);
      setPastedImportRows(text);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  const loadTemplateFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const text = await readStudentImportFile(file);
      const preview = parseStudentImportPreview(text);
      if (!preview.headers.length || !hasRequiredHeaders(preview.headers)) {
        toast.error("Template file is missing required student headers");
        return;
      }

      const rows = studentImportPreviewToDraftRows(preview);
      const { sharedBatchCodes: inferredSharedBatchCodes, wizardRows: mappedRows } = splitTemplateRows(rows, batches);
      setWizardRows(mappedRows);
      setSharedBatchCodes(inferredSharedBatchCodes);
      setImportMode("wizard");
      setImportSummary(null);
      setFileName(file.name);
      if (templateInputRef.current) {
        templateInputRef.current.value = "";
      }
      toast.success(`Loaded ${mappedRows.length} template row${mappedRows.length === 1 ? "" : "s"}`);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    await loadImportFile(file);
  };

  const handleTemplateFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    await loadTemplateFile(file);
  };

  const runImport = () => {
    if (!sourceText.trim()) {
      return;
    }

    const safeFileName = fileName.toLowerCase().endsWith(".csv") ? fileName : "students-import.csv";
    const file = new File([sourceText.trim()], safeFileName, { type: "text/csv" });
    importMutation.mutate(file);
  };

  if (!canCreate) {
    return null;
  }

  return (
    <Dialog open={importOpen} onOpenChange={setImportOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!canMutateWithinScope || studentLimitReached}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bulk import students</DialogTitle>
          <DialogDescription>
            Import from CSV, paste rows directly, or use the guided wizard to prepare students with batch assignment before sending them to the server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <UiCard className="border-border/60 bg-muted/20">
            <UiCardHeader className="pb-3">
              <UiCardTitle className="text-base">AI admission extractor</UiCardTitle>
              <UiCardDescription>Paste a raw admission form, scanned text, or typed notes and let AI shape it into the import wizard.</UiCardDescription>
            </UiCardHeader>
            <UiCardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-3">
                <Textarea
                  value={admissionRawText}
                  onChange={(event) => setAdmissionRawText(event.target.value)}
                  className="min-h-36"
                  placeholder="Paste admission form text here..."
                />
                <Input
                  value={admissionSourceLabel}
                  onChange={(event) => setAdmissionSourceLabel(event.target.value)}
                  placeholder="Source label such as admission form, WhatsApp message, or scanned note"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button type="button" onClick={() => admissionExtractionMutation.mutate()} disabled={admissionExtractionMutation.isPending || !admissionRawText.trim()}>
                  {admissionExtractionMutation.isPending ? "Extracting..." : "Extract admission"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAdmissionRawText("");
                    setAdmissionSourceLabel("");
                    setAdmissionExtraction(null);
                  }}
                >
                  Clear input
                </Button>
              </div>
              {admissionExtraction ? (
                <div className="rounded-2xl border bg-background p-4 md:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{admissionExtraction.student.firstName} {admissionExtraction.student.lastName}</p>
                      <p className="text-xs text-muted-foreground">Confidence {Math.round(admissionExtraction.confidence * 100)}%</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWizardRows([admissionExtractionToWizardRow(admissionExtraction)]);
                        setSharedBatchCodes(admissionExtraction.student.batchCodes ?? []);
                        setImportMode("wizard");
                      }}
                    >
                      Send to wizard
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{admissionExtraction.notes.join(" ")}</p>
                </div>
              ) : null}
            </UiCardContent>
          </UiCard>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm shadow-sm">
            <p className="font-medium">Required columns</p>
            <p className="mt-1 text-muted-foreground">`firstName`, `lastName`, `phone`, `guardianName`, `guardianPhone`, `admissionDate`</p>
            <p className="mt-2 text-muted-foreground">
              Optional columns: `email`, `guardianEmail`, `address`, `dateOfBirth`, `status`, `batchCodes`
            </p>
            <p className="mt-2 text-muted-foreground">For multiple batches, separate batch codes with `|` like `BATCH-A|BATCH-B`.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-muted/20 p-1 shadow-sm">
            {[
              { key: "file", label: "Upload file", icon: Upload },
              { key: "paste", label: "Paste rows", icon: Copy },
              { key: "wizard", label: "Bulk wizard", icon: FileSpreadsheet },
            ].map((item) => {
              const Icon = item.icon;
              const active = importMode === item.key;
              return (
                <Button
                  key={item.key}
                  type="button"
                  variant={active ? "default" : "ghost"}
                  className="rounded-2xl"
                  onClick={() => {
                    setImportMode(item.key as ImportMode);
                    setImportSummary(null);
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadSampleCsv}>
              <Download className="mr-2 h-4 w-4" />
              Download sample CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPastedImportRows(studentImportHeaders.join(",") + "\n");
                setImportMode("paste");
                setImportSummary(null);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Insert sample headers
            </Button>
          </div>

          {importMode === "file" ? (
            <div
              className={`space-y-3 rounded-2xl border border-dashed border-border/70 p-4 shadow-sm transition-colors ${
                isDropActive ? "border-primary bg-primary/5" : "bg-background"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDropActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDropActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDropActive(false);
              }}
              onDrop={async (event) => {
                event.preventDefault();
                setIsDropActive(false);
                await loadImportFile(event.dataTransfer.files?.[0] ?? null);
              }}
              role="presentation"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2 text-muted-foreground">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Drop CSV or Excel here</p>
                  <p className="text-xs text-muted-foreground">Or click to browse. Excel files are converted automatically.</p>
                </div>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                className="cursor-pointer"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
              />
              {fileName ? <p className="text-xs text-muted-foreground">Selected: {fileName}</p> : null}
            </div>
          ) : null}

          {importMode === "paste" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Paste CSV rows</label>
              <Textarea
                value={pastedImportRows}
                onChange={(event) => {
                  setPastedImportRows(event.target.value);
                  setSelectedImportFile(null);
                  setFileName("");
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                  setImportSummary(null);
                }}
                placeholder={`firstName,lastName,phone,guardianName,guardianPhone,admissionDate
Ali,Khan,03001234567,Ahmed Khan,03007654321,2026-05-11`}
                className="min-h-[220px] font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">Paste the CSV body including the header line. Excel data can be copied here too if it is already tabular text.</p>
            </div>
          ) : null}

          {importMode === "wizard" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={downloadWizardTemplateCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Export template CSV
                </Button>
                <Button variant="outline" onClick={downloadWizardTemplateXlsx}>
                  <Download className="mr-2 h-4 w-4" />
                  Export template Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    templateInputRef.current?.click();
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import template file
                </Button>
                <Input
                  ref={templateInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleTemplateFileChange}
                />
              </div>
                <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Shared batch assignment</p>
                    <p className="text-xs text-muted-foreground">These batch codes will be applied to every row unless you add extra codes on the row itself.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSharedBatchCodes([])}
                    disabled={sharedBatchCodes.length === 0}
                  >
                    Clear batches
                  </Button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {batches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No batches available to assign.</p>
                  ) : (
                    batches.map((batch) => {
                      const checked = sharedBatchCodes.includes(batch.code);
                      return (
                        <Checkbox
                          key={batch.id}
                          label={`${batch.name} (${batch.code})`}
                          checked={checked}
                          onChange={(event) => {
                            setSharedBatchCodes((current) =>
                              event.target.checked ? Array.from(new Set([...current, batch.code])) : current.filter((code) => code !== batch.code),
                            );
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Student rows</p>
                  <p className="text-xs text-muted-foreground">Add one row per student. Every row becomes one imported student.</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setWizardRows((current) => [...current, emptyWizardRow()])}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add row
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setWizardRows((current) => current.length > 1 ? current.slice(0, -1) : current)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove last
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {wizardRows.map((row, rowIndex) => (
                  <div key={row.id} className="rounded-2xl border bg-background p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Row {rowIndex + 1}</Badge>
                        {row.firstName || row.lastName ? (
                          <span className="text-sm text-muted-foreground">
                            {row.firstName} {row.lastName}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">New student</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setWizardRows((current) =>
                              current.map((item, index) => (index === rowIndex ? { ...item, ...emptyWizardRow(), id: item.id } : item)),
                            )
                          }
                        >
                          Reset row
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={wizardRows.length === 1}
                          onClick={() => setWizardRows((current) => current.filter((_, index) => index !== rowIndex))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="First name" value={row.firstName} onChange={(value) => updateWizardRow(setWizardRows, row.id, { firstName: value })} />
                      <Field label="Last name" value={row.lastName} onChange={(value) => updateWizardRow(setWizardRows, row.id, { lastName: value })} />
                      <Field label="Email" value={row.email} onChange={(value) => updateWizardRow(setWizardRows, row.id, { email: value })} />
                      <Field label="Phone" value={row.phone} onChange={(value) => updateWizardRow(setWizardRows, row.id, { phone: value })} />
                      <Field label="Guardian name" value={row.guardianName} onChange={(value) => updateWizardRow(setWizardRows, row.id, { guardianName: value })} />
                      <Field label="Guardian email" value={row.guardianEmail} onChange={(value) => updateWizardRow(setWizardRows, row.id, { guardianEmail: value })} />
                      <Field label="Guardian phone" value={row.guardianPhone} onChange={(value) => updateWizardRow(setWizardRows, row.id, { guardianPhone: value })} />
                      <Field label="Admission date" value={row.admissionDate} onChange={(value) => updateWizardRow(setWizardRows, row.id, { admissionDate: value })} type="date" />
                      <Field label="Date of birth" value={row.dateOfBirth} onChange={(value) => updateWizardRow(setWizardRows, row.id, { dateOfBirth: value })} type="date" />
                      <div className="md:col-span-2">
                        <Field label="Address" value={row.address} onChange={(value) => updateWizardRow(setWizardRows, row.id, { address: value })} />
                      </div>
                      <div className="md:col-span-2 grid gap-4 lg:grid-cols-[180px_1fr]">
                        <div className="w-[180px]">
                          <label className="mb-2 block text-sm font-medium">Status</label>
                          <select
                          className="h-10 w-full rounded-2xl border border-input bg-background px-3 text-sm shadow-sm"
                            value={row.status}
                            onChange={(event) => updateWizardRow(setWizardRows, row.id, { status: event.target.value })}
                          >
                            {["ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED"].map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Field
                          label="Extra batch codes"
                          value={row.batchCodes}
                          onChange={(value) => updateWizardRow(setWizardRows, row.id, { batchCodes: value })}
                          placeholder="BATCH-A|BATCH-B"
                        />
                      </div>
                      <div className="md:col-span-2 rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">Per-row batch picker</p>
                            <p className="text-xs text-muted-foreground">Select batches that apply only to this student.</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => updateWizardRow(setWizardRows, row.id, { selectedBatchCodes: [] })}
                            disabled={row.selectedBatchCodes.length === 0}
                          >
                            Clear row batches
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {batches.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No batches available.</p>
                          ) : (
                            batches.map((batch) => {
                              const checked = row.selectedBatchCodes.includes(batch.code);
                              return (
                                <Checkbox
                                  key={batch.id}
                                  label={`${batch.name} (${batch.code})`}
                                  checked={checked}
                                  onChange={(event) => {
                                    updateWizardRow(setWizardRows, row.id, {
                                      selectedBatchCodes: event.target.checked
                                        ? Array.from(new Set([...row.selectedBatchCodes, batch.code]))
                                        : row.selectedBatchCodes.filter((code) => code !== batch.code),
                                    });
                                  }}
                                />
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Validation preview</p>
                <p className="text-xs text-muted-foreground">
                  {preview.totalRows} rows detected. {preview.validRows} valid, {preview.invalidRows} with warnings or errors.
                </p>
              </div>
              {previewHasRequiredHeaders ? (
                <Badge variant="success">Ready to import</Badge>
              ) : (
                <Badge variant="warning">Missing required headers</Badge>
              )}
            </div>

            {!previewHasRequiredHeaders ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm">
                The preview is missing one or more required headers. The import endpoint will reject it until the required fields are present.
              </div>
            ) : null}

            <ScrollArea className="mt-4 max-h-[340px] rounded-2xl border border-border/70 bg-background shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Row</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Batches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        Add a file, paste rows, or fill the wizard to see a preview here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    preview.rows.slice(0, 25).map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {row.values.firstName} {row.values.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{row.values.email || row.values.guardianEmail || "No email provided"}</div>
                        </TableCell>
                        <TableCell>{row.values.phone}</TableCell>
                        <TableCell className="max-w-[220px] break-words">{row.values.batchCodes || "None"}</TableCell>
                        <TableCell>{row.values.status || "ACTIVE"}</TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <Badge variant="success">
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Valid
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="warning">
                                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                Review
                              </Badge>
                              <p className="text-xs text-muted-foreground">{row.errors.slice(0, 2).join(". ")}</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {importSummary ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <p className="font-medium text-emerald-900">Import completed</p>
              <p className="mt-1 text-emerald-800">
                {importSummary.importedCount} imported, {importSummary.skippedCount} skipped, {importSummary.errors.length} errors.
              </p>
              {importSummary.errors.length ? (
                <div className="mt-3 space-y-1 text-xs text-emerald-900">
                  {importSummary.errors.slice(0, 5).map((error) => (
                    <p key={`${error.rowNumber}-${error.message}`}>Row {error.rowNumber}: {error.message}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="sticky bottom-0 z-10 -mx-6 flex justify-end gap-2 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur">
            <Button
              variant="outline"
              onClick={() => {
                setImportOpen(false);
                setSelectedImportFile(null);
                setPastedImportRows("");
                setAdmissionRawText("");
                setAdmissionSourceLabel("");
                setAdmissionExtraction(null);
                setFileName("");
                setIsDropActive(false);
                setWizardRows([emptyWizardRow()]);
                setSharedBatchCodes([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
                if (templateInputRef.current) {
                  templateInputRef.current.value = "";
                }
              }}
            >
              Close
            </Button>
            <Button onClick={runImport} disabled={importDisabled}>
              {importMutation.isPending ? "Importing..." : preview.invalidRows > 0 ? "Import with warnings" : "Import students"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function updateWizardRow(
  setWizardRows: React.Dispatch<React.SetStateAction<WizardRow[]>>,
  rowId: string,
  patch: Partial<WizardRow>,
) {
  setWizardRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
}

function mergeCodes(sharedCodes: string, rowCodes: string): string {
  return Array.from(
    new Set(
      [sharedCodes, rowCodes]
        .flatMap((value) => value.split("|"))
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).join("|");
}

function splitTemplateRows(rows: StudentImportDraftRow[], batches: Batch[]) {
  const knownCodes = new Set(batches.map((batch) => batch.code));
  const perRowKnownCodes = rows.map((row) => parseBatchCodes(row.batchCodes).filter((code) => knownCodes.has(code)));
  const sharedBatchCodes = perRowKnownCodes.length
    ? perRowKnownCodes.reduce<string[]>((shared, codes) => shared.filter((code) => codes.includes(code)), perRowKnownCodes[0])
    : [];

  return {
    sharedBatchCodes,
    wizardRows: rows.map((row) => {
      const rowCodes = parseBatchCodes(row.batchCodes);
      const selectedBatchCodes = rowCodes.filter((code) => knownCodes.has(code) && !sharedBatchCodes.includes(code));
      const batchCodes = rowCodes.filter((code) => !knownCodes.has(code));

      return {
        id: crypto.randomUUID(),
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        guardianName: row.guardianName,
        guardianEmail: row.guardianEmail,
        guardianPhone: row.guardianPhone,
        address: row.address,
        dateOfBirth: row.dateOfBirth,
        admissionDate: row.admissionDate,
        status: row.status,
        batchCodes: batchCodes.join("|"),
        selectedBatchCodes,
      };
    }),
  };
}

function admissionExtractionToWizardRow(extraction: AiAdmissionExtraction): WizardRow {
  return {
    id: crypto.randomUUID(),
    firstName: extraction.student.firstName,
    lastName: extraction.student.lastName,
    email: extraction.student.email,
    phone: extraction.student.phone,
    guardianName: extraction.student.guardianName,
    guardianEmail: extraction.student.guardianEmail,
    guardianPhone: extraction.student.guardianPhone,
    address: extraction.student.address,
    dateOfBirth: extraction.student.dateOfBirth,
    admissionDate: extraction.student.admissionDate,
    status: extraction.student.status,
    batchCodes: "",
    selectedBatchCodes: extraction.student.batchCodes ?? [],
  };
}

function parseBatchCodes(batchCodes: string): string[] {
  return batchCodes
    .split("|")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);
}
