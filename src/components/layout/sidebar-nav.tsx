"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Lock,
  Logs,
  Mailbox,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  UserSquare2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { hasAnyPermission } from "@/lib/permissions/access";
import { hasRole } from "@/lib/permissions/access";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, permissions: ["reports.read"], section: "workspace" },
  { href: "/users", label: "Users", icon: Users, permissions: ["users.read"], section: "workspace" },
  { href: "/students", label: "Students", icon: UserSquare2, permissions: ["students.read"], section: "workspace" },
  { href: "/batches", label: "Batches", icon: BookOpen, permissions: ["batches.read"], section: "workspace" },
  { href: "/fee-plans", label: "Fee Plans", icon: Landmark, permissions: ["fees.read"], section: "workspace" },
  { href: "/fees", label: "Fees", icon: CreditCard, permissions: ["fees.read"], section: "workspace" },
  { href: "/attendance", label: "Attendance", icon: BarChart3, permissions: ["attendance.read"], section: "workspace" },
  { href: "/reminders", label: "Reminders", icon: Bell, permissions: ["reminders.read"], section: "workspace" },
  { href: "/reports", label: "Reports", icon: BarChart3, permissions: ["reports.read"], section: "workspace" },
  { href: "/activity-logs", label: "Activity Logs", icon: Logs, permissions: ["activity-logs.read"], section: "workspace" },
  { href: "/organizations", label: "Organizations", icon: Landmark, permissions: ["users.read"], roles: ["SUPER_ADMIN"], section: "platform" },
  { href: "/roles", label: "Roles", icon: ShieldCheck, permissions: ["users.read"], roles: ["SUPER_ADMIN"], section: "platform" },
  { href: "/permissions", label: "Permissions", icon: Lock, permissions: ["users.read"], roles: ["SUPER_ADMIN"], section: "platform" },
  { href: "/inquiries", label: "Inquiries", icon: Mailbox, permissions: ["users.read"], roles: ["SUPER_ADMIN"], section: "platform" },
  { href: "/settings", label: "Settings", icon: Settings, permissions: ["settings.update"], section: "workspace" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const canAccessSettings = hasRole(user, "ADMIN");
  const visibleNavItems = navItems
    .filter((item) => hasAnyPermission(user, item.permissions))
    .filter((item) => !item.roles || item.roles.some((role) => hasRole(user, role)));
  const workspaceItems = visibleNavItems.filter((item) => item.section === "workspace");
  const platformItems = visibleNavItems.filter((item) => item.section === "platform");

  return (
    <nav className="flex flex-col gap-1">
      {workspaceItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      {platformItems.length ? (
        <div className="mt-4 border-t pt-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Platform</p>
          <div className="flex flex-col gap-1">
            {platformItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-4 border-t pt-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/profile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <UserCog className="h-4 w-4" />
          Profile
        </Link>
        {canAccessSettings ? (
          <Link
            href="/settings"
            className={cn(
              "mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
