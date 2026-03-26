"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ExportConfig } from "@/lib/utils/export";
import { exportRowsToCsv, exportRowsToPdf } from "@/lib/utils/export";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  action?: React.ReactNode;
  exportConfig?: ExportConfig;
}

export function FilterBar({ search, onSearchChange, searchPlaceholder, filters, action, exportConfig }: FilterBarProps) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
            placeholder={searchPlaceholder ?? "Search by name, email, phone, code..."}
          />
          </div>
          {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {exportConfig ? (
            <>
              <Button variant="outline" onClick={() => exportRowsToCsv(exportConfig)}>
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => exportRowsToPdf(exportConfig)}>
                Export PDF
              </Button>
            </>
          ) : null}
          {action}
        </div>
      </div>
    </div>
  );
}
