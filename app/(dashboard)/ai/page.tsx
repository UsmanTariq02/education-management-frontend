"use client";

import { AiLabWorkspace } from "@/features/ai/components/ai-lab-workspace";
import { usePermission } from "@/hooks/use-permission";
import { ErrorState } from "@/components/feedback/error-state";

export default function AiPage() {
  const canUseAi = usePermission("ai.use");

  if (!canUseAi) {
    return <ErrorState description="You do not have access to the AI lab." />;
  }

  return <AiLabWorkspace />;
}
