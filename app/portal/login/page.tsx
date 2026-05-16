import Link from "next/link";
import { ArrowRight, BellRing, CalendarCheck2, CreditCard, GraduationCap } from "lucide-react";
import { PortalLoginForm } from "@/features/portal/components/portal-login-form";

export default function PortalLoginPage() {
  return (
    <main className="container grid min-h-screen items-center gap-10 py-10 lg:grid-cols-[1.1fr_440px]">
      <section className="relative overflow-hidden rounded-[2rem] border bg-slate-950 px-8 py-10 text-slate-50 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)] lg:px-10 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.28),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)]" />
        <div className="relative space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">Portal access</p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight lg:text-6xl">
              Student and parent visibility without the admin clutter.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              Students and guardians can follow attendance, dues, reminders, timetable, and published results from a dedicated portal designed around clarity.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: CalendarCheck2, title: "Attendance clarity", description: "See recent status, attendance rate, and class rhythm quickly." },
              { icon: CreditCard, title: "Fee visibility", description: "Track pending dues, recent fee records, and overdue cycles." },
              { icon: GraduationCap, title: "Published results", description: "Review exam performance and academic progress in one place." },
              { icon: BellRing, title: "Reminder history", description: "Check fee and admin communication sent to the student account." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <Icon className="h-5 w-5 text-sky-300" />
                  <p className="mt-3 font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 hover:bg-white/5">
              Back to website
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 hover:bg-white/5">
              Staff login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <PortalLoginForm />
      </section>
    </main>
  );
}
