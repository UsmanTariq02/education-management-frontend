import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  email: z.union([z.string().email("Enter a valid email"), z.literal("")]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
  subscriptionStatus: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"]).default("TRIAL"),
  trialDays: z.coerce.number().int().min(0, "Trial days cannot be negative").default(14),
  trialStartsAt: z.string().optional(),
  trialEndsAt: z.string().optional(),
  subscriptionStartsAt: z.string().optional(),
  subscriptionEndsAt: z.string().optional(),
  subscriptionNotes: z.string().optional(),
  aiDraftApprovalRequired: z.boolean().default(false),
  userLimit: z.coerce.number().int().min(1, "User limit must be at least 1").default(10),
  studentLimit: z.coerce.number().int().min(1, "Student limit must be at least 1").default(500),
  openAiApiKey: z.string().optional(),
  enabledModules: z.array(
    z.enum(["USERS", "STUDENTS", "PORTALS", "BATCHES", "ACADEMICS", "FEES", "ATTENDANCE", "REMINDERS", "MAIL", "REPORTS", "ACTIVITY_LOGS", "SETTINGS", "MEDIA"]),
  ).min(1, "Select at least one enabled module"),
});

export type OrganizationSchema = z.infer<typeof organizationSchema>;
