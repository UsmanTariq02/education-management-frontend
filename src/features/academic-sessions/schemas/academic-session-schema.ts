import { z } from "zod";

export const academicSessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isCurrent: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type AcademicSessionSchema = z.infer<typeof academicSessionSchema>;
