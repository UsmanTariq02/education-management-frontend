"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BellRing,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileQuestion,
  FolderOpen,
  Mail,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ReceiptText,
  ScrollText,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { usePortalAuth } from "@/providers/portal-auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { portalMailApi } from "@/features/mail/api/portal-mail-api";
import { getAiAccessLabel, hasAiAccess } from "@/lib/ai/access";

type PortalVariant = "student" | "parent";

interface PortalShellProps {
  variant: PortalVariant;
  children: React.ReactNode;
}

interface PortalNavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  matchStartsWith?: boolean;
}

const mailFolders = [
  { label: "Inbox", folder: "inbox" },
  { label: "Sent", folder: "sent" },
  { label: "Drafts", folder: "drafts" },
  { label: "Starred", folder: "starred" },
  { label: "Trash", folder: "trash" },
] as const;

const portalNavItems: Record<PortalVariant, PortalNavItem[]> = {
  student: [
    { href: "/portal/student", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/student/report-card", label: "Report Card", icon: ScrollText },
    { href: "/portal/student/assessments", label: "Assessments", icon: FileQuestion, matchStartsWith: true },
    { href: "/portal/student/assignments", label: "Assignments", icon: ClipboardCheck, matchStartsWith: true },
    { href: "/portal/student/activity", label: "Activity", icon: BellRing },
    { href: "/portal/student/announcements", label: "Announcements", icon: Megaphone },
    { href: "/portal/student/documents", label: "Documents", icon: FolderOpen },
    { href: "/portal/student/acknowledgements", label: "Acknowledgements", icon: ReceiptText },
    { href: "/portal/student/fees", label: "Fees", icon: CreditCard },
    { href: "/portal/student/guide", label: "Guide", icon: BookOpen },
  ],
  parent: [
    { href: "/portal/parent", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/parent/report-card", label: "Report Card", icon: ScrollText },
    { href: "/portal/parent/assessments", label: "Assessments", icon: FileQuestion },
    { href: "/portal/parent/assignments", label: "Assignments", icon: ClipboardCheck },
    { href: "/portal/parent/activity", label: "Activity", icon: BellRing },
    { href: "/portal/parent/announcements", label: "Announcements", icon: Megaphone },
    { href: "/portal/parent/documents", label: "Documents", icon: FolderOpen },
    { href: "/portal/parent/acknowledgements", label: "Acknowledgements", icon: ReceiptText },
    { href: "/portal/parent/fees", label: "Fees", icon: CreditCard },
    { href: "/portal/parent/guide", label: "Guide", icon: BookOpen },
  ],
};

function isActivePath(pathname: string, item: PortalNavItem) {
  if (item.href === pathname) {
    return true;
  }

  if (item.matchStartsWith) {
    return pathname.startsWith(`${item.href}/`);
  }

  return pathname.startsWith(`${item.href}/`);
}

export function PortalShell({ variant, children }: PortalShellProps) {
  const pathname = usePathname() ?? (variant === "parent" ? "/portal/parent" : "/portal/student");
  const searchParams = useSearchParams();
  const { user, logout } = usePortalAuth();
  const navItems = portalNavItems[variant];
  const mailCountsQuery = useQuery({
    queryKey: ["portal-mail-sidebar-counts", variant],
    queryFn: () => portalMailApi.mailbox({ page: 1, limit: 1, folder: "inbox" }),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
  const aiReady = hasAiAccess(user);
  const aiLabel = getAiAccessLabel(user);
  const activeItem = pathname.includes("/mail")
    ? { label: "Mail" }
    : navItems.find((item) => isActivePath(pathname, item)) ?? navItems[0];
  const [mailExpanded, setMailExpanded] = useState(pathname.includes("/mail"));
  const currentMailFolder = (searchParams?.get("folder") as (typeof mailFolders)[number]["folder"] | null) ?? "inbox";
  const isMailActive = pathname.includes("/mail");
  const displayName = variant === "parent" ? user?.guardianName ?? user?.studentName ?? "Parent" : user?.studentName ?? "Student";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    if (isMailActive) {
      setMailExpanded(true);
    }
  }, [isMailActive]);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur">
            <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#082f49_0%,#0f766e_48%,#f59e0b_100%)] p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-base font-semibold">
                  {initials || "P"}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-lg font-semibold">{displayName}</p>
                  <p className="break-words text-xs uppercase tracking-[0.2em] text-white/75">
                    {variant === "parent" ? "Parent portal" : "Student portal"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="border-white/10 bg-white/15 text-white hover:bg-white/15">{user?.organizationName ?? "Organization"}</Badge>
                {user ? (
                  <Badge className={aiReady ? "border-emerald-300/20 bg-emerald-400/15 text-emerald-50 hover:bg-emerald-400/15" : "border-amber-300/20 bg-amber-400/15 text-amber-50 hover:bg-amber-400/15"}>
                    {aiReady ? aiLabel : "AI key missing"}
                  </Badge>
                ) : null}
                <Badge className="border-white/10 bg-black/10 text-white hover:bg-black/10">{user?.studentStatus ?? "ACTIVE"}</Badge>
              </div>
              <p className="mt-4 text-sm text-white/80">
                {variant === "parent"
                  ? "Follow academics, fees, notices, and documents from one organized guardian workspace."
                  : "Stay on top of classes, assessments, dues, and updates from one focused student workspace."}
              </p>
            </div>

            <nav className="mt-5 space-y-1.5">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                      active
                        ? "bg-slate-950 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.75)]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="min-w-0 break-words">{item.label}</span>
                  </Link>
                );
              })}
              <div className="rounded-2xl border border-border/70 bg-background/70 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMailExpanded((current) => !current)}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                    isMailActive
                      ? "bg-slate-950 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.75)]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3">
                    <Mail className="h-4 w-4" />
                    Mail
                  </span>
                  <ChevronDown className={["h-4 w-4 transition-transform", mailExpanded ? "rotate-180" : ""].join(" ")} />
                </button>
                {mailExpanded ? (
                  <div className="mt-1 space-y-1 px-1 pb-1">
                    {mailFolders.map((item) => {
                      const href = `${variant === "parent" ? "/portal/parent" : "/portal/student"}/mail?folder=${item.folder}`;
                      const active = pathname.includes("/mail") && currentMailFolder === item.folder;
                      const unreadCount = mailCountsQuery.data?.counts?.[item.folder]?.unread ?? 0;
                      return (
                        <Link
                          key={item.folder}
                          href={href}
                          className={[
                            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                            active
                              ? "bg-slate-950 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.75)]"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                          ].join(" ")}
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
            </nav>

            <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-muted/30 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Quick access
              </div>
              <p className="mt-2 text-sm text-slate-600">Use the report card, activity, and documents sections most often for daily follow-up.</p>
              <Button variant="outline" className="mt-4 w-full justify-start rounded-2xl" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Portal workspace</p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{activeItem.label}</h1>
                <p className="text-sm text-slate-600">
                  {variant === "parent"
                    ? "A cleaner guardian view with quick movement between academics, notices, fees, and downloadable records."
                    : "A cleaner student view with direct movement between classes, tasks, results, and updates."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">
                  <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                  {user?.studentName ?? "Student"}
                </Badge>
                <Badge
                  className={
                    aiReady
                      ? "rounded-full border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/10"
                      : "rounded-full border-amber-300/30 bg-amber-500/10 px-3 py-1 text-amber-700 hover:bg-amber-500/10"
                  }
                >
                  {aiReady ? aiLabel : "AI key missing"}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {user?.email ?? "portal-user"}
                </Badge>
                <Button variant="outline" className="rounded-full lg:hidden" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>

            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex max-w-full shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                      active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="break-words">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
