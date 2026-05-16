"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/constants/app";

interface SiteFooterProps {
  variant?: "public" | "dashboard";
}

export function SiteFooter({ variant = "public" }: SiteFooterProps) {
  const isDashboard = variant === "dashboard";

  return (
    <footer className={isDashboard ? "border-t bg-background" : "border-t bg-slate-950 text-slate-100"}>
      <div className="container flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl space-y-3">
          <p className={isDashboard ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-white"}>{APP_NAME}</p>
          <p className={isDashboard ? "text-sm text-muted-foreground" : "text-sm text-slate-300"}>
            Multi-tenant education operations software for schools, colleges, academies, and training institutes. Manage students,
            batches, fees, attendance, reminders, and reporting from one governed workspace.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <p className={isDashboard ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-white"}>Platform</p>
            <div className={isDashboard ? "space-y-2 text-sm text-muted-foreground" : "space-y-2 text-sm text-slate-300"}>
              <Link href="/why-eduflow" className="block hover:text-primary">
                Why EduFlow
              </Link>
              <Link href="/about" className="block hover:text-primary">
                About
              </Link>
              <Link href="/pricing" className="block hover:text-primary">
                Pricing
              </Link>
              <Link href="/contact" className="block hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className={isDashboard ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-white"}>Core modules</p>
            <div className={isDashboard ? "space-y-2 text-sm text-muted-foreground" : "space-y-2 text-sm text-slate-300"}>
              <p>Students and Batches</p>
              <p>Fees and Attendance</p>
              <p>Reminders and Reports</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className={isDashboard ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-white"}>Commercial model</p>
            <div className={isDashboard ? "space-y-2 text-sm text-muted-foreground" : "space-y-2 text-sm text-slate-300"}>
              <p>$1 per module per user</p>
              <p>Tenant-based onboarding</p>
              <p>Super admin governance</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
