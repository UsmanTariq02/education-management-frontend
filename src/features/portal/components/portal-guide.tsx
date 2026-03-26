"use client";

import Link from "next/link";
import { BookOpen, BellRing, CalendarCheck2, CreditCard, GraduationCap, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const guideSections = [
  {
    id: "overview",
    title: "Portal overview",
    description: "Understand what this portal is for and what information is available to you.",
    points: [
      "Your dashboard combines attendance, fee status, timetable, reminders, and published academic results.",
      "The portal is read-focused so students and parents can follow school activity without entering admin workspaces.",
      "If something looks missing, contact your school administration because some areas depend on what the institution has enabled.",
    ],
    icon: BookOpen,
  },
  {
    id: "fees",
    title: "Track fees",
    description: "Use the fee summary and recent records to monitor dues and completed payments.",
    points: [
      "Check total billed, total paid, and pending amount from the fee cards.",
      "Review recent billing cycles to see which month is paid, partial, overdue, or pending.",
      "Use reminder history to understand when the school communicated about fees.",
    ],
    icon: CreditCard,
  },
  {
    id: "attendance",
    title: "Follow attendance",
    description: "Attendance charts and summaries give a quick operational picture.",
    points: [
      "Use the attendance rate card for a fast health signal.",
      "Review the attendance mix chart to see present, absent, late, and leave distribution.",
      "Look at recent attendance entries for the most recent date-level record updates.",
    ],
    icon: CalendarCheck2,
  },
  {
    id: "academics",
    title: "Review academics",
    description: "Published results and timetable entries are shown from the academic module.",
    points: [
      "Recent result performance charts show the latest published exam percentages.",
      "The timetable block lists current active class slots for the linked batches.",
      "If no result appears, it usually means the school has not published that exam yet.",
    ],
    icon: GraduationCap,
  },
  {
    id: "reminders",
    title: "Read reminders",
    description: "Reminder history helps you understand recent communication from the institution.",
    points: [
      "Each reminder shows channel, status, and the original message.",
      "Failed reminders indicate the school attempted communication but delivery did not complete.",
      "For payment or attendance questions, compare reminders with fee and attendance records.",
    ],
    icon: BellRing,
  },
  {
    id: "best-practices",
    title: "Best practices",
    description: "A few habits make the portal more useful and reduce confusion.",
    points: [
      "Keep student and guardian email addresses updated so portal and reminder access stay aligned.",
      "Check the portal after exam publication periods and fee due dates.",
      "Use the guide links and back-to-dashboard action if you need to reorient inside the portal.",
    ],
    icon: ListChecks,
  },
];

export function PortalGuide({ variant }: { variant: "student" | "parent" }) {
  const dashboardHref = variant === "parent" ? "/portal/parent" : "/portal/student";
  const audienceLabel = variant === "parent" ? "Parent portal guide" : "Student portal guide";

  return (
    <main className="container space-y-6 py-8">
      <div className="rounded-3xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{audienceLabel}</p>
            <h1 className="text-3xl font-semibold tracking-tight">How to use this portal</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              This guide explains what information is available here, what each dashboard section means, and how students or guardians should use the portal effectively.
            </p>
            <div className="flex flex-wrap gap-2">
              {guideSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>
          <Button asChild>
            <Link href={dashboardHref}>Back to dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {guideSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {section.points.map((point) => (
                  <p key={point}>{point}</p>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
