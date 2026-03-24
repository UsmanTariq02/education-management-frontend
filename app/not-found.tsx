import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-4 py-12 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">404</p>
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">The route you requested does not exist or is not available in this product configuration.</p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
