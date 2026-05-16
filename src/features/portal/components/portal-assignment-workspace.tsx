"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Save, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { portalApi } from "@/features/portal/api/portal-api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { normalizeApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/formatters";

interface PortalAssignmentWorkspaceProps {
  assignmentId: string;
}

export function PortalAssignmentWorkspace({ assignmentId }: PortalAssignmentWorkspaceProps) {
  const queryClient = useQueryClient();
  const [submissionText, setSubmissionText] = useState("");
  const [attachmentText, setAttachmentText] = useState("");
  const query = useQuery({
    queryKey: ["portal-assignment", assignmentId],
    queryFn: () => portalApi.assignmentDetail(assignmentId),
  });

  useEffect(() => {
    if (query.data?.submission) {
      setSubmissionText(query.data.submission.submissionText ?? "");
      setAttachmentText(query.data.submission.attachmentLinks.join("\n"));
    }
  }, [query.data]);

  const payload = useMemo(
    () => ({
      submissionText,
      attachmentLinks: attachmentText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    }),
    [attachmentText, submissionText],
  );

  const saveMutation = useMutation({
    mutationFn: () => portalApi.saveAssignmentSubmission(assignmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal-assignment", assignmentId] });
      await queryClient.invalidateQueries({ queryKey: ["portal-assignments"] });
      toast.success("Assignment draft saved.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const submitMutation = useMutation({
    mutationFn: () => portalApi.submitAssignment(assignmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal-assignment", assignmentId] });
      await queryClient.invalidateQueries({ queryKey: ["portal-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["portal-dashboard"] });
      toast.success("Assignment submitted.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (query.isLoading) {
    return <LoadingState rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState description="Assignment detail could not be loaded." onRetry={() => query.refetch()} />;
  }

  const assignment = query.data;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Student assignments</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{assignment.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {assignment.subjectName} · {assignment.batchName} · {assignment.teacherName ?? "Course team"}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/portal/student/assignments">Back to assignments</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assignment brief</CardTitle>
            <CardDescription>Write your response, attach any links, then save a draft or submit the final version.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border px-4 py-3 text-sm">
              <p className="font-medium">Instructions</p>
              <p className="mt-1 text-muted-foreground">{assignment.instructions ?? assignment.description ?? "No detailed instructions provided."}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Submission text</p>
              <Textarea
                rows={10}
                value={submissionText}
                onChange={(event) => setSubmissionText(event.target.value)}
                placeholder="Write your assignment response here..."
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Attachment links</p>
              <Textarea
                rows={4}
                value={attachmentText}
                onChange={(event) => setAttachmentText(event.target.value)}
                placeholder="Paste one link per line for external references or uploaded files"
              />
            </div>
            {assignment.canSubmit ? (
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save draft"}
                </Button>
                <Button
                  type="button"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || !submissionText.trim()}
                >
                  <SendHorizonal className="mr-2 h-4 w-4" />
                  {submitMutation.isPending ? "Submitting..." : "Submit assignment"}
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                This assignment is no longer open for new submissions.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Track the current submission state and teacher review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{assignment.status}</Badge>
              <Badge variant={assignment.allowLateSubmission ? "warning" : "outline"}>
                {assignment.allowLateSubmission ? "Late allowed" : "Due strict"}
              </Badge>
              {assignment.submission ? (
                <Badge variant={assignment.submission.status === "REVIEWED" ? "success" : assignment.submission.status === "SUBMITTED" ? "secondary" : "warning"}>
                  {assignment.submission.status}
                </Badge>
              ) : null}
            </div>
            <div className="rounded-2xl border px-4 py-3">
              <p className="text-muted-foreground">Due date</p>
              <p className="mt-1 font-medium">{formatDate(assignment.dueAt)}</p>
            </div>
            <div className="rounded-2xl border px-4 py-3">
              <p className="text-muted-foreground">Marks</p>
              <p className="mt-1 font-medium">
                {assignment.submission?.awardedMarks !== null && assignment.submission?.awardedMarks !== undefined
                  ? `${assignment.submission.awardedMarks}/${assignment.maxMarks}`
                  : `${assignment.maxMarks} available`}
              </p>
            </div>
            {assignment.submission ? (
              <>
                <div className="rounded-2xl border px-4 py-3">
                  <p className="text-muted-foreground">Last submitted</p>
                  <p className="mt-1 font-medium">
                    {assignment.submission.submittedAt ? formatDate(assignment.submission.submittedAt) : "Draft only"}
                  </p>
                </div>
                {assignment.submission.feedback ? (
                  <div className="rounded-2xl border px-4 py-3">
                    <p className="text-muted-foreground">Teacher feedback</p>
                    <p className="mt-1">{assignment.submission.feedback}</p>
                    {assignment.submission.reviewedByTeacherName ? (
                      <p className="mt-2 text-xs text-muted-foreground">Reviewed by {assignment.submission.reviewedByTeacherName}</p>
                    ) : null}
                  </div>
                ) : null}
                {assignment.submission.attachmentLinks.length ? (
                  <div className="rounded-2xl border px-4 py-3">
                    <p className="text-muted-foreground">Attachment links</p>
                    <div className="mt-2 space-y-2">
                      {assignment.submission.attachmentLinks.map((link) => (
                        <a key={link} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary underline-offset-4 hover:underline">
                          <FileUp className="h-4 w-4" />
                          <span className="truncate">{link}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-3 text-muted-foreground">No submission saved yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
