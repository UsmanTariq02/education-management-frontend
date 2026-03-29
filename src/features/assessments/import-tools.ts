import type { AssessmentSchema } from "@/features/assessments/schemas/assessment-schema";

type AssessmentDraftQuestion = AssessmentSchema["questions"][number];

function normalizeType(rawType: string): AssessmentDraftQuestion["type"] {
  const value = rawType.trim().toUpperCase().replaceAll(" ", "_");
  if (["MCQ", "TRUE_FALSE", "FILL_IN_THE_BLANK", "SHORT_ANSWER", "LONG_ANSWER"].includes(value)) {
    return value as AssessmentDraftQuestion["type"];
  }
  throw new Error(`Unsupported question type: ${rawType}`);
}

function toDraftQuestion(rawQuestion: Record<string, unknown>): AssessmentDraftQuestion {
  const type = normalizeType(String(rawQuestion.type ?? "MCQ"));
  const options = Array.isArray(rawQuestion.options)
    ? rawQuestion.options.map((option) =>
        typeof option === "string"
          ? { text: option, isCorrect: false }
          : {
              text: String((option as { text?: unknown }).text ?? ""),
              isCorrect: Boolean((option as { isCorrect?: unknown }).isCorrect),
            },
      )
    : [];

  const acceptedAnswers = Array.isArray(rawQuestion.acceptedAnswers)
    ? rawQuestion.acceptedAnswers.map((answer) => String(answer))
    : [];

  return {
    type,
    prompt: String(rawQuestion.prompt ?? ""),
    helperText: String(rawQuestion.helperText ?? ""),
    explanation: String(rawQuestion.explanation ?? ""),
    marks: Number(rawQuestion.marks ?? 1),
    acceptedAnswersText: acceptedAnswers.join(", "),
    correctBooleanAnswer:
      type === "TRUE_FALSE" && typeof rawQuestion.correctBooleanAnswer === "boolean"
        ? rawQuestion.correctBooleanAnswer
        : undefined,
    options:
      type === "MCQ"
        ? options.length
          ? options
          : [
              { text: "", isCorrect: true },
              { text: "", isCorrect: false },
            ]
        : [],
  };
}

function parsePipeSeparated(text: string): AssessmentDraftQuestion[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawType, prompt, rawMarks = "1", rawOptions = "", rawAnswers = "", explanation = ""] = line.split("|");
      const type = normalizeType(rawType);
      const options = rawOptions
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((text, index) => ({ text, isCorrect: index === 0 }));

      return {
        type,
        prompt: prompt?.trim() ?? "",
        helperText: "",
        explanation: explanation.trim(),
        marks: Number(rawMarks.trim() || "1"),
        acceptedAnswersText: rawAnswers
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .join(", "),
        correctBooleanAnswer:
          type === "TRUE_FALSE" ? rawAnswers.trim().toLowerCase() === "true" : undefined,
        options:
          type === "MCQ"
            ? options.length
              ? options
              : [
                  { text: "", isCorrect: true },
                  { text: "", isCorrect: false },
                ]
            : [],
      } satisfies AssessmentDraftQuestion;
    });
}

export function parseImportedQuestions(text: string): AssessmentDraftQuestion[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as Array<Record<string, unknown>>;
    return parsed.map((question) => toDraftQuestion(question));
  }

  return parsePipeSeparated(trimmed);
}
