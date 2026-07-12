import { Text } from "@earendil-works/pi-tui";

import { boundUtf8, MAX_COMPACT_RENDER_BYTES, MAX_MODEL_CONTENT_BYTES } from "./bounds.ts";
import { QuestionDialog, type DialogOutcome } from "./dialog.ts";
import { buildResult, createContinuationId, lookupContinuation, restoreDraft } from "./results.ts";
import { walkRpc } from "./rpc.ts";
import { QuestionParameters, validateQuestions } from "./schema.ts";
import { createInitialState } from "./state.ts";

import type {
  QuestionDefinition,
  QuestionInput,
  QuestionResultDetails,
  QuestionnaireState,
} from "./types.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export {
  MAX_COMPACT_RENDER_BYTES,
  MAX_CUSTOM_JSON_BYTES,
  MAX_MODEL_CONTENT_BYTES,
  MAX_NOTE_JSON_BYTES,
  MAX_REDIRECT_JSON_BYTES,
  TRUNCATION_MARKER,
  boundJsonUtf8,
  boundUtf8,
  hasStructuralControl,
  sanitizeText,
} from "./bounds.ts";
export { QuestionDialog } from "./dialog.ts";
export {
  columnWidths,
  fitDialogToRows,
  joinColumns,
  PREVIEW_MIN_WIDTH,
  previewSideBySide,
} from "./layout.ts";
export {
  answersFromState,
  buildResult,
  continuationFromBranch,
  createContinuationId,
  lookupContinuation,
  restoreDraft,
} from "./results.ts";
export { QuestionParameters, RESERVED_LABELS, validateQuestions } from "./schema.ts";
export { applyAction, createInitialState, firstUnansweredTab } from "./state.ts";
export type * from "./types.ts";

function initialState(
  input: QuestionInput,
  ctx: ExtensionContext,
): { readonly state: QuestionnaireState; readonly continuedFrom?: string } {
  if (!input.continuationId) return { state: createInitialState(input.questions) };
  const lookup = lookupContinuation(ctx.sessionManager.getBranch(), input.continuationId);
  if (lookup.kind === "stale") {
    throw new Error(
      `continuationId "${input.continuationId}" is stale on the current session branch`,
    );
  }
  if (lookup.kind === "unknown") {
    throw new Error(
      `continuationId "${input.continuationId}" was not found on the current session branch`,
    );
  }
  return {
    state: restoreDraft(input.questions, lookup.details),
    continuedFrom: input.continuationId,
  };
}

function contentFor(details: QuestionResultDetails): string {
  if (details.status === "unavailable") {
    return "Structured questions are not available in this non-interactive mode.";
  }
  if (details.status === "cancelled") {
    return details.reason === "abort"
      ? "Question dialog aborted."
      : "User cancelled the question dialog.";
  }
  if (details.status === "redirected") {
    return `User wants to clarify before answering: ${details.redirect ?? ""}\nRe-call question with continuationId ${details.continuationId ?? ""} and revised questions after addressing the clarification.`;
  }
  const lines = details.answers.map((answer) => {
    const selections = answer.selections
      .map((selection) => `${selection.label}${selection.note ? ` (note: ${selection.note})` : ""}`)
      .join(", ");
    return `${answer.questionId}: ${[selections, answer.custom].filter(Boolean).join("; ")}`;
  });
  return `User submitted answers:\n${lines.join("\n")}`;
}

function toolResult(details: QuestionResultDetails) {
  return {
    content: [
      {
        type: "text" as const,
        text: boundUtf8(contentFor(details), MAX_MODEL_CONTENT_BYTES),
      },
    ],
    details,
  };
}

async function runTui(
  questions: readonly QuestionDefinition[],
  state: QuestionnaireState,
  ctx: ExtensionContext,
  signal: AbortSignal | undefined,
): Promise<DialogOutcome> {
  if (signal?.aborted) return { kind: "cancelled", state, reason: "abort" };
  let dialog: QuestionDialog | undefined;
  const abort = () => dialog?.cancelAbort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    return await ctx.ui.custom<DialogOutcome>((tui, theme, keybindings, done) => {
      dialog = new QuestionDialog(tui, theme, keybindings, questions, state, done);
      if (signal?.aborted) queueMicrotask(() => dialog?.cancelAbort());
      return dialog;
    });
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}

export default function questionExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "question",
    label: "Question",
    description:
      "Ask the user 1-4 structured clarifying questions with choices, previews, notes, custom answers, and conversational redirection. Use stable IDs and re-call with continuationId after a redirected result.",
    promptSnippet: "Ask structured clarifying questions instead of guessing",
    promptGuidelines: [
      "Use question when a material ambiguity, preference, or decision requires user input instead of guessing.",
      "After question returns redirected, address the clarification and re-call question with its continuationId and revised questions; retain stable IDs only for semantically unchanged questions and options.",
      "Do not add Other, Chat about this, Next, or Submit options to question inputs because question renders those controls.",
    ],
    parameters: QuestionParameters,
    executionMode: "sequential",

    async execute(_id, input: QuestionInput, signal, _update, ctx) {
      const errors = validateQuestions(input.questions);
      if (errors.length > 0) throw new Error(`Invalid question input: ${errors.join("; ")}`);
      if (ctx.mode === "json" || ctx.mode === "print" || !ctx.hasUI) {
        return toolResult(
          buildResult("unavailable", input.questions, createInitialState(input.questions), {
            reason: "no_ui",
          }),
        );
      }
      const resumed = initialState(input, ctx);
      const continuation = resumed.continuedFrom ? { continuedFrom: resumed.continuedFrom } : {};
      const outcome =
        ctx.mode === "rpc"
          ? await walkRpc(input.questions, resumed.state, ctx, signal)
          : await runTui(input.questions, resumed.state, ctx, signal);
      if (outcome.kind === "submitted") {
        return toolResult(buildResult("submitted", input.questions, outcome.state, continuation));
      }
      if (outcome.kind === "redirected") {
        return toolResult(
          buildResult("redirected", input.questions, outcome.state, {
            ...continuation,
            continuationId: createContinuationId(),
            redirect: outcome.text,
          }),
        );
      }
      return toolResult(
        buildResult("cancelled", input.questions, outcome.state, {
          ...continuation,
          reason: outcome.reason,
        }),
      );
    },

    renderCall(args, theme) {
      const count = Array.isArray(args.questions) ? args.questions.length : 0;
      const label = `${String(count)} question${count === 1 ? "" : "s"}`;
      return new Text(
        `${theme.fg("toolTitle", theme.bold("question "))}${theme.fg("muted", label)}`,
        0,
        0,
      );
    },

    renderResult(result, _options, theme) {
      const details = result.details as QuestionResultDetails | undefined;
      if (!details) {
        const text = result.content.find((item) => item.type === "text");
        return new Text(
          boundUtf8(text?.type === "text" ? text.text : "", MAX_COMPACT_RENDER_BYTES),
          0,
          0,
        );
      }
      if (details.status === "cancelled") return new Text(theme.fg("warning", "Cancelled"), 0, 0);
      if (details.status === "unavailable")
        return new Text(theme.fg("warning", "Unavailable"), 0, 0);
      if (details.status === "redirected") {
        return new Text(
          theme.fg(
            "accent",
            boundUtf8(`Clarifying: ${details.redirect ?? ""}`, MAX_COMPACT_RENDER_BYTES),
          ),
          0,
          0,
        );
      }
      return new Text(
        theme.fg(
          "success",
          `✓ ${String(details.answers.length)} answer${details.answers.length === 1 ? "" : "s"} submitted`,
        ),
        0,
        0,
      );
    },
  });
}
