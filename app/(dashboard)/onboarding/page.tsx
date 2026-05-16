"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { useAuth } from "@/providers/auth-provider";
import { hasRole } from "@/lib/permissions/access";

type StepLink = {
  href: string;
  label: string;
  description: string;
};

type StepBlock = {
  title: string;
  description: string;
  scope: string;
  accent: "sky" | "emerald" | "violet" | "amber" | "rose";
  icon: React.ComponentType<{ className?: string }>;
  links: StepLink[];
  superAdminOnly?: boolean;
};

const setupSteps: StepBlock[] = [
  {
    title: "Platform onboarding",
    description: "Create the organization, set subscription limits, and define who can manage the tenant.",
    scope: "Super admin only",
    accent: "violet",
    icon: Building2,
    superAdminOnly: true,
    links: [
      { href: "/organizations", label: "Organizations", description: "Create the tenant and control limits." },
      { href: "/roles", label: "Roles", description: "Shape role templates before rollout." },
      { href: "/permissions", label: "Permissions", description: "Review access scope by module." },
      { href: "/inquiries", label: "Inquiries", description: "Track the sales and onboarding pipeline." },
    ],
  },
  {
    title: "Tenant identity and settings",
    description: "Confirm school identity, contact details, reminder channels, and AI configuration.",
    scope: "Admins and super admin",
    accent: "sky",
    icon: Settings,
    links: [
      { href: "/settings", label: "Settings", description: "Update organization profile and providers." },
      { href: "/profile", label: "Profile", description: "Keep operator contact details current." },
    ],
  },
  {
    title: "User and staff access",
    description: "Create staff accounts first so dashboard access is ready before operational data goes live.",
    scope: "Admins and super admin",
    accent: "emerald",
    icon: Users,
    links: [
      { href: "/users", label: "Users", description: "Onboard admins, coordinators, and staff." },
      { href: "/teachers", label: "Teachers", description: "Create teacher profiles and optional logins." },
    ],
  },
  {
    title: "Admissions and class structure",
    description: "Bring in students, link guardians, and prepare batches before the academic timetable starts.",
    scope: "Admins and super admin",
    accent: "amber",
    icon: BookOpen,
    links: [
      { href: "/students", label: "Students", description: "Admission intake and portal provisioning." },
      { href: "/batches", label: "Batches", description: "Define classes, sections, and groupings." },
    ],
  },
  {
    title: "Academic planning",
    description: "Lock the academic calendar, subject map, timetable, and exam workflow before publishing results.",
    scope: "Admins and super admin",
    accent: "sky",
    icon: GraduationCap,
    links: [
      { href: "/academic-sessions", label: "Years / Terms", description: "Define the school calendar." },
      { href: "/subjects", label: "Subjects", description: "Build the subject catalogue." },
      { href: "/batch-subject-assignments", label: "Subject Mapping", description: "Map subjects to batches." },
      { href: "/timetables", label: "Timetable", description: "Publish weekly class schedules." },
      { href: "/exams", label: "Exams", description: "Plan assessments and exam papers." },
      { href: "/exam-results", label: "Results", description: "Record and publish marks." },
      { href: "/report-cards", label: "Report Cards", description: "Review presentation-ready academic outputs." },
    ],
  },
  {
    title: "Finance and follow-up",
    description: "Set fee plans, monitor dues, and activate automated reminders before the first billing cycle.",
    scope: "Admins and super admin",
    accent: "rose",
    icon: CreditCard,
    links: [
      { href: "/fee-plans", label: "Fee Plans", description: "Define recurring fee structures." },
      { href: "/fees", label: "Fees", description: "Track paid, partial, and overdue cycles." },
      { href: "/reminders", label: "Reminders", description: "Configure collection and follow-up automation." },
    ],
  },
  {
    title: "Daily operations",
    description: "Run attendance, announcements, messaging, and reporting from the same workspace.",
    scope: "Admins and super admin",
    accent: "emerald",
    icon: ClipboardCheck,
    links: [
      { href: "/attendance", label: "Attendance", description: "Mark and import attendance in bulk." },
      { href: "/mail", label: "Mail", description: "Draft notices and bulk messages." },
      { href: "/reports", label: "Reports", description: "Monitor the daily operating picture." },
      { href: "/activity-logs", label: "Activity Logs", description: "Review audit trails and changes." },
    ],
  },
  {
    title: "Parent and student rollout",
    description: "Enable portal access only after the academic and finance data is ready.",
    scope: "Admins and super admin",
    accent: "violet",
    icon: ShieldCheck,
    links: [
      { href: "/portal/parent/guide", label: "Parent portal guide", description: "Help guardians get started." },
      { href: "/portal/student/guide", label: "Student portal guide", description: "Help students find their workspace." },
      { href: "/portal/parent", label: "Parent portal", description: "Check the parent experience." },
      { href: "/portal/student", label: "Student portal", description: "Check the student experience." },
    ],
  },
  {
    title: "AI automation",
    description: "Use the AI lab for drafts, queue review, analytics, and scheduled notice campaigns.",
    scope: "Admins and super admin",
    accent: "sky",
    icon: Sparkles,
    links: [
      { href: "/ai", label: "AI Lab", description: "Draft notices, replies, and automation outputs." },
      { href: "/ai/queue", label: "AI Queue", description: "Review and approve generated drafts." },
      { href: "/ai/admin", label: "AI Admin", description: "Monitor AI usage and queue pressure." },
    ],
  },
];

