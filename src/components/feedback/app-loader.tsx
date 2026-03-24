import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLoaderProps {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

export function AppLoader({
  title = "Loading workspace",
  description = "Preparing operational data, permissions, and navigation.",
  compact = false,
  className,
}: AppLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] items-center justify-center px-4 py-10",
        compact ? "min-h-[32vh] py-6" : "min-h-screen",
        className,
      )}
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border bg-card/95 p-8 shadow-xl">
        <div className="absolute inset-0 bg-[size:24px_24px] bg-grid-fade opacity-40" />
        <div className="relative space-y-8">
          <div className="mx-auto flex w-fit items-center gap-4 rounded-full border bg-background/80 px-5 py-3 shadow-sm">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/25" />
              <div className="relative rounded-2xl bg-primary/10 p-3 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">EduFlow SaaS</p>
              <p className="text-lg font-semibold">{title}</p>
            </div>
          </div>

          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="mx-auto flex max-w-md items-center gap-2">
              <span className="h-2 flex-1 animate-pulse rounded-full bg-primary/80 [animation-delay:0ms]" />
              <span className="h-2 flex-1 animate-pulse rounded-full bg-primary/55 [animation-delay:120ms]" />
              <span className="h-2 flex-1 animate-pulse rounded-full bg-primary/30 [animation-delay:240ms]" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              "Syncing fee records",
              "Checking permissions",
              "Rendering dashboards",
            ].map((label) => (
              <div key={label} className="rounded-2xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
