"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  Mail,
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
  ChevronDown,
  Video,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mailApi } from "@/features/mail/api/mail-api";
import { useAuth } from "@/providers/auth-provider";
import { getAiAccessLabel, hasAiAccess } from "@/lib/ai/access";
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
  { href: "/academic-sessions", label: "Years / Terms", icon: GraduationCap, permissions: ["academic-sessions.read"], section: "academics", module: "ACADEMICS" as OrganizationModule },
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
  { href: "/ai", label: "AI Lab", icon: Sparkles, permissions: ["ai.use"], section: "insights" },
  { href: "/ai/queue", label: "AI Queue", icon: ClipboardList, permissions: ["ai.use"], section: "insights" },
  { href: "/ai/admin", label: "AI Admin", icon: BarChart3, permissions: ["ai.use"], roles: ["SUPER_ADMIN"], section: "insights" },
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

const sectionOrder = ["operations", "academics", "insights", "platform"] as const;

const mailFolders = [
  { label: "Inbox", folder: "inbox" },
  { label: "Sent", folder: "sent" },
  { label: "Drafts", folder: "drafts" },
  { label: "Starred", folder: "starred" },
  { label: "Trash", folder: "trash" },
] as const;

const sectionShellClass =
  "rounded-2xl border border-border/60 bg-background/50 p-1 shadow-sm shadow-slate-900/5 ring-1 ring-white/50";
const sectionHeaderClass =
  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] transition-colors";
const activeNavClass = "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-sm shadow-sky-900/10";
const inactiveNavClass = "text-muted-foreground hover:bg-muted/70 hover:text-foreground";

function getNavLinkClass(isActive: boolean) {
  return cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200", isActive ? activeNavClass : inactiveNavClass);
}

export function SidebarNav() {
  const pathname = usePathname() ?? "/dashboard";
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const canAccessSettings = hasRole(user, "ADMIN") && hasModule(user, "SETTINGS");
  const aiReady = hasAiAccess(user);
  const aiLabel = getAiAccessLabel(user);
  const mailCountsQuery = useQuery({
    queryKey: ["mail-sidebar-counts"],
    queryFn: () => mailApi.mailbox({ page: 1, limit: 1, folder: "inbox" }),
    enabled: hasAnyPermission(user, ["mail.read"]) && hasModule(user, "MAIL"),
    staleTime: 60_000,
  });
  const [openSections, setOpenSections] = React.useState<Record<(typeof sectionOrder)[number], boolean>>({
    operations: true,
    academics: true,
    insights: false,
    platform: false,
  });
  const [mailExpanded, setMailExpanded] = React.useState(pathname === "/mail");
  const visibleNavItems = useMemo(
    () =>
      navItems
        .filter((item) => hasAnyPermission(user, item.permissions))
        .filter((item) => !item.roles || item.roles.some((role) => hasRole(user, role))),
    [user],
  );
  const moduleScopedItems = useMemo(
    () => visibleNavItems.filter((item) => !item.module || hasModule(user, item.module)),
    [user, visibleNavItems],
  );
  const operationsItems = useMemo(
    () => moduleScopedItems.filter((item) => item.section === "operations"),
    [moduleScopedItems],
  );
  const academicItems = useMemo(
    () => moduleScopedItems.filter((item) => item.section === "academics"),
    [moduleScopedItems],
  );
  const insightItems = useMemo(
    () => moduleScopedItems.filter((item) => item.section === "insights"),
    [moduleScopedItems],
  );
  const platformItems = useMemo(
    () => moduleScopedItems.filter((item) => item.section === "platform"),
    [moduleScopedItems],
  );
  const currentMailFolder = (searchParams?.get("folder") as (typeof mailFolders)[number]["folder"] | null) ?? "inbox";
  const isMailActive = pathname === "/mail" || pathname.startsWith("/mail/");

  useEffect(() => {
    if (pathname === "/mail") {
      setMailExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    const activeSection =
      operationsItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
        ? "operations"
        : academicItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
          ? "academics"
          : insightItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
            ? "insights"
        : platformItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
          ? "platform"
          : null;

    if (activeSection) {
      setOpenSections((current) => {
        if (current[activeSection]) {
          return current;
        }

        return { ...current, [activeSection]: true };
      });
    }
  }, [academicItems, insightItems, operationsItems, platformItems, pathname]);

  return (
    <nav className="flex flex-col gap-3">
      {sectionOrder.map((sectionKey) => {
        const sectionItems =
          sectionKey === "operations"
            ? operationsItems
            : sectionKey === "academics"
              ? academicItems
              : sectionKey === "insights"
                ? insightItems
                : platformItems;

        if (!sectionItems.length) {
          return null;
        }

        const expanded = openSections[sectionKey];
        const hasMail = sectionKey === "operations" && hasAnyPermission(user, ["mail.read"]) && hasModule(user, "MAIL");
        const hasContent = sectionItems.length > 0 || hasMail;

        return (
          <div key={sectionKey} className={sectionShellClass}>
            <button
              type="button"
              onClick={() => setOpenSections((current) => ({ ...current, [sectionKey]: !current[sectionKey] }))}
              className={cn(
                sectionHeaderClass,
                expanded ? "text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span>{sectionLabels[sectionKey]}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")} />
            </button>
            {expanded && hasContent ? (
              <div className="mt-1 flex flex-col gap-1 pb-1">
                {sectionItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={getNavLinkClass(isActive)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/ai" ? (
                        <Badge variant={aiReady ? "success" : "warning"} className="ml-auto rounded-full">
                          {aiReady ? aiLabel : "Set key"}
                        </Badge>
                      ) : null}
                    </Link>
                  );
                })}
                {hasMail ? (
                  <div className="rounded-xl border border-border/60 bg-background/60 p-1">
                    <button
                      type="button"
                      onClick={() => setMailExpanded((current) => !current)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isMailActive
                          ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Mail className="h-4 w-4" />
                        Mail
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", mailExpanded ? "rotate-180" : "")} />
                    </button>
                    {mailExpanded ? (
                      <div className="mt-1 space-y-1 pl-2">
                        {mailFolders.map((item) => {
                          const href = `/mail?folder=${item.folder}`;
                          const active = pathname === "/mail" && currentMailFolder === item.folder;
                          const unreadCount = mailCountsQuery.data?.counts?.[item.folder]?.unread ?? 0;
                          return (
                            <Link
                              key={item.folder}
                              href={href}
                              className={cn(getNavLinkClass(active), "rounded-lg px-3 py-2 text-sm")}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              <span className="flex-1">{item.label}</span>
                              {unreadCount > 0 ? (
                                <Badge className="ml-auto rounded-full border-0 bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-slate-950">
                                  {unreadCount}
                                </Badge>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="mt-4 border-t border-border/60 pt-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <Link
          href="/profile"
          className={getNavLinkClass(pathname === "/profile")}
        >
          <UserCog className="h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/guide"
          className={cn(getNavLinkClass(pathname === "/guide"), "mt-1")}
        >
          <LifeBuoy className="h-4 w-4" />
          Guide
        </Link>
        <Link
          href="/security"
          className={cn(getNavLinkClass(pathname === "/security"), "mt-1")}
        >
          <Fingerprint className="h-4 w-4" />
          Security
        </Link>
        {canAccessSettings ? (
          <Link
            href="/settings"
            className={cn(getNavLinkClass(pathname === "/settings"), "mt-1")}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
