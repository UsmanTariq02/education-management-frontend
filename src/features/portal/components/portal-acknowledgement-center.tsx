"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellDot, CheckCheck, GraduationCap, Wallet } from "lucide-react";
import { toast } from "sonner";
import { portalApi } from "@/features/portal/api/portal-api";
import type { PortalAcknowledgementItem, PortalAcknowledgementKind } from "@/types/domain";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";

const kindMeta: Record<PortalAcknowledgementKind, { icon: typeof BellDot; label: string }> = {
  FEE_DUE: { icon: Wallet, label: "Fee attention" },
  ASSIGNMENT_FEEDBACK: { icon: CheckCheck, label: "Assignment feedback" },
  ASSESSMENT_RESULT: { icon: GraduationCap, label: "Assessment result" },
  EXAM_RESULT: { icon: GraduationCap, label: "Exam result" },
};

export function PortalAcknowledgementCenter({ variant }: { variant: "student" | "parent" }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["portal-acknowledgements", variant],
    queryFn: portalApi.acknowledgements,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: portalApi.acknowledgeItem,
    onSuccess: async () => {
      toast.success("Acknowledgement saved");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portal-acknowledgements"] }),
        queryClient.invalidateQueries({ queryKey: ["portal-dashboard"] }),
      ]);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="Acknowledgement items could not be loaded." onRetry={() => query.refetch()} />;
  }

  const pending = query.data.filter((item) => !item.acknowledgedAt);
  const acknowledged = query.data.filter((item) => item.acknowledgedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            {variant === "parent" ? "Guardian acknowledgement center" : "Student acknowledgement center"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Acknowledgements</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Review live fee, result, and feedback items that require explicit acknowledgement inside the portal.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={variant === "parent" ? "/portal/parent" : "/portal/student"}>Back to portal</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Pending" value={pending.length} helper="Items still waiting for acknowledgement" />
        <SummaryCard title="Acknowledged" value={acknowledged.length} helper="Items already confirmed in this portal" />
      </div>

      <Section title="Pending acknowledgement" items={pending}>
        {(item) => (
          <Button
            onClick={() => acknowledgeMutation.mutate({ itemKey: item.itemKey, kind: item.kind, title: item.title })}
            disabled={acknowledgeMutation.isPending}
          >
            Acknowledge
          </Button>
        )}
      </Section>

      <Section title="Acknowledged history" items={acknowledged}>
        {(item) => <Badge variant="success">Acknowledged {formatDate(item.acknowledgedAt, "MMM d, yyyy p")}</Badge>}
      </Section>
    </div>
  );
}

function Section({
  title,
  items,
  children,
}: {
  title: string;
  items: PortalAcknowledgementItem[];
  children: (item: PortalAcknowledgementItem) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Guardian-visible academic and finance actions generated from live portal data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => {
            const meta = kindMeta[item.kind];
            const Icon = meta.icon;
            return (
              <div key={item.itemKey} className="rounded-2xl border p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <Icon className="mr-2 h-3.5 w-3.5" />
                        {meta.label}
                      </Badge>
                      {item.subjectName ? <Badge variant="outline">{item.subjectName}</Badge> : null}
                      {item.scoreLabel ? <Badge variant="outline">{item.scoreLabel}</Badge> : null}
                    </div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.occurredAt, "MMM d, yyyy p")}
                      {item.actorName ? ` · ${item.actorName}` : ""}
                    </p>
                  </div>
                  {children(item)}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No items in this section yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ title, value, helper }: { title: string; value: number; helper: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
