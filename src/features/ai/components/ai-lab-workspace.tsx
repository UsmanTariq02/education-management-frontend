"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bot,
  CheckCircle2,
  Copy,
  Archive,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  Mic2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { aiApi } from "@/features/ai/api/ai-api";
import { batchesApi } from "@/features/batches/api/batches-api";
import { organizationsApi } from "@/features/organizations/api/organizations-api";
import { rolesApi } from "@/features/roles/api/roles-api";
import { useAuth } from "@/providers/auth-provider";
import { normalizeApiError } from "@/lib/api/errors";
import { getAiAccessLabel, hasAiAccess } from "@/lib/ai/access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationScopeBanner } from "@/components/shared/organization-scope-banner";
import {
  createAiReviewItem,
  latestReviewItem,
  updateAiReviewItem,
  type AiReviewItem,
  type AiReviewKind,
} from "@/features/ai/utils/ai-review-queue";
import { buildStudentImportCsv } from "@/features/students/utils/student-bulk-import";
import type { StudentImportDraftRow } from "@/features/students/utils/student-bulk-import";
import type {
  AiAdmissionExtraction,
  AnnouncementDeliveryAnalytics,
  AiPromptPreset,
  AiMailDraft,
  AiNoticeDraft,
  NoticeCampaignAnalytics,
  NoticeCampaignAudience,
  NoticeCampaignSummary,
  AiSupportReply,
} from "@/types/domain";
import type { ScheduleNoticeCampaignAiDto } from "@/types/dto";

type ChatMessage = { role: "user" | "assistant"; content: string };

const emptyAdmissionStudent: AiAdmissionExtraction["student"] = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  guardianName: "",
  guardianEmail: "",
  guardianPhone: "",
  address: "",
  dateOfBirth: "",
  admissionDate: "",
  status: "ACTIVE",
  batchCodes: [],
};

function normalizeAdmissionExtraction(value: unknown): AiAdmissionExtraction {
  const candidate = value as {
    student?: Partial<AiAdmissionExtraction["student"]> | null;
    missingFields?: unknown;
    notes?: unknown;
    confidence?: unknown;
  } | null;

  const student = candidate?.student ?? {};
  const batchCodes = Array.isArray(student.batchCodes) ? student.batchCodes.filter((item): item is string => typeof item === "string") : [];

  return {
    student: {
      ...emptyAdmissionStudent,
      firstName: typeof student.firstName === "string" ? student.firstName : "",
      lastName: typeof student.lastName === "string" ? student.lastName : "",
      email: typeof student.email === "string" ? student.email : "",
      phone: typeof student.phone === "string" ? student.phone : "",
      guardianName: typeof student.guardianName === "string" ? student.guardianName : "",
      guardianEmail: typeof student.guardianEmail === "string" ? student.guardianEmail : "",
      guardianPhone: typeof student.guardianPhone === "string" ? student.guardianPhone : "",
      address: typeof student.address === "string" ? student.address : "",
      dateOfBirth: typeof student.dateOfBirth === "string" ? student.dateOfBirth : "",
      admissionDate: typeof student.admissionDate === "string" ? student.admissionDate : "",
      status:
        student.status === "ACTIVE" || student.status === "INACTIVE" || student.status === "SUSPENDED" || student.status === "GRADUATED"
          ? student.status
          : "ACTIVE",
      batchCodes,
    },
    missingFields: Array.isArray(candidate?.missingFields) ? candidate!.missingFields.filter((item): item is string => typeof item === "string") : [],
    notes: Array.isArray(candidate?.notes) ? candidate!.notes.filter((item): item is string => typeof item === "string") : [],
    confidence: typeof candidate?.confidence === "number" && Number.isFinite(candidate.confidence) ? Math.min(Math.max(candidate.confidence, 0), 1) : 0,
  };
}

function normalizeDraftList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeNoticeDraft(value: unknown): AiNoticeDraft {
  const candidate = value as Partial<AiNoticeDraft> | null;
  return {
    title: typeof candidate?.title === "string" ? candidate.title : "",
    subject: typeof candidate?.subject === "string" ? candidate.subject : "",
    body: typeof candidate?.body === "string" ? candidate.body : "",
    audienceSummary: typeof candidate?.audienceSummary === "string" ? candidate.audienceSummary : "",
    tone: typeof candidate?.tone === "string" ? candidate.tone : "",
    callToAction: typeof candidate?.callToAction === "string" ? candidate.callToAction : "",
    keyPoints: normalizeDraftList(candidate?.keyPoints),
  };
}

function normalizeMailDraft(value: unknown): AiMailDraft {
  const candidate = value as Partial<AiMailDraft> | null;
  return {
    subject: typeof candidate?.subject === "string" ? candidate.subject : "",
    body: typeof candidate?.body === "string" ? candidate.body : "",
    tone: typeof candidate?.tone === "string" ? candidate.tone : "",
    followUp: typeof candidate?.followUp === "string" ? candidate.followUp : "",
    keyPoints: normalizeDraftList(candidate?.keyPoints),
  };
}

function normalizeSupportReply(value: unknown): AiSupportReply {
  const candidate = value as Partial<AiSupportReply> | null;
  return {
    reply: typeof candidate?.reply === "string" ? candidate.reply : "",
    escalationNeeded: Boolean(candidate?.escalationNeeded),
    reason: typeof candidate?.reason === "string" ? candidate.reason : "",
    suggestedActions: normalizeDraftList(candidate?.suggestedActions),
  };
}

function normalizeNoticeCampaignDraft(value: unknown): ScheduleNoticeCampaignAiDto | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<ScheduleNoticeCampaignAiDto>;
  if (
    typeof candidate.title !== "string" ||
    typeof candidate.body !== "string" ||
    typeof candidate.audience !== "string"
  ) {
    return null;
  }

  return {
    title: candidate.title,
    body: candidate.body,
    category: typeof candidate.category === "string" ? candidate.category : undefined,
    audience: candidate.audience as NoticeCampaignAudience,
    isPinned: candidate.isPinned,
    publishedAt: typeof candidate.publishedAt === "string" ? candidate.publishedAt : undefined,
    expiresAt: typeof candidate.expiresAt === "string" ? candidate.expiresAt : undefined,
    targetScope: typeof candidate.targetScope === "string" ? candidate.targetScope : undefined,
    promptPreset: candidate.promptPreset,
    organizationId: typeof candidate.organizationId === "string" ? candidate.organizationId : undefined,
  };
}

