"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fingerprint, ShieldCheck, ShieldX, Smartphone, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { MetricCard } from "@/components/cards/metric-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { DetailItem } from "@/components/shared/detail-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

const successStatuses = new Set(["SUCCESS", "REFRESH", "LOGOUT"]);

export default function SecurityPage() {
  const queryClient = useQueryClient();
  const securityQuery = useQuery({
    queryKey: ["auth-security"],
    queryFn: authApi.security,
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      toast.success("Session revoked successfully.");
      void queryClient.invalidateQueries({ queryKey: ["auth-security"] });
    },
    onError: () => {
      toast.error("Unable to revoke session.");
    },
  });

  if (securityQuery.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (securityQuery.isError || !securityQuery.data) {
    return <ErrorState description="Security history could not be loaded." onRetry={() => void securityQuery.refetch()} />;
  }

  const { sessions, recentLoginEvents } = securityQuery.data;
  const activeSessions = sessions.filter((session) => !session.revokedAt);
  const revokedSessions = sessions.filter((session) => Boolean(session.revokedAt));
  const blockedEvents = recentLoginEvents.filter((event) => event.status === "BLOCKED").length;
  const failedEvents = recentLoginEvents.filter((event) => event.status === "FAILED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Login sessions and history"
        description="Review active login sessions, revoke old access, and monitor recent authentication activity for compliance and operational safety."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active login sessions" value={String(activeSessions.length)} helper="Refresh-token backed device sessions" icon={Smartphone} tone="sky" />
        <MetricCard title="Revoked login sessions" value={String(revokedSessions.length)} helper="Sessions explicitly ended or rotated" icon={ShieldCheck} tone="violet" />
        <MetricCard title="Failed logins" value={String(failedEvents)} helper="Recent invalid credential attempts" icon={ShieldX} tone={failedEvents > 0 ? "amber" : "emerald"} />
        <MetricCard title="Blocked attempts" value={String(blockedEvents)} helper="Rate-limited or policy-blocked auth" icon={Fingerprint} tone={blockedEvents > 0 ? "rose" : "emerald"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current login sessions</CardTitle>
            <CardDescription>Each item represents an active or historical refresh session tied to this account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length ? (
              sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={session.revokedAt ? "outline" : "success"}>
                          {session.revokedAt ? "Revoked" : "Active"}
                        </Badge>
                        <Badge variant="secondary">{session.ipAddress ?? "IP unavailable"}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{session.userAgent ?? "Unknown device"}</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <DetailItem label="Created" value={formatDate(session.createdAt, "MMM d, yyyy p")} />
                        <DetailItem label="Expires" value={formatDate(session.expiresAt, "MMM d, yyyy p")} />
                        <DetailItem label="Last used" value={session.lastUsedAt ? formatDate(session.lastUsedAt, "MMM d, yyyy p") : "At login"} />
                        {session.revokedAt ? <DetailItem label="Revoked" value={`${formatDate(session.revokedAt, "MMM d, yyyy p")}${session.revocationReason ? ` · ${session.revocationReason.replaceAll("-", " ")}` : ""}`} /> : null}
                      </div>
                    </div>
                    {!session.revokedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMutation.mutate(session.id)}
                        disabled={revokeMutation.isPending}
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No login history" description="Active and historical refresh sessions will appear here after account use." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to use this page</CardTitle>
            <CardDescription>Use this page as your personal security review workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Review active sessions regularly and revoke sessions you do not recognize.</p>
            <p>Blocked or repeated failed attempts usually indicate incorrect credentials or misuse that should be investigated.</p>
            <p>If your role or organization access changes, re-login so the latest permissions and module access apply cleanly.</p>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm">
              <p className="font-medium text-foreground">Compliance note</p>
              <p className="mt-2">This page is intended for account-level session review. Platform-wide audit remains in Activity Logs and super-admin governance modules.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent authentication activity</CardTitle>
          <CardDescription>Latest login, refresh, logout, blocked, and failed events for this account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentLoginEvents.length ? (
            recentLoginEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={successStatuses.has(event.status) ? "success" : event.status === "FAILED" ? "warning" : "danger"}>
                        {event.status.replaceAll("_", " ")}
                      </Badge>
                      <Badge variant="outline">{event.ipAddress ?? "IP unavailable"}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{event.userAgent ?? "Unknown device"}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <DetailItem label="Timestamp" value={formatDate(event.createdAt, "MMM d, yyyy p")} />
                      <DetailItem label="Account" value={event.email} />
                      {event.failureReason ? <DetailItem label="Reason" value={event.failureReason.replaceAll("-", " ")} className="md:col-span-2" /> : null}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No authentication events" description="Login, refresh, logout, and blocked attempts will appear here once recorded." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
