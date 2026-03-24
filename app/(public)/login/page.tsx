import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="container grid min-h-[calc(100vh-4rem)] items-center gap-8 py-12 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Authentication</p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight">Secure access for super admins, admins, and staff.</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Session handling is built for JWT access and refresh tokens, role-aware navigation, and permission-controlled actions.
        </p>
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Demo seed from the backend: <span className="font-semibold text-foreground">superadmin@edu.local</span> /{" "}
          <span className="font-semibold text-foreground">ChangeMe123!</span>
        </div>
      </div>
      <div className="space-y-4">
        <LoginForm />
        <div className="flex justify-between text-sm text-muted-foreground">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/">Back to website</Link>
        </div>
      </div>
    </main>
  );
}
