import { z } from "zod";

export const reminderSchema = z.object({
  studentId: z.string().uuid("Select a student"),
  feeRecordId: z.string().uuid().optional().or(z.literal("")),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL", "MANUAL"]),
  message: z.string().min(10, "Message should be more descriptive"),
  status: z.enum(["PENDING", "SENT", "FAILED"]).default("SENT"),
});

export type ReminderSchema = z.infer<typeof reminderSchema>;
