"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Pin, CheckCircle2, Loader2 } from "lucide-react";
import { portalApi } from "@/features/portal/api/portal-api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

export function PortalAnnouncementBoard({ variant }: { variant: "student" | "parent" }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["portal-announcements", variant],
    queryFn: portalApi.announcements,
  });
  const acknowledgeMutation = useMutation({
    mutationFn: portalApi.acknowledgeItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal-announcements", variant] });
      await queryClient.invalidateQueries({ queryKey: ["portal-acknowledgements", variant] });
    },
  });

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="Portal announcements could not be loaded." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            {variant === "parent" ? "Guardian noticeboard" : "Student noticeboard"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Announcements</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Read published notices, academic updates, and operational announcements released by the institution.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={variant === "parent" ? "/portal/parent" : "/portal/student"}>Back to portal</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {query.data.length ? (
          query.data.map((item) => (
            <Card key={item.id} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <Megaphone className="mr-2 h-3.5 w-3.5" />
                        {item.category}
                      </Badge>
                      {item.isPinned ? (
                        <Badge variant="warning">
                          <Pin className="mr-2 h-3.5 w-3.5" />
                          Pinned
                        </Badge>
                      ) : null}
                    </div>
                    <CardTitle className="break-words">{item.title}</CardTitle>
                    <CardDescription>
                      {item.publishedAt ? `Published ${formatDate(item.publishedAt, "MMM d, yyyy p")}` : "Scheduled"}
                      {item.expiresAt ? ` · Expires ${formatDate(item.expiresAt, "MMM d, yyyy")}` : ""}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{item.audience}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.body}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.acknowledgedAt ? "success" : "outline"}>
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      {item.acknowledgedAt ? `Read ${formatDate(item.acknowledgedAt, "MMM d, yyyy p")}` : "Unread"}
                    </Badge>
                  </div>
                  {!item.acknowledgedAt ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeMutation.mutate({ itemKey: item.id, kind: "ANNOUNCEMENT", title: item.title })}
                      disabled={acknowledgeMutation.isPending}
                    >
                      {acknowledgeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Mark as read
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No announcements are currently published for this portal account.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
