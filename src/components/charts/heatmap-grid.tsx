"use client";

import { cn } from "@/lib/utils";

export interface HeatmapCell {
  label: string;
  value: number;
  hint?: string;
}

interface HeatmapGridProps {
  cells: HeatmapCell[];
  columns?: number;
  className?: string;
}

function backgroundFor(value: number, max: number) {
  if (max <= 0) {
    return "bg-slate-100 text-slate-500";
  }

  const ratio = value / max;
  if (ratio >= 0.85) return "bg-emerald-600 text-white";
  if (ratio >= 0.65) return "bg-emerald-500 text-white";
  if (ratio >= 0.45) return "bg-emerald-300 text-emerald-950";
  if (ratio >= 0.25) return "bg-emerald-200 text-emerald-950";
  return "bg-slate-100 text-slate-700";
}

export function HeatmapGrid({ cells, columns = 7, className }: HeatmapGridProps) {
  const max = Math.max(...cells.map((cell) => cell.value), 0);

  return (
    <div
      className={cn("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells.map((cell) => (
        <div
          key={cell.label}
          className={cn("rounded-xl border border-border/50 p-3 text-center", backgroundFor(cell.value, max))}
          title={cell.hint ?? `${cell.label}: ${cell.value}`}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-80">{cell.label}</p>
          <p className="mt-2 text-lg font-semibold">{cell.value}</p>
          {cell.hint ? <p className="mt-1 text-[11px] opacity-80">{cell.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
