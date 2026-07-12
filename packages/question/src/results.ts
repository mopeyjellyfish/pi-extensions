import { createHash, randomUUID } from "node:crypto";

import {
  boundJsonUtf8,
  MAX_CUSTOM_JSON_BYTES,
  MAX_NOTE_JSON_BYTES,
  MAX_REDIRECT_JSON_BYTES,
} from "./bounds.ts";
import { createInitialState } from "./state.ts";

import type {
  ContinuationQuestionSignature,
  QuestionAnswer,
  QuestionDefinition,
  QuestionDraft,
  QuestionResultDetails,
  QuestionResultStatus,
  QuestionnaireState,
} from "./types.ts";

export function createContinuationId(): string {
  return `question-${randomUUID()}`;
}

export function answersFromState(
  questions: readonly QuestionDefinition[],
  state: QuestionnaireState,
): QuestionAnswer[] {
  return questions.map((question) => {
    const draft = state.drafts[question.id];
    const selected = new Set(draft?.selectedIds);
    const selections = question.options
      .filter((option) => selected.has(option.id))
      .map((option) => {
        const note = draft?.notes[option.id]?.trim();
        return {
          optionId: option.id,
          label: option.label,
          ...(note ? { note: boundJsonUtf8(note, MAX_NOTE_JSON_BYTES) } : {}),
        };
      });
    return {
      questionId: question.id,
      selections,
      ...(draft?.custom ? { custom: boundJsonUtf8(draft.custom, MAX_CUSTOM_JSON_BYTES) } : {}),
    };
  });
}

function semanticHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function continuationSignatures(
  questions: readonly QuestionDefinition[],
): ContinuationQuestionSignature[] {
  return questions.map((question) => ({
    id: question.id,
    semanticHash: semanticHash({
      question: question.question,
      multiSelect: Boolean(question.multiSelect),
    }),
    options: question.options.map(({ id, label, description }) => ({
      id,
      semanticHash: semanticHash({ label, description }),
    })),
  }));
}

export function buildResult(
  status: QuestionResultStatus,
  questions: readonly QuestionDefinition[],
  state: QuestionnaireState,
  options: {
    readonly continuationId?: string;
    readonly continuedFrom?: string;
    readonly redirect?: string;
    readonly reason?: QuestionResultDetails["reason"];
  } = {},
): QuestionResultDetails {
  return {
    status,
    answers: status === "unavailable" ? [] : answersFromState(questions, state),
    ...(options.continuationId ? { continuationId: options.continuationId } : {}),
    ...(options.continuedFrom ? { continuedFrom: options.continuedFrom } : {}),
    ...(options.redirect
      ? { redirect: boundJsonUtf8(options.redirect, MAX_REDIRECT_JSON_BYTES) }
      : {}),
    ...(options.reason ? { reason: options.reason } : {}),
    ...(status === "redirected"
      ? { snapshot: { questions: continuationSignatures(questions) } }
      : {}),
  };
}

function questionHash(question: QuestionDefinition): string {
  return semanticHash({
    question: question.question,
    multiSelect: Boolean(question.multiSelect),
  });
}

function compatibleOptionIds(
  question: QuestionDefinition,
  previous: ContinuationQuestionSignature,
): Set<string> {
  const previousById = new Map(previous.options.map((option) => [option.id, option.semanticHash]));
  return new Set(
    question.options
      .filter(
        ({ id, label, description }) =>
          previousById.get(id) === semanticHash({ label, description }),
      )
      .map((option) => option.id),
  );
}

function restoredDraft(
  question: QuestionDefinition,
  previous: ContinuationQuestionSignature,
  answer: QuestionAnswer,
): QuestionDraft {
  const compatibleIds = compatibleOptionIds(question, previous);
  const compatibleSelections = answer.selections.filter((selection) =>
    compatibleIds.has(selection.optionId),
  );
  return {
    selectedIds: compatibleSelections.map((selection) => selection.optionId),
    notes: Object.fromEntries(
      compatibleSelections
        .filter((selection) => selection.note)
        .map((selection) => [selection.optionId, selection.note ?? ""]),
    ),
    ...(answer.custom ? { custom: answer.custom } : {}),
  };
}

export function restoreDraft(
  questions: readonly QuestionDefinition[],
  prior: QuestionResultDetails,
): QuestionnaireState {
  const fresh = createInitialState(questions);
  if (!prior.snapshot) return fresh;
  const previousById = new Map(prior.snapshot.questions.map((question) => [question.id, question]));
  const answersById = new Map(prior.answers.map((answer) => [answer.questionId, answer]));
  const drafts = { ...fresh.drafts };
  for (const question of questions) {
    const previous = previousById.get(question.id);
    const answer = answersById.get(question.id);
    if (!previous || !answer || previous.semanticHash !== questionHash(question)) continue;
    drafts[question.id] = restoredDraft(question, previous, answer);
  }
  const complete = questions.every((question) => {
    const draft = drafts[question.id];
    return Boolean(draft && (draft.selectedIds.length > 0 || draft.custom));
  });
  return { ...fresh, drafts, complete };
}

interface BranchEntry {
  readonly type?: string;
  readonly message?: {
    readonly role?: string;
    readonly toolName?: string;
    readonly details?: unknown;
  };
}

function isQuestionDetails(value: unknown): value is QuestionResultDetails {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QuestionResultDetails>;
  return (
    (["submitted", "redirected", "cancelled", "unavailable"] as readonly unknown[]).includes(
      candidate.status,
    ) && Array.isArray(candidate.answers)
  );
}

export type ContinuationLookup =
  | { readonly kind: "found"; readonly details: QuestionResultDetails }
  | { readonly kind: "stale" }
  | { readonly kind: "unknown" };

export function lookupContinuation(
  entries: readonly unknown[],
  continuationId: string,
): ContinuationLookup {
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index] as BranchEntry;
    const message = entry.type === "message" ? entry.message : undefined;
    if (message?.role !== "toolResult" || message.toolName !== "question") continue;
    if (!isQuestionDetails(message.details)) continue;
    if (message.details.continuedFrom === continuationId) return { kind: "stale" };
    if (
      message.details.continuationId === continuationId &&
      message.details.status === "redirected"
    ) {
      return { kind: "found", details: message.details };
    }
  }
  return { kind: "unknown" };
}

export function continuationFromBranch(
  entries: readonly unknown[],
  continuationId: string,
): QuestionResultDetails | undefined {
  const lookup = lookupContinuation(entries, continuationId);
  return lookup.kind === "found" ? lookup.details : undefined;
}
