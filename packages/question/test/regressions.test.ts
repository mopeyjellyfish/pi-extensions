import { stripVTControlCharacters } from "node:util";

import { initTheme } from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import questionExtension, {
  MAX_COMPACT_RENDER_BYTES,
  MAX_CUSTOM_JSON_BYTES,
  MAX_MODEL_CONTENT_BYTES,
  MAX_NOTE_JSON_BYTES,
  MAX_REDIRECT_JSON_BYTES,
  QuestionDialog,
  applyAction,
  buildResult,
  columnWidths,
  continuationFromBranch,
  createInitialState,
  fitDialogToRows,
  restoreDraft,
} from "../src/index.ts";

import type {
  QuestionDefinition,
  QuestionResultDetails,
  QuestionnaireState,
} from "../src/index.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

initTheme("dark", false);

const alpha = {
  id: "alpha",
  label: "Alpha option with enough words to wrap within the left preview column",
  description:
    "A description that must wrap inside the actual left column rather than being rendered wide and truncated",
  preview: "PREVIEW-LINE",
} as const;
const beta = { id: "beta", label: "Beta", description: "Second choice" } as const;
const question: QuestionDefinition = {
  id: "scope",
  header: "Scope",
  question: "Choose a scope",
  options: [alpha, beta],
};

interface Tool {
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
  renderResult(
    result: { content: readonly { type: "text"; text: string }[]; details?: QuestionResultDetails },
    options: { expanded: boolean; isPartial: boolean },
    uiTheme: {
      bold(value: string): string;
      fg(color: string, value: string): string;
      bg(color: string, value: string): string;
    },
  ): { render(width: number): string[] };
}

const theme = {
  bold: (value: string) => value,
  fg: (_color: string, value: string) => value,
  bg: (_color: string, value: string) => value,
};

function tool(): Tool {
  let registered: Tool | undefined;
  questionExtension({
    registerTool: (definition: Tool) => {
      registered = definition;
    },
  } as unknown as ExtensionAPI);
  if (!registered) throw new Error("question was not registered");
  return registered;
}

function ctx(
  mode: "print" | "rpc" | "tui",
  overrides: Record<string, unknown> = {},
): ExtensionContext {
  return {
    cwd: "/project",
    hasUI: mode !== "print",
    mode,
    sessionManager: { getBranch: () => [] },
    ui: {},
    ...overrides,
  } as unknown as ExtensionContext;
}

function entry(details: QuestionResultDetails): unknown {
  return { type: "message", message: { role: "toolResult", toolName: "question", details } };
}

function selectedState(
  customQuestions: readonly QuestionDefinition[] = [question],
): QuestionnaireState {
  return applyAction(
    createInitialState(customQuestions),
    { kind: "select", optionId: customQuestions[0]?.options[0]?.id ?? "alpha" },
    customQuestions,
  );
}

