"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { organizationAssetsApi } from "@/features/media/api/organization-assets-api";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { OrganizationAssetType } from "@/types/domain";

const assetTypes: OrganizationAssetType[] = ["LOGO", "LETTERHEAD", "STAMP", "BROCHURE", "OTHER"];

export function OrganizationAssetsCard() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<OrganizationAssetType>("LOGO");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const query = useQuery({
    queryKey: ["organization-assets"],
    queryFn: organizationAssetsApi.list,
  });

  const uploadMutation = useMutation({
    mutationFn: organizationAssetsApi.upload,
    onSuccess: () => {
      toast.success("Organization asset uploaded");
      setTitle("");
      setType("LOGO");
      setNotes("");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["organization-assets"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: organizationAssetsApi.remove,
    onSuccess: () => {
      toast.success("Organization asset deleted");
      void queryClient.invalidateQueries({ queryKey: ["organization-assets"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const downloadAsset = async (assetId: string, filename: string) => {
    try {
      const blob = await organizationAssetsApi.download(assetId);
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
        <CardTitle>Organization assets</CardTitle>
        <CardDescription>Manage logos, letterheads, stamps, and other brand assets used across the institution.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Asset title" />
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={type} onChange={(event) => setType(event.target.value as OrganizationAssetType)}>
            {assetTypes.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <Textarea className="md:col-span-2" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes" />
          <Input className="md:col-span-2" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <div className="md:col-span-2">
            <Button
              onClick={() => file && uploadMutation.mutate({ payload: { title, type, notes: notes || undefined }, file })}
              disabled={!file || !title.trim() || uploadMutation.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadMutation.isPending ? "Uploading..." : "Upload asset"}
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
                  <Button variant="outline" size="sm" onClick={() => downloadAsset(item.id, item.originalName)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              <ImageIcon className="mb-3 h-5 w-5" />
              No organization assets have been uploaded yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
