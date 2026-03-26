import { z } from "zod";

export const examResultItemSchema = z.object({
  examSubjectId: z.string().uuid(),
  subjectId: z.string().uuid(),
  obtainedMarks: z.coerce.number().min(0, "Marks cannot be negative"),
  remarks: z.string().optional(),
});

export const examResultSchema = z.object({
  examId: z.string().uuid("Select an exam"),
  studentId: z.string().uuid("Select a student"),
  remarks: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  items: z.array(examResultItemSchema).min(1, "Add at least one subject result"),
});

export type ExamResultSchema = z.infer<typeof examResultSchema>;
