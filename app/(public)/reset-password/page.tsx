import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Scaffolded page for a token-based password reset flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="password" placeholder="New password" />
          <Input type="password" placeholder="Confirm password" />
          <Button className="w-full">Update password</Button>
        </CardContent>
      </Card>
    </main>
  );
}
