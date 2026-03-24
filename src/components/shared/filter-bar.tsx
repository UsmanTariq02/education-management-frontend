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
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="relative max-w-md flex-1">
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
      <div className="flex items-center gap-2">
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
  );
}
