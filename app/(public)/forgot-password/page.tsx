import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Password reset API is scaffolded here. Connect it to a backend mail flow when the endpoint is available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="admin@school.edu" />
          <Button className="w-full">Send reset link</Button>
          <Link className="text-sm text-muted-foreground" href="/login">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
