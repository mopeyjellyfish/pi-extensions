import { boundJsonUtf8, MAX_CUSTOM_JSON_BYTES, MAX_NOTE_JSON_BYTES } from "./bounds.ts";

import type {
  QuestionAction,
  QuestionDefinition,
  QuestionDraft,
  QuestionnaireState,
} from "./types.ts";

function blankDraft(): QuestionDraft {
  return { selectedIds: [], notes: {} };
}

function isAnswered(draft: QuestionDraft | undefined): boolean {
  return Boolean(draft && (draft.selectedIds.length > 0 || (draft.custom?.trim().length ?? 0) > 0));
}

function withCompleteness(
  state: Omit<QuestionnaireState, "complete">,
  questions: readonly QuestionDefinition[],
): QuestionnaireState {
  return {
    ...state,
    complete: questions.every((question) => isAnswered(state.drafts[question.id])),
  };
}

export function createInitialState(questions: readonly QuestionDefinition[]): QuestionnaireState {
  const drafts = Object.fromEntries(questions.map((question) => [question.id, blankDraft()]));
  const cursorByQuestion = Object.fromEntries(questions.map((question) => [question.id, 0]));
  return { tab: 0, drafts, cursorByQuestion, complete: false };
}

export function applyAction(
  state: QuestionnaireState,
  action: QuestionAction,
  questions: readonly QuestionDefinition[],
): QuestionnaireState {
  if (action.kind === "tab") {
    return { ...state, tab: Math.max(0, Math.min(action.tab, questions.length)) };
  }
  if (action.kind === "next") {
    return { ...state, tab: Math.min(state.tab + 1, questions.length) };
  }
  const question = questions[state.tab];
  if (!question) return state;
  if (action.kind === "cursor") {
    return {
      ...state,
      cursorByQuestion: { ...state.cursorByQuestion, [question.id]: Math.max(0, action.index) },
    };
  }
  const current = state.drafts[question.id] ?? blankDraft();
  let draft: QuestionDraft;
  switch (action.kind) {
    case "select":
      draft = { selectedIds: [action.optionId], notes: current.notes };
      break;
    case "toggle": {
      const selected = new Set(current.selectedIds);
      if (selected.has(action.optionId)) selected.delete(action.optionId);
      else selected.add(action.optionId);
      draft = { ...current, selectedIds: [...selected] };
      break;
    }
    case "other": {
      const custom = boundJsonUtf8(action.text.trim(), MAX_CUSTOM_JSON_BYTES);
      draft = {
        selectedIds: question.multiSelect ? current.selectedIds : [],
        notes: current.notes,
        ...(custom ? { custom } : {}),
      };
      break;
    }
    case "note": {
      const note = boundJsonUtf8(action.text.trim(), MAX_NOTE_JSON_BYTES);
      const notes = note
        ? { ...current.notes, [action.optionId]: note }
        : Object.fromEntries(
            Object.entries(current.notes).filter(([id]) => id !== action.optionId),
          );
      draft = { ...current, notes };
      break;
    }
  }
  return withCompleteness(
    { ...state, drafts: { ...state.drafts, [question.id]: draft } },
    questions,
  );
}

export function firstUnansweredTab(
  state: QuestionnaireState,
  questions: readonly QuestionDefinition[],
): number | undefined {
  const index = questions.findIndex((question) => !isAnswered(state.drafts[question.id]));
  return index === -1 ? undefined : index;
}
