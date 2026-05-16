"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { onlineClassesApi } from "@/features/online-classes/api/online-classes-api";
import { formatDate } from "@/lib/formatters";
import { getAiAccessLabel, hasAiAccess } from "@/lib/ai/access";
import { usePermission } from "@/hooks/use-permission";
import { useAuth } from "@/providers/auth-provider";
import { GlobalCommandPalette } from "@/components/layout/global-command-palette";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/people": "People Directory",
  "/organizations": "Organizations",
  "/users": "Users Management",
  "/roles": "Roles Management",
  "/permissions": "Permissions Catalogue",
  "/students": "Students Operations",
  "/batches": "Batches & Classes",
  "/academic-sessions": "Years / Terms",
  "/subjects": "Subjects Catalogue",
  "/teachers": "Teachers Directory",
  "/batch-subject-assignments": "Batch Subject Mapping",
  "/timetables": "Timetable Planner",
  "/online-classes": "Online Classes",
  "/exams": "Exams Planner",
  "/assignments": "Assignments Workspace",
  "/exam-results": "Results & Report Cards",
  "/report-cards": "Report Cards",
  "/fee-plans": "Fee Plans",
  "/fees": "Fee Records",
  "/attendance": "Attendance Control",
  "/reminders": "Reminder Logs",
  "/mail": "Mail",
  "/reports": "Reports & Analytics",
  "/activity-logs": "Activity Logs",
  "/settings": "Settings",
  "/profile": "Profile",
  "/guide": "User Guide",
  "/onboarding": "Onboarding Hub",
  "/security": "Security",
  "/alerts": "Alerts",
};

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const canReadOnlineClasses = usePermission("online-classes.read");
  const alertsQuery = useQuery({
    queryKey: ["online-classes", "alerts", "header"],
    queryFn: onlineClassesApi.getAlerts,
    enabled: canReadOnlineClasses,
    refetchInterval: 60_000,
  });
  const title = pathname ? routeTitles[pathname] ?? "Education Management" : "Education Management";
  const alerts = alertsQuery.data ?? [];
  const aiReady = hasAiAccess(user);
  const aiLabel = getAiAccessLabel(user);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Secure workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="min-w-[280px] xl:w-[360px]">
            <GlobalCommandPalette />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-border/70 bg-card/70 shadow-sm">
              {user?.organizationName ?? "Global Console"}
            </Badge>
            {user?.organizationId ? (
              <Badge variant={aiReady ? "success" : "warning"} className="border-border/70 bg-card/70 shadow-sm">
                {aiReady ? aiLabel : "AI key missing"}
              </Badge>
            ) : null}
            <Badge variant="secondary" className="bg-muted/80 shadow-sm">
              {user?.roles.join(", ") ?? "Guest"}
            </Badge>
            {canReadOnlineClasses ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Alerts" className="relative border-border/70 bg-card/70 shadow-sm">
                    <Bell className="h-4 w-4" />
                    {alerts.length ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] text-white">
                        {alerts.length}
                      </span>
                    ) : null}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Alerts</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {alerts.length ? (
                      alerts.map((alert) => (
                        <div key={alert.id} className="rounded-2xl border border-border/70 bg-card p-4 text-sm shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{alert.title}</p>
                            <Badge variant={alert.severity === "HIGH" ? "danger" : alert.severity === "MEDIUM" ? "warning" : "outline"}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">{alert.description}</p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              {alert.scheduledAt ? formatDate(alert.scheduledAt, "MMM d, yyyy p") : "No schedule"}
                            </span>
                            <div className="flex gap-2">
                              {alert.sessionId ? (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href="/online-classes">Open class</Link>
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No active alerts.</p>
                    )}
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/alerts">Open alerts page</Link>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
            <Button variant="outline" asChild className="border-border/70 bg-card/70 shadow-sm">
              <Link href="/profile">{user?.firstName ?? "Account"}</Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout" className="shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
