import { z } from "zod";

export const assignmentSchema = z.object({
  academicSessionId: z.string().optional(),
  batchId: z.string().min(1, "Batch is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().optional(),
  title: z.string().min(3, "Title is required"),
  code: z.string().min(2, "Code is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
  maxMarks: z.coerce.number().min(0, "Marks must be zero or greater"),
  dueAt: z.string().min(1, "Due date is required"),
  allowLateSubmission: z.boolean().default(false),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;
