import { initTheme } from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import questionExtension, {
  QuestionDialog,
  QuestionParameters,
  RESERVED_LABELS,
  applyAction,
  buildResult,
  continuationFromBranch,
  createInitialState,
  fitDialogToRows,
  joinColumns,
  previewSideBySide,
  restoreDraft,
  validateQuestions,
} from "../src/index.ts";

import type {
  QuestionDefinition,
  QuestionResultDetails,
  QuestionnaireState,
} from "../src/index.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

initTheme("dark", false);

const smallOption = {
  id: "small",
  label: "Small",
  description: "Minimal change",
  preview: "```txt\nA -> B\n```",
} as const;
const largeOption = { id: "large", label: "Large", description: "Broader change" } as const;
const unitOption = { id: "unit", label: "Unit", description: "Unit tests" } as const;
const e2eOption = { id: "e2e", label: "E2E", description: "End-to-end tests" } as const;
const scopeQuestion: QuestionDefinition = {
  id: "scope",
  header: "Scope",
  question: "Which scope should we use?",
  options: [smallOption, largeOption],
};
const checksQuestion: QuestionDefinition = {
  id: "checks",
  header: "Checks",
  question: "Which checks should run?",
  multiSelect: true,
  options: [unitOption, e2eOption],
};
const questions = [scopeQuestion, checksQuestion] as const;

interface Theme {
  bold(value: string): string;
  fg(color: string, value: string): string;
  bg(color: string, value: string): string;
}

interface RegisteredTool {
  readonly name: string;
  readonly label: string;
  readonly executionMode?: string;
  readonly parameters: unknown;
  readonly promptSnippet?: string;
  readonly promptGuidelines?: readonly string[];
  execute(
    id: string,
    input: { continuationId?: string; questions: readonly QuestionDefinition[] },
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<{
    content: readonly { type: "text"; text: string }[];
    details: QuestionResultDetails;
  }>;
  renderCall(args: { questions?: readonly QuestionDefinition[] }, theme: Theme): Renderable;
  renderResult(
    result: { content: readonly { type: "text"; text: string }[]; details?: QuestionResultDetails },
    options: { expanded: boolean; isPartial: boolean },
    theme: Theme,
  ): Renderable;
}

interface Renderable {
  render(width: number): string[];
}

const theme: Theme = {
  bold: (value) => value,
  fg: (_color, value) => value,
  bg: (_color, value) => value,
};

function register(): RegisteredTool {
  let tool: RegisteredTool | undefined;
  questionExtension({
    registerTool(value: RegisteredTool) {
      tool = value;
    },
  } as unknown as ExtensionAPI);
  if (!tool) throw new Error("question tool was not registered");
  return tool;
}

function branchEntry(details: QuestionResultDetails): unknown {
  return { type: "message", message: { role: "toolResult", toolName: "question", details } };
}

function context(
  mode: "json" | "print" | "rpc" | "tui",
  overrides: Partial<ExtensionContext> = {},
): ExtensionContext {
  return {
    cwd: "/project",
    hasUI: mode === "tui" || mode === "rpc",
    mode,
    sessionManager: { getBranch: () => [] },
    ui: {},
    ...overrides,
  } as unknown as ExtensionContext;
}

describe("question contract", () => {
  it("registers a strict sequential model-facing tool", () => {
    expect.hasAssertions();
    const tool = register();
    expect(tool.name).toBe("question");
    expect(tool.label).toBe("Question");
    expect(tool.executionMode).toBe("sequential");
    expect(tool.parameters).toBe(QuestionParameters);
    expect(tool.promptSnippet).toMatch(/clarifying/i);
    expect(tool.promptGuidelines).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^Use question /u),
        expect.stringMatching(/continuationId/u),
      ]),
    );
  });

  it("enforces semantic limits, uniqueness, and reserved labels", () => {
    expect.hasAssertions();
    expect(validateQuestions(questions)).toEqual([]);
    expect(validateQuestions([])).toContain("questions must contain 1 to 4 questions");
    expect(
      validateQuestions([
        scopeQuestion,
        checksQuestion,
        scopeQuestion,
        checksQuestion,
        scopeQuestion,
      ]),
    ).toContain("questions must contain 1 to 4 questions");
    expect(validateQuestions([{ ...scopeQuestion, header: "thirteen chars" }])).toContain(
      "questions[0].header must be at most 12 characters",
    );
    expect(validateQuestions([{ ...scopeQuestion, options: [smallOption] }])).toContain(
      "questions[0].options must contain 2 to 4 options",
    );
    expect(validateQuestions([scopeQuestion, { ...checksQuestion, id: "scope" }])).toContain(
      'duplicate question id "scope"',
    );
    expect(
      validateQuestions([
        { ...scopeQuestion, options: [smallOption, { ...largeOption, id: "small" }] },
      ]),
    ).toContain('questions[0] has duplicate option id "small"');
    expect(
      validateQuestions([
        { ...scopeQuestion, options: [smallOption, { ...largeOption, label: "Small" }] },
      ]),
    ).toContain('questions[0] has duplicate option label "Small"');
    expect(
      validateQuestions([
        {
          ...scopeQuestion,
          id: " ",
          header: " ",
          question: " ",
          options: [{ ...smallOption, id: " ", label: " ", description: " " }, largeOption],
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "questions[0].id must not be empty",
        "questions[0].header must not be empty",
        "questions[0].question must not be empty",
        "questions[0] option id must not be empty",
        "questions[0] option label must not be empty",
        "questions[0] option description must not be empty",
      ]),
    );
    for (const label of RESERVED_LABELS) {
      expect(
        validateQuestions([
          { ...scopeQuestion, options: [smallOption, { ...largeOption, label }] },
        ]),
      ).toContain(`questions[0] option label "${label}" is reserved`);
    }
  });
});

