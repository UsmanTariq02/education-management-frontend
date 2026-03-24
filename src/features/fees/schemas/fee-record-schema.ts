import { z } from "zod";

export const feeRecordSchema = z.object({
  studentId: z.string().uuid("Select a student"),
  batchId: z.string().uuid().optional().or(z.literal("")),
  feePlanId: z.string().uuid("Select a fee plan"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
  amountDue: z.coerce.number().nonnegative(),
  amountPaid: z.coerce.number().nonnegative().default(0),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"]).default("PENDING"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "CHEQUE", "OTHER"]).optional(),
  remarks: z.string().optional(),
});

export type FeeRecordSchema = z.infer<typeof feeRecordSchema>;
