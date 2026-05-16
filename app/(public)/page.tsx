import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  ChartNoAxesCombined,
  CheckCircle2,
  CreditCard,
  Layers3,
  Quote,
  ShieldCheck,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingLoader } from "@/components/feedback/landing-loader";
import { publicModuleCatalog, publicModuleCount } from "@/lib/marketing/module-catalog";

const features = [
  {
    title: "Fee tracking built for operations",
    description: "Track pending, partial, paid, and overdue tuition with practical collections workflows and reminders.",
    icon: CreditCard,
  },
  {
    title: "Attendance visibility by class and student",
    description: "Monitor present, absent, late, and leave trends with daily operational controls instead of vanity widgets.",
    icon: BookOpenCheck,
  },
  {
    title: "AI automation with guardrails",
    description: "Generate notices, mail drafts, support replies, and admission extraction suggestions before a human approves them.",
    icon: WandSparkles,
  },
  {
    title: "Role-based access control",
    description: "Keep super admin, admin, and staff access clean with permission-aware modules, routes, and actions.",
    icon: ShieldCheck,
  },
  {
    title: "Reporting that supports decisions",
    description: "Give school owners batch-wise collection, attendance, reminder, and AI workflow views that map to real operations.",
    icon: ChartNoAxesCombined,
  },
];

const trustPoints = [
  "Multi-tenant architecture for multiple schools or colleges",
  "Role and permission security for super admin, admin, and staff",
  `${publicModuleCount} public-facing modules covering governance, academics, finance, communication, automation, and documents`,
  "Chart-ready analytics for fees, attendance, reminders, student activity, and AI-assisted workflows",
  "CSV student import for faster implementation and migration",
];

const faqItems = [
  {
    question: "Can one super admin manage multiple institutions?",
    answer: "Yes. The platform is designed for multi-tenant onboarding, so super admin can oversee multiple organizations while admins and staff stay scoped to their own tenant.",
  },
  {
    question: "How is pricing calculated?",
    answer: "Pricing is based on a simple formula: $1 per module per user. Institutions can start with only the modules they need and scale over time.",
  },
  {
    question: "Can existing student data be migrated?",
    answer: "Yes. The product supports CSV student import with validation and duplicate avoidance to make onboarding cleaner.",
  },
];

const deploymentFits = [
  "Private schools",
  "Colleges",
  "Coaching centers",
  "Academies",
  "Training institutes",
  "Education groups",
];

