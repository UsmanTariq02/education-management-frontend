"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/organizations": "Organizations",
  "/users": "Users Management",
  "/roles": "Roles Management",
  "/permissions": "Permissions Catalogue",
  "/students": "Students Operations",
  "/batches": "Batches & Classes",
  "/fee-plans": "Fee Plans",
  "/fees": "Fee Records",
  "/attendance": "Attendance Control",
  "/reminders": "Reminder Logs",
  "/reports": "Reports & Analytics",
  "/activity-logs": "Activity Logs",
  "/settings": "Settings",
  "/profile": "Profile",
};

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const title = pathname ? routeTitles[pathname] ?? "Education Management" : "Education Management";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Secure workspace</p>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search records, students, payments..." />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{user?.organizationName ?? "Platform Console"}</Badge>
            <Badge variant="secondary">{user?.roles.join(", ") ?? "Guest"}</Badge>
            <Button variant="outline" asChild>
              <Link href="/profile">{user?.firstName ?? "Account"}</Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
