"use client";

interface BoxPlotSummaryProps {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  formatValue?: (value: number) => string;
}

export function BoxPlotSummary({ min, q1, median, q3, max, formatValue = (value) => `${value}` }: BoxPlotSummaryProps) {
  const range = Math.max(max - min, 1);
  const left = ((q1 - min) / range) * 100;
  const width = ((q3 - q1) / range) * 100;
  const medianOffset = ((median - min) / range) * 100;

  return (
    <div className="space-y-4">
      <div className="relative h-20">
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-slate-300" />
        <div className="absolute top-1/2 h-10 w-[2px] -translate-y-1/2 bg-slate-400" style={{ left: "0%" }} />
        <div className="absolute top-1/2 h-10 w-[2px] -translate-y-1/2 bg-slate-400" style={{ left: "100%" }} />
        <div
          className="absolute top-1/2 h-12 -translate-y-1/2 rounded-xl border-2 border-sky-500 bg-sky-100/80"
          style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
        />
        <div className="absolute top-1/2 h-14 w-[3px] -translate-y-1/2 bg-sky-800" style={{ left: `${medianOffset}%` }} />
      </div>
      <div className="grid grid-cols-5 gap-2 text-center text-xs text-muted-foreground">
        <div>
          <p className="uppercase tracking-[0.14em]">Min</p>
          <p className="mt-1 font-semibold text-foreground">{formatValue(min)}</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.14em]">Q1</p>
          <p className="mt-1 font-semibold text-foreground">{formatValue(q1)}</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.14em]">Median</p>
          <p className="mt-1 font-semibold text-foreground">{formatValue(median)}</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.14em]">Q3</p>
          <p className="mt-1 font-semibold text-foreground">{formatValue(q3)}</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.14em]">Max</p>
          <p className="mt-1 font-semibold text-foreground">{formatValue(max)}</p>
        </div>
      </div>
    </div>
  );
}
