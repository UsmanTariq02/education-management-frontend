"use client";

import type { AssessmentSchema } from "@/features/assessments/schemas/assessment-schema";

const ASSESSMENT_DRAFT_STORAGE_KEY = "edu-flow:assessment-draft";
const QUESTION_BANK_STORAGE_KEY = "edu-flow:assessment-question-bank";
const GRADING_WORKSPACE_STORAGE_KEY = "edu-flow:grading-workspace";

export interface QuestionBankEntry {
  id: string;
  title: string;
  question: AssessmentSchema["questions"][number];
  createdAt: string;
}

export interface GradingWorkspaceEntry {
  rubricNote: string;
  suggestedFeedback: string;
  reviewPriority: "LOW" | "MEDIUM" | "HIGH";
  expectedScore: number;
}

export type GradingWorkspaceState = Record<string, GradingWorkspaceEntry>;

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readAssessmentDraft(): AssessmentSchema | null {
  return readStorage<AssessmentSchema | null>(ASSESSMENT_DRAFT_STORAGE_KEY, null);
}

export function writeAssessmentDraft(draft: AssessmentSchema | null): void {
  writeStorage(ASSESSMENT_DRAFT_STORAGE_KEY, draft);
}

export function readQuestionBank(): QuestionBankEntry[] {
  return readStorage<QuestionBankEntry[]>(QUESTION_BANK_STORAGE_KEY, []);
}

export function writeQuestionBank(entries: QuestionBankEntry[]): void {
  writeStorage(QUESTION_BANK_STORAGE_KEY, entries);
}

export function readGradingWorkspace(assessmentId: string): GradingWorkspaceState {
  const allEntries = readStorage<Record<string, GradingWorkspaceState>>(GRADING_WORKSPACE_STORAGE_KEY, {});
  return allEntries[assessmentId] ?? {};
}

export function writeGradingWorkspace(assessmentId: string, state: GradingWorkspaceState): void {
  const allEntries = readStorage<Record<string, GradingWorkspaceState>>(GRADING_WORKSPACE_STORAGE_KEY, {});
  writeStorage(GRADING_WORKSPACE_STORAGE_KEY, {
    ...allEntries,
    [assessmentId]: state,
  });
}

export function clearGradingWorkspace(assessmentId: string): void {
  const allEntries = readStorage<Record<string, GradingWorkspaceState>>(GRADING_WORKSPACE_STORAGE_KEY, {});
  const nextEntries = { ...allEntries };
  delete nextEntries[assessmentId];
  writeStorage(GRADING_WORKSPACE_STORAGE_KEY, nextEntries);
}
