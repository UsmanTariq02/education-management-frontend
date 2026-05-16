import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 overflow-hidden rounded-[1.75rem] border border-border/60 bg-[linear-gradient(135deg,_rgba(255,255,255,0.94)_0%,_rgba(248,250,252,0.82)_100%)] p-5 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between md:p-6",
        className,
      )}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-primary/0 via-primary/35 to-primary/0" />
      <div className="space-y-3">
        {eyebrow ? (
          <p className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3 md:justify-end">{actions}</div> : null}
    </div>
  );
}
