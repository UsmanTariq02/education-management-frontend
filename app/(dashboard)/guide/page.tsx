"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  ScanSearch,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";
import { hasModule, hasRole } from "@/lib/permissions/access";

type GuideLink = {
  href: string;
  label: string;
  description: string;
};

const baseGuideLinks: GuideLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Use the dashboard first to understand fee collection, attendance health, reminders, and academic performance at a glance.",
  },
  {
    href: "/people",
    label: "People Directory",
    description: "Browse users, teachers, and students from one place without mixing their onboarding flows.",
  },
];

const moduleGuideMap: Record<string, GuideLink[]> = {
  USERS: [
    {
      href: "/users",
      label: "Users",
      description: "Create access-based accounts like admin, academic coordinator, and staff. Use this for dashboard access identities.",
    },
  ],
  STUDENTS: [
    {
      href: "/students",
      label: "Students",
      description: "Use this for admission intake, guardian details, and optional student or parent portal provisioning.",
    },
  ],
  BATCHES: [
    {
      href: "/batches",
      label: "Batches",
      description: "Manage class/batch structures before linking students, timetables, attendance, and exams.",
    },
  ],
  ACADEMICS: [
    {
      href: "/academic-sessions",
      label: "Academic Years / Terms",
      description: "Define school periods before planning subjects, exams, and academic reporting.",
    },
    {
      href: "/subjects",
      label: "Subjects",
      description: "Maintain subject catalogue and prepare it for batch mapping and exam papers.",
    },
    {
      href: "/teachers",
      label: "Teachers",
      description: "Create teacher profiles and optionally provision teacher dashboard login in the same flow.",
    },
    {
      href: "/batch-subject-assignments",
      label: "Assignments",
      description: "Map subjects to batches so timetable planning and exams have the right academic structure.",
    },
    {
      href: "/timetables",
      label: "Timetable",
      description: "Publish weekly schedules by batch, subject, teacher, room, and time slots.",
    },
    {
      href: "/exams",
      label: "Exams",
      description: "Plan exams and define exam papers so results entry becomes subject-aware and consistent.",
    },
    {
      href: "/exam-results",
      label: "Exam Results",
      description: "Record marks by exam paper, publish results, and use the built-in charts for grade and performance review.",
    },
    {
      href: "/report-cards",
      label: "Report Cards",
      description: "Review published academic performance in a more presentation-ready report-card workspace.",
    },
  ],
  FEES: [
    {
      href: "/fee-plans",
      label: "Fee Plans",
      description: "Define recurring fee structures before billing students.",
    },
    {
      href: "/fees",
      label: "Fees",
      description: "Track paid, partial, pending, and overdue cycles. Use report drill-downs to land here directly.",
    },
  ],
  ATTENDANCE: [
    {
      href: "/attendance",
      label: "Attendance",
      description: "Maintain daily attendance and monitor present, absent, late, and leave trends.",
    },
  ],
  REMINDERS: [
    {
      href: "/reminders",
      label: "Reminders",
      description: "Manage reminder templates, automation rules, and delivery history for fee and attendance follow-up.",
    },
  ],
  REPORTS: [
    {
      href: "/reports",
      label: "Reports",
      description: "Use finance and academic charts for month, quarter, year, collection comparisons, and performance trends.",
    },
  ],
  ACTIVITY_LOGS: [
    {
      href: "/activity-logs",
      label: "Activity Logs",
      description: "Review audit trails for operational changes inside the current organization.",
    },
  ],
  SETTINGS: [
    {
      href: "/settings",
      label: "Settings",
      description: "Organization admins can update tenant-level identity and provider settings from here.",
    },
  ],
};

const roleManuals = [
  {
    key: "SUPER_ADMIN",
    title: "Super admin manual",
    description: "Use the platform workspace to onboard organizations, set limits, enable modules, and manage global governance.",
    icon: ShieldCheck,
  },
  {
    key: "ADMIN",
    title: "Admin manual",
    description: "Run day-to-day school operations, onboard staff, manage students and teachers, and supervise finance and academic activity.",
    icon: Users,
  },
  {
    key: "ACADEMIC_COORDINATOR",
    title: "Academic coordinator manual",
    description: "Focus on periods, subjects, teacher planning, assignments, timetables, exams, and result publication quality.",
    icon: GraduationCap,
  },
  {
    key: "TEACHER",
    title: "Teacher manual",
      description: "Use the academic workspace to follow timetable, exams, results entry, and student academic progress.",
    icon: ClipboardCheck,
  },
  {
    key: "STAFF",
    title: "Staff manual",
    description: "Use operational modules that your organization has enabled, especially attendance, student follow-up, and read-focused workflows.",
    icon: CreditCard,
  },
];

