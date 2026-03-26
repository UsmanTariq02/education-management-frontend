import Link from "next/link";
import { PortalLoginForm } from "@/features/portal/components/portal-login-form";

export default function PortalLoginPage() {
  return (
    <main className="container grid min-h-[calc(100vh-4rem)] items-center gap-8 py-12 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Portal access</p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight">Student and parent visibility without the admin overhead.</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Students and guardians can follow attendance, dues, reminders, timetable, and published results from a dedicated portal experience.
        </p>
      </div>
      <div className="space-y-4">
        <PortalLoginForm />
        <div className="flex justify-between text-sm text-muted-foreground">
          <Link href="/login">Staff login</Link>
          <Link href="/">Back to website</Link>
        </div>
      </div>
    </main>
  );
}
