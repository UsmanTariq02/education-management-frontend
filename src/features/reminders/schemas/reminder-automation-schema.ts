import { z } from "zod";

export const reminderTemplateSchema = z.object({
  name: z.string().min(2, "Template name is required"),
  code: z.string().min(2, "Template code is required").max(100, "Code is too long"),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL", "MANUAL"]),
  target: z.enum(["STUDENT", "GUARDIAN", "BOTH"]),
  subject: z.string().max(255, "Subject is too long").optional().or(z.literal("")),
  body: z.string().min(10, "Template body should be descriptive"),
  isActive: z.boolean().default(true),
});

export const reminderRuleSchema = z.object({
  name: z.string().min(2, "Rule name is required"),
  templateId: z.string().uuid("Select a template"),
  trigger: z.enum(["FEE_DUE", "FEE_OVERDUE", "PAYMENT_RECEIVED"]),
  offsetDays: z.coerce.number().int().min(0, "Offset must be zero or greater"),
  isActive: z.boolean().default(true),
});

export const reminderProviderSettingSchema = z.object({
  autoRemindersEnabled: z.boolean().default(false),
  emailEnabled: z.boolean().default(false),
  whatsappEnabled: z.boolean().default(false),
  smsEnabled: z.boolean().default(false),
  paymentConfirmationEnabled: z.boolean().default(false),
  senderName: z.string().max(150, "Sender name is too long").optional().or(z.literal("")),
  replyToEmail: z.string().email("Enter a valid reply-to email").optional().or(z.literal("")),
});

export type ReminderTemplateSchema = z.infer<typeof reminderTemplateSchema>;
export type ReminderRuleSchema = z.infer<typeof reminderRuleSchema>;
export type ReminderProviderSettingSchema = z.infer<typeof reminderProviderSettingSchema>;
