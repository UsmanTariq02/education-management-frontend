import { format } from "date-fns";

export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | Date | null | undefined, pattern = "MMM d, yyyy") {
  if (!value) return "N/A";
  return format(new Date(value), pattern);
}

export function formatName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(" ");
}
