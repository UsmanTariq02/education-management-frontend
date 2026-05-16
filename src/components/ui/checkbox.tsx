"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.ComponentProps<"input">, "type"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  containerClassName?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, containerClassName, checked, indeterminate, ...props }, ref) => {
    const inputId = React.useId();
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = Boolean(indeterminate);
      }
    }, [indeterminate]);

    return (
      <label className={cn("flex items-start gap-3", containerClassName)} htmlFor={inputId}>
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            id={inputId}
            ref={innerRef}
            type="checkbox"
            checked={checked}
            className={cn("peer sr-only", className)}
            {...props}
          />
          <span className="flex h-5 w-5 items-center justify-center rounded-md border border-input bg-background text-transparent transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:border-sky-600 peer-checked:bg-sky-600 peer-checked:text-white" />
          <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        {label || description ? (
          <span className="space-y-1">
            {label ? <span className="block text-sm font-medium text-foreground">{label}</span> : null}
            {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
          </span>
        ) : null}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
