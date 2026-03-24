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
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error.message}</p> : null}
    </div>
  );
}
