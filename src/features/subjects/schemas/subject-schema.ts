import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type SubjectSchema = z.infer<typeof subjectSchema>;