describe("review regressions", () => {
  it("lets AbortSignal win RPC select and input resolution races", async () => {
    expect.hasAssertions();
    const selectController = new AbortController();
    const selectResult = await tool().execute(
      "select-race",
      { questions: [question] },
      selectController.signal,
      undefined,
      ctx("rpc", {
        ui: {
          select: (() => {
            let first = true;
            return () => {
              if (!first) return Promise.resolve(undefined);
              first = false;
              selectController.abort();
              return Promise.resolve(alpha.label);
            };
          })(),
          input: () => Promise.resolve("unused"),
        },
      }),
    );
    expect(selectResult.details).toMatchObject({ status: "cancelled", reason: "abort" });

    const inputController = new AbortController();
    const inputResult = await tool().execute(
      "input-race",
      { questions: [question] },
      inputController.signal,
      undefined,
      ctx("rpc", {
        ui: {
          select: (() => {
            let first = true;
            return () => {
              if (!first) return Promise.resolve(undefined);
              first = false;
              return Promise.resolve("Other…");
            };
          })(),
          input: () => {
            inputController.abort();
            return Promise.resolve("accepted too late");
          },
        },
      }),
    );
    expect(inputResult.details).toMatchObject({ status: "cancelled", reason: "abort" });
  });

  it("returns unavailable before looking up a continuation without UI", async () => {
    expect.hasAssertions();
    const result = await tool().execute(
      "no-ui",
      { continuationId: "missing", questions: [question] },
      undefined,
      undefined,
      ctx("print"),
    );
    expect(result.details).toMatchObject({ status: "unavailable", reason: "no_ui" });
  });

  it("keeps stacked previews and focused rows visible in short terminals", () => {
    expect.hasAssertions();
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 9 },
        requestRender() {
          return;
        },
      },
      theme as never,
      { matches: () => false },
      [question],
      createInitialState([question]),
      () => {
        return;
      },
    );
    const stacked = dialog.render(70).join("\n");
    expect(stacked).toContain("Alpha option");
    expect(stacked).toContain("PREVIEW-LINE");
    expect(dialog.render(100).every((line) => visibleWidth(line) <= 100)).toBe(true);
    const columns = columnWidths(100);
    expect(columns.left).toBeGreaterThan(0);
    expect(columns.right).toBeGreaterThan(0);
  });
  it("gives the post-gap remainder to the wide content column", () => {
    expect.hasAssertions();
    expect(columnWidths(100)).toEqual({ left: 32, right: 66, gap: 2 });
    expect(columnWidths(102)).toEqual({ left: 33, right: 67, gap: 2 });
  });
  it("keeps the wide left rail for documents, previews, blank content, and review", () => {
    expect.hasAssertions();
    const railOptions = [
      {
        id: alpha.id,
        label: "LEFT-RAIL-OPTION-TEXT-THAT-MUST-NOT-EXPAND-INTO-THE-BLANK-CONTENT-PANE",
        description: alpha.description,
      },
      beta,
    ];
    const documentQuestion: QuestionDefinition = {
      ...question,
      options: railOptions,
      document: { content: "DOCUMENT-CONTENT", format: "txt", name: "plan.txt" },
    };
    const render = (
      questions: readonly QuestionDefinition[],
      state = createInitialState(questions),
    ) =>
      new QuestionDialog(
        {
          terminal: { rows: 20 },
          requestRender() {
            return;
          },
        },
        theme as never,
        { matches: () => false },
        questions,
        state,
        () => {
          return;
        },
      )
        .render(100)
        .map(stripVTControlCharacters);
    const blankQuestion: QuestionDefinition = { ...question, options: railOptions };
    const reviewQuestions: readonly QuestionDefinition[] = [
      { ...blankQuestion, header: "First" },
      { ...blankQuestion, id: "second", header: "Second" },
    ];
    let reviewState = applyAction(
      createInitialState(reviewQuestions),
      { kind: "select", optionId: "alpha" },
      reviewQuestions,
    );
    reviewState = applyAction(reviewState, { kind: "tab", tab: 1 }, reviewQuestions);
    reviewState = applyAction(reviewState, { kind: "select", optionId: "alpha" }, reviewQuestions);
    reviewState = applyAction(reviewState, { kind: "tab", tab: 2 }, reviewQuestions);

    const document = render([documentQuestion]);
    expect(
      document.find((line) => line.includes("DOCUMENT-CONTENT"))?.indexOf("DOCUMENT-CONTENT"),
    ).toBe(34);
    const documentRailLines = document.filter((line) => line.includes("LEFT-RAIL"));
    expect(documentRailLines.length).toBeGreaterThan(0);
    expect(documentRailLines.every((line) => line.slice(32, 34) === "  ")).toBe(true);
    const preview = render([question]);
    expect(preview.find((line) => line.includes("PREVIEW-LINE"))?.indexOf("PREVIEW-LINE")).toBe(34);
    const blank = render([blankQuestion]);
    const blankRailLines = blank.filter((line) => line.includes("LEFT-RAIL"));
    expect(blankRailLines.length).toBeGreaterThan(0);
    expect(blankRailLines.every((line) => line.slice(34).trim() === "")).toBe(true);
    const review = render(reviewQuestions, reviewState);
    const reviewRailLines = review.filter((line) => line.includes("LEFT-RAIL"));
    expect(reviewRailLines.length).toBeGreaterThan(0);
    expect(reviewRailLines.every((line) => line.slice(34).trim() === "")).toBe(true);
    expect(
      review
        .find((line) => line.includes("Submit answers"))
        ?.slice(34)
        .trim(),
    ).toBe("");
  });

  it("keeps document and preview content stacked at 99 columns", () => {
    expect.hasAssertions();
    const render = (questionToRender: QuestionDefinition) =>
      new QuestionDialog(
        {
          terminal: { rows: 20 },
          requestRender() {
            return;
          },
        },
        theme as never,
        { matches: () => false },
        [questionToRender],
        createInitialState([questionToRender]),
        () => {
          return;
        },
      )
        .render(99)
        .map(stripVTControlCharacters);
    const withDocument: QuestionDefinition = {
      ...question,
      document: { content: "DOCUMENT-STACKED", format: "txt", name: "plan.txt" },
    };

    expect(
      render(question)
        .find((line) => line.includes("PREVIEW-LINE"))
        ?.indexOf("PREVIEW-LINE"),
    ).toBe(0);
    expect(
      render(withDocument)
        .find((line) => line.includes("DOCUMENT-STACKED"))
        ?.indexOf("DOCUMENT-STACKED"),
    ).toBe(0);
  });

  it("uses indicator rows without erasing focused content", () => {
    expect.hasAssertions();
    const tiny = fitDialogToRows(["TOP", "before", "FOCUSED", "after", "HINT", "BOTTOM"], {
      rows: 4,
      topRows: 1,
      bottomRows: 2,
      focusStart: 2,
      focusEnd: 2,
    });
    expect(tiny).toHaveLength(4);
    expect(tiny[1]).toContain("FOCUSED");
    expect(tiny[1]).toMatch(/[↕↑↓]/u);
    expect(
      fitDialogToRows(["TOP", "a", "b", "FOCUSED", "BOTTOM"], {
        rows: 3,
        topRows: 1,
        bottomRows: 1,
        focusStart: 3,
        focusEnd: 3,
      })[1],
    ).toBe("↑ FOCUSED");
    expect(
      fitDialogToRows(["TOP", "FOCUSED", "b", "c", "BOTTOM"], {
        rows: 3,
        topRows: 1,
        bottomRows: 1,
        focusStart: 1,
        focusEnd: 1,
      })[1],
    ).toBe("↓ FOCUSED");
    const prefixedBoth = fitDialogToRows(["TOP", "a", "b", "FOCUSED", "c", "d", "BOTTOM"], {
      rows: 4,
      topRows: 1,
      bottomRows: 1,
      focusStart: 3,
      focusEnd: 3,
    });
    expect(prefixedBoth[1]).toMatch(/^↑ /u);
    expect(prefixedBoth[2]).toMatch(/^↓ /u);

    const roomy = fitDialogToRows(["TOP", "a", "b", "c", "FOCUSED", "d", "e", "HINT", "BOTTOM"], {
      rows: 7,
      topRows: 1,
      bottomRows: 2,
      focusStart: 4,
      focusEnd: 4,
    });
    expect(roomy).toContain("FOCUSED");
    expect(roomy).toContain("↑");
    expect(roomy).toContain("↓");
    expect(roomy.slice(-2)).toEqual(["HINT", "BOTTOM"]);
  });

  it("shows notes in review and clears empty notes and Other answers", () => {
    expect.hasAssertions();
    let state = selectedState();
    state = applyAction(state, { kind: "note", optionId: "alpha", text: "important" }, [question]);
    state = applyAction(state, { kind: "tab", tab: 1 }, [question]);
    const review = new QuestionDialog(
      {
        terminal: { rows: 20 },
        requestRender() {
          return;
        },
      },
      theme as never,
      { matches: () => false },
      [question],
      state,
      () => {
        return;
      },
    )
      .render(80)
      .join("\n");
    expect(review).toContain("important");

    state = applyAction(state, { kind: "tab", tab: 0 }, [question]);
    state = applyAction(state, { kind: "note", optionId: "alpha", text: "" }, [question]);
    state = applyAction(state, { kind: "other", text: "custom" }, [question]);
    state = applyAction(state, { kind: "other", text: "" }, [question]);
    expect(state.drafts["scope"]?.notes).toEqual({});
    expect(state.drafts["scope"]?.custom).toBeUndefined();
  });

  it("uses injected cancellation while editing and rejects empty Chat submission", () => {
    expect.hasAssertions();
    let outcome: unknown;
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 20 },
        requestRender() {
          return;
        },
      },
      theme as never,
      {
        matches(data: string, id: string) {
          return (
            (id === "tui.select.down" && data === "DOWN") ||
            (id === "tui.select.confirm" && data === "ENTER") ||
            (id === "tui.select.cancel" && data === "CANCEL")
          );
        },
      },
      [question],
      createInitialState([question]),
      (value) => {
        outcome = value;
      },
    );
    dialog.handleInput("DOWN");
    dialog.handleInput("DOWN");
    dialog.handleInput("DOWN");
    dialog.handleInput("ENTER");
    dialog.handleInput("\r");
    expect(outcome).toBeUndefined();
    dialog.handleInput("CANCEL");
    dialog.handleInput("CANCEL");
    expect(outcome).toMatchObject({ kind: "cancelled", reason: "escape" });
  });

  it("drops selections when option semantics change but ignores preview and document changes", () => {
    expect.hasAssertions();
    const original: QuestionDefinition = {
      ...question,
      document: { content: '{"original":true}', format: "json", name: "plan.json" },
    };
    const state = selectedState([original]);
    const prior = buildResult("redirected", [original], state, {
      continuationId: "semantic",
      redirect: "clarify",
    });
    expect(prior.snapshot?.questions[0]).not.toHaveProperty("document");
    expect(
      restoreDraft([{ ...original, options: [{ ...alpha, preview: "NEW" }, beta] }], prior).drafts[
        "scope"
      ]?.selectedIds,
    ).toEqual(["alpha"]);
    expect(
      restoreDraft(
        [
          {
            ...original,
            document: { content: "# Updated plan", format: "md", name: "plan.md" },
          },
        ],
        prior,
      ).drafts["scope"]?.selectedIds,
    ).toEqual(["alpha"]);
    expect(
      restoreDraft([{ ...original, options: [{ ...alpha, label: "Renamed" }, beta] }], prior)
        .drafts["scope"]?.selectedIds,
    ).toEqual([]);
    expect(
      restoreDraft([{ ...original, options: [{ ...alpha, description: "Changed" }, beta] }], prior)
        .drafts["scope"]?.selectedIds,
    ).toEqual([]);
  });

  it("restores and consumes a count-unbounded continuation without dropping structure", () => {
    expect.hasAssertions();
    const many: QuestionDefinition[] = Array.from({ length: 5 }, (_, questionIndex) => ({
      ...question,
      id: `q-${String(questionIndex)}`,
      header: `Q${String(questionIndex + 1)}`,
      multiSelect: true,
      options: Array.from({ length: 5 }, (__, optionIndex) => ({
        id: `o-${String(optionIndex)}`,
        label: `Option ${String(optionIndex + 1)}`,
        description: `Description ${String(optionIndex + 1)}`,
        preview: `Preview ${String(optionIndex + 1)}`,
      })),
    }));
    let state = createInitialState(many);
    for (const [questionIndex, current] of many.entries()) {
      state = applyAction(state, { kind: "tab", tab: questionIndex }, many);
      for (const option of current.options) {
        state = applyAction(state, { kind: "toggle", optionId: option.id }, many);
      }
    }
    const prior = buildResult("redirected", many, state, {
      continuationId: "many",
      redirect: "clarify",
    });
    const changedDisplayOnly = many.map((current) => ({
      ...current,
      document: { content: "updated", format: "txt" as const },
      options: current.options.map((option) => ({ ...option, preview: "Updated preview" })),
    }));

    const restored = restoreDraft(changedDisplayOnly, prior);
    expect(Object.values(restored.drafts)).toHaveLength(5);
    expect(Object.values(restored.drafts).every((draft) => draft.selectedIds.length === 5)).toBe(
      true,
    );
    expect(continuationFromBranch([entry(prior)], "many")).toBe(prior);
    const consumed = buildResult("submitted", many, restored, { continuedFrom: "many" });
    expect(continuationFromBranch([entry(prior), entry(consumed)], "many")).toBeUndefined();
  });

  it("re-prompts RPC single-select after an empty Other answer", async () => {
    expect.hasAssertions();
    const choices = ["Other…", alpha.label, "Submit answers"];
    const result = await tool().execute(
      "empty-other",
      { questions: [question] },
      undefined,
      undefined,
      ctx("rpc", {
        ui: {
          select: () => Promise.resolve(choices.shift()),
          input: () => Promise.resolve(""),
        },
      }),
    );
    expect(result.details.status).toBe("submitted");
    expect(result.details.answers[0]?.selections[0]?.optionId).toBe("alpha");
  });

  it("uses Next → in RPC without colliding with an option label", async () => {
    expect.hasAssertions();
    const multi: QuestionDefinition = { ...question, multiSelect: true };
    const choices = [`[ ] ${alpha.label}`, "Next →", "Submit answers"];
    const result = await tool().execute(
      "next",
      { questions: [multi] },
      undefined,
      undefined,
      ctx("rpc", {
        ui: {
          select: (_title: string, options: string[]) => {
            expect(options).not.toContain("Done");
            return Promise.resolve(choices.shift());
          },
          input: () => Promise.resolve(undefined),
        },
      }),
    );
    expect(result.details.status).toBe("submitted");
  });

  it("bounds user text, model content, compact rendering, and continuation signatures", async () => {
    expect.hasAssertions();
    const huge = "x".repeat(
      MAX_CUSTOM_JSON_BYTES + MAX_NOTE_JSON_BYTES + MAX_REDIRECT_JSON_BYTES + 100,
    );
    let state = selectedState();
    state = applyAction(state, { kind: "note", optionId: "alpha", text: huge }, [question]);
    state = applyAction(state, { kind: "other", text: huge }, [{ ...question, multiSelect: true }]);
    const result = buildResult("redirected", [question], state, {
      continuationId: "bounded",
      redirect: huge,
    });
    expect(result.redirect?.length).toBeLessThanOrEqual(MAX_REDIRECT_JSON_BYTES + 20);
    expect(result.answers[0]?.selections[0]?.note?.length).toBeLessThanOrEqual(
      MAX_NOTE_JSON_BYTES + 20,
    );
    expect(result.snapshot?.questions[0]?.options[0]).not.toHaveProperty("preview");
    expect(result.snapshot?.questions[0]).not.toHaveProperty("document");
    expect(JSON.stringify(result)).toContain("[truncated]");

    const registered = tool();
    const rpcResult = await registered.execute(
      "bounded-content",
      { questions: [question] },
      undefined,
      undefined,
      ctx("rpc", {
        ui: {
          select: () => Promise.resolve("Chat about this…"),
          input: () => Promise.resolve(huge),
        },
      }),
    );
    expect(rpcResult.content[0]?.text.length).toBeLessThanOrEqual(MAX_MODEL_CONTENT_BYTES);
    const rendered = registered
      .renderResult(rpcResult, { expanded: false, isPartial: false }, theme)
      .render(MAX_COMPACT_RENDER_BYTES + 100)
      .join("\n");
    expect(rendered).toContain("[truncated]");
  });

  it("marks continuations consumed and makes them one-use on the current branch", async () => {
    expect.hasAssertions();
    const state = selectedState();
    const original = buildResult("redirected", [question], state, {
      continuationId: "original",
      redirect: "clarify",
    });
    const consumed = buildResult("submitted", [question], state, { continuedFrom: "original" });
    expect(continuationFromBranch([entry(original), entry(consumed)], "original")).toBeUndefined();
    await expect(
      tool().execute(
        "stale",
        { continuationId: "original", questions: [question] },
        undefined,
        undefined,
        ctx("rpc", {
          sessionManager: { getBranch: () => [entry(original), entry(consumed)] },
          ui: {},
        }),
      ),
    ).rejects.toThrow(/stale/u);
  });
});
