"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, FileArchive, FileSpreadsheet, Files } from "lucide-react";
import { toast } from "sonner";
import { portalApi } from "@/features/portal/api/portal-api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";

export function PortalDocumentCenter({ variant }: { variant: "student" | "parent" }) {
  const query = useQuery({
    queryKey: ["portal-documents", variant],
    queryFn: portalApi.documents,
  });

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="Portal documents could not be loaded." onRetry={() => query.refetch()} />;
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const blob = await portalApi.downloadDocument(documentId);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            {variant === "parent" ? "Guardian document center" : "Portal document center"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Download generated academic summaries and any student files already uploaded by the school.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={variant === "parent" ? "/portal/parent" : "/portal/student"}>Back to portal</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DocSummary title="Total files" value={query.data.length} icon={Files} />
        <DocSummary title="Generated" value={query.data.filter((item) => item.kind === "GENERATED").length} icon={FileSpreadsheet} />
        <DocSummary title="Uploaded" value={query.data.filter((item) => item.kind === "UPLOADED").length} icon={FileArchive} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {query.data.map((item) => (
          <Card key={item.id} className="border-border/70">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="break-words">{item.title}</CardTitle>
                  <CardDescription className="break-words">{item.fileName}</CardDescription>
                </div>
                <Badge variant={item.kind === "GENERATED" ? "secondary" : "outline"}>{item.kind}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{item.category}</Badge>
                <Badge variant="outline">{item.mimeType}</Badge>
                <Badge variant="outline">{formatDate(item.createdAt, "MMM d, yyyy")}</Badge>
              </div>
              <p className="break-words text-muted-foreground">{item.description ?? "No additional description available."}</p>
              <Button onClick={() => handleDownload(item.id, item.fileName)} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DocSummary({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Files }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
          <span className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
