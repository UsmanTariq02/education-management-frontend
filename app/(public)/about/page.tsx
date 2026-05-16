import Link from "next/link";
import { ArrowRight, Building2, ChartColumnBig, CreditCard, ShieldCheck, UsersRound, WandSparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicModuleCatalog, publicModuleCount } from "@/lib/marketing/module-catalog";

const trustPoints = [
  "Multi-tenant architecture for multiple schools or colleges",
  "Role and permission security for super admin, admin, and staff",
  `${publicModuleCount} public-facing modules covering governance, academics, finance, communication, automation, and documents`,
  "Chart-ready analytics for fees, attendance, reminders, student activity, and AI-assisted workflows",
  "CSV student import for faster implementation and migration",
];

export default function AboutPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.08),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_28%)]" />
      <div className="container relative space-y-16 py-16">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">About EduFlow</Badge>
            <PageHeader
              eyebrow="Multi-tenant education operations"
              title="Built for institutions that need real control over data, users, workflows, reporting, and AI automation."
              description="EduFlow is an education management SaaS product for schools, colleges, coaching centers, and academies that need one governed platform for student data, batch operations, fees, attendance, reminders, reports, AI-assisted workflows, and tenant-wide administration."
            />
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/pricing">
                  View pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Talk to the team</Link>
              </Button>
            </div>
          </div>
          <Card className="overflow-hidden border-slate-200 bg-slate-950 text-slate-50 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.85)] ring-1 ring-white/5">
            <CardHeader>
              <CardTitle>What makes the platform different</CardTitle>
              <CardDescription className="text-slate-300">
                This is designed as a serious SaaS foundation, not just a single-school admin panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                "Multi-organization onboarding with clear tenant isolation",
                "Super admin governance with organization-wide visibility",
                "Admin and staff access controlled by role and permission design",
                "Operational chart APIs for fees, attendance, reminders, students, users, and AI workflows",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-foreground shadow-sm">
                  {item}
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Built around</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trustPoints.map((point) => (
                    <span key={point} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Why it exists</p>
            <h2 className="text-3xl font-semibold tracking-tight">Most institutions are still running core operations across spreadsheets, chat messages, and disconnected staff habits.</h2>
            <p className="text-muted-foreground">
              EduFlow consolidates those workflows into one product where student operations, financial follow-up, attendance discipline, reminder execution, and AI-assisted drafting all sit inside the same governed system.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Organization-aware by design",
                description: "Each institution is isolated by tenant, while super admin can review the full platform.",
                icon: Building2,
              },
              {
                title: "Operational reporting",
                description: "Reports and chart endpoints are built for management review, not just raw table listing.",
                icon: ChartColumnBig,
              },
              {
                title: "Controlled access model",
                description: "Users, roles, and permissions are part of the product foundation, not an afterthought.",
                icon: ShieldCheck,
              },
              {
                title: "Guardrailed automation",
                description: "AI drafts notices, support replies, and admissions extracts, but approvals stay with the team.",
                icon: WandSparkles,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border/70 bg-card/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,_rgba(251,191,36,0.08)_0%,_rgba(14,165,233,0.06)_100%)] p-8 shadow-sm backdrop-blur">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              "Administration and academics should not live in disconnected tools.",
              "Parents and students should not depend on informal follow-up for visibility.",
              "Management should not have to wait for manual reporting to understand operations.",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Why it matters {index + 1}</p>
                <p className="mt-3 text-lg font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/85 p-8 shadow-sm backdrop-blur">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              "AI-generated drafts are reviewable before they move into notices, mail, or support follow-up.",
              "Admission extraction turns raw form text into structured student data with missing-field visibility.",
              "Automation is a workflow accelerator, not a replacement for staff approval or operational oversight.",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">AI principle {index + 1}</p>
                <p className="mt-3 text-lg font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Who the platform is for</CardTitle>
            <CardDescription>Designed for teams that need a working operations system, not a brochure dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "School owners and principals who need one place for admissions, batches, attendance, fees, reminders, and reporting instead of scattered spreadsheets and chat follow-ups.",
              "College administrators who need stronger role separation, auditability, and clearer control over academic and financial operations.",
              "Academies and coaching centers with recurring monthly fee collection, fast attendance checks, and parent communication that has to stay consistent.",
              "Education groups and multi-campus operators that need shared governance across more than one institution without losing tenant isolation.",
              "Operations teams that want AI drafts for notices, mail replies, support answers, or admission extraction, but still want staff approval before anything is published.",
              "Implementation teams that care about rollout speed, because the platform can start with core modules first and expand into automation later.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/70 p-4 text-sm shadow-sm">
                <UsersRound className="mt-0.5 h-4 w-4 text-primary" />
                <p>{item}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">In short</p>
              <p className="mt-2">
                The platform fits institutions that want governance, finance discipline, academic workflows, and AI-assisted execution in one controlled product, with the flexibility to activate only the pieces they need.
              </p>
            </div>
          </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>What the product covers</CardTitle>
            <CardDescription>All public-facing modules are listed here so buyers can see the full SaaS scope clearly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {publicModuleCatalog.map((item, index) => (
              <div key={item.key} className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Commercial philosophy</CardTitle>
            <CardDescription>The pricing model stays simple enough for institutions to understand quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>The platform follows a modular pricing structure: <span className="font-semibold text-foreground">$1 per module per user</span>.</p>
            <p>This allows institutions to start small, enable only the modules they need, and expand without needing a full commercial redesign each time they grow.</p>
            <p>AI automation follows the same idea: institutions can activate it only when they want draft generation, admission extraction, or support workflows inside the same governed product.</p>
            <p>That structure also makes demos and procurement conversations easier, because the pricing logic is straightforward and defensible.</p>
          </CardContent>
          </Card>
          <Card>
          <CardHeader>
            <CardTitle>Why teams choose it</CardTitle>
            <CardDescription>Decision makers usually care about governance, reporting, and operational clarity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: CreditCard, label: "Finance teams want cleaner collection tracking and overdue visibility." },
              { icon: ShieldCheck, label: "Leadership wants controlled access and auditability." },
              { icon: ChartColumnBig, label: "Management wants charts and summaries that are ready for review meetings." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                  <Icon className="mt-0.5 h-4 w-4 text-primary" />
                  <p>{item.label}</p>
                </div>
              );
            })}
          </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-primary text-primary-foreground shadow-[0_25px_80px_-40px_rgba(14,165,233,0.6)]">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/70">Next step</p>
              <h2 className="text-3xl font-semibold">If your institution needs one platform for governance, operations, and reporting, this is the right point to move away from scattered tools.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/contact">Request a walkthrough</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/pricing">Review pricing</Link>
              </Button>
            </div>
          </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
