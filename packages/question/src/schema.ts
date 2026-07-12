import { Type } from "typebox";

import { hasStructuralControl, sanitizeText } from "./bounds.ts";

import type { QuestionDefinition } from "./types.ts";

export const RESERVED_LABELS = [
  "Other",
  "Other…",
  "Type something.",
  "Chat about this…",
  "Next",
  "Next →",
] as const;

const OptionSchema = Type.Object(
  {
    id: Type.String({ minLength: 1, maxLength: 64, description: "Stable option identifier" }),
    label: Type.String({ minLength: 1, maxLength: 80, description: "Concise display label" }),
    description: Type.String({
      minLength: 1,
      maxLength: 400,
      description: "What this option means",
    }),
    preview: Type.Optional(
      Type.String({
        maxLength: 12_000,
        description: "Optional Markdown preview; fence code and ASCII diagrams",
      }),
    ),
  },
  { additionalProperties: false },
);

const QuestionSchema = Type.Object(
  {
    id: Type.String({ minLength: 1, maxLength: 64, description: "Stable question identifier" }),
    header: Type.String({
      minLength: 1,
      maxLength: 12,
      description: "Short tab label, at most 12 characters",
    }),
    question: Type.String({
      minLength: 1,
      maxLength: 1000,
      description: "Question shown to the user",
    }),
    multiSelect: Type.Optional(Type.Boolean({ description: "Allow more than one option" })),
    options: Type.Array(OptionSchema, { minItems: 2, maxItems: 4 }),
  },
  { additionalProperties: false },
);

function quoted(value: string): string {
  return JSON.stringify(sanitizeText(value));
}

export const QuestionParameters = Type.Object(
  {
    continuationId: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 128,
        description: "Opaque ID returned by a redirected question call",
      }),
    ),
    questions: Type.Array(QuestionSchema, { minItems: 1, maxItems: 4 }),
  },
  { additionalProperties: false },
);

function validateOption(
  option: QuestionDefinition["options"][number],
  prefix: string,
  ids: Set<string>,
  labels: Set<string>,
): string[] {
  const errors: string[] = [];
  if (ids.has(option.id)) errors.push(`${prefix} has duplicate option id ${quoted(option.id)}`);
  ids.add(option.id);
  if (labels.has(option.label))
    errors.push(`${prefix} has duplicate option label ${quoted(option.label)}`);
  labels.add(option.label);
  if ((RESERVED_LABELS as readonly string[]).includes(option.label)) {
    errors.push(`${prefix} option label ${quoted(option.label)} is reserved`);
  }
  if (!option.id.trim()) errors.push(`${prefix} option id must not be empty`);
  if (hasStructuralControl(option.id)) {
    errors.push(`${prefix} option id must not contain control characters`);
  }
  if (!option.label.trim()) errors.push(`${prefix} option label must not be empty`);
  if (hasStructuralControl(option.label)) {
    errors.push(`${prefix} option label must not contain control characters`);
  }
  if (!option.description.trim()) errors.push(`${prefix} option description must not be empty`);
  return errors;
}

function validateQuestion(question: QuestionDefinition, index: number): string[] {
  const prefix = `questions[${String(index)}]`;
  const errors: string[] = [];
  if (!question.id.trim()) errors.push(`${prefix}.id must not be empty`);
  if (hasStructuralControl(question.id)) {
    errors.push(`${prefix}.id must not contain control characters`);
  }
  if (question.header.length > 12) errors.push(`${prefix}.header must be at most 12 characters`);
  if (!question.header.trim()) errors.push(`${prefix}.header must not be empty`);
  if (hasStructuralControl(question.header)) {
    errors.push(`${prefix}.header must not contain control characters`);
  }
  if (!question.question.trim()) errors.push(`${prefix}.question must not be empty`);
  if (question.options.length < 2 || question.options.length > 4) {
    errors.push(`${prefix}.options must contain 2 to 4 options`);
  }
  const ids = new Set<string>();
  const labels = new Set<string>();
  for (const option of question.options) {
    errors.push(...validateOption(option, prefix, ids, labels));
  }
  return errors;
}

export function validateQuestions(questions: readonly QuestionDefinition[]): string[] {
  const errors =
    questions.length < 1 || questions.length > 4 ? ["questions must contain 1 to 4 questions"] : [];
  const ids = new Set<string>();
  for (const [index, question] of questions.entries()) {
    if (ids.has(question.id)) errors.push(`duplicate question id ${quoted(question.id)}`);
    ids.add(question.id);
    errors.push(...validateQuestion(question, index));
  }
  return errors;
}
