import { z } from "zod";

export const teacherSchema = z
  .object({
    employeeId: z.string().min(1, "Employee ID is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.union([z.string().email("Enter a valid email"), z.literal("")]).optional(),
    phone: z.string().min(1, "Phone is required"),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    joinedAt: z.string().min(1, "Joined date is required"),
    isActive: z.boolean().default(true),
    createLoginAccess: z.boolean().default(false),
    accessPassword: z.string().optional(),
    accessIsActive: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (!value.createLoginAccess) {
      return;
    }

    if (!value.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Email is required when login access is enabled",
      });
    }

    if (!value.accessPassword || value.accessPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accessPassword"],
        message: "Access password must be at least 8 characters",
      });
    }
  });

export type TeacherSchema = z.infer<typeof teacherSchema>;
