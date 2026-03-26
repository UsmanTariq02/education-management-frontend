import { z } from "zod";

export const timetableSchema = z.object({
  academicSessionId: z.union([z.string().uuid(), z.literal("")]).optional(),
  batchId: z.string().uuid("Select a batch"),
  subjectId: z.string().uuid("Select a subject"),
  teacherId: z.union([z.string().uuid(), z.literal("")]).optional(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  deliveryMode: z.enum(["OFFLINE", "ONLINE", "HYBRID"]).default("OFFLINE"),
  onlineClassProvider: z.union([z.enum(["GOOGLE_MEET", "ZOOM"]), z.literal("")]).optional(),
  onlineMeetingUrl: z.string().optional(),
  onlineMeetingCode: z.string().optional(),
  externalCalendarEventId: z.string().optional(),
  autoAttendanceEnabled: z.boolean().default(false),
  attendanceJoinThresholdMinutes: z.coerce.number().int().min(1).default(5),
  room: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type TimetableSchema = z.infer<typeof timetableSchema>;
