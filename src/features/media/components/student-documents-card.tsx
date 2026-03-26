"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { studentDocumentsApi } from "@/features/media/api/student-documents-api";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { StudentDocumentType } from "@/types/domain";

const documentTypes: StudentDocumentType[] = [
  "ID_CARD",
  "ADMISSION_FORM",
  "BIRTH_CERTIFICATE",
  "GUARDIAN_ID",
  "ACADEMIC_RECORD",
  "MEDICAL_RECORD",
  "OTHER",
];

export function StudentDocumentsCard({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<StudentDocumentType>("ID_CARD");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const query = useQuery({
    queryKey: ["student-documents", studentId],
    queryFn: () => studentDocumentsApi.list(studentId),
    enabled: Boolean(studentId),
  });

  const uploadMutation = useMutation({
    mutationFn: studentDocumentsApi.upload,
    onSuccess: () => {
      toast.success("Student document uploaded");
      setTitle("");
      setType("ID_CARD");
      setNotes("");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["student-documents", studentId] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ documentId }: { documentId: string }) => studentDocumentsApi.remove(studentId, documentId),
    onSuccess: () => {
      toast.success("Student document deleted");
      void queryClient.invalidateQueries({ queryKey: ["student-documents", studentId] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const downloadDocument = async (documentId: string, filename: string) => {
    try {
      const blob = await studentDocumentsApi.download(studentId, documentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student documents</CardTitle>
        <CardDescription>Upload and maintain official student records, certificates, and guardian documents.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Document title" />
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={type} onChange={(event) => setType(event.target.value as StudentDocumentType)}>
            {documentTypes.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <Textarea className="md:col-span-2" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes" />
          <Input className="md:col-span-2" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <div className="md:col-span-2">
            <Button
              onClick={() => file && uploadMutation.mutate({ studentId, payload: { title, type, notes: notes || undefined }, file })}
              disabled={!file || !title.trim() || uploadMutation.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadMutation.isPending ? "Uploading..." : "Upload document"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {query.data?.length ? (
            query.data.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.originalName} · {Math.max(1, Math.round(item.sizeBytes / 1024))} KB · {formatDate(item.createdAt, "MMM d, yyyy p")}
                    </p>
                  </div>
                  <Badge variant="outline">{item.type.replaceAll("_", " ")}</Badge>
                </div>
                {item.notes ? <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadDocument(item.id, item.originalName)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ documentId: item.id })}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              <FileText className="mb-3 h-5 w-5" />
              No student documents have been uploaded yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
