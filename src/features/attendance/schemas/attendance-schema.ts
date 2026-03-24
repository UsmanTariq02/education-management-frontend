import { z } from "zod";

export const attendanceSchema = z.object({
  studentId: z.string().uuid("Select a student"),
  batchId: z.string().uuid("Select a batch"),
  attendanceDate: z.string().min(1, "Date is required"),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]),
  remarks: z.string().optional(),
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;
