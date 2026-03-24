import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
          <div className="rounded-full bg-amber-100 p-4 text-amber-700">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Access denied</h1>
            <p className="text-muted-foreground">Your account is authenticated, but this module or action is not available for your assigned permissions.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard">Return to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
