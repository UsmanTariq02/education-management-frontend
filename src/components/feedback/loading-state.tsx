import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-3xl border border-border/40 bg-muted/60" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-3xl border border-border/40 bg-muted/60 xl:col-span-2" />
        <Skeleton className="h-80 rounded-3xl border border-border/40 bg-muted/60" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-2xl border border-border/40 bg-muted/60" />
        ))}
      </div>
    </div>
  );
}
