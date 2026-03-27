import { z } from "zod";

const questionOptionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z
  .object({
    type: z.enum(["MCQ", "TRUE_FALSE", "FILL_IN_THE_BLANK", "SHORT_ANSWER", "LONG_ANSWER"]),
    prompt: z.string().min(1, "Question prompt is required"),
    helperText: z.string().optional(),
    explanation: z.string().optional(),
    marks: z.coerce.number().min(0, "Marks must be 0 or greater"),
    acceptedAnswersText: z.string().optional(),
    correctBooleanAnswer: z.boolean().optional(),
    options: z.array(questionOptionSchema).default([]),
  })
  .superRefine((question, ctx) => {
    if (question.type === "MCQ") {
      if (question.options.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "MCQ questions need at least two options", path: ["options"] });
      }
      if (!question.options.some((option) => option.isCorrect)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mark at least one correct option", path: ["options"] });
      }
    }

    if (question.type === "FILL_IN_THE_BLANK" && !(question.acceptedAnswersText ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one accepted answer, separated by commas",
        path: ["acceptedAnswersText"],
      });
    }

    if (question.type === "TRUE_FALSE" && typeof question.correctBooleanAnswer !== "boolean") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choose the correct boolean answer", path: ["correctBooleanAnswer"] });
    }
  });

export const assessmentSchema = z.object({
  academicSessionId: z.union([z.string().uuid(), z.literal("")]).optional(),
  batchId: z.string().uuid("Select a batch"),
  subjectId: z.string().uuid("Select a subject"),
  teacherId: z.union([z.string().uuid(), z.literal("")]).optional(),
  title: z.string().min(1, "Assessment title is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  type: z.enum(["QUIZ", "TEST", "ASSIGNMENT", "PRACTICE"]),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  passMarks: z.coerce.number().min(0, "Pass marks must be 0 or greater"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  availableFrom: z.string().optional(),
  availableUntil: z.string().optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showResultImmediately: z.boolean().default(true),
  allowMultipleAttempts: z.boolean().default(false),
  maxAttempts: z.coerce.number().min(1, "Max attempts must be at least 1"),
  negativeMarkingEnabled: z.boolean().default(false),
  negativeMarkingPerWrong: z.coerce.number().min(0, "Negative marking must be 0 or greater").optional(),
  questions: z.array(questionSchema).min(1, "Add at least one question"),
});

export type AssessmentSchema = z.infer<typeof assessmentSchema>;
