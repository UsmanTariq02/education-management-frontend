import type { AttendanceStatus, FeeRecordStatus, ReminderStatus } from "@/types/domain";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export function getAttendanceColor(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "#10b981";
    case "ABSENT":
      return "#ef4444";
    case "LATE":
      return "#f59e0b";
    case "LEAVE":
      return "#6366f1";
    default:
      return "#64748b";
  }
}

export function getAttendanceBadgeVariant(status: AttendanceStatus): BadgeVariant {
  switch (status) {
    case "PRESENT":
      return "success";
    case "ABSENT":
      return "danger";
    case "LATE":
      return "warning";
    case "LEAVE":
      return "secondary";
    default:
      return "outline";
  }
}

export function getFeeStatusBadgeVariant(status: FeeRecordStatus): BadgeVariant {
  switch (status) {
    case "PAID":
      return "success";
    case "OVERDUE":
      return "danger";
    case "PARTIAL":
      return "warning";
    case "WAIVED":
      return "secondary";
    case "PENDING":
    default:
      return "outline";
  }
}

export function getReminderStatusBadgeVariant(status: ReminderStatus): BadgeVariant {
  switch (status) {
    case "SENT":
      return "success";
    case "FAILED":
      return "danger";
    case "PENDING":
    default:
      return "warning";
  }
}
