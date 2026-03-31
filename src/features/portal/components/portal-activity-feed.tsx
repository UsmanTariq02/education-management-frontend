"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellRing, ClipboardCheck, FileQuestion, GraduationCap } from "lucide-react";
import { portalApi } from "@/features/portal/api/portal-api";
import type { PortalActivityFeedItem, PortalActivityFeedKind } from "@/types/domain";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

const kindMeta: Record<
  PortalActivityFeedKind,
  { label: string; icon: typeof BellRing; variant: "outline" | "secondary" | "success" | "warning" }
> = {
  REMINDER: { label: "Reminder", icon: BellRing, variant: "outline" },
  ASSIGNMENT_FEEDBACK: { label: "Assignment feedback", icon: ClipboardCheck, variant: "success" },
  ASSESSMENT_FEEDBACK: { label: "Assessment feedback", icon: FileQuestion, variant: "warning" },
  RESULT_PUBLISHED: { label: "Result published", icon: GraduationCap, variant: "secondary" },
};

export function PortalActivityFeed({ variant }: { variant: "student" | "parent" }) {
  const query = useQuery({
    queryKey: ["portal-activity-feed", variant],
    queryFn: portalApi.activityFeed,
  });

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="The portal activity feed could not be loaded." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            {variant === "parent" ? "Guardian notifications" : "Portal notifications"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Activity timeline</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {variant === "parent"
              ? "Track reminders, published results, and teacher feedback for the linked student in one timeline."
              : "Track reminders, published results, and teacher feedback in one timeline."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={variant === "parent" ? "/portal/parent" : "/portal/student"}>Back to portal</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {query.data.length ? (
          query.data.map((item) => <ActivityItem key={item.id} item={item} />)
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No activity has been recorded for this portal account yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ item }: { item: PortalActivityFeedItem }) {
  const meta = kindMeta[item.kind];
  const Icon = meta.icon;

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={meta.variant}>
                <Icon className="mr-2 h-3.5 w-3.5" />
                {meta.label}
              </Badge>
              {item.subjectName ? <Badge variant="outline">{item.subjectName}</Badge> : null}
              {item.status ? <Badge variant="outline">{item.status}</Badge> : null}
            </div>
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription>{formatDate(item.occurredAt, "MMM d, yyyy p")}</CardDescription>
          </div>
          {item.scoreLabel ? <Badge variant="outline">{item.scoreLabel}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{item.description}</p>
        {item.actorName ? <p className="text-xs text-muted-foreground">Updated by {item.actorName}</p> : null}
      </CardContent>
    </Card>
  );
}
