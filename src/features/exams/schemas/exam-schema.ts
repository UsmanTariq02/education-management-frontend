import { z } from "zod";

export const examSubjectSchema = z.object({
  subjectId: z.string().uuid("Select a subject"),
  totalMarks: z.coerce.number().min(1, "Total marks must be at least 1"),
  passMarks: z.coerce.number().min(0, "Pass marks must be 0 or greater"),
});

export const examSchema = z.object({
  academicSessionId: z.union([z.string().uuid(), z.literal("")]).optional(),
  batchId: z.string().uuid("Select a batch"),
  teacherId: z.union([z.string().uuid(), z.literal("")]).optional(),
  name: z.string().min(1, "Exam name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  examDate: z.string().min(1, "Exam date is required"),
  isPublished: z.boolean().default(false),
  subjects: z.array(examSubjectSchema).min(1, "Add at least one subject"),
});

export type ExamSchema = z.infer<typeof examSchema>;
