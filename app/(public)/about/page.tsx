import Link from "next/link";
import { ArrowRight, Building2, ChartColumnBig, CreditCard, Layers3, ShieldCheck, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicModuleCatalog } from "@/lib/marketing/module-catalog";

export default function AboutPage() {
  return (
    <main className="container space-y-16 py-16">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <Badge>About EduFlow</Badge>
          <PageHeader
            eyebrow="Multi-tenant education operations"
            title="Built for institutions that need real control over data, users, workflows, and reporting."
            description="EduFlow is an education management SaaS product for schools, colleges, coaching centers, and academies that need one governed platform for student records, batch operations, fees, attendance, reminders, reports, and platform-wide administration."
          />
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/pricing">
                See pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Talk to the team</Link>
            </Button>
          </div>
        </div>
        <Card className="border-slate-200 bg-slate-950 text-slate-50">
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
              "Operational chart APIs for fees, attendance, reminders, students, and users",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Why it exists</p>
          <h2 className="text-3xl font-semibold tracking-tight">Most institutions are still running core operations across spreadsheets, chat messages, and disconnected staff habits.</h2>
          <p className="text-muted-foreground">
            EduFlow consolidates those workflows into one product where student operations, financial follow-up, attendance discipline, and reminder execution all sit inside the same governed system.
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
              description: "Reports and chart endpoints are built for management review, not just raw record listing.",
              icon: ChartColumnBig,
            },
            {
              title: "Controlled access model",
              description: "Users, roles, and permissions are part of the product foundation, not an afterthought.",
              icon: ShieldCheck,
            },
            {
              title: "Modular commercial model",
              description: "Institutions can activate the modules they need and scale gradually over time.",
              icon: Layers3,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Who the platform is for</CardTitle>
            <CardDescription>Designed for teams that need a working operations system, not a brochure dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Schools handling admissions, batches, attendance, fee collection, and guardian follow-up",
              "Colleges needing admin and staff separation with stronger reporting discipline",
              "Academies and coaching centers with recurring monthly collection workflows",
              "Education groups onboarding more than one institution onto a shared SaaS platform",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-muted/70 p-4 text-sm">
                <UsersRound className="mt-0.5 h-4 w-4 text-primary" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What the product covers</CardTitle>
            <CardDescription>All public-facing modules are listed here so buyers can see the full SaaS scope clearly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {publicModuleCatalog.map((item, index) => (
              <div key={item.key} className="flex items-start gap-4 rounded-xl border p-4">
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
        <Card>
          <CardHeader>
            <CardTitle>Commercial philosophy</CardTitle>
            <CardDescription>The pricing model stays simple enough for institutions to understand quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>The platform follows a modular pricing structure: <span className="font-semibold text-foreground">$1 per module per user</span>.</p>
            <p>This allows institutions to start small, enable only the modules they need, and expand without needing a full commercial redesign each time they grow.</p>
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
                <div key={item.label} className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 text-primary" />
                  <p>{item.label}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="bg-primary text-primary-foreground">
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
    </main>
  );
}
