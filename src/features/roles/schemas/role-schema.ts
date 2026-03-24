import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export type RoleSchema = z.infer<typeof roleSchema>;
