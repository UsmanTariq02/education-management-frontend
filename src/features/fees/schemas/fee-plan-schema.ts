import { z } from "zod";

export const feePlanSchema = z.object({
  studentId: z.string().uuid("Select a student"),
  batchId: z.string().uuid().optional().or(z.literal("")),
  monthlyFee: z.coerce.number().positive("Monthly fee must be greater than zero"),
  dueDay: z.coerce.number().int().min(1).max(31),
  isActive: z.boolean().default(true),
});

export type FeePlanSchema = z.infer<typeof feePlanSchema>;
