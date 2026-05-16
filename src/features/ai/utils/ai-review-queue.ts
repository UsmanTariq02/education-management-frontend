"use client";

export type AiReviewKind =
  | "NOTICE"
  | "NOTICE_CAMPAIGN"
  | "MAIL"
  | "SUPPORT"
  | "ADMISSION"
  | "RISK"
  | "FEES"
  | "ATTENDANCE"
  | "REMINDER";
export type AiReviewStatus = "DRAFT" | "APPROVED" | "ARCHIVED";

export interface AiReviewItem {
  id: string;
  kind: AiReviewKind;
  title: string;
  summary: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  status: AiReviewStatus;
  archivedAt: string | null;
  approvedAt: string | null;
}

export function createAiReviewItem(input: {
  kind: AiReviewKind;
  title: string;
  summary: string;
  body: string;
  status?: AiReviewStatus;
}): AiReviewItem {
  const createdAt = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    body: input.body,
    createdAt,
    updatedAt: createdAt,
    status: input.status ?? "DRAFT",
    archivedAt: null,
    approvedAt: null,
  };
}

export function updateAiReviewItem(
  queue: AiReviewItem[],
  id: string,
  patch: Partial<Pick<AiReviewItem, "status" | "title" | "summary" | "body">>,
) {
  return queue.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
}

export function latestReviewItem(
  queue: AiReviewItem[],
  kind: AiReviewKind | undefined = undefined,
  status: AiReviewStatus | undefined = undefined,
) {
  const items = queue.filter((item) => (kind ? item.kind === kind : true) && (status ? item.status === status : true));
  return items.length ? items[items.length - 1] : null;
}