describe("question state", () => {
  it("persists multi-select toggles and advances through Next", () => {
    expect.hasAssertions();
    let state = createInitialState(questions);
    state = applyAction(state, { kind: "tab", tab: 1 }, questions);
    state = applyAction(state, { kind: "toggle", optionId: "unit" }, questions);
    state = applyAction(state, { kind: "toggle", optionId: "e2e" }, questions);
    expect(state.drafts["checks"]?.selectedIds).toEqual(["unit", "e2e"]);
    state = applyAction(state, { kind: "toggle", optionId: "e2e" }, questions);
    state = applyAction(state, { kind: "toggle", optionId: "e2e" }, questions);
    state = applyAction(state, { kind: "next" }, questions);
    expect(state.tab).toBe(2);
    expect(applyAction(state, { kind: "cursor", index: 1 }, questions)).toBe(state);
    state = applyAction(state, { kind: "tab", tab: 1 }, questions);
    expect(state.drafts["checks"]?.selectedIds).toEqual(["unit", "e2e"]);
  });

  it("supports choices, Other, selected notes, and completeness", () => {
    expect.hasAssertions();
    let state = createInitialState(questions);
    state = applyAction(state, { kind: "select", optionId: "small" }, questions);
    state = applyAction(state, { kind: "note", optionId: "small", text: "prefer this" }, questions);
    state = applyAction(state, { kind: "note", optionId: "large", text: "discard" }, questions);
    state = applyAction(state, { kind: "tab", tab: 1 }, questions);
    state = applyAction(state, { kind: "other", text: "Only smoke tests" }, questions);
    expect(state.complete).toBe(true);
    expect(buildResult("submitted", questions, state).answers).toEqual([
      {
        questionId: "scope",
        selections: [{ optionId: "small", label: "Small", note: "prefer this" }],
      },
      {
        questionId: "checks",
        selections: [],
        custom: "Only smoke tests",
      },
    ]);
    let singleState = applyAction(
      createInitialState([scopeQuestion]),
      { kind: "select", optionId: "small" },
      [scopeQuestion],
    );
    singleState = applyAction(singleState, { kind: "other", text: "custom" }, [scopeQuestion]);
    expect(singleState.drafts["scope"]).toMatchObject({ selectedIds: [], custom: "custom" });
    expect(
      applyAction(singleState, { kind: "cursor", index: -4 }, [scopeQuestion]).cursorByQuestion[
        "scope"
      ],
    ).toBe(0);
  });

  it("restores only semantically unchanged questions", () => {
    expect.hasAssertions();
    let state = createInitialState(questions);
    state = applyAction(state, { kind: "select", optionId: "small" }, questions);
    state = applyAction(state, { kind: "note", optionId: "small", text: "keep" }, questions);
    const prior = buildResult("redirected", questions, state, {
      continuationId: "continue-1",
      redirect: "Clarify scope",
    });
    const revisedChecks = { ...checksQuestion, question: "Which revised checks should run?" };
    const restored = restoreDraft([scopeQuestion, revisedChecks], prior);
    expect(restored.drafts["scope"]).toMatchObject({
      selectedIds: ["small"],
      notes: { small: "keep" },
    });
    expect(restored.drafts["checks"]).toEqual({ selectedIds: [], notes: {} });
    expect(restored.complete).toBe(false);
    expect(restoreDraft(questions, buildResult("cancelled", questions, state))).toEqual(
      createInitialState(questions),
    );
    expect(continuationFromBranch([{}, branchEntry(prior)], "continue-1")).toBe(prior);
    expect(
      continuationFromBranch([branchEntry(buildResult("submitted", questions, state))], "missing"),
    ).toBeUndefined();
    const removedOptionQuestion = { ...scopeQuestion, options: [largeOption, e2eOption] };
    const compatible = restoreDraft([removedOptionQuestion], prior);
    expect(compatible.drafts["scope"]?.selectedIds).toEqual([]);
  });
});