const quickLinks: StepLink[] = [
  { href: "/dashboard", label: "Overview", description: "See the current operating health." },
  { href: "/guide", label: "Workspace guide", description: "Read the role-based manual." },
];

function StepCard({ step }: { step: StepBlock }) {
  const Icon = step.icon;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-4">
          <span className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span>{step.title}</span>
          </span>
          <Badge variant={step.accent === "violet" ? "secondary" : step.accent === "amber" ? "warning" : "outline"}>{step.scope}</Badge>
        </CardTitle>
        <CardDescription>{step.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {step.links.map((link) => (
            <div key={link.href} className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm">
              <p className="font-medium">{link.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
              <Button asChild size="sm" variant="ghost" className="mt-3 px-0 text-primary hover:bg-transparent">
                <Link href={link.href}>
                  Open
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const isSuperAdmin = hasRole(user, "SUPER_ADMIN");
  const isAdmin = hasRole(user, "ADMIN");
  const canAccess = isSuperAdmin || isAdmin;

  const visibleSteps = setupSteps.filter((step) => !step.superAdminOnly || isSuperAdmin);

  if (!canAccess) {
    return <ErrorState title="Access restricted" description="This onboarding hub is available to super admin and organization admins only." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding hub"
        title="Zero to hero setup flow"
        description="Follow this role-aware sequence to launch a fresh organization, prepare staff access, publish portal access, and turn on automation without skipping the essentials."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/guide">Open guide</Link>
            </Button>
            <Button asChild>
              <Link href={isSuperAdmin ? "/organizations" : "/settings"}>
                {isSuperAdmin ? "Start with organization" : "Open organization settings"}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
          <CardContent className="space-y-5 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/10 text-white hover:bg-white/15">{isSuperAdmin ? "Super admin path enabled" : "Tenant admin path"}</Badge>
              <Badge className="bg-white/10 text-white hover:bg-white/15">{user?.organizationName ?? "Platform scope"}</Badge>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Launch sequence</p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Build the tenant, provision the team, then switch on the school.
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                This page gives super admins the full organization onboarding runway. Tenant admins get the operational rollout path only, so platform setup stays clean and isolated.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Step 1</p>
                <p className="mt-2 font-medium">Create and govern</p>
                <p className="mt-1 text-sm text-slate-300">Only super admin handles tenant creation, limits, and role templates.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Step 2</p>
                <p className="mt-2 font-medium">Populate operations</p>
                <p className="mt-1 text-sm text-slate-300">Admins add users, students, batches, subjects, fees, and attendance rules.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Step 3</p>
                <p className="mt-2 font-medium">Publish portals</p>
                <p className="mt-1 text-sm text-slate-300">Portal access and AI automation go live after the operational data is ready.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                Quick start
              </CardTitle>
              <CardDescription>Open the first page in the flow depending on your role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickLinks.map((link) => (
                <div key={link.href} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div>
                    <p className="font-medium">{link.label}</p>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={link.href}>Open</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="rounded-2xl bg-primary/10 p-2 text-primary">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                Role scope
              </CardTitle>
              <CardDescription>Use the correct path so organization setup stays separate from tenant operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                {isSuperAdmin
                  ? "Super admin can create organizations, set global limits, and seed governance before tenant admins take over."
                  : "Tenant admins should focus on operational setup inside the current organization. Organization creation and platform governance stay outside this page."}
              </p>
              <div className="flex flex-wrap gap-2">
                {(user?.roles ?? []).map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4">
        {visibleSteps.map((step) => (
          <StepCard key={step.title} step={step} />
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary/10 p-2 text-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
            Final go-live checklist
          </CardTitle>
          <CardDescription>Use this before handing the workspace to the school team.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Access", detail: "Admins, staff, and teacher logins are working." },
            { title: "Admissions", detail: "Students and guardians are imported and linked." },
            { title: "Academics", detail: "Batches, subjects, timetable, exams, and results are ready." },
            { title: "Operations", detail: "Fees, attendance, reminders, and reports are active." },
            { title: "Portals", detail: "Parent and student portal access has been tested." },
            { title: "AI", detail: "Draft approvals, usage limits, and automation are configured." },
            { title: "Audit", detail: "Logs and governance checks are in place." },
            { title: "Launch", detail: "The dashboard reflects a stable tenant state." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
