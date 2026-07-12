import { applyAction, firstUnansweredTab } from "./state.ts";

import type { QuestionDefinition, QuestionnaireState } from "./types.ts";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export type WalkerOutcome =
  | { readonly kind: "submitted"; readonly state: QuestionnaireState }
  | { readonly kind: "redirected"; readonly state: QuestionnaireState; readonly text: string }
  | {
      readonly kind: "cancelled";
      readonly state: QuestionnaireState;
      readonly reason: "abort" | "escape";
    };

type Intermediate =
  | { readonly done: false; readonly state: QuestionnaireState }
  | { readonly done: true; readonly outcome: WalkerOutcome };

const OTHER = "Other…";
const CHAT = "Chat about this…";
const NEXT = "Next →";
const SUBMIT = "Submit answers";

function dialogOptions(signal: AbortSignal | undefined): { signal?: AbortSignal } {
  return signal ? { signal } : {};
}

function cancelled(state: QuestionnaireState, signal: AbortSignal | undefined): WalkerOutcome {
  return { kind: "cancelled", state, reason: signal?.aborted ? "abort" : "escape" };
}

function nestedAbort(result: Intermediate, signal: AbortSignal | undefined): Intermediate {
  if (!signal?.aborted) return result;
  const state = (result.done ? result.outcome : result).state;
  return { done: true, outcome: cancelled(state, signal) };
}

function nestedOutcomeAbort(
  outcome: WalkerOutcome,
  signal: AbortSignal | undefined,
): WalkerOutcome {
  return signal?.aborted ? cancelled(outcome.state, signal) : outcome;
}

async function redirect(
  state: QuestionnaireState,
  ctx: ExtensionContext,
  signal: AbortSignal | undefined,
): Promise<WalkerOutcome> {
  for (;;) {
    const text = await ctx.ui.input(CHAT, "Type a response", dialogOptions(signal));
    if (signal?.aborted) return cancelled(state, signal);
    if (text === undefined) return cancelled(state, signal);
    if (text.trim()) return { kind: "redirected", state, text: text.trim() };
  }
}

async function customAnswer(
  state: QuestionnaireState,
  questions: readonly QuestionDefinition[],
  ctx: ExtensionContext,
  signal: AbortSignal | undefined,
): Promise<Intermediate> {
  const text = await ctx.ui.input(OTHER, "Type a response", dialogOptions(signal));
  if (signal?.aborted) return { done: true, outcome: cancelled(state, signal) };
  if (text === undefined) return { done: true, outcome: cancelled(state, signal) };
  return { done: false, state: applyAction(state, { kind: "other", text }, questions) };
}

async function walkSingle(
  state: QuestionnaireState,
  question: QuestionDefinition,
  questions: readonly QuestionDefinition[],
  ctx: ExtensionContext,
  signal: AbortSignal | undefined,
): Promise<Intermediate> {
  const choice = await ctx.ui.select(
    `${question.header}: ${question.question}`,
    [...question.options.map((option) => option.label), OTHER, CHAT],
    dialogOptions(signal),
  );
  if (signal?.aborted) return { done: true, outcome: cancelled(state, signal) };
  if (!choice) return { done: true, outcome: cancelled(state, signal) };
  if (choice === CHAT) {
    const outcome = await redirect(state, ctx, signal);
    return { done: true, outcome: nestedOutcomeAbort(outcome, signal) };
  }
  if (choice === OTHER) {
    return nestedAbort(await customAnswer(state, questions, ctx, signal), signal);
  }
  const option = question.options.find((item) => item.label === choice);
  if (!option) throw new Error(`RPC returned unknown option "${choice}"`);
  return {
    done: false,
    state: applyAction(state, { kind: "select", optionId: option.id }, questions),
  };
}

async function applyMultiChoice(
  state: QuestionnaireState,
  question: QuestionDefinition,
  questions: readonly QuestionDefinition[],
  choice: string,
  ctx: ExtensionContext,
  signal: AbortSignal | undefined,
): Promise<Intermediate> {
  if (choice === CHAT) {
    const outcome = await redirect(state, ctx, signal);
    return { done: true, outcome: nestedOutcomeAbort(outcome, signal) };
  }
  if (choice === OTHER) {
    return nestedAbort(await customAnswer(state, questions, ctx, signal), signal);
  }
  const plain = choice.replace(/^\[[ x]\]\s+/u, "");
  const option = question.options.find((item) => item.label === plain);
  if (!option) throw new Error(`RPC returned unknown option "${choice}"`);
  return {
    done: false,
    state: applyAction(state, { kind: "toggle", optionId: option.id }, questions),
  };
}

async function walkMulti(
  initialState: QuestionnaireState,
  question: QuestionDefinition,
  tab: number,
  questions: readonly QuestionDefinition[],
  ctx: ExtensionContext,
  signal: AbortSignal | undefined,
): Promise<Intermediate> {
  let state = initialState;
  for (;;) {
    const selected = state.drafts[question.id]?.selectedIds ?? [];
    const labels = question.options.map(
      (option) => `${selected.includes(option.id) ? "[x]" : "[ ]"} ${option.label}`,
    );
    const choice = await ctx.ui.select(
      `${question.header}: ${question.question}`,
      [...labels, OTHER, CHAT, NEXT],
      dialogOptions(signal),
    );
    if (signal?.aborted) return { done: true, outcome: cancelled(state, signal) };
    if (!choice) return { done: true, outcome: cancelled(state, signal) };
    if (choice === NEXT) {
      if (firstUnansweredTab(state, questions) !== tab) return { done: false, state };
      continue;
    }
    const result = nestedAbort(
      await applyMultiChoice(state, question, questions, choice, ctx, signal),
      signal,
    );
    if (result.done) return result;
    state = result.state;
  }
}

async function review(
  state: QuestionnaireState,
  ctx: ExtensionContext,
  signal: AbortSignal | undefined,
): Promise<WalkerOutcome> {
  for (;;) {
    const choice = await ctx.ui.select("Review answers", [SUBMIT, CHAT], dialogOptions(signal));
    if (signal?.aborted) return cancelled(state, signal);
    if (!choice) return cancelled(state, signal);
    if (choice === SUBMIT && state.complete) return { kind: "submitted", state };
    if (choice === CHAT) {
      return nestedOutcomeAbort(await redirect(state, ctx, signal), signal);
    }
  }
}

export async function walkRpc(
  questions: readonly QuestionDefinition[],
  initialState: QuestionnaireState,
  ctx: ExtensionContext,
  signal: AbortSignal | undefined,
): Promise<WalkerOutcome> {
  let state = initialState;
  for (const [tab, question] of questions.entries()) {
    const existing = state.drafts[question.id];
    if (existing && (existing.selectedIds.length > 0 || existing.custom)) continue;
    state = applyAction(state, { kind: "tab", tab }, questions);
    if (question.multiSelect) {
      const result = nestedAbort(
        await walkMulti(state, question, tab, questions, ctx, signal),
        signal,
      );
      if (result.done) return result.outcome;
      state = result.state;
      continue;
    }
    for (;;) {
      const result = nestedAbort(await walkSingle(state, question, questions, ctx, signal), signal);
      if (result.done) return result.outcome;
      state = result.state;
      if (firstUnansweredTab(state, questions) !== tab) break;
    }
  }
  state = applyAction(state, { kind: "tab", tab: questions.length }, questions);
  return nestedOutcomeAbort(await review(state, ctx, signal), signal);
}
