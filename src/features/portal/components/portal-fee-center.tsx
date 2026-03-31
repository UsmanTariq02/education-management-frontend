"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CreditCard, Download, ReceiptText, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { portalApi } from "@/features/portal/api/portal-api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeApiError } from "@/lib/api/errors";
import { formatCurrency, formatDate } from "@/lib/formatters";

export function PortalFeeCenter({ variant }: { variant: "student" | "parent" }) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { title: string; notes: string; file: File | null }>>({});
  const query = useQuery({
    queryKey: ["portal-fees", variant],
    queryFn: portalApi.fees,
  });

  const uploadMutation = useMutation({
    mutationFn: async (input: { feeRecordId: string; title: string; notes: string; file: File }) =>
      portalApi.uploadPaymentProof(input.feeRecordId, { title: input.title, notes: input.notes || undefined }, input.file),
    onSuccess: async () => {
      toast.success("Payment proof uploaded");
      await queryClient.invalidateQueries({ queryKey: ["portal-fees"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="Portal fees could not be loaded." onRetry={() => query.refetch()} />;
  }

  const handleDownload = async (proofId: string, fileName: string) => {
    try {
      const blob = await portalApi.downloadPaymentProof(proofId);
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
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            {variant === "parent" ? "Parent fee action center" : "Student fee overview"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Fees and payment proofs</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {variant === "parent"
              ? "Review outstanding fee cycles and upload payment evidence directly from the parent portal."
              : "Review billed fee cycles and any payment proofs already submitted for this student."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={variant === "parent" ? "/portal/parent" : "/portal/student"}>Back to portal</Link>
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {query.data.map((item) => {
          const draft = drafts[item.id] ?? { title: "", notes: "", file: null };
          return (
            <Card key={item.id} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {item.month}/{item.year}
                    </CardTitle>
                    <CardDescription>
                      Due {formatCurrency(item.amountDue)} · Paid {formatCurrency(item.amountPaid)} · Pending {formatCurrency(item.pendingAmount)}
                    </CardDescription>
                  </div>
                  <Badge variant={item.pendingAmount > 0 ? "warning" : "success"}>{item.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.paymentMethod ? <Badge variant="outline">{item.paymentMethod}</Badge> : null}
                  {item.paidAt ? <Badge variant="outline">Paid {formatDate(item.paidAt)}</Badge> : null}
                  <Badge variant="outline">{item.proofs.length} proof(s)</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {item.remarks ? <p className="text-muted-foreground">{item.remarks}</p> : null}

                {variant === "parent" && item.pendingAmount > 0 ? (
                  <div className="space-y-3 rounded-2xl border border-dashed p-4">
                    <p className="font-medium">Upload payment proof</p>
                    <Input
                      placeholder="Proof title"
                      value={draft.title}
                      onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, title: event.target.value } }))}
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={draft.notes}
                      onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, notes: event.target.value } }))}
                    />
                    <Input
                      type="file"
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: { ...draft, file: event.target.files?.[0] ?? null },
                        }))
                      }
                    />
                    <Button
                      className="w-full"
                      disabled={!draft.title.trim() || !draft.file || uploadMutation.isPending}
                      onClick={() => {
                        if (!draft.file || !draft.title.trim()) return;
                        uploadMutation.mutate({
                          feeRecordId: item.id,
                          title: draft.title.trim(),
                          notes: draft.notes.trim(),
                          file: draft.file,
                        });
                      }}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Submit proof
                    </Button>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <p className="font-medium">Submitted proofs</p>
                  {item.proofs.length ? (
                    item.proofs.map((proof) => (
                      <div key={proof.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{proof.title}</p>
                            <p className="text-muted-foreground">
                              {proof.originalName} · {formatDate(proof.submittedAt, "MMM d, yyyy p")}
                            </p>
                          </div>
                          <Badge variant={proof.status === "ACCEPTED" ? "success" : proof.status === "REJECTED" ? "danger" : "outline"}>
                            {proof.status}
                          </Badge>
                        </div>
                        {proof.notes ? <p className="mt-2 text-muted-foreground">{proof.notes}</p> : null}
                        {proof.rejectionReason ? <p className="mt-2 text-rose-600">{proof.rejectionReason}</p> : null}
                        <Button variant="outline" className="mt-3" onClick={() => handleDownload(proof.id, proof.originalName)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download proof
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No payment proofs have been submitted for this fee cycle yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
