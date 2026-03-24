import { z } from "zod";

export const contactInquirySchema = z.object({
  fullName: z.string().min(2, "Enter the contact name"),
  email: z.string().email("Enter a valid email address"),
  institutionName: z.string().min(2, "Enter the institution name"),
  phone: z.string().optional(),
  institutionType: z.string().min(1, "Select an institution type"),
  expectedUserCount: z.string().min(1, "Select the expected user count"),
  requestedModules: z.array(z.string()).min(1, "Select at least one module"),
  inquiryType: z.string().min(1, "Select an inquiry type"),
  message: z.string().min(10, "Share more context for the team"),
});

export type ContactInquirySchema = z.infer<typeof contactInquirySchema>;