describe("terminal layout", () => {
  it("keeps sticky chrome and marks clipped directions", () => {
    expect.hasAssertions();
    const body = Array.from({ length: 12 }, (_, index) => `body-${String(index)}`);
    const fitted = fitDialogToRows(["TOP", "TABS", "QUESTION", ...body, "HINT", "BOTTOM"], {
      rows: 8,
      topRows: 3,
      bottomRows: 2,
      focusStart: 8,
      focusEnd: 8,
    });
    expect(fitted).toHaveLength(8);
    expect(fitted.slice(0, 3)).toEqual(["TOP", "TABS", "QUESTION"]);
    expect(fitted.slice(-2)).toEqual(["HINT", "BOTTOM"]);
    expect(fitted[3]).toMatch(/^↑ /u);
    expect(fitted[5]).toMatch(/^↓ /u);
  });

  it("combines one-row overflow and switches preview layout at 99/100", () => {
    expect.hasAssertions();
    expect(
      fitDialogToRows(["TOP", "a", "b", "c", "BOTTOM"], {
        rows: 3,
        topRows: 1,
        bottomRows: 1,
        focusStart: 2,
        focusEnd: 2,
      }),
    ).toEqual(["TOP", "↕ b", "BOTTOM"]);
    expect(previewSideBySide(99)).toBe(false);
    expect(previewSideBySide(100)).toBe(true);
    const lines = joinColumns(["界界界", "left-only"], ["preview → value"], 24);
    expect(visibleWidth(lines[0] ?? "")).toBeLessThanOrEqual(24);
    expect(lines).toHaveLength(2);
    expect(
      fitDialogToRows(["TOP", "body", "BOTTOM"], {
        rows: 3,
        topRows: 1,
        bottomRows: 1,
        focusStart: 1,
        focusEnd: 1,
      }),
    ).toEqual(["TOP", "body", "BOTTOM"]);
    expect(
      fitDialogToRows(["TOP", "body", "BOTTOM"], {
        rows: 1,
        topRows: 1,
        bottomRows: 1,
        focusStart: 1,
        focusEnd: 1,
      }),
    ).toEqual(["TOP"]);
  });
});