export default function LandingPage() {
  return (
    <LandingLoader>
      <main className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.08),_transparent_24%),linear-gradient(180deg,_hsl(var(--background))_0%,_hsl(var(--muted)/0.32)_100%)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[32rem] before:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_65%)] before:content-['']">
      <section className="container relative grid gap-10 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10">Built for schools, academies, and institutes</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">
              Run education operations, academics, portals, and AI automation from one system.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              EduFlow unifies student data, fee operations, attendance, teachers, timetables, exams, portals, online classes, reporting, and guarded AI workflows in one operational platform.
              The AI layer reduces repetitive admin work so teams can stay leaner without losing control.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                Open dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Common deployments</p>
            <div className="flex flex-wrap gap-2">
              {deploymentFits.map((item) => (
                <span key={item} className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/70 bg-card/85 shadow-sm shadow-slate-900/5 backdrop-blur">
              <CardContent className="p-5">
                <p className="text-3xl font-semibold">{publicModuleCount}</p>
                <p className="text-sm text-muted-foreground">Public modules across the platform surface</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/85 shadow-sm shadow-slate-900/5 backdrop-blur">
              <CardContent className="p-5">
                <p className="text-3xl font-semibold">AI</p>
                <p className="text-sm text-muted-foreground">Draft notices, support replies, and admission extracts so staff spend less time on repetitive work</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/85 shadow-sm shadow-slate-900/5 backdrop-blur">
              <CardContent className="p-5">
                <p className="text-3xl font-semibold">RBAC</p>
                <p className="text-sm text-muted-foreground">Permission-aware navigation and actions</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute -right-10 top-6 h-28 w-28 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-8 h-24 w-24 rounded-full bg-amber-400/15 blur-3xl" />

          <Card className="overflow-hidden border-slate-200 bg-slate-950 text-slate-50 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.85)] ring-1 ring-white/5">
            <CardContent className="p-6">
              <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.82)_100%)] p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.9)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Platform surface</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">One workspace for operations and control</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                      Track finances, attendance, portals, and AI workflows in a single governed system. The visual on the right acts like a product preview, not a second dashboard.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
                    Live preview
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Current view</p>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-300">Operational pulse</p>
                        <p className="mt-2 text-4xl font-semibold text-white">24/7</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-right">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Modules active</p>
                        <p className="mt-1 text-2xl font-semibold text-sky-300">{publicModuleCount}</p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      {[
                        { label: "Fees", value: "Collected", tone: "bg-sky-400/80", width: "w-[84%]" },
                        { label: "Attendance", value: "Tracked", tone: "bg-emerald-400/80", width: "w-[68%]" },
                        { label: "AI", value: "Guardrailed", tone: "bg-amber-300/80", width: "w-[58%]" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                              <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                            </div>
                            <span className={`h-2.5 rounded-full ${item.tone} ${item.width}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-6">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Today&apos;s focus</p>
                      <p className="mt-2 text-lg font-semibold text-white">A cleaner way to move work forward.</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Keep the team aligned on fees, attendance, and approvals without jumping between disconnected tools.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["Collections", "Attendance", "AI queue"].map((chip) => (
                          <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-4 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur md:grid-cols-4">
          {[
            { title: "Academic operations", detail: "Teachers, subjects, timetables, exams, and results in one flow." },
            { title: "Parent connectivity", detail: "Student and parent portals with fees, attendance, reminders, and results." },
            { title: "AI automation", detail: "Notices, support replies, admissions, and interventions are drafted with human approval so staff do less manual writing." },
            { title: "Governed SaaS", detail: "Multi-tenant controls, modules, limits, and permission-aware access." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border bg-background/70 p-4">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Platform coverage</p>
          <h2 className="text-3xl font-semibold tracking-tight">A practical product surface for education teams</h2>
          <p className="text-muted-foreground">
            The product is designed around operational tables, auditability, role-aware workflows, and AI-assisted automation that cuts repetitive admin load rather than decorative dashboards.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.08),_transparent_30%)] opacity-0 transition group-hover:opacity-100" />
                <CardHeader className="relative">
                  <div className="mb-4 inline-flex rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl tracking-tight">{feature.title}</CardTitle>
                  <CardDescription className="mt-2 leading-6">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Full module catalog</p>
          <h2 className="text-3xl font-semibold tracking-tight">All {publicModuleCount} modules available for public SaaS positioning</h2>
          <p className="text-muted-foreground">
            Buyers should be able to see the full product scope immediately, from governance and admissions to academics, finance, portals, reporting, and auditability.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {publicModuleCatalog.map((module) => (
            <Card
              key={module.key}
              className="group relative overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-amber-300 to-emerald-400 opacity-70" />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex rounded-full border border-border/70 bg-background/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Module
                </div>
                <CardTitle className="text-xl tracking-tight">{module.title}</CardTitle>
                <CardDescription className="leading-6">{module.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-2">
        <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300" />
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Attendance and reporting</CardTitle>
            <CardDescription className="leading-6">Use cohort-level trends, attendance distribution, and recent exceptions to take action quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Daily attendance entry with present, absent, late, and leave statuses",
              "Recent attendance ledger for fast review",
              "Batch-wise attendance summaries for reporting",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                  <UsersRound className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-300 to-rose-300" />
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Fee reminders that close operational gaps</CardTitle>
            <CardDescription className="leading-6">Track reminder channel, message, delivery status, and fee linkage from one place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "SMS, WhatsApp, email, and manual reminders in a unified history",
              "Overdue fee follow-ups tied to actual fee ledger entries",
              "Reminder activity visible to admins and assigned staff",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="mt-0.5 rounded-full bg-amber-500/10 p-2 text-amber-500">
                  <Bell className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { title: "Simple formula", price: "$1", description: "Per active module per active user, per month." },
            { title: "Modular rollout", price: "Flexible", description: "Start with only the modules your institution needs today." },
            { title: "Scale-ready", price: "Tenant-aware", description: "Expand users, modules, and organizations without changing platforms." },
          ].map((plan) => (
            <Card
              key={plan.title}
              className={`relative overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                plan.title === "Modular rollout" ? "border-primary/30 ring-1 ring-primary/10" : ""
              }`}
            >
              {plan.title === "Modular rollout" ? (
                <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                  Recommended
                </div>
              ) : null}
              <CardHeader>
                <CardTitle className="text-2xl tracking-tight">{plan.title}</CardTitle>
                <CardDescription className="leading-6">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-5xl font-semibold tracking-tight">{plan.price}</p>
                <div className="h-px bg-border/70" />
                <Button asChild className="w-full" size="lg" variant={plan.title === "Modular rollout" ? "default" : "outline"}>
              <Link href="/pricing">See pricing model</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-sky-300 to-violet-300" />
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Why institutions trust the platform</CardTitle>
            <CardDescription className="leading-6">Positioning that matters in actual buying and implementation discussions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trustPoints.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm shadow-sm">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="leading-6">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-slate-200 bg-slate-950 text-slate-50 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.8)]">
          <div className="h-1 bg-gradient-to-r from-sky-400 via-amber-300 to-emerald-300" />
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">What buyers usually respond to</CardTitle>
            <CardDescription className="text-slate-300 leading-6">
              Clear governance, modular rollout, AI support that lowers repetitive work, and pricing that is easy to defend internally.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Layers3 className="h-5 w-5 text-sky-300" />
              <p className="mt-3 font-semibold">Modular adoption</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Launch core modules first, then add more as teams mature operationally.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 font-semibold">Governed access</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Separate super admin, admin, and staff responsibilities with clearer control.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <CreditCard className="h-5 w-5 text-amber-300" />
              <p className="mt-3 font-semibold">Operational finance visibility</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Track fees, reminders, and collection pressure from one product surface.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ChartNoAxesCombined className="h-5 w-5 text-rose-300" />
              <p className="mt-3 font-semibold">Decision-ready reporting</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Charts and summaries help leadership review actual performance quickly.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-2">
              <WandSparkles className="h-5 w-5 text-amber-300" />
              <p className="mt-3 font-semibold">Lean operations with AI</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">AI drafts and extraction reduce the load on small teams, so they can handle more without adding manual staff too early.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-2">
        <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <div className="mb-3 inline-flex rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary">
              <Quote className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl tracking-tight">Designed for stronger sales conversations</CardTitle>
            <CardDescription className="leading-6">The public pages now communicate product fit, pricing logic, rollout readiness, and workload reduction more clearly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p className="leading-6">EduFlow is positioned as a governed operations platform, not a generic school CRM. That distinction matters when speaking with decision makers who care about finance discipline, role control, and multi-organization growth.</p>
            <p className="leading-6">The commercial model is also deliberately simple: $1 per module per user. It is easy to explain, easier to quote, and easier for institutions to compare against their own operational footprint.</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Frequently asked questions</CardTitle>
            <CardDescription className="leading-6">Useful for website visitors and for presentation follow-ups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                <p className="font-medium leading-6">{item.question}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="container py-16">
        <Card className="overflow-hidden border-primary/20 bg-primary/5 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Best-fit institution profiles</CardTitle>
            <CardDescription className="leading-6">
              Useful for marketing conversations, demos, and qualification calls where product fit needs to be clear fast.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {deploymentFits.map((item) => (
              <div key={item} className="rounded-full border border-border/70 bg-background/90 px-4 py-2 text-sm font-medium shadow-sm">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="container py-16">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f172a_0%,#0ea5e9_50%,#f59e0b_115%)] text-primary-foreground shadow-[0_30px_80px_-55px_rgba(15,23,42,0.95)]">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/70">Ready for rollout</p>
              <h2 className="mt-2 text-3xl font-semibold">Move school operations into a product your team can actually use.</h2>
            </div>
            <Button asChild size="lg" variant="secondary" className="bg-white text-slate-950 hover:bg-slate-100">
              <Link href="/login">Enter the workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
    </LandingLoader>
  );
}
