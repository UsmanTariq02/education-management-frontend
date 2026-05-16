import Link from "next/link";
import { ArrowRight, Bot, Building2, CheckCircle2, Layers3, ShieldCheck, Sparkles, UsersRound, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { publicModuleCount } from "@/lib/marketing/module-catalog";

const advantagePoints = [
  {
    title: "One platform, many decisions",
    description:
      "Fees, attendance, academics, reminders, reporting, and AI workflows sit in the same tenant-aware system, so teams stop stitching processes together by hand.",
    icon: Building2,
  },
  {
    title: "Automation with guardrails",
    description:
      "AI drafts notices, mail replies, support responses, and admission extraction outputs, but staff still approve anything that gets published or sent.",
    icon: WandSparkles,
  },
  {
    title: "Control without friction",
    description:
      "Super admin, admin, and staff permissions stay separate, so leadership gets oversight without forcing every user into the same access model.",
    icon: ShieldCheck,
  },
  {
    title: "Built to grow with the institution",
    description:
      "Teams can launch the core modules first, then activate more of the platform as usage, campuses, and automation needs increase.",
    icon: Layers3,
  },
];

const outcomes = [
  "Less time spent chasing updates across spreadsheets, chats, and disconnected tools.",
  "Cleaner fee follow-up because reminders, records, and support all live together.",
  "Faster admissions handling when raw input can be turned into structured student data.",
  "More confident reporting because operational data is already organized for review.",
];

const aiAutomations = [
  {
    title: "Notice drafting",
    description:
      "Draft announcements, fee reminders, and parent communications with the right tone and key points, then let staff review before publishing.",
  },
  {
    title: "Support replies",
    description:
      "Generate concise support responses for common questions so teams do not have to write every reply from scratch.",
  },
  {
    title: "Admission extraction",
    description:
      "Turn raw admission notes or form text into structured student data, which reduces manual retyping during onboarding.",
  },
  {
    title: "Intervention support",
    description:
      "Suggest next steps for attendance, fee follow-up, and student risk workflows so staff can act faster with more context.",
  },
  {
    title: "Fee collection planning",
    description:
      "Turn fee records and outstanding balances into practical next actions so finance teams do not have to manually plan every follow-up.",
  },
  {
    title: "Reminder drafting",
    description:
      "Create follow-up messages for SMS, WhatsApp, email, or manual delivery, which reduces repetitive communication work.",
  },
];

const automationDesks = [
  {
    title: "Admissions desk",
    description: "Extract student intake text into structured records and reduce retyping at the front office.",
    icon: Building2,
  },
  {
    title: "Finance desk",
    description: "Draft fee reminders and collection plans so overdue follow-up is not built from scratch every day.",
    icon: Sparkles,
  },
  {
    title: "Attendance desk",
    description: "Generate intervention steps for absenteeism before a staff member has to write a full follow-up plan.",
    icon: Bot,
  },
  {
    title: "Parent communication",
    description: "Prepare notices and mail replies in a ready-to-review format instead of asking staff to start from blank pages.",
    icon: WandSparkles,
  },
  {
    title: "Support desk",
    description: "Answer routine questions and escalate only what needs human follow-up, which reduces inbox pressure.",
    icon: UsersRound,
  },
  {
    title: "Management reporting",
    description: "Summarize operational context into clear action items so leaders do not need manual prep for every review meeting.",
    icon: Layers3,
  },
];

export default function WhyEduFlowPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.1),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.02)_0%,_transparent_100%)]" />
      <div className="container relative space-y-16 py-16">
        <section className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10">Why EduFlow</Badge>
            <PageHeader
              eyebrow="The operating advantage"
              title="Why EduFlow feels like a system upgrade, not another school software purchase."
              description="The platform is built for institutions that want control, speed, and AI-assisted execution in one governed workspace instead of a stack of separate tools."
            />
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">
                  Request a walkthrough
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Core scope</p>
                  <p className="mt-3 text-3xl font-semibold">{publicModuleCount} modules</p>
                  <p className="mt-2 text-sm text-muted-foreground">Governance, academics, finance, communication, documents, and automation.</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">AI posture</p>
                  <p className="mt-3 text-3xl font-semibold">Reviewed</p>
                  <p className="mt-2 text-sm text-muted-foreground">Drafts are generated first, then staff decide what gets published.</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <Card className="overflow-hidden border-slate-200 bg-slate-950 text-slate-50 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.85)] ring-1 ring-white/5">
            <CardHeader>
              <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-3 text-sky-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle>What makes it feel different</CardTitle>
              <CardDescription className="text-slate-300">
                EduFlow is not positioned as a generic admin panel. It is a governed operating system for institutions that need more than CRUD screens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Operational data is organized around real workflows, not just static forms.",
                "AI features accelerate drafting and extraction without removing approval from staff.",
                "The pricing and module model stays readable for procurement and rollout planning.",
                "The same product can support a single campus today and a multi-tenant group tomorrow.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p>{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {advantagePoints.map((item) => {
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
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>What teams usually gain</CardTitle>
              <CardDescription>The strongest benefit is not a single feature. It is the compound effect of everything working inside one product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {outcomes.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/70 p-4 text-sm shadow-sm">
                  <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Why the AI layer matters</CardTitle>
              <CardDescription>AI is most useful when it removes repetitive work and still leaves accountability with the institution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-medium text-foreground">The staffing effect</p>
                <p className="mt-2">
                  The AI layer is designed to absorb repetitive admin work so small teams can handle more volume without immediately adding more manual headcount.
                  It does not remove oversight. It removes the low-value drafting and data-entry work that slows people down.
                </p>
              </div>
              <div className="grid gap-3">
                {aiAutomations.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Automation scope</p>
            <h2 className="text-3xl font-semibold tracking-tight">The AI layer is meant to absorb real school work, not just generate text.</h2>
            <p className="text-muted-foreground">
              Each area below is a repeatable desk task that normally takes a person time every day. EduFlow turns that into a reviewable draft or recommendation so the institution can run leaner.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {automationDesks.map((item) => {
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

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Less repetitive work",
              description: "Teams spend less time composing the same notice, reply, reminder, or follow-up over and over.",
            },
            {
              title: "Less manual entry",
              description: "Admission extraction reduces copy-paste work and helps staff move faster from intake to record creation.",
            },
            {
              title: "Less pressure to hire early",
              description: "Institutions can support more workload with the same team before needing to add extra administrative staff just to keep up.",
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

        <section className="rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,_rgba(14,165,233,0.08)_0%,_rgba(251,191,36,0.08)_100%)] p-8 shadow-sm backdrop-blur">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              "If the institution needs control, EduFlow gives it structure.",
              "If the institution needs speed, EduFlow gives it automation with review.",
              "If the institution needs scale, EduFlow gives it modules that can expand over time.",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl border border-border/70 bg-background/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Why it matters {index + 1}</p>
                <p className="mt-3 text-lg font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <Card className="bg-primary text-primary-foreground shadow-[0_25px_80px_-40px_rgba(14,165,233,0.6)]">
            <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/70">Next step</p>
                <h2 className="text-3xl font-semibold">See why teams choose a system that combines governance, operations, and AI workflow control.</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link href="/contact">Talk to sales</Link>
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
