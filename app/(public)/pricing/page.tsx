import Link from "next/link";
import { ArrowRight, Calculator, Check, DollarSign, Layers3, Users2 } from "lucide-react";
import { PricingCalculator } from "@/components/marketing/pricing-calculator";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const moduleCatalog = [
  "Users and access control",
  "Students",
  "Batches / classes",
  "Fee plans and fee records",
  "Attendance",
  "Reminders",
  "Reports and analytics",
];

const pricingExamples = [
  {
    title: "Small school",
    users: 12,
    modules: 4,
    monthly: 48,
    description: "12 active users using 4 modules",
  },
  {
    title: "Growing academy",
    users: 25,
    modules: 6,
    monthly: 150,
    description: "25 active users using 6 modules",
  },
  {
    title: "Operational college team",
    users: 40,
    modules: 7,
    monthly: 280,
    description: "40 active users using 7 modules",
  },
];

export default function PricingPage() {
  return (
    <main className="container space-y-16 py-16">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <Badge>Pricing</Badge>
          <PageHeader
            eyebrow="Simple commercial model"
            title="$1 per module per user. Clear, modular, and easy to explain."
            description="You only pay for the modules your institution uses and the users who need access. The pricing model is designed to stay predictable as schools, colleges, and academies grow."
          />
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/contact">
                Request pricing discussion
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/about">Read product overview</Link>
            </Button>
          </div>
        </div>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle>Pricing formula</CardTitle>
            <CardDescription>Use one simple calculation for monthly software cost.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-white p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-700">Formula</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">Users x Modules x $1</p>
              <p className="mt-2 text-sm text-muted-foreground">Example: 20 users x 5 modules = $100 / month</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <Users2 className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">User-based</p>
                <p className="mt-1 text-xs text-muted-foreground">Pay for real operational users only.</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <Layers3 className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">Module-based</p>
                <p className="mt-1 text-xs text-muted-foreground">Enable only the modules you need.</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">Predictable</p>
                <p className="mt-1 text-xs text-muted-foreground">No complicated pricing tiers.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Available modules</CardTitle>
            <CardDescription>Select the operational areas your institution wants to activate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {moduleCatalog.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Illustrative pricing scenarios</CardTitle>
            <CardDescription>These examples make the pricing model easy to communicate to stakeholders.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {pricingExamples.map((example) => (
              <div key={example.title} className="rounded-2xl border bg-muted/30 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{example.title}</p>
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                  </div>
                  <p className="text-3xl font-semibold">${example.monthly}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-background p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Users</p>
                    <p className="mt-1 font-semibold">{example.users}</p>
                  </div>
                  <div className="rounded-xl bg-background p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Modules</p>
                    <p className="mt-1 font-semibold">{example.modules}</p>
                  </div>
                  <div className="rounded-xl bg-background p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Calculation</p>
                    <p className="mt-1 font-semibold">
                      {example.users} x {example.modules} x $1
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <PricingCalculator />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What is included</CardTitle>
            <CardDescription>The module charge is for software access, governance, and reporting support.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Every active module runs inside the same tenant-aware platform, with organization scoping, authentication, authorization, reporting, and structured audit logging built into the product.</p>
            <p>Institutions can start with a smaller operational footprint and expand gradually by enabling more modules and more users over time.</p>
            <p>The model works well for small schools, coaching centers, colleges, and group operators who need predictable SaaS pricing.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Typical questions</CardTitle>
            <CardDescription>Common commercial clarifications during demos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Do we pay only for users who actively need access? Yes.",
              "Can we start with only students, fees, attendance, and reports? Yes.",
              "Can more modules be added later without changing the platform? Yes.",
              "Can pricing scale across multiple organizations or campuses? Yes, the model is tenant-friendly.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                <Calculator className="mt-0.5 h-4 w-4 text-primary" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="bg-primary text-primary-foreground">
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
    </main>
  );
}
