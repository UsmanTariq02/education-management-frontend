import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary shadow-sm shadow-primary/10">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">EduFlow</p>
              <p className="text-xs text-muted-foreground">Education Management SaaS</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/why-eduflow">Why EduFlow</Link>
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/login">Login</Link>
          </nav>
          <Button asChild className="shadow-sm shadow-primary/15">
            <Link href="/login">Request Demo</Link>
          </Button>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <SiteFooter variant="public" />
    </div>
  );
}
