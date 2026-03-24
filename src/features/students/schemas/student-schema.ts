import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianPhone: z.string().min(1, "Guardian phone is required"),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  admissionDate: z.string().min(1, "Admission date is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED"]).default("ACTIVE"),
  batchIds: z.array(z.string().uuid()).default([]),
});

export type StudentSchema = z.infer<typeof studentSchema>;
