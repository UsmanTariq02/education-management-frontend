"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Inbox, Mail, PenSquare, Reply, Search, Send, Star, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { aiApi } from "@/features/ai/api/ai-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatters";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import {
  latestReviewItem,
  createAiReviewItem,
  type AiReviewItem,
} from "@/features/ai/utils/ai-review-queue";
import type { CreateMailMessageDto, ReplyMailMessageDto, UpdateMailDraftDto } from "@/types/dto";
import type { AiNoticeDraft, MailAudienceGroup, MailContact, MailMailboxResponse, MailMailboxItem, MailConversationDetail } from "@/types/domain";

type MailFolder = "inbox" | "sent" | "drafts" | "starred" | "trash";

const audienceOptions: Array<{ label: string; value: MailAudienceGroup; description: string }> = [
  { label: "Staff", value: "STAFF", description: "Users and administrators" },
  { label: "Teachers", value: "TEACHER", description: "Teaching staff" },
  { label: "Students", value: "STUDENT", description: "Student accounts" },
  { label: "Parents", value: "PARENT", description: "Guardians and parent contacts" },
];

type MailApiAdapter = {
  mailbox: (params: { page?: number; limit?: number; folder?: string; search?: string }) => Promise<MailMailboxResponse>;
  conversation: (conversationId: string) => Promise<MailConversationDetail>;
  create: (payload: CreateMailMessageDto) => Promise<MailMailboxItem>;
  updateDraft: (id: string, payload: UpdateMailDraftDto) => Promise<MailMailboxItem>;
  sendDraft: (id: string) => Promise<MailMailboxItem>;
  reply: (conversationId: string, payload: ReplyMailMessageDto) => Promise<MailMailboxItem>;
  markRead: (id: string) => Promise<{ updated: boolean }>;
  star: (id: string) => Promise<{ starred: boolean }>;
  unstar: (id: string) => Promise<{ starred: boolean }>;
  archive: (id: string) => Promise<{ archived: boolean }>;
  trash: (id: string) => Promise<{ trashed: boolean }>;
  restore: (id: string) => Promise<{ restored: boolean }>;
  contacts: (search?: string, organizationId?: string, audience?: MailAudienceGroup[], limit?: number) => Promise<MailContact[]>;
};

interface MailWorkspaceProps {
  title: string;
  description: string;
  api: MailApiAdapter;
  audienceLabel: string;
  initialFolder?: MailFolder;
  scopeKey?: string;
  organizationId?: string;
  aiReady?: boolean;
  requireApprovalForAiDrafts?: boolean;
}

const folders: Array<{ key: MailFolder; label: string; icon: typeof Inbox }> = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: PenSquare },
  { key: "starred", label: "Starred", icon: Star },
  { key: "trash", label: "Trash", icon: Trash2 },
];

const emptyCompose = {
  id: null as string | null,
  conversationId: null as string | null,
  subject: "",
  recipients: "",
  body: "",
  sendNow: true,
};

