import { z } from "zod";

export const studentSchema = z
  .object({
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
    createStudentPortal: z.boolean().default(false),
    studentPortalPassword: z.string().optional(),
    createParentPortal: z.boolean().default(false),
    parentPortalPassword: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.createStudentPortal) {
      if (!value.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Student email is required for student portal access",
        });
      }
      if (!value.studentPortalPassword || value.studentPortalPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["studentPortalPassword"],
          message: "Student portal password must be at least 8 characters",
        });
      }
    }

    if (value.createParentPortal) {
      if (!value.guardianEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianEmail"],
          message: "Guardian email is required for parent portal access",
        });
      }
      if (!value.parentPortalPassword || value.parentPortalPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parentPortalPassword"],
          message: "Parent portal password must be at least 8 characters",
        });
      }
    }
  });

export type StudentSchema = z.infer<typeof studentSchema>;