const promptPresetOptions: Array<{ value: AiPromptPreset; label: string; description: string }> = [
  { value: "STANDARD", label: "Standard", description: "Balanced output for general school tasks." },
  { value: "CONCISE", label: "Concise", description: "Short and direct drafts with less filler." },
  { value: "FRIENDLY", label: "Friendly", description: "Warm, encouraging language for sensitive messages." },
  { value: "FORMAL", label: "Formal", description: "More institutional language for official notices." },
  { value: "PARENT", label: "Parent-facing", description: "Plain language for guardians and families." },
  { value: "STAFF", label: "Staff-facing", description: "Operational tone for internal team workflows." },
  { value: "FINANCE", label: "Finance", description: "Focused on fees, deadlines, and payment steps." },
];

export function AiLabWorkspace() {
  const { user } = useAuth();
  const isPlatformSession = Boolean(user && !user.organizationId);
  const organizationsQuery = useQuery({
    queryKey: ["ai-organizations"],
    queryFn: () => organizationsApi.list({ page: 1, limit: 100 }),
    enabled: isPlatformSession,
  });
  const currentSettingsQuery = useQuery({
    queryKey: ["ai-current-settings"],
    queryFn: organizationsApi.currentSettings,
    enabled: Boolean(user?.organizationId) && !isPlatformSession,
  });
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | undefined>(user?.organizationId ?? undefined);
  const [promptPreset, setPromptPreset] = useState<AiPromptPreset>("STANDARD");
  const [selectedNoticeBatchIds, setSelectedNoticeBatchIds] = useState<string[]>([]);
  const [selectedNoticeRoleIds, setSelectedNoticeRoleIds] = useState<string[]>([]);
  const [noticeTargetScope, setNoticeTargetScope] = useState("");

  useEffect(() => {
    if (user?.organizationId) {
      setSelectedOrganizationId(user.organizationId);
      return;
    }

    if (!selectedOrganizationId) {
      const firstOrganization = organizationsQuery.data?.items?.[0];
      if (firstOrganization) {
        setSelectedOrganizationId(firstOrganization.id);
      }
    }
  }, [organizationsQuery.data?.items, selectedOrganizationId, user?.organizationId]);

  useEffect(() => {
    setSelectedNoticeBatchIds([]);
    setSelectedNoticeRoleIds([]);
    setNoticeTargetScope("");
  }, [selectedOrganizationId]);

  const noticeMutation = useMutation({
    mutationFn: async () =>
      aiApi.generateNotice({
        organizationId: selectedOrganizationId,
        audience: noticeAudience,
        topic: noticeTopic,
        tone: noticeTone,
        purpose: noticePurpose,
        callToAction: noticeCallToAction,
        keyPoints: splitLines(noticeKeyPoints),
        audienceContext: [noticeContext, noticeCampaignTargetScope].filter(Boolean).join("\n\n"),
        promptPreset,
      }),
    onSuccess: (data) => {
      const normalized = normalizeNoticeDraft(data);
      setNoticeResult(normalized);
      upsertReviewItem({
        kind: "NOTICE",
        title: normalized.subject,
        summary: `${normalized.audienceSummary} · ${normalized.tone}`,
        body: normalized.body,
      });
      toast.success("Notice drafted");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const noticeBatchesQuery = useQuery({
    queryKey: ["ai-notice-batches", selectedOrganizationId],
    queryFn: () => batchesApi.list({ page: 1, limit: 100 }),
    enabled: Boolean(selectedOrganizationId),
  });
  const noticeRolesQuery = useQuery({
    queryKey: ["ai-notice-roles", selectedOrganizationId],
    queryFn: rolesApi.list,
    enabled: Boolean(selectedOrganizationId),
  });

  const noticeScopeSelections = useMemo(() => {
    const selectedBatches = (noticeBatchesQuery.data?.items ?? []).filter((batch) => selectedNoticeBatchIds.includes(batch.id));
    const selectedRoles = (noticeRolesQuery.data ?? []).filter((role) => selectedNoticeRoleIds.includes(role.id));
    const batchLabel = selectedBatches.length
      ? `Batches: ${selectedBatches.map((batch) => batch.code || batch.name).join(", ")}`
      : "";
    const roleLabel = selectedRoles.length ? `Roles: ${selectedRoles.map((role) => role.name).join(", ")}` : "";
    return [batchLabel, roleLabel].filter(Boolean).join(" | ");
  }, [noticeBatchesQuery.data?.items, noticeRolesQuery.data, selectedNoticeBatchIds, selectedNoticeRoleIds]);

  const noticeCampaignTargetScope = [noticeScopeSelections, noticeTargetScope.trim()].filter(Boolean).join(" | ");

  const applyNoticeAudiencePreset = (preset: "WHOLE_SCHOOL" | "PARENTS" | "STUDENTS" | "RESET") => {
    const batches = noticeBatchesQuery.data?.items ?? [];
    const roles = noticeRolesQuery.data ?? [];
    const roleMatches = (matchers: RegExp[]) =>
      roles.filter((role) => matchers.some((matcher) => matcher.test(role.name))).map((role) => role.id);

    switch (preset) {
      case "WHOLE_SCHOOL":
        setNoticeCampaignAudience("BOTH");
        setSelectedNoticeBatchIds(batches.map((batch) => batch.id));
        setSelectedNoticeRoleIds(roleMatches([/parent/i, /guardian/i, /student/i, /teacher/i, /staff/i]));
        setNoticeTargetScope("Whole school");
        break;
      case "PARENTS":
        setNoticeCampaignAudience("PARENT");
        setSelectedNoticeBatchIds([]);
        setSelectedNoticeRoleIds(roleMatches([/parent/i, /guardian/i]));
        setNoticeTargetScope("Parents and guardians");
        break;
      case "STUDENTS":
        setNoticeCampaignAudience("STUDENT");
        setSelectedNoticeBatchIds([]);
        setSelectedNoticeRoleIds(roleMatches([/student/i]));
        setNoticeTargetScope("Students");
        break;
      case "RESET":
        setNoticeCampaignAudience("BOTH");
        setSelectedNoticeBatchIds([]);
        setSelectedNoticeRoleIds([]);
        setNoticeTargetScope("");
        break;
      default:
        break;
    }
  };

  const mailMutation = useMutation({
    mutationFn: async () =>
      aiApi.generateMailDraft({
        organizationId: selectedOrganizationId,
        recipientName: mailRecipientName,
        recipientRole: mailRecipientRole,
        threadContext: mailContext,
        tone: mailTone,
        subjectHint: mailSubjectHint,
        additionalInstructions: mailInstructions,
        promptPreset,
      }),
    onSuccess: (data) => {
      const normalized = normalizeMailDraft(data);
      setMailResult(normalized);
      upsertReviewItem({
        kind: "MAIL",
        title: normalized.subject,
        summary: `${normalized.tone} · ${normalized.followUp}`,
        body: normalized.body,
      });
      toast.success("Mail draft generated");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const supportMutation = useMutation({
    mutationFn: async (question: string) =>
      aiApi.generateSupportReply({
        organizationId: selectedOrganizationId,
        question,
        conversationSummary: [...supportMessages, { role: "user", content: question }]
          .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
          .join("\n"),
        contextBullets: splitLines(supportContext),
        tone: supportTone,
        promptPreset,
      }),
    onSuccess: (data) => {
      const normalized = normalizeSupportReply(data);
      setSupportMessages((current) => [...current, { role: "assistant", content: normalized.reply }]);
      setSupportResult(normalized);
      setSupportInput("");
      upsertReviewItem({
        kind: "SUPPORT",
        title: normalized.escalationNeeded ? "Support reply with escalation" : "Support reply",
        summary: normalized.reason,
        body: normalized.reply,
      });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const admissionMutation = useMutation({
    mutationFn: async () =>
      aiApi.extractAdmissionForm({
        organizationId: selectedOrganizationId,
        rawText: admissionText,
        sourceLabel: admissionLabel,
        promptPreset,
      }),
    onSuccess: (data) => {
      const normalized = normalizeAdmissionExtraction(data);
      setAdmissionResult(normalized);
      const studentName = [normalized.student.firstName, normalized.student.lastName].filter(Boolean).join(" ").trim() || "Admission";
      upsertReviewItem({
        kind: "ADMISSION",
        title: studentName,
        summary: `${Math.round(normalized.confidence * 100)}% confidence · ${normalized.missingFields.length} missing fields`,
        body: JSON.stringify(normalized.student, null, 2),
      });
      toast.success("Admission form extracted");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const [noticeAudience, setNoticeAudience] = useState("Parents and guardians");
  const [noticeTopic, setNoticeTopic] = useState("Monthly fee reminder");
  const [noticeTone, setNoticeTone] = useState("professional");
  const [noticePurpose, setNoticePurpose] = useState("Remind families of the fee deadline and explain the payment channels.");
  const [noticeCallToAction, setNoticeCallToAction] = useState("Please pay by the 10th of the month.");
  const [noticeKeyPoints, setNoticeKeyPoints] = useState("Deadline is the 10th\nUse the office counter or bank transfer\nLate fee applies after the due date");
  const [noticeContext, setNoticeContext] = useState("");
  const [noticeResult, setNoticeResult] = useState<AiNoticeDraft | null>(null);
  const [noticePublishAt, setNoticePublishAt] = useState("");
  const [noticeExpiresAt, setNoticeExpiresAt] = useState("");
  const [noticeCampaignAudience, setNoticeCampaignAudience] = useState<NoticeCampaignAudience>("BOTH");
  const [noticePinCampaign, setNoticePinCampaign] = useState(false);
  const [noticeCampaignCategory, setNoticeCampaignCategory] = useState("GENERAL");
  const [noticeCampaigns, setNoticeCampaigns] = useState<NoticeCampaignSummary[]>([]);

  const [mailRecipientName, setMailRecipientName] = useState("Mrs. Khan");
  const [mailRecipientRole, setMailRecipientRole] = useState("Teacher");
  const [mailTone, setMailTone] = useState("warm and concise");
  const [mailSubjectHint, setMailSubjectHint] = useState("Follow-up on homework submission");
  const [mailContext, setMailContext] = useState("The student missed the last assignment deadline. Please ask for a short status update and suggest a make-up window.");
  const [mailInstructions, setMailInstructions] = useState("");
  const [mailResult, setMailResult] = useState<AiMailDraft | null>(null);

  const [supportMessages, setSupportMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Ask me about fees, schedules, portal access, admissions, mail, or notices." },
  ]);
  const [supportInput, setSupportInput] = useState("");
  const [supportTone, setSupportTone] = useState("helpful and concise");
  const [supportContext, setSupportContext] = useState("The school uses an internal student/parent portal and in-app mail. Escalate payment exceptions to the accounts office.");
  const [supportResult, setSupportResult] = useState<AiSupportReply | null>(null);

  const [admissionLabel, setAdmissionLabel] = useState("Admission form scan");
  const [admissionText, setAdmissionText] = useState(
    "Student name: Ali Raza\nFather: Ahmed Raza\nPhone: 03001234567\nGuardian email: guardian@example.com\nClass: Grade 8 Blue\nAdmission date: 2026-05-11",
  );
  const [admissionResult, setAdmissionResult] = useState<AiAdmissionExtraction | null>(null);
  const [approvalQueue, setApprovalQueue] = useState<AiReviewItem[]>([]);
  const lastSyncedQueueRef = useRef<string>("");

  const organizationOptions = organizationsQuery.data?.items ?? [];
  const selectedOrganizationRecord = organizationOptions.find((item) => item.id === selectedOrganizationId) ?? null;
  const selectedOrganizationName =
    user?.organizationName ?? selectedOrganizationRecord?.name ?? "selected organization";

  const hasOrganization = Boolean(selectedOrganizationId);
  const aiReady = hasAiAccess(user) || hasAiAccess(selectedOrganizationRecord) || hasAiAccess(currentSettingsQuery.data);
  const aiAccessLabel = getAiAccessLabel(selectedOrganizationRecord ?? currentSettingsQuery.data ?? user);
  const trialAiEnabled = Boolean(
    (selectedOrganizationRecord && selectedOrganizationRecord.hasTrialAiAccess) ||
      currentSettingsQuery.data?.hasTrialAiAccess ||
      user?.hasTrialAiAccess,
  );

  const usageQuery = useQuery({
    queryKey: ["ai-usage", selectedOrganizationId],
    queryFn: () => aiApi.getUsage(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId) && aiReady,
  });

  const reviewQueueQuery = useQuery({
    queryKey: ["ai-review-queue", selectedOrganizationId],
    queryFn: () => aiApi.reviewQueue(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId),
  });

  const usageSummary = usageQuery.data;
  const noticeCampaignsQuery = useQuery({
    queryKey: ["notice-campaigns", selectedOrganizationId],
    queryFn: () => aiApi.listNoticeCampaigns(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId) && aiReady,
  });
  const noticeCampaignAnalyticsQuery = useQuery({
    queryKey: ["notice-campaign-analytics", selectedOrganizationId],
    queryFn: () => aiApi.noticeCampaignAnalytics(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId) && aiReady,
  });
  const noticeDeliveryAnalyticsQuery = useQuery({
    queryKey: ["notice-delivery-analytics", selectedOrganizationId],
    queryFn: () => aiApi.announcementDeliveryAnalytics(selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId) && aiReady,
  });

  useEffect(() => {
    setNoticeCampaigns(noticeCampaignsQuery.data ?? []);
  }, [noticeCampaignsQuery.data]);

  useEffect(() => {
    if (!reviewQueueQuery.data) {
      return;
    }

    const serialized = JSON.stringify(reviewQueueQuery.data);
    lastSyncedQueueRef.current = serialized;
    setApprovalQueue(reviewQueueQuery.data);
  }, [reviewQueueQuery.data]);

  const noticeCampaignAnalytics: NoticeCampaignAnalytics | null = noticeCampaignAnalyticsQuery.data ?? null;
  const noticeDeliveryAnalytics: AnnouncementDeliveryAnalytics | null = noticeDeliveryAnalyticsQuery.data ?? null;

  const noticeCampaignMutation = useMutation({
    mutationFn: async (): Promise<NoticeCampaignSummary> => {
      const payload: ScheduleNoticeCampaignAiDto = {
        organizationId: selectedOrganizationId,
        title: noticeResult?.title ?? noticeTopic,
        body: noticeResult?.body ?? noticePurpose,
        category: noticeCampaignCategory,
        audience: noticeCampaignAudience,
        isPinned: noticePinCampaign,
        publishedAt: noticePublishAt ? new Date(noticePublishAt).toISOString() : undefined,
        expiresAt: noticeExpiresAt ? new Date(noticeExpiresAt).toISOString() : undefined,
        targetScope: noticeCampaignTargetScope.trim() || undefined,
        promptPreset,
      };

      return aiApi.scheduleNoticeCampaign(payload);
    },
    onSuccess: async (campaign) => {
      setNoticeCampaigns((current) => [campaign, ...current.filter((item) => item.id !== campaign.id)].slice(0, 25));
      await noticeCampaignsQuery.refetch();
      toast.success(campaign.isPublished ? "Announcement published." : "Announcement scheduled.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const publishNoticeCampaignMutation = useMutation({
    mutationFn: async (payload: ScheduleNoticeCampaignAiDto) => aiApi.scheduleNoticeCampaign(payload),
    onSuccess: async (campaign) => {
      setNoticeCampaigns((current) => [campaign, ...current.filter((item) => item.id !== campaign.id)].slice(0, 25));
      await noticeCampaignsQuery.refetch();
      toast.success(campaign.isPublished ? "Announcement published." : "Announcement scheduled.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });
  const usageCards = useMemo(
    () => [
      { label: "Today", value: usageSummary?.todayCount ?? 0, hint: "Generations today" },
      { label: "This week", value: usageSummary?.weekCount ?? 0, hint: "Last 7 days" },
      { label: "This month", value: usageSummary?.monthCount ?? 0, hint: "Current month" },
      {
        label: "Trial left",
        value: usageSummary?.trialRemaining ?? 0,
        hint: usageSummary?.trialAccess ? `Daily trial cap ${usageSummary.trialDailyLimit}` : "Tenant AI key in use",
      },
    ],
    [usageSummary],
  );

  const saveReviewQueueMutation = useMutation({
    mutationFn: async (queue: AiReviewItem[]) => aiApi.saveReviewQueue({ items: queue }, selectedOrganizationId),
    onSuccess: (savedQueue) => {
      const serialized = JSON.stringify(savedQueue);
      lastSyncedQueueRef.current = serialized;
      setApprovalQueue(savedQueue);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  useEffect(() => {
    if (!selectedOrganizationId || !reviewQueueQuery.isSuccess) {
      return;
    }

    const serialized = JSON.stringify(approvalQueue);
    if (serialized === lastSyncedQueueRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveReviewQueueMutation.mutate(approvalQueue);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [approvalQueue, reviewQueueQuery.isSuccess, saveReviewQueueMutation, selectedOrganizationId]);

  const approvalQueueStats = useMemo(
    () => ({
      draft: approvalQueue.filter((item) => item.status === "DRAFT").length,
      approved: approvalQueue.filter((item) => item.status === "APPROVED").length,
      archived: approvalQueue.filter((item) => item.status === "ARCHIVED").length,
    }),
    [approvalQueue],
  );

  const admissionCsv = useMemo(() => {
    if (!admissionResult?.student) return "";
    const student = admissionResult.student;
    const rows: StudentImportDraftRow[] = [
      {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        guardianName: student.guardianName,
        guardianEmail: student.guardianEmail,
        guardianPhone: student.guardianPhone,
        address: student.address,
        dateOfBirth: student.dateOfBirth,
        admissionDate: student.admissionDate,
        status: student.status,
        batchCodes: student.batchCodes.join("|"),
      },
    ];
    return buildStudentImportCsv(rows);
  }, [admissionResult]);

  const approvalRequired = Boolean(selectedOrganizationRecord?.aiDraftApprovalRequired ?? currentSettingsQuery.data?.aiDraftApprovalRequired);

  const upsertReviewItem = (input: { kind: AiReviewKind; title: string; summary: string; body: string }) => {
    setApprovalQueue((current) => [
      ...current,
      createAiReviewItem({
        ...input,
        status: approvalRequired ? "DRAFT" : "APPROVED",
      }),
    ]);
  };

  const createNoticeCampaignReviewItem = (payload: ScheduleNoticeCampaignAiDto) => {
    setApprovalQueue((current) => [
      ...current,
      createAiReviewItem({
        kind: "NOTICE_CAMPAIGN",
        title: payload.title,
        summary: `${payload.audience} · ${payload.category ?? "GENERAL"}${payload.targetScope ? ` · ${payload.targetScope}` : ""}`,
        body: JSON.stringify(payload, null, 2),
        status: approvalRequired ? "DRAFT" : "APPROVED",
      }),
    ]);
  };

  const publishNoticeCampaignFromReview = async (item: AiReviewItem) => {
    const payload = normalizeNoticeCampaignDraft(item.body);
    if (!payload) {
      toast.error("This queued campaign cannot be published because its saved payload is invalid.");
      return;
    }

    try {
      const campaign = await publishNoticeCampaignMutation.mutateAsync(payload);
      setApprovalQueue((current) => updateAiReviewItem(current, item.id, { status: "ARCHIVED" }));
      toast.success(campaign.isPublished ? "Queued campaign published." : "Queued campaign scheduled.");
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  const setReviewStatus = (id: string, status: AiReviewItem["status"]) => {
    setApprovalQueue((current) => updateAiReviewItem(current, id, { status }));
  };

  if (isPlatformSession && !selectedOrganizationId) {
    return (
      <div className="space-y-6">
        <OrganizationScopeBanner moduleLabel="AI Lab" />
        <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Select an organization</CardTitle>
            <CardDescription>Super admin sessions need an organization selected before using the AI tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder={organizationsQuery.isLoading ? "Loading organizations..." : "Choose organization"} />
              </SelectTrigger>
              <SelectContent>
                {organizationOptions.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name} · {getAiAccessLabel(organization)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrganizationScopeBanner moduleLabel="AI Lab" />
      <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
        <CardHeader className="space-y-3 border-b bg-[linear-gradient(135deg,#0f172a_0%,#134e4a_52%,#f59e0b_100%)] text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">AI automation</Badge>
              <CardTitle className="text-3xl tracking-tight">AI Lab</CardTitle>
              <CardDescription className="max-w-2xl text-white/75">
                Draft notices, generate mail replies, answer support questions, and extract admission forms for {selectedOrganizationName}.
              </CardDescription>
            </div>
            {hasOrganization ? (
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                <Sparkles className="mr-2 h-4 w-4" />
                {aiReady ? aiAccessLabel : "Key missing"}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {hasOrganization && !aiReady ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              This organization does not have AI access configured yet. AI actions are disabled until a tenant key is saved or the trial mode is active.
            </div>
          ) : trialAiEnabled ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              Trial AI is enabled for this organization. Drafts are powered by Groq and use a limited shared daily quota during the trial window.
              {usageSummary ? ` ${usageSummary.trialRemaining} trial request(s) remain today.` : null}
            </div>
          ) : null}
          <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  Prompt style and usage
                </CardTitle>
                <CardDescription>Choose the response style and monitor AI volume for the selected organization.</CardDescription>
              </div>
              {usageQuery.isFetching ? (
                <Badge variant="outline">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Prompt preset</p>
                  <p className="text-xs text-muted-foreground">Applies to all AI Lab drafts and changes the tone before the model is called.</p>
                </div>
                <Select value={promptPreset} onValueChange={(value) => setPromptPreset(value as AiPromptPreset)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {promptPresetOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>{promptPresetOptions.find((option) => option.value === promptPreset)?.description}</p>
                  <p>Use Finance for fee notices, Parent-facing for family communication, and Staff-facing for internal follow-up.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {usageCards.map((card) => (
                  <div key={card.label} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm md:col-span-2 xl:col-span-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Usage breakdown</p>
                      <p className="text-xs text-muted-foreground">
                        {usageSummary?.lastGeneratedAt
                          ? `Last generation at ${new Date(usageSummary.lastGeneratedAt).toLocaleString()}`
                          : "No AI generation activity recorded yet for this organization."}
                      </p>
                    </div>
                    {usageSummary?.trialAccess ? (
                      <Badge variant="warning">Trial access active</Badge>
                    ) : (
                      <Badge variant="secondary">Tenant AI key active</Badge>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-white/80 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Provider mix</p>
                      <div className="mt-2 space-y-2 text-sm">
                        {usageSummary?.providerBreakdown.length ? (
                          usageSummary.providerBreakdown.map((item) => (
                            <div key={item.provider} className="flex items-center justify-between">
                              <span className="capitalize">{item.provider}</span>
                              <span className="font-medium">{item.count}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No provider usage yet.</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-white/80 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Top schemas</p>
                      <div className="mt-2 space-y-2 text-sm">
                        {usageSummary?.schemaBreakdown.length ? (
                          usageSummary.schemaBreakdown.slice(0, 4).map((item) => (
                            <div key={item.schemaName} className="flex items-center justify-between gap-3">
                              <span className="truncate">{item.schemaName}</span>
                              <span className="font-medium">{item.count}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No schema usage yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-muted/20 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  AI approval queue
                </CardTitle>
                <CardDescription>Review generated outputs before they are used in notices, mail, support replies, or office follow-up.</CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">
                  Latest approved item: {latestReviewItem(approvalQueue, undefined, "APPROVED")?.title ?? "None yet"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Drafts {approvalQueueStats.draft}</Badge>
                <Badge variant="success">Approved {approvalQueueStats.approved}</Badge>
                <Badge variant="outline">Archived {approvalQueueStats.archived}</Badge>
                <Badge variant={approvalRequired ? "danger" : "secondary"}>
                  {approvalRequired ? "Approval required" : "Auto use allowed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm">
                <div>
                  <p className="text-sm font-medium">Organization approval rule</p>
                  <p className="text-xs text-muted-foreground">
                    {approvalRequired
                      ? "AI drafts stay in review until an admin approves them for use in mail or reminder flows."
                      : "Approved AI drafts can be used directly from the queue."}
                  </p>
                </div>
                <Button type="button" variant="outline" asChild>
                  <a href="/settings">Manage in settings</a>
                </Button>
              </div>
              {approvalQueue.length ? (
                approvalQueue
                  .slice()
                  .reverse()
                  .map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{item.kind}</Badge>
                            <Badge variant={item.status === "APPROVED" ? "success" : item.status === "ARCHIVED" ? "secondary" : "warning"}>{item.status}</Badge>
                          </div>
                          <p className="mt-2 font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.kind === "NOTICE_CAMPAIGN" && item.status === "APPROVED" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => publishNoticeCampaignFromReview(item)}
                              disabled={publishNoticeCampaignMutation.isPending}
                            >
                              Publish
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm" onClick={() => copyText(item.body)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReviewStatus(item.id, "APPROVED")}
                            disabled={item.status === "APPROVED"}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReviewStatus(item.id, "ARCHIVED")}
                            disabled={item.status === "ARCHIVED"}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </Button>
                        </div>
                      </div>
                      <Textarea readOnly value={item.body} className="mt-3 min-h-[140px] font-mono text-xs" />
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">Generated drafts will appear here for review and approval.</p>
              )}
            </CardContent>
          </Card>
          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <WandSparkles className="h-5 w-5 text-emerald-600" />
                  Notice generator
                </CardTitle>
                <CardDescription>Generate polished announcements for parents, students, teachers, or staff.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Audience" value={noticeAudience} onChange={setNoticeAudience} />
                <Field label="Topic" value={noticeTopic} onChange={setNoticeTopic} />
                <Field label="Tone" value={noticeTone} onChange={setNoticeTone} />
                <Field label="Call to action" value={noticeCallToAction} onChange={setNoticeCallToAction} />
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Purpose</label>
                  <Textarea value={noticePurpose} onChange={(event) => setNoticePurpose(event.target.value)} className="min-h-[110px]" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Key points</label>
                  <Textarea value={noticeKeyPoints} onChange={(event) => setNoticeKeyPoints(event.target.value)} className="min-h-[110px]" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Additional context</label>
                  <Textarea value={noticeContext} onChange={(event) => setNoticeContext(event.target.value)} className="min-h-[90px]" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between gap-3">
                <Button onClick={() => noticeMutation.mutate()} disabled={noticeMutation.isPending || !aiReady}>
                    {noticeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate notice"
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">Uses the selected organization context and your prompts.</span>
                </div>
              </CardContent>
            </Card>
            <ResultCard
              title="Notice draft"
              icon={FileText}
              summary={noticeResult ? `${noticeResult.audienceSummary} · ${noticeResult.tone}` : "Your generated notice will appear here."}
              onCopy={() => copyText(noticeResult?.body ?? "")}
            >
              {noticeResult ? (
                <DraftView
                  primaryLabel={`Subject: ${noticeResult.subject}`}
                  title={noticeResult.title}
                  body={noticeResult.body}
                  meta={[
                    `Audience: ${noticeResult.audienceSummary}`,
                    `Tone: ${noticeResult.tone}`,
                    `Call to action: ${noticeResult.callToAction}`,
                  ]}
                  bullets={noticeResult.keyPoints}
                />
              ) : null}
            </ResultCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  Notice campaign scheduler
                </CardTitle>
                <CardDescription>Save the drafted notice as a published or scheduled portal announcement.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input value={noticeCampaignCategory} onChange={(event) => setNoticeCampaignCategory(event.target.value)} placeholder="GENERAL" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audience</label>
                  <Select value={noticeCampaignAudience} onValueChange={(value) => setNoticeCampaignAudience(value as NoticeCampaignAudience)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOTH">Parents and students</SelectItem>
                      <SelectItem value="PARENT">Parents only</SelectItem>
                      <SelectItem value="STUDENT">Students only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => applyNoticeAudiencePreset("WHOLE_SCHOOL")}>
                    Whole school
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => applyNoticeAudiencePreset("PARENTS")}>
                    Parents only
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => applyNoticeAudiencePreset("STUDENTS")}>
                    Students only
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyNoticeAudiencePreset("RESET")}>
                    Reset target
                  </Button>
                </div>
                <div className="md:col-span-2 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div>
                      <p className="text-sm font-medium">Target classes / batches</p>
                      <p className="text-xs text-muted-foreground">Pick one or more classes for this notice.</p>
                    </div>
                    <div className="max-h-44 space-y-2 overflow-auto pr-1">
                      {noticeBatchesQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading batches...</p>
                      ) : noticeBatchesQuery.data?.items?.length ? (
                        noticeBatchesQuery.data.items.map((batch) => (
                          <label key={batch.id} className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedNoticeBatchIds.includes(batch.id)}
                              onChange={(event) => {
                                setSelectedNoticeBatchIds((current) =>
                                  event.target.checked ? [...current, batch.id] : current.filter((id) => id !== batch.id),
                                );
                              }}
                              className="mt-1"
                            />
                            <span>
                              <span className="font-medium">{batch.code}</span>
                              <span className="text-muted-foreground"> · {batch.name}</span>
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No batches available.</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div>
                      <p className="text-sm font-medium">Target roles</p>
                      <p className="text-xs text-muted-foreground">Pick staff, teachers, students, or parents.</p>
                    </div>
                    <div className="max-h-44 space-y-2 overflow-auto pr-1">
                      {noticeRolesQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading roles...</p>
                      ) : noticeRolesQuery.data?.length ? (
                        noticeRolesQuery.data.map((role) => (
                          <label key={role.id} className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedNoticeRoleIds.includes(role.id)}
                              onChange={(event) => {
                                setSelectedNoticeRoleIds((current) =>
                                  event.target.checked ? [...current, role.id] : current.filter((id) => id !== role.id),
                                );
                              }}
                              className="mt-1"
                            />
                            <span className="font-medium">{role.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No roles available.</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Publish at</label>
                  <Input type="datetime-local" value={noticePublishAt} onChange={(event) => setNoticePublishAt(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expires at</label>
                  <Input type="datetime-local" value={noticeExpiresAt} onChange={(event) => setNoticeExpiresAt(event.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Target scope</label>
                  <Textarea
                    value={noticeTargetScope}
                    onChange={(event) => setNoticeTargetScope(event.target.value)}
                    className="min-h-[90px]"
                    placeholder="Add a manual scope note if needed"
                  />
                  <p className="text-xs text-muted-foreground">
                    {noticeCampaignTargetScope ? `Effective scope: ${noticeCampaignTargetScope}` : "Select batches or roles to build the target scope."}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input type="checkbox" checked={noticePinCampaign} onChange={(event) => setNoticePinCampaign(event.target.checked)} />
                  Pin this campaign at the top of the portal noticeboard
                </label>
                <div className="md:col-span-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Uses the latest generated notice. If publish time is in the past or empty, the announcement is published immediately.
                  </p>
                  <Button
                    onClick={() => {
                      const payload: ScheduleNoticeCampaignAiDto = {
                        organizationId: selectedOrganizationId,
                        title: noticeResult?.title ?? noticeTopic,
                        body: noticeResult?.body ?? noticePurpose,
                        category: noticeCampaignCategory,
                        audience: noticeCampaignAudience,
                        isPinned: noticePinCampaign,
                        publishedAt: noticePublishAt ? new Date(noticePublishAt).toISOString() : undefined,
                        expiresAt: noticeExpiresAt ? new Date(noticeExpiresAt).toISOString() : undefined,
                        targetScope: noticeTargetScope.trim() || undefined,
                        promptPreset,
                      };

                      if (approvalRequired) {
                        createNoticeCampaignReviewItem(payload);
                        toast.success("Notice campaign queued for approval.");
                        return;
                      }

                      noticeCampaignMutation.mutate();
                    }}
                    disabled={noticeCampaignMutation.isPending || !noticeResult || !aiReady}
                  >
                    {noticeCampaignMutation.isPending ? "Saving..." : approvalRequired ? "Queue for approval" : "Schedule campaign"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Archive className="h-5 w-5 text-sky-600" />
                  Campaign history
                </CardTitle>
                <CardDescription>Recent notices scheduled or published for the selected organization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {noticeCampaignAnalytics ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Publication state</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <span>Total {noticeCampaignAnalytics.totalCampaigns}</span>
                        <span>Published {noticeCampaignAnalytics.publishedCampaigns}</span>
                        <span>Scheduled {noticeCampaignAnalytics.scheduledCampaigns}</span>
                        <span>Pinned {noticeCampaignAnalytics.pinnedCampaigns}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Audience mix</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {noticeCampaignAnalytics.audienceBreakdown.map((item) => (
                          <Badge key={item.audience} variant="outline">
                            {item.audience} · {item.count}
                          </Badge>
                        ))}
                        {!noticeCampaignAnalytics.audienceBreakdown.length ? <p className="text-sm text-muted-foreground">No audience data yet.</p> : null}
                      </div>
                    </div>
                  </div>
                ) : null}
                {noticeDeliveryAnalytics ? (
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Portal delivery</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {noticeDeliveryAnalytics.latestPublishedAt
                            ? `Latest published at ${new Date(noticeDeliveryAnalytics.latestPublishedAt).toLocaleString()}`
                            : "No portal announcements published yet."}
                        </p>
                      </div>
                      <Badge variant="secondary">{noticeDeliveryAnalytics.readRate}% read rate</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Published</p>
                        <p className="mt-2 text-2xl font-semibold">{noticeDeliveryAnalytics.publishedAnnouncements}</p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Visible now</p>
                        <p className="mt-2 text-2xl font-semibold">{noticeDeliveryAnalytics.activeAnnouncements}</p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Read receipts</p>
                        <p className="mt-2 text-2xl font-semibold">{noticeDeliveryAnalytics.readReceipts}</p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Targets</p>
                        <p className="mt-2 text-2xl font-semibold">{noticeDeliveryAnalytics.deliveryTargets}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {noticeDeliveryAnalytics.audienceBreakdown.map((item) => (
                        <Badge key={item.audience} variant="outline">
                          {item.audience} · {item.count}
                        </Badge>
                      ))}
                      {!noticeDeliveryAnalytics.audienceBreakdown.length ? <p className="text-sm text-muted-foreground">No audience analytics yet.</p> : null}
                    </div>
                  </div>
                ) : null}
                {noticeCampaigns.length ? (
                  noticeCampaigns.map((campaign) => (
                    <div key={campaign.id} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{campaign.title}</p>
                          <p className="text-xs text-muted-foreground">{campaign.category}</p>
                        </div>
                        <Badge variant={campaign.isPublished ? "success" : "warning"}>{campaign.isPublished ? "Published" : "Scheduled"}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{campaign.audience}</span>
                        {campaign.isPinned ? <span>Pinned</span> : null}
                        {campaign.targetScope ? <span>Scope: {campaign.targetScope}</span> : null}
                        <span>{new Date(campaign.publishedAt ?? campaign.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No campaigns yet. Generate a notice and schedule it from the left panel.</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Mail className="h-5 w-5 text-sky-600" />
                  Mail reply assistant
                </CardTitle>
                <CardDescription>Turn a thread summary into a draft reply for teachers, parents, or staff.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Recipient name" value={mailRecipientName} onChange={setMailRecipientName} />
                <Field label="Recipient role" value={mailRecipientRole} onChange={setMailRecipientRole} />
                <Field label="Tone" value={mailTone} onChange={setMailTone} />
                <Field label="Subject hint" value={mailSubjectHint} onChange={setMailSubjectHint} />
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Thread context</label>
                  <Textarea value={mailContext} onChange={(event) => setMailContext(event.target.value)} className="min-h-[130px]" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Extra instructions</label>
                  <Textarea value={mailInstructions} onChange={(event) => setMailInstructions(event.target.value)} className="min-h-[90px]" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between gap-3">
                <Button onClick={() => mailMutation.mutate()} disabled={mailMutation.isPending || !aiReady}>
                    {mailMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Drafting...
                      </>
                    ) : (
                      "Generate reply"
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">The result is copy-ready for the existing mail composer.</span>
                </div>
              </CardContent>
            </Card>
            <ResultCard
              title="Mail draft"
              icon={Mail}
              summary={mailResult ? `${mailResult.tone} · ${mailResult.followUp}` : "Mail assistant output will appear here."}
              onCopy={() => copyText(mailResult?.body ?? "")}
            >
              {mailResult ? (
                <DraftView
                  primaryLabel={`Subject: ${mailResult.subject}`}
                  title="Reply draft"
                  body={mailResult.body}
                  meta={[`Tone: ${mailResult.tone}`, `Follow-up: ${mailResult.followUp}`]}
                  bullets={mailResult.keyPoints}
                />
              ) : null}
            </ResultCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bot className="h-5 w-5 text-violet-600" />
                  Support bot
                </CardTitle>
                <CardDescription>Answer common operational questions and flag items that need staff escalation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Helpful context</label>
                  <Textarea value={supportContext} onChange={(event) => setSupportContext(event.target.value)} className="min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <Input value={supportTone} onChange={(event) => setSupportTone(event.target.value)} />
                </div>
                <div className="max-h-[300px] space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-sm">
                  {supportMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        message.role === "assistant" ? "bg-white text-foreground shadow-sm" : "ml-auto max-w-[85%] bg-slate-950 text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={supportInput}
                    onChange={(event) => setSupportInput(event.target.value)}
                    placeholder="Ask a support question..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        const question = supportInput.trim();
                        if (question && aiReady) {
                          setSupportMessages((current) => [...current, { role: "user", content: question }]);
                          supportMutation.mutate(question);
                          setSupportInput("");
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const question = supportInput.trim();
                      if (!question || !aiReady) return;
                      setSupportMessages((current) => [...current, { role: "user", content: question }]);
                      supportMutation.mutate(question);
                      setSupportInput("");
                    }}
                    disabled={supportMutation.isPending || !supportInput.trim() || !aiReady}
                  >
                    {supportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic2 className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <ResultCard
              title="Support reply"
              icon={Bot}
              summary={supportResult ? (supportResult.escalationNeeded ? "Escalation needed" : "Direct reply ready") : "Support output will appear here."}
              onCopy={() => copyText(supportResult?.reply ?? "")}
            >
              {supportResult ? (
                <DraftView
                  primaryLabel={supportResult.escalationNeeded ? "Escalation required" : "No escalation required"}
                  title="Suggested answer"
                  body={supportResult.reply}
                  meta={[`Reason: ${supportResult.reason}`]}
                  bullets={supportResult.suggestedActions}
                />
              ) : null}
            </ResultCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <GraduationCap className="h-5 w-5 text-amber-600" />
                  Admission extractor
                </CardTitle>
                <CardDescription>Convert pasted or scanned admission text into a structured student draft.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Source label" value={admissionLabel} onChange={setAdmissionLabel} />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admission text</label>
                  <Textarea value={admissionText} onChange={(event) => setAdmissionText(event.target.value)} className="min-h-[220px]" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button onClick={() => admissionMutation.mutate()} disabled={admissionMutation.isPending || !aiReady}>
                    {admissionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      "Extract student data"
                    )}
                  </Button>
                  {admissionResult ? (
                    <Button variant="outline" onClick={() => copyText(admissionCsv)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy CSV
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            <ResultCard
              title="Structured admission draft"
              icon={GraduationCap}
              summary={admissionResult ? `${Math.round(admissionResult.confidence * 100)}% confidence` : "Extracted student data will appear here."}
              onCopy={() => copyText(JSON.stringify(admissionResult ?? {}, null, 2))}
            >
              {admissionResult ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(admissionResult.student ?? {}).map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{key}</p>
                        <p className="mt-1 text-sm font-medium break-words">{Array.isArray(value) ? value.join(", ") : value || "—"}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm shadow-sm">
                    <p className="font-medium">Missing fields</p>
                    <p className="mt-1 text-muted-foreground">
                      {admissionResult.missingFields?.length ? admissionResult.missingFields.join(", ") : "None"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm shadow-sm">
                    <p className="font-medium">Notes</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                      {(admissionResult.notes ?? []).map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </ResultCard>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ResultCard({
  title,
  icon: Icon,
  summary,
  onCopy,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  onCopy: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Icon className="h-5 w-5 text-sky-600" />
            {title}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DraftView({
  primaryLabel,
  title,
  body,
  meta = [],
  bullets = [],
}: {
  primaryLabel: string;
  title: string;
  body: string;
  meta?: string[];
  bullets?: string[];
}) {
  return (
    <div className="space-y-4">
      <Badge variant="outline">{primaryLabel}</Badge>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {meta.map((item) => (
          <p key={item} className="text-xs text-muted-foreground">
            {item}
          </p>
        ))}
      </div>
      <Textarea readOnly value={body} className="min-h-[220px] font-mono text-sm" />
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm shadow-sm">
        <p className="font-medium">Key points</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function copyText(value: string) {
  if (!value.trim()) {
    toast.error("Nothing to copy");
    return;
  }

  void navigator.clipboard.writeText(value).then(
    () => toast.success("Copied"),
    () => toast.error("Copy failed"),
  );
}
