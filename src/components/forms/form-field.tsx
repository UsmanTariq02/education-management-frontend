import { type FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: FieldError;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium tracking-tight">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div className="space-y-1.5">
        {children}
        {error ? <p className="text-xs leading-5 text-destructive">{error.message}</p> : null}
      </div>
    </div>
  );
}
