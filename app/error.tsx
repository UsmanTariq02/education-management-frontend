"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-4 py-12 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Application error</p>
      <h1 className="text-4xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">A recoverable error occurred. Try the action again or return to the dashboard.</p>
      <Button onClick={reset}>Retry</Button>
    </main>
  );
}
