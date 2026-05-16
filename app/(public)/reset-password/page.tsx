import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%)]" />
      <div className="container relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md overflow-hidden border-border/70 bg-card/85 shadow-[0_25px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-sky-400 via-emerald-300 to-amber-300" />
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Reset password</CardTitle>
            <CardDescription className="leading-6">Scaffolded page for a token-based password reset flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="password" placeholder="New password" />
            <Input type="password" placeholder="Confirm password" />
            <Button className="w-full">Update password</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
