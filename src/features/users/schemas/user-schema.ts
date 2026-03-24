import { z } from "zod";

export const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.union([z.string().min(8, "Password must be at least 8 characters"), z.literal("")]).optional(),
  organizationId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  roleIds: z.array(z.string().uuid()).min(1, "Select at least one role"),
});

export type UserSchema = z.infer<typeof userSchema>;