describe("TUI dialog", () => {
  const single: readonly QuestionDefinition[] = [
    {
      ...scopeQuestion,
      options: [
        { id: smallOption.id, label: smallOption.label, description: smallOption.description },
        largeOption,
      ],
    },
  ];

  it("submits through custom UI and bounds every line", async () => {
    expect.hasAssertions();
    const ctx = context("tui", {
      ui: {
        custom(factory: (...arguments_: unknown[]) => unknown) {
          return new Promise((resolve) => {
            const tui = {
              terminal: { rows: 12 },
              requestRender() {
                return;
              },
            };
            const keybindings = {
              matches(data: unknown, id: unknown) {
                return id === "tui.select.confirm" && data === "\r";
              },
            };
            const component = factory(tui, theme, keybindings, resolve) as Renderable & {
              handleInput(data: string): void;
            };
            expect(component.render(40).every((line) => visibleWidth(line) <= 40)).toBe(true);
            component.handleInput("\r");
            component.handleInput("\r");
          });
        },
      },
    } as unknown as Partial<ExtensionContext>);
    const result = await register().execute("id", { questions: single }, undefined, undefined, ctx);
    expect(result.details.status).toBe("submitted");
    expect(result.details.answers[0]?.selections[0]?.optionId).toBe("small");
  });

  it("is terminal-row-bounded with sticky borders and safe invalidation", () => {
    expect.hasAssertions();
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 7 },
        requestRender() {
          return;
        },
      },
      theme as never,
      { matches: () => false },
      single,
      createInitialState(single),
      () => {
        return;
      },
    );
    const lines = dialog.render(32);
    expect(lines).toHaveLength(7);
    expect(lines[0]).toMatch(/^─+$/u);
    expect(lines.at(-1)).toMatch(/^─+$/u);
    expect(lines.every((line) => visibleWidth(line) <= 32)).toBe(true);
    expect(() => {
      dialog.invalidate();
    }).not.toThrow();
    expect(dialog.render(32)).toHaveLength(7);
  });

  it("handles multi-select Next, notes, incomplete Submit, and tab persistence", () => {
    expect.hasAssertions();
    const previewChecks: QuestionDefinition = {
      ...checksQuestion,
      options: [{ ...unitOption, preview: "**Unit preview**" }, e2eOption],
    };
    const dialogQuestions = [scopeQuestion, previewChecks];
    let outcome: unknown;
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 30 },
        requestRender() {
          return;
        },
      },
      theme as never,
      {
        matches(data: string, id: string) {
          return (
            (id === "tui.select.confirm" && data === "\r") ||
            (id === "tui.select.up" && data === "UP") ||
            (id === "tui.select.down" && data === "DOWN") ||
            (id === "tui.select.cancel" && data === "ESC")
          );
        },
      },
      dialogQuestions,
      createInitialState(dialogQuestions),
      (value) => {
        outcome = value;
      },
    );
    dialog.handleInput("\t");
    dialog.handleInput(" ");
    dialog.handleInput("n");
    expect(dialog.render(80).some((line) => line.includes("Note:"))).toBe(true);
    for (const character of "keep") dialog.handleInput(character);
    dialog.handleInput("\r");
    expect(dialog.render(99).some((line) => line.includes("Unit preview"))).toBe(true);
    expect(dialog.render(100).every((line) => visibleWidth(line) <= 100)).toBe(true);
    for (let index = 0; index < 4; index++) dialog.handleInput("DOWN");
    dialog.handleInput("\r");
    expect(dialog.render(80).some((line) => line.includes("Submit answers (disabled)"))).toBe(true);
    dialog.handleInput("\r");
    dialog.handleInput("\r");
    dialog.handleInput("\t");
    dialog.handleInput("\r");
    expect(outcome).toMatchObject({
      kind: "submitted",
      state: {
        drafts: {
          checks: { selectedIds: ["unit"], notes: { unit: "keep" } },
          scope: { selectedIds: ["small"] },
        },
      },
    });
  });

  it("supports Other and Chat editors and two-stage Escape", () => {
    expect.hasAssertions();
    const keybindings = {
      matches(data: string, id: string) {
        return (
          (id === "tui.select.confirm" && data === "\r") ||
          (id === "tui.select.down" && data === "DOWN") ||
          (id === "tui.select.cancel" && data === "ESC")
        );
      },
    };
    let redirected: unknown;
    const chat = new QuestionDialog(
      {
        terminal: { rows: 20 },
        requestRender() {
          return;
        },
      },
      theme as never,
      keybindings,
      single,
      createInitialState(single),
      (value) => {
        redirected = value;
      },
    );
    chat.handleInput("DOWN");
    chat.handleInput("DOWN");
    chat.handleInput("DOWN");
    chat.handleInput("\r");
    chat.handleInput("x");
    chat.handleInput("\u{1B}");
    expect(redirected).toBeUndefined();
    chat.handleInput("\r");
    for (const character of "clarify") chat.handleInput(character);
    chat.handleInput("\r");
    expect(redirected).toMatchObject({ kind: "redirected", text: "clarify" });

    let submitted: unknown;
    const other = new QuestionDialog(
      {
        terminal: { rows: 20 },
        requestRender() {
          return;
        },
      },
      theme as never,
      keybindings,
      single,
      createInitialState(single),
      (value) => {
        submitted = value;
      },
    );
    other.handleInput("DOWN");
    other.handleInput("DOWN");
    other.handleInput("\r");
    for (const character of "custom") other.handleInput(character);
    other.handleInput("\r");
    other.handleInput("\t");
    other.handleInput("\r");
    expect(submitted).toMatchObject({ kind: "submitted", state: { complete: true } });
  });

  it("supports focus propagation, submit-tab Chat, navigation, and Escape cancellation", () => {
    expect.hasAssertions();
    const keybindings = {
      matches(data: string, id: string) {
        return (
          (id === "tui.select.confirm" && data === "\r") ||
          (id === "tui.select.up" && data === "UP") ||
          (id === "tui.select.down" && data === "DOWN") ||
          (id === "tui.select.cancel" && data === "ESC")
        );
      },
    };
    let outcome: unknown;
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 30 },
        requestRender() {
          return;
        },
      },
      theme as never,
      keybindings,
      single,
      createInitialState(single),
      (value) => {
        outcome = value;
      },
    );
    dialog.focused = true;
    expect(dialog.focused).toBe(true);
    dialog.handleInput("UP");
    dialog.handleInput("DOWN");
    dialog.handleInput("\r");
    dialog.handleInput("DOWN");
    dialog.handleInput("\r");
    for (const character of "review clarification") dialog.handleInput(character);
    dialog.handleInput("\r");
    expect(outcome).toMatchObject({ kind: "redirected", text: "review clarification" });

    let cancelled: unknown;
    const cancelDialog = new QuestionDialog(
      {
        terminal: { rows: 20 },
        requestRender() {
          return;
        },
      },
      theme as never,
      keybindings,
      single,
      createInitialState(single),
      (value) => {
        cancelled = value;
      },
    );
    cancelDialog.handleInput("ESC");
    cancelDialog.cancelAbort();
    expect(cancelled).toMatchObject({ kind: "cancelled", reason: "escape" });
  });

  it("handles AbortSignal exactly once", async () => {
    expect.hasAssertions();
    const controller = new AbortController();
    let doneCalls = 0;
    const ctx = context("tui", {
      ui: {
        custom(factory: (...arguments_: unknown[]) => unknown) {
          return new Promise((resolve) => {
            const done = (value: unknown) => {
              doneCalls++;
              resolve(value);
            };
            factory(
              {
                terminal: { rows: 20 },
                requestRender() {
                  return;
                },
              },
              theme,
              { matches: () => false },
              done,
            );
            controller.abort();
            controller.abort();
          });
        },
      },
    } as unknown as Partial<ExtensionContext>);
    const result = await register().execute(
      "id",
      { questions: single },
      controller.signal,
      undefined,
      ctx,
    );
    expect(result.details).toMatchObject({ status: "cancelled", reason: "abort" });
    expect(doneCalls).toBe(1);
  });
});

