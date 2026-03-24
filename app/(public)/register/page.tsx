import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Registration placeholder</CardTitle>
          <CardDescription>This SaaS currently assumes organization-managed user creation through the admin console.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Keep this route if self-serve onboarding is introduced later, otherwise redirect users to contact sales.
        </CardContent>
      </Card>
    </main>
  );
}