export function MailWorkspace({
  title,
  description,
  api,
  audienceLabel,
  initialFolder = "inbox",
  scopeKey = "default",
  organizationId,
  aiReady = true,
  requireApprovalForAiDrafts = false,
}: MailWorkspaceProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState<MailFolder>(initialFolder);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState(emptyCompose);
  const [replyBody, setReplyBody] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientAudienceFilters, setRecipientAudienceFilters] = useState<MailAudienceGroup[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<AiReviewItem[]>([]);
  const lastSyncedQueueRef = useRef<string>("");

  const mailboxQuery = useQuery({
    queryKey: ["mailbox", scopeKey, folder, search],
    queryFn: () => api.mailbox({ page: 1, limit: 50, folder, search }),
  });

  const contactsQuery = useQuery({
    queryKey: ["mail-contacts", scopeKey, recipientSearch, recipientAudienceFilters.join(",")],
    queryFn: () => api.contacts(recipientSearch, organizationId, recipientAudienceFilters, 500),
    enabled: composeOpen,
  });

  const reviewQueueQuery = useQuery({
    queryKey: ["ai-review-queue", organizationId, user?.id],
    queryFn: () => aiApi.reviewQueue(organizationId),
    enabled: Boolean(organizationId),
  });

  useEffect(() => {
    if (!reviewQueueQuery.data) {
      return;
    }

    const serialized = JSON.stringify(reviewQueueQuery.data);
    lastSyncedQueueRef.current = serialized;
    setApprovalQueue(reviewQueueQuery.data);
  }, [reviewQueueQuery.data]);

  const saveReviewQueueMutation = useMutation({
    mutationFn: async (queue: AiReviewItem[]) => aiApi.saveReviewQueue({ items: queue }, organizationId),
    onSuccess: (savedQueue) => {
      const serialized = JSON.stringify(savedQueue);
      lastSyncedQueueRef.current = serialized;
      setApprovalQueue(savedQueue);
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  useEffect(() => {
    if (!organizationId || !reviewQueueQuery.isSuccess) {
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
  }, [approvalQueue, organizationId, reviewQueueQuery.isSuccess, saveReviewQueueMutation]);

  const selectedMessage = mailboxQuery.data?.items.find((item) => item.id === selectedId) ?? mailboxQuery.data?.items[0] ?? null;

  const conversationQuery = useQuery({
    queryKey: ["mail-conversation", scopeKey, selectedMessage?.conversationId],
    queryFn: () => api.conversation(selectedMessage!.conversationId),
    enabled: Boolean(selectedMessage?.conversationId),
  });

  const latestApprovedMailDraft = useMemo(() => latestReviewItem(approvalQueue, "MAIL", "APPROVED"), [approvalQueue]);
  const latestApprovedNoticeDraft = useMemo(() => latestReviewItem(approvalQueue, "NOTICE", "APPROVED"), [approvalQueue]);
  const selectedAudienceLabel = useMemo(
    () =>
      recipientAudienceFilters.length
        ? recipientAudienceFilters.map((item) => audienceOptions.find((option) => option.value === item)?.label ?? item).join(", ")
        : "All contacts",
    [recipientAudienceFilters],
  );

  useEffect(() => {
    setFolder(initialFolder);
  }, [initialFolder]);

  useEffect(() => {
    const items = mailboxQuery.data?.items ?? [];
    if (!items.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [mailboxQuery.data?.items, selectedId]);

  useEffect(() => {
    if (selectedMessage && selectedMessage.status === "DRAFT" && selectedMessage.isSender) {
      setCompose({
        id: selectedMessage.id,
        conversationId: selectedMessage.conversationId,
        subject: selectedMessage.subject,
        recipients: selectedMessage.recipients.map((recipient) => recipient.email).join(", "),
        body: selectedMessage.body,
        sendNow: true,
      });
    }
  }, [selectedMessage]);

  const saveMutation = useMutation({
    mutationFn: async (sendNowOverride: boolean) => {
      const shouldSendNow = sendNowOverride;
      const recipients = parseRecipients(compose.recipients);
      const payload: CreateMailMessageDto = {
        subject: compose.subject,
        body: compose.body,
        recipients,
        sendNow: shouldSendNow,
        conversationId: compose.conversationId ?? undefined,
      };

      if (compose.id) {
        const draftPayload: UpdateMailDraftDto = {
          subject: compose.subject,
          body: compose.body,
          recipients,
          sendNow: shouldSendNow,
          conversationId: compose.conversationId ?? undefined,
        };

        if (!shouldSendNow) {
          await api.updateDraft(compose.id, draftPayload);
        } else {
          await api.updateDraft(compose.id, draftPayload);
          await api.sendDraft(compose.id);
        }
      } else {
        await api.create(payload);
      }
    },
    onSuccess: async (_data, sendNowOverride) => {
      toast.success(sendNowOverride ? "Mail sent." : "Draft saved.");
      setFolder(sendNowOverride ? "sent" : "drafts");
      setCompose(emptyCompose);
      setComposeOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["mailbox"] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMessage?.conversationId) return;
      await api.reply(selectedMessage.conversationId, { body: replyBody });
    },
    onSuccess: async () => {
      toast.success("Reply sent.");
      setReplyBody("");
      await queryClient.invalidateQueries({ queryKey: ["mailbox"] });
      await queryClient.invalidateQueries({ queryKey: ["mail-conversation", selectedMessage?.conversationId] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const aiDraftMutation = useMutation({
    mutationFn: async () => {
      const conversationContext = conversationQuery.data?.messages
        ?.map((message) => `${message.senderName} <${message.senderEmail}>: ${message.body}`)
        .join("\n\n");
      const recipientLabel = compose.recipients.trim() || selectedMessage?.senderName || "Recipient";

      return aiApi.generateMailDraft({
        recipientName: recipientLabel,
        recipientRole: selectedMessage?.isSender ? "school staff" : "school contact",
        threadContext: [conversationContext, compose.subject ? `Current subject: ${compose.subject}` : null, compose.body ? `Current draft:\n${compose.body}` : null]
          .filter(Boolean)
          .join("\n\n"),
        tone: "helpful and professional",
        additionalInstructions: "Keep the response concise and suitable for a school mailbox.",
        organizationId,
      });
    },
    onSuccess: (draft) => {
      setApprovalQueue((current) => [
        ...current,
        createAiReviewItem({
          kind: "MAIL",
          title: draft.subject,
          summary: `${draft.tone} · ${draft.followUp}`,
          body: draft.body,
        }),
      ]);

      if (requireApprovalForAiDrafts) {
        toast.success("AI draft queued for approval.");
        return;
      }

      setCompose((current) => ({
        ...current,
        subject: draft.subject,
        body: draft.body,
        sendNow: false,
      }));
      toast.success("AI draft inserted into the composer.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const replySuggestionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMessage?.conversationId) {
        throw new Error("Open a conversation first");
      }

      const conversationContext = conversationQuery.data?.messages
        ?.map((message) => `${message.senderName} <${message.senderEmail}>: ${message.body}`)
        .join("\n\n");

      return aiApi.generateMailDraft({
        recipientName: selectedMessage.senderName,
        recipientRole: selectedMessage.isSender ? "school staff" : "school contact",
        threadContext: [
          conversationContext,
          selectedMessage.subject ? `Conversation subject: ${selectedMessage.subject}` : null,
          replyBody ? `Current reply draft:\n${replyBody}` : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
        tone: "helpful and professional",
        additionalInstructions: "Write a direct reply body for this conversation. Keep it concise and practical.",
        organizationId,
      });
    },
    onSuccess: (draft) => {
      setReplyBody(draft.body);
      toast.success("Reply suggestion loaded.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const actionButtons = useMemo(() => {
    if (!selectedMessage) return [];
    return [
      { label: "Read", action: () => api.markRead(selectedMessage.id) },
      {
        label: selectedMessage.state.starredAt ? "Unstar" : "Star",
        action: () => (selectedMessage.state.starredAt ? api.unstar(selectedMessage.id) : api.star(selectedMessage.id)),
      },
      { label: "Archive", action: () => api.archive(selectedMessage.id) },
      { label: "Trash", action: () => api.trash(selectedMessage.id) },
      { label: "Restore", action: () => api.restore(selectedMessage.id) },
    ];
  }, [api, selectedMessage]);

  const folderCounts = mailboxQuery.data?.counts;
  const items = mailboxQuery.data?.items ?? [];
  const contacts = contactsQuery.data ?? [];

  const refreshMailbox = async () => {
    await queryClient.invalidateQueries({ queryKey: ["mailbox"] });
    await queryClient.invalidateQueries({ queryKey: ["mail-conversation"] });
  };

  const applyMessageAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
      await refreshMailbox();
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  const getActionSet = (item: MailMailboxItem) => {
    const starred = Boolean(item.state.starredAt);
    const trashed = Boolean(item.state.trashedAt);

    const actions: Array<{
      label: string;
      icon: LucideIcon;
      action: () => Promise<unknown>;
      successMessage: string;
    }> = [
      {
        label: starred ? "Unstar" : "Star",
        icon: Star,
        action: () => (starred ? api.unstar(item.id) : api.star(item.id)),
        successMessage: starred ? "Unstarred." : "Starred.",
      },
      {
        label: "Archive",
        icon: Archive,
        action: () => api.archive(item.id),
        successMessage: "Archived.",
      },
      {
        label: trashed ? "Restore" : "Trash",
        icon: Trash2,
        action: () => (trashed ? api.restore(item.id) : api.trash(item.id)),
        successMessage: trashed ? "Restored." : "Moved to trash.",
      },
    ];

    return item.folder === "trash" ? actions.filter((entry) => entry.label !== "Archive") : actions;
  };

  const applyApprovedDraft = (kind: "MAIL" | "NOTICE") => {
    const approvedDraft = kind === "MAIL" ? latestApprovedMailDraft : latestApprovedNoticeDraft;
    if (!approvedDraft) {
      toast.message(`No approved ${kind.toLowerCase()} draft available yet.`);
      return;
    }

    setCompose((current) => ({
      ...current,
      subject: approvedDraft.title,
      body: approvedDraft.body,
      sendNow: false,
    }));
    setComposeOpen(true);
    toast.success(`Approved ${kind.toLowerCase()} draft loaded into the composer.`);
  };

  const noticeDraftMutation = useMutation({
    mutationFn: async (): Promise<AiNoticeDraft> =>
      aiApi.generateNotice({
        audience: selectedAudienceLabel,
        topic: compose.subject.trim() || "School notice",
        tone: "professional",
        purpose: compose.body.trim() || "Draft a clear notice for the selected audience.",
        callToAction: "Please review the notice and take the required action.",
        keyPoints: compose.body
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 5),
        audienceContext: `Audience filters: ${selectedAudienceLabel}.`,
        organizationId,
      }),
    onSuccess: (draft) => {
      setApprovalQueue((current) => [
        ...current,
        createAiReviewItem({
          kind: "NOTICE",
          title: draft.subject,
          summary: `${draft.tone} · ${draft.audienceSummary}`,
          body: draft.body,
        }),
      ]);

      if (requireApprovalForAiDrafts) {
        toast.success("AI notice queued for approval.");
        return;
      }

      setCompose((current) => ({
        ...current,
        subject: draft.subject,
        body: draft.body,
        sendNow: false,
      }));
      toast.success("AI notice inserted into the composer.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const toggleAudienceFilter = (audience: MailAudienceGroup) => {
    setRecipientAudienceFilters((current) => (current.includes(audience) ? current.filter((item) => item !== audience) : [...current, audience]));
  };

  const addAudienceRecipients = () => {
    setCompose((current) => {
      const existing = parseRecipients(current.recipients).map((item) => item.email);
      const nextEmails = Array.from(new Set([...existing, ...contacts.map((contact) => contact.email)]));
      return { ...current, recipients: nextEmails.join(", ") };
    });
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
        <CardHeader className="space-y-4 border-b bg-[linear-gradient(135deg,#0f172a_0%,#134e4a_52%,#f59e0b_100%)] text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">{audienceLabel}</Badge>
              <CardTitle className="text-3xl tracking-tight">{title}</CardTitle>
              <CardDescription className="max-w-2xl text-white/75">{description}</CardDescription>
            </div>
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-white text-slate-950 hover:bg-slate-100">
                  <Mail className="mr-2 h-4 w-4" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{compose.id ? "Edit draft" : "Compose mail"}</DialogTitle>
                  <DialogDescription>Send a message, save a draft, or continue a conversation.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To</label>
                    <Input
                      value={compose.recipients}
                      onChange={(event) => {
                        setCompose((current) => ({ ...current, recipients: event.target.value }));
                        setRecipientSearch(event.target.value.split(",").pop()?.trim() ?? "");
                      }}
                      placeholder="teacher@school.edu, staff@school.edu"
                    />
                    <div className="mt-3 space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Audience filters</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => setRecipientAudienceFilters([])}
                          disabled={!recipientAudienceFilters.length}
                        >
                          Clear filters
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {audienceOptions.map((option) => {
                          const active = recipientAudienceFilters.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleAudienceFilter(option.value)}
                              className={[
                                "rounded-full border px-3 py-1.5 text-left text-xs transition",
                                active ? "border-sky-500 bg-sky-50 text-sky-700" : "border-border bg-background/70 text-muted-foreground hover:bg-background",
                              ].join(" ")}
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className="text-[11px] opacity-80">{option.description}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Scope: {selectedAudienceLabel}. Matching contacts will be loaded into the suggestions list.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={addAudienceRecipients}
                          disabled={!contacts.length}
                        >
                          Add audience recipients
                        </Button>
                      </div>
                    </div>
                    {recipientSearch.trim().length > 1 || recipientAudienceFilters.length ? (
                      <div className="rounded-2xl border border-border/70 bg-muted/30 p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Contacts</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={addAudienceRecipients}
                            disabled={!contacts.length}
                          >
                            Add all visible
                          </Button>
                        </div>
                        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                          {contacts.slice(0, 8).map((contact) => (
                            <button
                              key={contact.email}
                              type="button"
                              className="flex items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-background"
                              onClick={() => {
                                setCompose((current) => {
                                  const existing = parseRecipients(current.recipients).map((item) => item.email);
                                  const nextEmails = Array.from(new Set([...existing, contact.email]));
                                  return { ...current, recipients: nextEmails.join(", ") };
                                });
                                setRecipientSearch("");
                              }}
                            >
                              <span className="min-w-0">
                                <span className="font-medium">{contact.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{contact.role}</span>
                                {contact.audienceGroup ? <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-sky-600">{contact.audienceGroup}</span> : null}
                              </span>
                              <span className="text-xs text-muted-foreground">{contact.email}</span>
                            </button>
                          ))}
                          {!contacts.length ? <p className="text-sm text-muted-foreground">No contacts found.</p> : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={compose.subject}
                      onChange={(event) => setCompose((current) => ({ ...current, subject: event.target.value }))}
                      placeholder="Subject line"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-sm font-medium">Message</label>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => applyApprovedDraft("NOTICE")} disabled={!latestApprovedNoticeDraft}>
                          Use approved notice
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => applyApprovedDraft("MAIL")} disabled={!latestApprovedMailDraft}>
                          Use approved mail
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => noticeDraftMutation.mutate()}
                          disabled={noticeDraftMutation.isPending || (!compose.body.trim() && !compose.subject.trim()) || !aiReady}
                        >
                          {noticeDraftMutation.isPending ? "Drafting notice..." : "Draft notice"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => aiDraftMutation.mutate()}
                          disabled={aiDraftMutation.isPending || !compose.recipients.trim() || !aiReady}
                        >
                          {aiDraftMutation.isPending ? "Drafting..." : "Draft with AI"}
                        </Button>
                      </div>
                    </div>
                    {requireApprovalForAiDrafts ? (
                      <p className="text-xs text-muted-foreground">
                        Approval is required for AI drafts. Use an approved draft before sending.
                      </p>
                    ) : null}
                    <Textarea
                      value={compose.body}
                      onChange={(event) => setCompose((current) => ({ ...current, body: event.target.value }))}
                      className="min-h-40"
                      placeholder="Write your message..."
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={compose.sendNow}
                        onChange={(event) => setCompose((current) => ({ ...current, sendNow: event.target.checked }))}
                      />
                      Send immediately
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          saveMutation.mutate(false);
                        }}
                        disabled={saveMutation.isPending}
                      >
                        Save draft
                      </Button>
                      <Button
                        onClick={() => saveMutation.mutate(true)}
                        disabled={saveMutation.isPending || !compose.subject.trim() || !compose.body.trim() || !compose.recipients.trim()}
                      >
                        {saveMutation.isPending ? "Saving..." : "Send"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {folders.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFolder(item.key)}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  folder === item.key ? "border-white/30 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <p className="mt-1 text-2xl font-semibold">
                  {folderCounts?.[item.key]?.total ?? 0}
                </p>
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages..." />
            </div>
          </CardHeader>
          <ScrollArea className="h-[760px]">
            <CardContent className="space-y-2 p-3">
              {items.length ? (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={[
                      "w-full rounded-2xl border border-border/70 bg-background/70 p-4 text-left transition shadow-sm",
                      selectedMessage?.id === item.id
                        ? "border-sky-400 bg-sky-50"
                        : "border-border/70 bg-background hover:bg-muted/40",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={async () => {
                          setSelectedId(item.id);
                          if (item.status === "DRAFT" && item.isSender) {
                            setComposeOpen(true);
                          }
                          if (item.unread) {
                            await api.markRead(item.id);
                            await queryClient.invalidateQueries({ queryKey: ["mailbox"] });
                          }
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{item.subject}</p>
                          {item.state.starredAt ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : null}
                          {item.unread ? <Badge className="bg-sky-600 text-white hover:bg-sky-600">Unread</Badge> : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.isSender ? `To ${item.recipients.map((recipient) => recipient.email).join(", ")}` : `From ${item.senderName} <${item.senderEmail}>`}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.bodyPreview}</p>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          {getActionSet(item).map((action) => {
                            const Icon = action.icon;
                            return (
                              <Button
                                key={action.label}
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full"
                                onClick={() => applyMessageAction(action.action, action.successMessage)}
                                aria-label={action.label}
                              >
                                <Icon className="h-4 w-4" />
                              </Button>
                            );
                          })}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(item.sentAt ?? item.createdAt, "MMM d")}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No messages in this folder yet.
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-3 border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{selectedMessage?.subject ?? "Select a message"}</CardTitle>
                  <CardDescription>
                    {selectedMessage ? `${selectedMessage.senderName} · ${formatDate(selectedMessage.sentAt ?? selectedMessage.createdAt, "MMM d, yyyy p")}` : "Open a conversation from the list."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actionButtons.map((item) => (
                    <Button key={item.label} variant="outline" size="sm" onClick={() => item.action()} disabled={!selectedMessage}>
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              {conversationQuery.data?.messages?.length ? (
                conversationQuery.data.messages.map((message) => (
                  <div key={message.id} className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{message.senderName}</p>
                        <p className="text-xs text-muted-foreground">{message.senderEmail}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(message.sentAt ?? message.createdAt, "MMM d, yyyy p")}</p>
                    </div>
                    <Separator className="my-4" />
                    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{message.body}</p>
                  </div>
                ))
              ) : selectedMessage ? (
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm leading-7">{selectedMessage.body}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No message selected.
                </div>
              )}

                  {selectedMessage ? (
                    <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Reply className="h-4 w-4" />
                      Reply
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => replySuggestionMutation.mutate()}
                      disabled={replySuggestionMutation.isPending || !selectedMessage?.conversationId || !aiReady}
                    >
                      {replySuggestionMutation.isPending ? "Suggesting..." : "Suggest reply"}
                    </Button>
                  </div>
                  <Textarea
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    className="min-h-32"
                    placeholder="Write your reply..."
                  />
                  <div className="flex justify-end">
                    <Button onClick={() => replyMutation.mutate()} disabled={!replyBody.trim() || replyMutation.isPending}>
                      {replyMutation.isPending ? "Sending..." : "Send reply"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How this mailbox works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Use inbox, sent, drafts, starred, and trash like a normal email system.</p>
              <p>Students and staff can address each other using school emails or portal addresses.</p>
              <p>Replies stay inside the same conversation thread for easier follow-up.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function parseRecipients(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}
