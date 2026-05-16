import { z } from "zod";

export const onlineClassProviderSettingSchema = z.object({
  provider: z.enum(["GOOGLE_MEET", "ZOOM"]).default("GOOGLE_MEET"),
  integrationEnabled: z.boolean().default(false),
  autoCreateMeetLinks: z.boolean().default(false),
  autoSyncParticipants: z.boolean().default(false),
  calendarId: z.string().max(255).optional().or(z.literal("")),
  impersonatedUserEmail: z.string().email("Enter a valid delegated admin email").optional().or(z.literal("")),
});

export type OnlineClassProviderSettingSchema = z.infer<typeof onlineClassProviderSettingSchema>;
