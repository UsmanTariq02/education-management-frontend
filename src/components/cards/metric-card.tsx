import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneClasses = {
  default: {
    card: "",
    iconWrap: "bg-primary/10 text-primary",
  },
  sky: {
    card: "border-sky-200 bg-sky-50/60",
    iconWrap: "bg-sky-100 text-sky-700",
  },
  emerald: {
    card: "border-emerald-200 bg-emerald-50/60",
    iconWrap: "bg-emerald-100 text-emerald-700",
  },
  amber: {
    card: "border-amber-200 bg-amber-50/60",
    iconWrap: "bg-amber-100 text-amber-700",
  },
  rose: {
    card: "border-rose-200 bg-rose-50/60",
    iconWrap: "bg-rose-100 text-rose-700",
  },
  violet: {
    card: "border-violet-200 bg-violet-50/60",
    iconWrap: "bg-violet-100 text-violet-700",
  },
} as const;

interface MetricCardProps {
  title: string;
  value: string;
  helper: string;
  trend?: number;
  icon?: LucideIcon;
  tone?: keyof typeof toneClasses;
}

export function MetricCard({ title, value, helper, trend, icon: Icon, tone = "default" }: MetricCardProps) {
  const selectedTone = toneClasses[tone];

  return (
    <Card className={selectedTone.card}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {Icon ? (
            <div className={cn("rounded-2xl p-2", selectedTone.iconWrap)}>
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
          </div>
          {trend !== undefined ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
              )}
            >
              {trend >= 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
