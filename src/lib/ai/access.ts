import type { AuthUser, PortalAuthUser } from "@/types/auth";
import type { Organization } from "@/types/domain";

type AiAccessEntity = Pick<AuthUser, "hasOpenAiApiKey" | "hasTrialAiAccess" | "subscriptionStatus" | "trialEndsAt"> |
  Pick<PortalAuthUser, "hasOpenAiApiKey" | "hasTrialAiAccess"> |
  Pick<Organization, "hasOpenAiApiKey" | "hasTrialAiAccess" | "subscriptionStatus" | "trialEndsAt">;

export function hasAiAccess(entity?: AiAccessEntity | null): boolean {
  return Boolean(entity?.hasOpenAiApiKey || entity?.hasTrialAiAccess);
}

export function getAiAccessLabel(entity?: AiAccessEntity | null): string {
  if (!entity) {
    return "AI key missing";
  }

  if (entity.hasOpenAiApiKey) {
    return "AI ready";
  }

  if (entity.hasTrialAiAccess) {
    return "Trial AI";
  }

  return "AI key missing";
}
