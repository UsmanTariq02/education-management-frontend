"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useAuth } from "@/providers/auth-provider";

export function AppSidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-card/85 backdrop-blur lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <Link href="/dashboard" className="flex items-center gap-3 px-6 py-6">
          <div className="rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 p-2.5 text-sky-700 shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">EduFlow</p>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{user?.organizationName ?? "Platform Console"}</p>
          </div>
        </Link>
        <Separator />
        <ScrollArea className="flex-1 px-4 py-6">
          <SidebarNav />
        </ScrollArea>
      </div>
    </aside>
  );
}