describe("tool execution modes", () => {
  it.each(["json", "print"] as const)("returns structured unavailable in %s mode", async (mode) => {
    expect.hasAssertions();
    const result = await register().execute(
      "id",
      { questions },
      undefined,
      undefined,
      context(mode),
    );
    expect(result.details).toMatchObject({ status: "unavailable", answers: [] });
    expect(result.content[0]?.text).toMatch(/not available/i);
  });

  it("rejects semantic errors and handles a pre-aborted TUI call", async () => {
    expect.hasAssertions();
    await expect(
      register().execute("id", { questions: [] }, undefined, undefined, context("print")),
    ).rejects.toThrow(/Invalid question input/u);
    const controller = new AbortController();
    controller.abort();
    const result = await register().execute(
      "id",
      { questions: [scopeQuestion] },
      controller.signal,
      undefined,
      context("tui"),
    );
    expect(result.details).toMatchObject({ status: "cancelled", reason: "abort" });
    const noUi = await register().execute(
      "id",
      { questions: [scopeQuestion] },
      undefined,
      undefined,
      context("rpc", { hasUI: false }),
    );
    expect(noUi.details.status).toBe("unavailable");
  });

  it("walks RPC single/multi questions and submits", async () => {
    expect.hasAssertions();
    const selections = ["Small", "Next →", "[ ] Unit", "Next →", "Submit answers"];
    const ctx = context("rpc", {
      ui: {
        select: () => Promise.resolve(selections.shift()),
        input: () => Promise.resolve(undefined),
      },
    } as unknown as Partial<ExtensionContext>);
    const result = await register().execute("id", { questions }, undefined, undefined, ctx);
    expect(result.details.status).toBe("submitted");
    expect(
      result.details.answers.map((answer) => answer.selections.map((item) => item.optionId)),
    ).toEqual([["small"], ["unit"]]);
  });

  it("supports RPC Other, review Chat, and cancellation", async () => {
    expect.hasAssertions();
    const choices = ["Other…", "[ ] Unit", "Next →", "Chat about this…"];
    const inputs = ["custom scope", "review clarification"];
    const ctx = context("rpc", {
      ui: {
        select: () => Promise.resolve(choices.shift()),
        input: () => Promise.resolve(inputs.shift()),
      },
    } as unknown as Partial<ExtensionContext>);
    const redirected = await register().execute("id", { questions }, undefined, undefined, ctx);
    expect(redirected.details).toMatchObject({
      status: "redirected",
      redirect: "review clarification",
      answers: [
        { questionId: "scope", custom: "custom scope" },
        { questionId: "checks", selections: [{ optionId: "unit" }] },
      ],
    });
    const cancelledContext = context("rpc", {
      ui: {
        select: () => Promise.resolve(undefined),
        input: () => Promise.resolve(undefined),
      },
    } as unknown as Partial<ExtensionContext>);
    const cancelled = await register().execute(
      "id",
      { questions },
      undefined,
      undefined,
      cancelledContext,
    );
    expect(cancelled.details).toMatchObject({ status: "cancelled", reason: "escape" });
  });

  it("handles RPC cancellation, abort, and invalid host responses explicitly", async () => {
    expect.hasAssertions();
    const executeWith = async (
      questionSet: readonly QuestionDefinition[],
      choices: (string | undefined)[],
      inputs: (string | undefined)[] = [],
      signal?: AbortSignal,
    ) =>
      await register().execute(
        "id",
        { questions: questionSet },
        signal,
        undefined,
        context("rpc", {
          ui: {
            select: () => Promise.resolve(choices.shift()),
            input: () => Promise.resolve(inputs.shift()),
          },
        } as unknown as Partial<ExtensionContext>),
      );
    expect((await executeWith([scopeQuestion], ["Other…"], [undefined])).details.reason).toBe(
      "escape",
    );
    expect((await executeWith([scopeQuestion], ["Chat about this…"], [" "])).details.reason).toBe(
      "escape",
    );
    await expect(executeWith([scopeQuestion], ["bogus"])).rejects.toThrow(/unknown option/u);
    await expect(executeWith([checksQuestion], ["bogus"])).rejects.toThrow(/unknown option/u);
    expect(
      (await executeWith([checksQuestion], ["Chat about this…"], [undefined])).details.status,
    ).toBe("cancelled");
    expect((await executeWith([scopeQuestion], ["Small", undefined])).details.reason).toBe(
      "escape",
    );
    const controller = new AbortController();
    controller.abort();
    expect(
      (await executeWith([scopeQuestion], [undefined], [], controller.signal)).details.reason,
    ).toBe("abort");
  });

  it("supports RPC chat redirection and rejects stale continuations", async () => {
    expect.hasAssertions();
    const ctx = context("rpc", {
      sessionManager: { getBranch: () => [] },
      ui: {
        select: () => Promise.resolve("Chat about this…"),
        input: () => Promise.resolve("What does scope mean?"),
      },
    } as unknown as Partial<ExtensionContext>);
    const redirected = await register().execute("id", { questions }, undefined, undefined, ctx);
    expect(redirected.details).toMatchObject({
      status: "redirected",
      redirect: "What does scope mean?",
    });
    expect(redirected.details.continuationId).toMatch(/^question-/u);
    await expect(
      register().execute("id", { continuationId: "missing", questions }, undefined, undefined, ctx),
    ).rejects.toThrow(/continuationId.*current session branch/u);
  });

  it("restores continuation details from the current branch", async () => {
    expect.hasAssertions();
    const priorState: QuestionnaireState = applyAction(
      createInitialState(questions),
      { kind: "select", optionId: "small" },
      questions,
    );
    const prior = buildResult("redirected", questions, priorState, {
      continuationId: "question-existing",
      redirect: "Clarify",
    });
    const selections = ["[ ] Unit", "Next →", "Submit answers"];
    const ctx = context("rpc", {
      sessionManager: { getBranch: () => [branchEntry(prior)] },
      ui: {
        select: () => Promise.resolve(selections.shift()),
        input: () => Promise.resolve(undefined),
      },
    } as unknown as Partial<ExtensionContext>);
    const result = await register().execute(
      "id",
      { continuationId: "question-existing", questions },
      undefined,
      undefined,
      ctx,
    );
    expect(result.details.status).toBe("submitted");
    expect(result.details.answers[0]?.selections[0]?.optionId).toBe("small");
  });

  it("renders compact calls and results", () => {
    expect.hasAssertions();
    const tool = register();
    expect(tool.renderCall({}, theme).render(80).join("\n")).toMatch(/0 questions/u);
    expect(tool.renderCall({ questions }, theme).render(80).join("\n")).toMatch(/2 questions/u);
    expect(
      tool
        .renderCall({ questions: [scopeQuestion] }, theme)
        .render(80)
        .join("\n"),
    ).toMatch(/1 question/u);
    const details = buildResult("cancelled", questions, createInitialState(questions));
    expect(
      tool.renderResult({ content: [] }, { expanded: false, isPartial: false }, theme).render(80),
    ).toHaveLength(0);
    expect(
      tool
        .renderResult({ content: [], details }, { expanded: false, isPartial: false }, theme)
        .render(80)
        .map((line) => line.trimEnd()),
    ).toEqual(["Cancelled"]);
    const unavailable = buildResult("unavailable", questions, createInitialState(questions));
    expect(
      tool
        .renderResult(
          { content: [], details: unavailable },
          { expanded: false, isPartial: false },
          theme,
        )
        .render(80)
        .join(""),
    ).toContain("Unavailable");
    const redirected = buildResult("redirected", questions, createInitialState(questions), {
      continuationId: "next",
      redirect: "clarify",
    });
    expect(
      tool
        .renderResult(
          { content: [], details: redirected },
          { expanded: false, isPartial: false },
          theme,
        )
        .render(80)
        .join(""),
    ).toContain("Clarifying: clarify");
    const submitted = buildResult("submitted", questions, createInitialState(questions));
    expect(
      tool
        .renderResult(
          { content: [], details: submitted },
          { expanded: false, isPartial: false },
          theme,
        )
        .render(80)
        .join(""),
    ).toContain("2 answers submitted");
    expect(
      tool
        .renderResult(
          { content: [{ type: "text", text: "fallback" }] },
          { expanded: false, isPartial: false },
          theme,
        )
        .render(80)
        .join(""),
    ).toContain("fallback");
  });
});
