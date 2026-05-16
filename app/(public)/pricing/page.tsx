import Link from "next/link";
import { ArrowRight, Calculator, Check, Layers3, Users2, WandSparkles } from "lucide-react";
import { PricingCalculator } from "@/components/marketing/pricing-calculator";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicModuleCatalog, publicModuleCount } from "@/lib/marketing/module-catalog";

const pricingExamples = [
  {
    title: "Small school",
    users: 12,
    modules: 4,
    monthly: 48,
    description: "12 active users using 4 modules",
    modulesUsed: ["Student records", "Fee plans and collections", "Attendance", "Reports and analytics"],
    aiEnabled: false,
  },
  {
    title: "Growing academy",
    users: 25,
    modules: 8,
    monthly: 200,
    description: "25 active users using 8 modules",
    modulesUsed: ["Students", "Batches", "Academics", "Fees", "Attendance", "Reminders", "Mail", "Reports"],
    aiEnabled: true,
  },
  {
    title: "Operational college team",
    users: 40,
    modules: publicModuleCount,
    monthly: 40 * publicModuleCount,
    description: `40 active users using all ${publicModuleCount} modules`,
    modulesUsed: ["Users", "Students", "Portals", "Academics", "Fees", "Attendance", "Reminders", "Mail", "AI automation", "Reports", "Activity logs", "Settings", "Media"],
    aiEnabled: true,
  },
  {
    title: "Multi-campus group",
    users: 60,
    modules: publicModuleCount - 2,
    monthly: 60 * (publicModuleCount - 2),
    description: "60 active users across multiple campuses with most modules active",
    modulesUsed: ["Users", "Students", "Portals", "Batches", "Academics", "Fees", "Attendance", "AI automation", "Reports", "Activity logs", "Settings"],
    aiEnabled: true,
  },
];

export default function PricingPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_28%)]" />
      <div className="container relative space-y-16 py-16">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">Pricing</Badge>
            <PageHeader
              eyebrow="Simple commercial model"
              title={`$1 per module per user across ${publicModuleCount} modules. Clear, modular, and easy to explain.`}
              description="You only pay for the modules your institution uses and the users who need access. The pricing model is designed to stay predictable as schools, colleges, and academies grow, including AI-assisted automation when that module is activated."
            />
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">
                  Discuss pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/about">See product overview</Link>
              </Button>
            </div>
          </div>
          <Card className="overflow-hidden border-emerald-200 bg-[linear-gradient(135deg,_rgba(236,253,245,1)_0%,_rgba(240,253,250,1)_55%,_rgba(255,255,255,1)_100%)] shadow-[0_25px_80px_-45px_rgba(16,185,129,0.45)] ring-1 ring-emerald-200/40">
          <CardHeader>
            <CardTitle>Pricing formula</CardTitle>
            <CardDescription>Use one simple calculation for monthly software cost, including AI automation where needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-background/80 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-700">Formula</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">Users x Modules x $1</p>
              <p className="mt-2 text-sm text-muted-foreground">Example: 20 users x 5 modules = $100 / month</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                <Users2 className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">User-based</p>
                <p className="mt-1 text-xs text-muted-foreground">Pay for real operational users only.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                <Layers3 className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">Module-based</p>
                <p className="mt-1 text-xs text-muted-foreground">Enable only the modules you need.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                <WandSparkles className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">AI-ready</p>
                <p className="mt-1 text-xs text-muted-foreground">Drafts and extractions stay inside the same module logic.</p>
              </div>
            </div>
          </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Available modules</CardTitle>
            <CardDescription>Select the operational areas your institution wants to activate across the full EduFlow product surface.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {publicModuleCatalog.map((item) => (
              <div key={item.key} className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm shadow-sm">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                <p className="mt-3 font-medium">{item.title}</p>
                <p className="mt-1 text-muted-foreground">{item.description}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm shadow-sm md:col-span-2">
              <div className="flex items-start gap-3">
                <WandSparkles className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">AI automation is part of the module list</p>
                  <p className="mt-1 text-muted-foreground">
                    It covers notice drafts, mail drafts, support replies, admission extraction, fee collection planning, attendance intervention, and reminder drafting with review gates.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          </Card>
          <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Illustrative pricing scenarios</CardTitle>
            <CardDescription>These examples make the pricing model easy to communicate to stakeholders and show how AI automation fits into different rollout sizes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.1),_transparent_28%),transparent]">
            {pricingExamples.map((example) => (
              <div key={example.title} className="rounded-2xl border border-border/70 bg-muted/30 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{example.title}</p>
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                  </div>
                  <p className="text-3xl font-semibold">${example.monthly}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-background p-3 text-sm shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Users</p>
                    <p className="mt-1 font-semibold">{example.users}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background p-3 text-sm shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Modules</p>
                    <p className="mt-1 font-semibold">{example.modules}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background p-3 text-sm shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Calculation</p>
                    <p className="mt-1 font-semibold">
                      {example.users} x {example.modules} x $1
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-2xl border border-border/70 bg-background p-4 text-sm shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Module mix</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {example.modulesUsed.map((module) => (
                        <span key={module} className="rounded-full border border-border/70 bg-muted px-3 py-1 text-xs font-medium">
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background p-4 text-sm shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">AI automation</p>
                    <p className="mt-2 font-medium text-foreground">{example.aiEnabled ? "Included in the workflow scope" : "Not required for this rollout"}</p>
                    <p className="mt-1 text-muted-foreground">
                      {example.aiEnabled
                        ? "Approvals stay with staff, while drafts and extraction help speed up operations."
                        : "A lighter rollout can stay focused on core administration first."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          </Card>
        </section>

        <PricingCalculator />

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "AI draft workflows",
              description: "Notice, support, and reminder drafts are generated before staff review and publish them.",
            },
            {
              title: "Admission extraction",
              description: "Scanned or pasted admission details can be turned into structured student records faster.",
            },
            {
              title: "Governed automation",
              description: "Automation stays inside the same tenant, permission, and approval model as the rest of the platform.",
            },
          ].map((item) => (
            <Card key={item.title} className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle>What is included</CardTitle>
            <CardDescription>The module charge is for software access, governance, reporting support, and any AI-assisted workflows you choose to activate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Every active module runs inside the same tenant-aware platform, with organization scoping, authentication, authorization, reporting, and structured audit logging built into the product.</p>
            <p>Institutions can start with a smaller operational footprint and expand gradually by enabling more modules and more users over time.</p>
            <p>The model works well for small schools, coaching centers, colleges, and group operators who need predictable SaaS pricing.</p>
          </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Typical questions</CardTitle>
            <CardDescription>Common commercial clarifications during demos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Do we pay only for users who actively need access? Yes.",
              "Can we start with only students, fees, attendance, and reports? Yes.",
              "Can more modules be added later without changing the platform? Yes.",
              "Are academic workflows, portals, settings, documents, and audit history available as separate modules? Yes.",
              "Is AI automation optional and reviewable? Yes, it stays behind the same workflow controls.",
              "Can pricing scale across multiple organizations or campuses? Yes, the model is tenant-friendly.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                <Calculator className="mt-0.5 h-4 w-4 text-primary" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-primary text-primary-foreground shadow-[0_25px_80px_-40px_rgba(14,165,233,0.6)]">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/70">Commercial next step</p>
              <h2 className="text-3xl font-semibold">Share your expected user count and required modules, and we can give a precise monthly estimate immediately.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/contact">Get exact estimate</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/about">See platform context</Link>
              </Button>
            </div>
          </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
