"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  BookText,
  CreditCard,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Logs,
  Mailbox,
  ScanSearch,
  Settings,
  ShieldCheck,
  TableProperties,
  Trophy,
  FileQuestion,
  ClipboardCheck,
  ClipboardList,
  UserCog,
  UserRound,
  Users,
  UserSquare2,
  Waypoints,
  ClipboardPenLine,
  Fingerprint,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { hasAnyPermission } from "@/lib/permissions/access";
import { hasRole } from "@/lib/permissions/access";
import { hasModule } from "@/lib/permissions/access";
import type { OrganizationModule } from "@/types/auth";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, permissions: ["reports.read"], section: "operations", module: "REPORTS" as OrganizationModule },
  { href: "/people", label: "People", icon: ScanSearch, permissions: ["users.read", "teachers.read", "students.read"], section: "operations" },
  { href: "/users", label: "Users", icon: Users, permissions: ["users.read"], section: "operations", module: "USERS" as OrganizationModule },
  { href: "/students", label: "Students", icon: UserSquare2, permissions: ["students.read"], section: "operations", module: "STUDENTS" as OrganizationModule },
  { href: "/batches", label: "Batches", icon: BookOpen, permissions: ["batches.read"], section: "operations", module: "BATCHES" as OrganizationModule },
  { href: "/fee-plans", label: "Fee Plans", icon: Landmark, permissions: ["fees.read"], section: "operations", module: "FEES" as OrganizationModule },
  { href: "/fees", label: "Fees", icon: CreditCard, permissions: ["fees.read"], section: "operations", module: "FEES" as OrganizationModule },
  { href: "/attendance", label: "Attendance", icon: BarChart3, permissions: ["attendance.read"], section: "operations", module: "ATTENDANCE" as OrganizationModule },
  { href: "/reminders", label: "Reminders", icon: Bell, permissions: ["reminders.read"], section: "operations", module: "REMINDERS" as OrganizationModule },
  { href: "/academic-sessions", label: "Sessions", icon: GraduationCap, permissions: ["academic-sessions.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/subjects", label: "Subjects", icon: BookText, permissions: ["subjects.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/teachers", label: "Teachers", icon: UserRound, permissions: ["teachers.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/batch-subject-assignments", label: "Subject Mapping", icon: Waypoints, permissions: ["batch-subject-assignments.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/timetables", label: "Timetable", icon: TableProperties, permissions: ["timetables.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/online-classes", label: "Online Classes", icon: Video, permissions: ["online-classes.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/exams", label: "Exams", icon: Trophy, permissions: ["exams.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/assignments", label: "Assignments", icon: ClipboardList, permissions: ["assignments.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/assessments", label: "Assessments", icon: FileQuestion, permissions: ["assessments.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/exam-results", label: "Results", icon: ClipboardPenLine, permissions: ["exam-results.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/report-cards", label: "Report Cards", icon: ClipboardCheck, permissions: ["reports.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
  { href: "/reports", label: "Reports", icon: BarChart3, permissions: ["reports.read"], section: "insights", module: "REPORTS" as OrganizationModule },
  { href: "/alerts", label: "Alerts", icon: Bell, permissions: ["online-classes.read"], section: "insights", module: "ACADEMICS" as OrganizationModule },
  { href: "/activity-logs", label: "Activity Logs", icon: Logs, permissions: ["activity-logs.read"], section: "insights", module: "ACTIVITY_LOGS" as OrganizationModule },
  { href: "/organizations", label: "Organizations", icon: Landmark, permissions: ["users.read"], roles: ["SUPER_ADMIN"], section: "platform" },
  { href: "/roles", label: "Roles", icon: ShieldCheck, permissions: ["users.read"], roles: ["SUPER_ADMIN"], section: "platform" },
  { href: "/permissions", label: "Permissions", icon: Lock, permissions: ["users.read"], roles: ["SUPER_ADMIN"], section: "platform" },
  { href: "/inquiries", label: "Inquiries", icon: Mailbox, permissions: ["users.read"], roles: ["SUPER_ADMIN"], section: "platform" },
];

const sectionLabels: Record<string, string> = {
  operations: "Operations",
  academics: "Academics",
  insights: "Insights",
  platform: "Platform",
};

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const canAccessSettings = hasRole(user, "ADMIN") && hasModule(user, "SETTINGS");
  const visibleNavItems = navItems
    .filter((item) => hasAnyPermission(user, item.permissions))
    .filter((item) => !item.roles || item.roles.some((role) => hasRole(user, role)));
  const moduleScopedItems = visibleNavItems.filter((item) => !item.module || hasModule(user, item.module));
  const operationsItems = moduleScopedItems.filter((item) => item.section === "operations");
  const academicItems = moduleScopedItems.filter((item) => item.section === "academics");
  const insightItems = moduleScopedItems.filter((item) => item.section === "insights");
  const platformItems = moduleScopedItems.filter((item) => item.section === "platform");
  const groupedSections = [
    { key: "operations", items: operationsItems },
    { key: "academics", items: academicItems },
    { key: "insights", items: insightItems },
  ].filter((section) => section.items.length > 0);

  return (
    <nav className="flex flex-col gap-1">
      {groupedSections.map((section, index) => (
        <div key={section.key} className={cn(index > 0 ? "mt-5 border-t border-border/60 pt-5" : "")}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {sectionLabels[section.key]}
          </p>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      {platformItems.length ? (
        <div className="mt-5 border-t border-border/60 pt-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {sectionLabels.platform}
          </p>
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
                    isActive
                      ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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
      <div className="mt-5 border-t border-border/60 pt-5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/profile"
              ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <UserCog className="h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/guide"
          className={cn(
            "mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/guide"
              ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <LifeBuoy className="h-4 w-4" />
          Guide
        </Link>
        <Link
          href="/security"
          className={cn(
            "mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/security"
              ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <Fingerprint className="h-4 w-4" />
          Security
        </Link>
        {canAccessSettings ? (
          <Link
            href="/settings"
            className={cn(
              "mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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
