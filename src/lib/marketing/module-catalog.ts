export const publicModuleCatalog = [
  {
    key: "USERS",
    title: "Users and access control",
    description: "Create admin and staff accounts, assign roles, and keep module access governed by permission design.",
  },
  {
    key: "STUDENTS",
    title: "Student records",
    description: "Manage admission data, guardian details, student profiles, and lifecycle status in one workspace.",
  },
  {
    key: "PORTALS",
    title: "Student and parent portals",
    description: "Provision portal access so families can review attendance, fees, results, and student updates.",
  },
  {
    key: "BATCHES",
    title: "Batches and classes",
    description: "Structure classes and cohorts before connecting timetables, attendance, exams, and fee operations.",
  },
  {
    key: "ACADEMICS",
    title: "Academic management",
    description: "Run sessions, subjects, teachers, assignments, timetables, exams, results, and report cards together.",
  },
  {
    key: "FEES",
    title: "Fee plans and collections",
    description: "Define fee plans, track payments, manage dues, and keep overdue visibility clear for operations teams.",
  },
  {
    key: "ATTENDANCE",
    title: "Attendance",
    description: "Capture daily attendance with present, absent, late, and leave tracking by class and student.",
  },
  {
    key: "REMINDERS",
    title: "Reminders and automation",
    description: "Send manual and automated fee follow-ups with templates, schedules, channels, and delivery history.",
  },
  {
    key: "REPORTS",
    title: "Reports and analytics",
    description: "Review collection, attendance, reminder, and academic trends with chart-ready summaries for management.",
  },
  {
    key: "ACTIVITY_LOGS",
    title: "Activity logs",
    description: "Audit who changed what across operational workflows so review and accountability stay easier.",
  },
  {
    key: "SETTINGS",
    title: "Organization settings",
    description: "Manage institution identity, tenant configuration, and account-level operational preferences.",
  },
  {
    key: "MEDIA",
    title: "Media and documents",
    description: "Store organization assets and student documents such as logos, IDs, forms, and academic records.",
  },
] as const;

export const publicModuleOptions = publicModuleCatalog.map((module) => module.title);
