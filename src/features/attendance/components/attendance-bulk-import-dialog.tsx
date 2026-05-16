"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { attendanceApi } from "@/features/attendance/api/attendance-api";
import {
  attendanceImportHeaders,
  attendanceImportPreviewToDraftRows,
  buildAttendanceImportCsv,
  hasRequiredAttendanceHeaders,
  parseAttendanceImportPreview,
  readAttendanceImportFile,
} from "@/features/attendance/utils/attendance-bulk-import";
import { normalizeApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AttendanceBulkImportDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);

  const preview = useMemo(() => parseAttendanceImportPreview(rawText), [rawText]);
  const readyToImport = preview.totalRows > 0 && preview.validRows > 0 && preview.invalidRows === 0 && hasRequiredAttendanceHeaders(preview.headers);

  const importMutation = useMutation({
    mutationFn: async () =>
      attendanceApi.bulkCreate({
        items: attendanceImportPreviewToDraftRows(preview).map((item) => ({
          ...item,
          remarks: item.remarks || undefined,
        })),
      }),
    onSuccess: (result) => {
      toast.success(`Imported ${result.createdCount} attendance record${result.createdCount === 1 ? "" : "s"}`);
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setOpen(false);
      setRawText("");
      setFileName("");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const loadFile = async (file: File | null) => {
    if (!file) {
      setRawText("");
      setFileName("");
      return;
    }

    setIsParsingFile(true);
    setFileName(file.name);

    try {
      setRawText(await readAttendanceImportFile(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to read attendance file");
      setRawText("");
      setFileName("");
    } finally {
      setIsParsingFile(false);
    }
  };

  const downloadSample = () => {
    const csv = buildAttendanceImportCsv([
      {
        studentId: "00000000-0000-0000-0000-000000000001",
        batchId: "00000000-0000-0000-0000-000000000002",
        attendanceDate: new Date().toISOString().slice(0, 10),
        status: "PRESENT",
        remarks: "Morning check-in",
      },
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-import-sample.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk attendance import</DialogTitle>
          <DialogDescription>Upload a CSV or spreadsheet with studentId, batchId, attendanceDate, status, and optional remarks.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadSample}>
              <Download className="mr-2 h-4 w-4" />
              Download sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const csv = buildAttendanceImportCsv(attendanceImportPreviewToDraftRows(preview));
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "attendance-import-preview.csv";
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
              }}
              disabled={!preview.totalRows}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export preview
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(event) => loadFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              {fileName || "Paste CSV text below or choose a file. Spreadsheet import is converted to CSV locally."}
            </p>
          </div>
          <Textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            className="min-h-[220px] font-mono text-xs"
            placeholder={attendanceImportHeaders.join(",")}
          />
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm">
            <div className="flex flex-wrap gap-4">
              <span>Total rows: {preview.totalRows}</span>
              <span>Valid: {preview.validRows}</span>
              <span>Invalid: {preview.invalidRows}</span>
              <span>Required headers: {hasRequiredAttendanceHeaders(preview.headers) ? "yes" : "no"}</span>
            </div>
            {preview.rows.some((row) => row.errors.length > 0) ? (
              <div className="mt-3 space-y-1 text-xs text-rose-700">
                {preview.rows
                  .filter((row) => row.errors.length > 0)
                  .slice(0, 4)
                  .map((row) => (
                    <p key={row.rowNumber}>
                      Row {row.rowNumber}: {row.errors.join("; ")}
                    </p>
                  ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => importMutation.mutate()} disabled={!readyToImport || importMutation.isPending || isParsingFile}>
              {importMutation.isPending ? "Importing..." : "Import records"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
