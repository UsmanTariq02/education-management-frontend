export const PERMISSIONS = {
  users: ["users.create", "users.read", "users.update", "users.delete"],
  students: ["students.create", "students.read", "students.update", "students.delete"],
  batches: ["batches.create", "batches.read", "batches.update", "batches.delete"],
  fees: ["fees.create", "fees.read", "fees.update", "fees.delete"],
  attendance: ["attendance.create", "attendance.read", "attendance.update", "attendance.delete"],
  reminders: ["reminders.create", "reminders.read", "reminders.update", "reminders.delete"],
  reports: ["reports.read"],
  settings: ["settings.update"],
} as const;
