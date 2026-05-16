"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Logs,
  Mailbox,
  Search,
  Settings,
  ShieldCheck,
  TableProperties,
  Trophy,
  FileQuestion,
  ClipboardCheck,
  ClipboardPenLine,
  UserRound,
  Users,
  UserSquare2,
  Waypoints,
  Bell,
  Video,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { hasAnyPermission, hasModule, hasRole } from "@/lib/permissions/access";
import type { OrganizationModule } from "@/types/auth";
import { cn } from "@/lib/utils";

type CommandItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  module?: OrganizationModule;
  roles?: string[];
  access?: (user: ReturnType<typeof useAuth>["user"]) => boolean;
  tone?: "sky" | "emerald" | "violet" | "amber" | "rose";
};

const commandItems: CommandItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Open the operational overview", icon: LayoutDashboard, permissions: ["reports.read"], module: "REPORTS", tone: "sky" },
  { href: "/people", label: "People", description: "Search across users, students, and teachers", icon: Search, permissions: ["users.read", "teachers.read", "students.read"], tone: "emerald" },
  { href: "/users", label: "Users", description: "Manage staff and internal access", icon: Users, permissions: ["users.read"], module: "USERS", tone: "violet" },
  { href: "/students", label: "Students", description: "Admissions, guardians, and portal setup", icon: UserSquare2, permissions: ["students.read"], module: "STUDENTS", tone: "emerald" },
  { href: "/batches", label: "Batches", description: "Classes and enrollment groups", icon: BookOpen, permissions: ["batches.read"], module: "BATCHES", tone: "amber" },
  { href: "/fees", label: "Fees", description: "Fee records and collection status", icon: CreditCard, permissions: ["fees.read"], module: "FEES", tone: "amber" },
  { href: "/fee-plans", label: "Fee Plans", description: "Define fee structures and collections", icon: Landmark, permissions: ["fees.read"], module: "FEES", tone: "amber" },
  { href: "/attendance", label: "Attendance", description: "Track presence and absences", icon: BarChart3, permissions: ["attendance.read"], module: "ATTENDANCE", tone: "sky" },
  { href: "/reminders", label: "Reminders", description: "Templates, rules, and delivery logs", icon: Bell, permissions: ["reminders.read"], module: "REMINDERS", tone: "rose" },
  { href: "/academic-sessions", label: "Years / Terms", description: "Manage academic years and terms", icon: GraduationCap, permissions: ["academic-sessions.read"], module: "ACADEMICS", tone: "violet" },
  { href: "/subjects", label: "Subjects", description: "Maintain the subject catalogue", icon: BookOpen, permissions: ["subjects.read"], module: "ACADEMICS", tone: "violet" },
  { href: "/teachers", label: "Teachers", description: "Staff records and access", icon: UserRound, permissions: ["teachers.read"], module: "ACADEMICS", tone: "emerald" },
  { href: "/batch-subject-assignments", label: "Subject Mapping", description: "Assign subjects to batches", icon: Waypoints, permissions: ["batch-subject-assignments.read"], module: "ACADEMICS", tone: "violet" },
  { href: "/timetables", label: "Timetable", description: "Plan schedules and class slots", icon: TableProperties, permissions: ["timetables.read"], module: "ACADEMICS", tone: "sky" },
  { href: "/online-classes", label: "Online Classes", description: "Live sessions and recordings", icon: Video, permissions: ["online-classes.read"], module: "ACADEMICS", tone: "sky" },
  { href: "/exams", label: "Exams", description: "Build and schedule exams", icon: Trophy, permissions: ["exams.read"], module: "ACADEMICS", tone: "amber" },
  { href: "/assignments", label: "Assignments", description: "Manage assignments and submissions", icon: ClipboardCheck, permissions: ["assignments.read"], module: "ACADEMICS", tone: "emerald" },
  { href: "/assessments", label: "Assessments", description: "Create quizzes and tests", icon: FileQuestion, permissions: ["assessments.read"], module: "ACADEMICS", tone: "violet" },
  { href: "/exam-results", label: "Results", description: "Publish result sheets and averages", icon: ClipboardPenLine, permissions: ["exam-results.read"], module: "ACADEMICS", tone: "amber" },
  { href: "/alerts", label: "Alerts", description: "Monitor operational and security alerts", icon: Mailbox, permissions: ["online-classes.read"], module: "ACADEMICS", tone: "rose" },
  { href: "/activity-logs", label: "Activity Logs", description: "Audit user and system actions", icon: Logs, permissions: ["activity-logs.read"], module: "ACTIVITY_LOGS", tone: "sky" },
  { href: "/ai", label: "AI Lab", description: "Draft notices, replies, support answers, and admission extraction", icon: Sparkles, permissions: ["ai.use"], tone: "emerald" },
  { href: "/ai/admin", label: "AI Admin", description: "Monitor queue pressure and AI usage across a tenant", icon: BarChart3, permissions: ["ai.use"], roles: ["SUPER_ADMIN"], tone: "sky" },
  {
    href: "/settings",
    label: "Settings",
    description: "Organization configuration and billing",
    icon: Settings,
    permissions: [],
    access: (user) => hasRole(user, "ADMIN") && hasModule(user, "SETTINGS"),
    tone: "violet",
  },
  { href: "/organizations", label: "Organizations", description: "Platform tenant management", icon: Landmark, permissions: ["users.read"], roles: ["SUPER_ADMIN"], tone: "violet" },
  { href: "/roles", label: "Roles", description: "Permission templates and access control", icon: ShieldCheck, permissions: ["users.read"], roles: ["SUPER_ADMIN"], tone: "violet" },
];

export function GlobalCommandPalette() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  const accessibleItems = useMemo(
    () =>
      commandItems.filter((item) => {
        if (item.access) {
          return item.access(user);
        }

        if (item.roles && !item.roles.some((role) => hasRole(user, role))) {
          return false;
        }

        if (item.module && !hasModule(user, item.module)) {
          return false;
        }

        return hasAnyPermission(user, item.permissions);
      }),
    [user],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return accessibleItems;
    }

    return accessibleItems.filter((item) =>
      [item.label, item.description].some((field) => field.toLowerCase().includes(normalizedQuery)),
    );
  }, [accessibleItems, query]);

  const navigateTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-2.5 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-card"
          aria-label="Open command palette"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Search or jump to a page
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="rounded-md border bg-background px-1.5 py-0.5">Ctrl</span>
            <span className="rounded-md border bg-background px-1.5 py-0.5">K</span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>Search modules, settings, and operational pages you can access.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type to filter pages..."
            className="h-12"
          />
          <div className="grid gap-3">
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigateTo(item.href)}
                    className={cn(
                      "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/60",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-xl border bg-background p-2">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {item.href}
                    </Badge>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                No pages match your search.
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">Ctrl+K</Badge>
            <span>Open from anywhere in the workspace.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
