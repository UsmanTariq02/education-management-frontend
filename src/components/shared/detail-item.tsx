import { cn } from "@/lib/utils";

interface DetailItemProps {
  label: string;
  value: string;
  className?: string;
}

export function DetailItem({ label, value, className }: DetailItemProps) {
  return (
    <div className={cn("rounded-xl border border-border/70 bg-muted/25 p-3", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-foreground">{value}</p>
    </div>
  );
}
