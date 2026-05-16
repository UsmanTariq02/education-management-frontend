import { z } from "zod";

export const batchSubjectAssignmentSchema = z.object({
  academicSessionId: z.union([z.string().uuid(), z.literal("")]).optional(),
  batchId: z.string().uuid("Select a batch"),
  subjectId: z.string().uuid("Select a subject"),
  teacherId: z.union([z.string().uuid(), z.literal("")]).optional(),
  weeklyClasses: z.coerce.number().int().min(1, "At least one weekly class is required").default(1),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type BatchSubjectAssignmentSchema = z.infer<typeof batchSubjectAssignmentSchema>;
