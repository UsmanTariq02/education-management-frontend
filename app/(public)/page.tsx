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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingLoader } from "@/components/feedback/landing-loader";

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
    title: "Role-based access control",
    description: "Keep super admin, admin, and staff access clean with permission-aware modules, routes, and actions.",
    icon: ShieldCheck,
  },
  {
    title: "Reporting that supports decisions",
    description: "Give school owners batch-wise collection, attendance, and reminder performance views that map to real workflows.",
    icon: ChartNoAxesCombined,
  },
];

const trustPoints = [
  "Multi-tenant architecture for multiple schools or colleges",
  "Role and permission security for super admin, admin, and staff",
  "Chart-ready analytics for fees, attendance, reminders, and student activity",
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
    question: "Can existing student records be migrated?",
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
    <main>
      <section className="container grid gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <Badge>Built for schools, academies, and institutes</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">
              Run education operations with fewer spreadsheets and more control.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              EduFlow unifies student records, batches, fee collection, attendance, reminders, reporting, and access control in one operational system.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                Launch dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-card/80">
              <CardContent className="p-5">
                <p className="text-3xl font-semibold">98%</p>
                <p className="text-sm text-muted-foreground">Collection visibility across current month dues</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="p-5">
                <p className="text-3xl font-semibold">4x</p>
                <p className="text-sm text-muted-foreground">Faster attendance review by batch and day</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="p-5">
                <p className="text-3xl font-semibold">RBAC</p>
                <p className="text-sm text-muted-foreground">Permission-aware navigation and actions</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Card className="overflow-hidden border-slate-200 bg-slate-950 text-slate-50">
          <CardContent className="p-0">
            <div className="grid gap-0 md:grid-cols-[220px_1fr]">
              <div className="border-b border-slate-800 bg-slate-900 p-5 md:border-b-0 md:border-r">
                <p className="text-sm font-semibold text-slate-200">Operations Snapshot</p>
                <div className="mt-6 space-y-3 text-sm text-slate-400">
                  <div className="rounded-xl bg-slate-800 px-3 py-2">Overdue fees</div>
                  <div className="rounded-xl bg-slate-800/60 px-3 py-2">Attendance trends</div>
                  <div className="rounded-xl bg-slate-800/60 px-3 py-2">Reminder delivery logs</div>
                  <div className="rounded-xl bg-slate-800/60 px-3 py-2">Role-based access</div>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-sky-500/15 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Collected</p>
                    <p className="mt-3 text-2xl font-semibold">$24,800</p>
                  </div>
                  <div className="rounded-2xl bg-amber-500/15 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Overdue</p>
                    <p className="mt-3 text-2xl font-semibold">29 records</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/15 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Present</p>
                    <p className="mt-3 text-2xl font-semibold">412 today</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800">
                  <div className="grid grid-cols-4 gap-2 border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <span>Student</span>
                    <span>Batch</span>
                    <span>Status</span>
                    <span>Amount due</span>
                  </div>
                  <div className="space-y-1 p-2 text-sm">
                    {["Ayesha Khan", "Hamza Ali", "Sara Ahmed"].map((name, index) => (
                      <div key={name} className="grid grid-cols-4 rounded-xl px-3 py-3 hover:bg-slate-900">
                        <span>{name}</span>
                        <span>Batch {index + 6}</span>
                        <span className="text-amber-300">Overdue</span>
                        <span>${420 + index * 20}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container py-16">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Platform coverage</p>
          <h2 className="text-3xl font-semibold tracking-tight">A practical product surface for education teams</h2>
          <p className="text-muted-foreground">
            The product is designed around operational tables, auditability, and role-aware workflows rather than decorative dashboards.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance and reporting</CardTitle>
            <CardDescription>Use cohort-level trends, attendance distribution, and recent exceptions to take action quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Daily attendance entry with present, absent, late, and leave statuses",
              "Recent attendance records table for fast review",
              "Batch-wise attendance summaries for reporting",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-muted/70 p-4">
                <UsersRound className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fee reminders that close operational gaps</CardTitle>
            <CardDescription>Track reminder channel, message, delivery status, and fee linkage from one place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "SMS, WhatsApp, email, and manual reminders in a unified log",
              "Overdue fee follow-ups tied to actual fee records",
              "Reminder activity visible to admins and assigned staff",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-muted/70 p-4">
                <Bell className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm">{item}</p>
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
            <Card key={plan.title} className={plan.title === "Modular rollout" ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <CardTitle>{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-4xl font-semibold">{plan.price}</p>
                <Button asChild className="w-full" variant={plan.title === "Modular rollout" ? "default" : "outline"}>
                  <Link href="/pricing">View pricing model</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Why institutions trust the platform</CardTitle>
            <CardDescription>Positioning that matters in actual buying and implementation discussions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trustPoints.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>What buyers usually respond to</CardTitle>
            <CardDescription className="text-slate-300">
              Clear governance, modular rollout, and pricing that is easy to defend internally.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Layers3 className="h-5 w-5 text-sky-300" />
              <p className="mt-3 font-semibold">Modular adoption</p>
              <p className="mt-2 text-sm text-slate-300">Launch core modules first, then add more as teams mature operationally.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 font-semibold">Governed access</p>
              <p className="mt-2 text-sm text-slate-300">Separate super admin, admin, and staff responsibilities with clearer control.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <CreditCard className="h-5 w-5 text-amber-300" />
              <p className="mt-3 font-semibold">Operational finance visibility</p>
              <p className="mt-2 text-sm text-slate-300">Track fees, reminders, and collection pressure from one product surface.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <ChartNoAxesCombined className="h-5 w-5 text-rose-300" />
              <p className="mt-3 font-semibold">Decision-ready reporting</p>
              <p className="mt-2 text-sm text-slate-300">Charts and summaries help leadership review actual performance quickly.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
              <Quote className="h-5 w-5" />
            </div>
            <CardTitle>Designed for stronger sales conversations</CardTitle>
            <CardDescription>The public pages now communicate product fit, pricing logic, and rollout readiness more clearly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>EduFlow is positioned as a governed operations platform, not a generic school CRM. That distinction matters when speaking with decision makers who care about finance discipline, role control, and multi-organization growth.</p>
            <p>The commercial model is also deliberately simple: $1 per module per user. It is easy to explain, easier to quote, and easier for institutions to compare against their own operational footprint.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Frequently asked questions</CardTitle>
            <CardDescription>Useful for website visitors and for presentation follow-ups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-xl border p-4">
                <p className="font-medium">{item.question}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="container py-16">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Best-fit institution profiles</CardTitle>
            <CardDescription>
              Useful for marketing conversations, demos, and qualification calls where product fit needs to be clear fast.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {deploymentFits.map((item) => (
              <div key={item} className="rounded-full border bg-background px-4 py-2 text-sm font-medium">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="container py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/70">Ready for rollout</p>
              <h2 className="mt-2 text-3xl font-semibold">Move school operations into a product your team can actually use.</h2>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">Open the workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
    </LandingLoader>
  );
}
