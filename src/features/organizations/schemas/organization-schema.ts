import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  email: z.union([z.string().email("Enter a valid email"), z.literal("")]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type OrganizationSchema = z.infer<typeof organizationSchema>;