export default function GuidePage() {
  const { user } = useAuth();
  const enabledModules = user?.roles.includes("SUPER_ADMIN")
    ? Object.keys(moduleGuideMap)
    : (user?.enabledModules ?? []);

  const visibleLinks = [
    ...baseGuideLinks,
    ...enabledModules.flatMap((module) => moduleGuideMap[module] ?? []),
  ];

  const visibleRoleManuals = roleManuals.filter((manual) => hasRole(user, manual.key));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="User guide"
        title="How to use this workspace"
        description="Role-aware guidance for the dashboard, with direct links to the modules available in your current organization."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        }
      />

      <div className="rounded-3xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Workspace manual</p>
            <h2 className="text-2xl font-semibold tracking-tight">Start here before using the platform</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              This manual explains which workspace to use for each kind of onboarding, where to find academic and finance controls, and how your current role should move through the system.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{user?.organizationName ?? "Platform"}</Badge>
            {(user?.roles ?? []).map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {visibleRoleManuals.map((manual) => {
          const Icon = manual.icon;
          return (
            <Card key={manual.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {manual.title}
                </CardTitle>
                <CardDescription>{manual.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {manual.key === "SUPER_ADMIN" ? (
                <p>
                    Start with <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/onboarding">Onboarding Hub</Link> for the full zero-to-hero setup flow, then review{" "}
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/organizations">Organizations</Link>,{" "}
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/roles">Roles</Link>,{" "}
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/permissions">Permissions</Link>, and{" "}
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/inquiries">Inquiries</Link> first.
                </p>
                ) : manual.key === "ADMIN" ? (
                  <p>
                    Open <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/onboarding">Onboarding Hub</Link> for the tenant rollout path, then use{" "}
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/students">Students</Link> for admissions and portal provisioning,{" "}
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/teachers">Teachers</Link> for teacher profiles, and{" "}
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/users">Users</Link> for dashboard access roles.
                  </p>
                ) : manual.key === "ACADEMIC_COORDINATOR" ? (
                  <p>
                    {"Follow the sequence: sessions -> subjects -> teachers -> assignments -> timetable -> exams -> results -> report cards."}
                  </p>
                ) : manual.key === "TEACHER" ? (
                  <p>
                    Focus on timetable, exam review, and marks entry. Published results and report cards become the student-facing academic output.
                  </p>
                ) : (
                  <p>
                    Operational workflows are usually read-focused. Use attendance, student follow-up, and reminders based on the permissions your organization assigned.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <LifeBuoy className="h-4 w-4" />
            </span>
            Recommended workflow
          </CardTitle>
          <CardDescription>Use the correct creation path so profiles and access stay clean.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <p className="font-medium text-foreground">Access roles</p>
            <p className="mt-2">Use the Users module for admin, academic coordinator, and staff onboarding. Open the Onboarding Hub first when you are rolling out a new tenant.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <p className="font-medium text-foreground">Teacher profiles</p>
            <p className="mt-2">Use the Teachers module so profile data stays academic-first, with optional teacher login in the same flow.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <p className="font-medium text-foreground">Student and parent access</p>
            <p className="mt-2">Use the Students module for admission intake, then optionally provision student and parent portal access there.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {visibleLinks.map((link) => (
          <Card key={link.href}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  {link.href === "/dashboard" ? <LayoutDashboard className="h-4 w-4 text-primary" /> : null}
                  {link.href === "/people" ? <ScanSearch className="h-4 w-4 text-primary" /> : null}
                  {link.href === "/settings" ? <Settings className="h-4 w-4 text-primary" /> : null}
                  {!["/dashboard", "/people", "/settings"].includes(link.href) ? <BookOpen className="h-4 w-4 text-primary" /> : null}
                  {link.label}
                </span>
                <Button asChild size="sm" variant="ghost">
                  <Link href={link.href}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {hasModule(user, "PORTALS") ? (
        <Card>
          <CardHeader>
            <CardTitle>Portal manuals</CardTitle>
            <CardDescription>Use these when provisioning student or parent access so end users know where to start.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/portal/student/guide">Student portal guide</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/portal/parent/guide">Parent portal guide</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
