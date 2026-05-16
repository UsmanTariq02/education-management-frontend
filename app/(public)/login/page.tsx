import Link from "next/link";
import { CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%)]" />
      <div className="container relative grid min-h-[calc(100vh-4rem)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_420px]">
        <div className="space-y-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Authentication</p>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight md:text-6xl">Secure access for super admins, admins, and staff.</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Login handling is built for JWT access and refresh tokens, role-aware navigation, and permission-controlled actions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-3 font-semibold">Permission-aware by default</p>
              <p className="mt-2 text-sm text-muted-foreground">Routes and actions stay scoped to the user&apos;s role and permissions.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur">
              <UsersRound className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 font-semibold">Built for school teams</p>
              <p className="mt-2 text-sm text-muted-foreground">Admins and staff get a simpler workspace with the right surface area.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border/70 bg-card/70 p-6 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <div className="flex items-center gap-3 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Demo seed from the backend</span>
            </div>
            <p className="mt-3">
              <span className="font-semibold text-foreground">superadmin@edu.local</span> /{" "}
              <span className="font-semibold text-foreground">ChangeMe123!</span>
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <LoginForm />
          <div className="flex justify-between text-sm text-muted-foreground">
            <Link href="/forgot-password">Forgot password?</Link>
            <Link href="/">Back to website</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
