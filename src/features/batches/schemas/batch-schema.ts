import { z } from "zod";

export const batchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  scheduleInfo: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type BatchSchema = z.infer<typeof batchSchema>;
