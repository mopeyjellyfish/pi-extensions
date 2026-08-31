import { Buffer } from "node:buffer";

import { initTheme } from "@earendil-works/pi-coding-agent";
import { CURSOR_MARKER, visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import questionExtension, {
  MAX_CUSTOM_JSON_BYTES,
  MAX_NOTE_JSON_BYTES,
  MAX_REDIRECT_JSON_BYTES,
  MAX_RESULT_DETAILS_JSON_BYTES,
  QuestionDialog,
  applyAction,
  buildResult,
  createInitialState,
  focusedItemWindowByRows,
  preflightResultDetailsBytes,
  resultDetailsBytes,
  sanitizeText,
  validateQuestions,
} from "../src/index.ts";

import type {
  QuestionDefinition,
  QuestionResultDetails,
  QuestionnaireState,
} from "../src/index.ts";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

initTheme("dark", false);

const options = [
  { id: "a", label: "A", description: "First" },
  { id: "b", label: "B", description: "Second" },
] as const;
const question: QuestionDefinition = {
  id: "scope",
  header: "Scope",
  question: "Choose scope",
  options,
};

interface Tool {
  execute(
    id: string,
    input: { questions: readonly QuestionDefinition[] },
    signal: AbortSignal | undefined,
    update: undefined,
    context: ExtensionContext,
  ): Promise<{ details: QuestionResultDetails }>;
}

function tool(): Tool {
  let registered: Tool | undefined;
  questionExtension({
    registerTool(definition: Tool) {
      registered = definition;
    },
  } as unknown as ExtensionAPI);
  if (!registered) throw new Error("question tool was not registered");
  return registered;
}

function rpcContext(choices: string[], inputs: string[] = []): ExtensionContext {
  return {
    cwd: "/project",
    hasUI: true,
    mode: "rpc",
    sessionManager: { getBranch: () => [] },
    ui: {
      select: () => Promise.resolve(choices.shift()),
      input: () => Promise.resolve(inputs.shift()),
    },
  } as unknown as ExtensionContext;
}

function abortOnRead(read: number): AbortSignal {
  let reads = 0;
  return {
    get aborted() {
      reads++;
      return reads >= read;
    },
  } as AbortSignal;
}

const theme = {
  bold: (value: string) => value,
  fg: (_color: string, value: string) => value,
  bg: (_color: string, value: string) => value,
};

describe("final review regressions", () => {
  it("lets abort win after nested RPC helpers resolve", async () => {
    expect.hasAssertions();
    const custom = await tool().execute(
      "custom-nested",
      { questions: [question] },
      abortOnRead(3),
      undefined,
      rpcContext(["Other…", "Submit answers"], ["custom"]),
    );
    expect(custom.details).toMatchObject({ status: "cancelled", reason: "abort" });

    const multiQuestion: QuestionDefinition = { ...question, multiSelect: true };
    const multi = await tool().execute(
      "multi-nested",
      { questions: [multiQuestion] },
      abortOnRead(2),
      undefined,
      rpcContext(["[ ] A", "Next →", "Submit answers"]),
    );
    expect(multi.details).toMatchObject({ status: "cancelled", reason: "abort" });

    const reviewQuestions = [
      question,
      { ...question, id: "priority", header: "Priority", question: "Choose priority" },
    ];
    const review = await tool().execute(
      "review-nested",
      { questions: reviewQuestions },
      abortOnRead(5),
      undefined,
      rpcContext(["A", "A", "Submit answers"]),
    );
    expect(review.details).toMatchObject({ status: "cancelled", reason: "abort" });

    const largeQuestions = Array.from({ length: 24 }, (_, questionIndex) => ({
      ...question,
      id: `large-${String(questionIndex)}`,
      header: `Q${String(questionIndex + 1)}`,
      options: Array.from({ length: 10 }, (__, optionIndex) => ({
        id: `o-${String(optionIndex)}`,
        label: `Option ${String(optionIndex + 1)}`,
        description: `Description ${String(optionIndex + 1)}`,
      })),
    }));
    const large = await tool().execute(
      "large-rpc-abort",
      { questions: largeQuestions },
      abortOnRead(2),
      undefined,
      rpcContext(["Option 1"]),
    );
    expect(large.details).toMatchObject({ status: "cancelled", reason: "abort" });
  });

  it("keeps maximum Unicode result details below 50KB without previews", () => {
    expect.hasAssertions();
    const emoji = "🪼";
    const questions: QuestionDefinition[] = Array.from({ length: 4 }, (_, questionIndex) => ({
      id: `q${String(questionIndex)}`,
      header: `Q${String(questionIndex)}`,
      question: emoji.repeat(500),
      multiSelect: true,
      options: Array.from({ length: 4 }, (_, optionIndex) => ({
        id: `o${String(optionIndex)}`,
        label: emoji.repeat(40),
        description: emoji.repeat(200),
        preview: `PREVIEW-${emoji.repeat(3000)}`,
      })),
    }));
    let state: QuestionnaireState = createInitialState(questions);
    for (let questionIndex = 0; questionIndex < questions.length; questionIndex++) {
      state = applyAction(state, { kind: "tab", tab: questionIndex }, questions);
      for (let optionIndex = 0; optionIndex < 4; optionIndex++) {
        const optionId = `o${String(optionIndex)}`;
        state = applyAction(state, { kind: "toggle", optionId }, questions);
        state = applyAction(
          state,
          { kind: "note", optionId, text: emoji.repeat(MAX_NOTE_JSON_BYTES) },
          questions,
        );
      }
      state = applyAction(
        state,
        { kind: "other", text: emoji.repeat(MAX_CUSTOM_JSON_BYTES) },
        questions,
      );
    }
    const details = buildResult("redirected", questions, state, {
      continuationId: "maximum",
      redirect: emoji.repeat(MAX_REDIRECT_JSON_BYTES),
    });
    const serialized = JSON.stringify(details);
    expect(Buffer.byteLength(serialized, "utf8")).toBeLessThan(50 * 1024);
    expect(serialized).not.toContain("PREVIEW-");
    expect(details.answers[0]).not.toHaveProperty("question");
    expect(details.snapshot).not.toHaveProperty("state");
    expect(details.snapshot?.questions[0]).toHaveProperty("semanticHash");
    expect(details.snapshot?.questions[0]?.options[0]).toHaveProperty("semanticHash");
  });

  it("bounds adversarial JSON-escaped C0 text below 50KB", () => {
    expect.hasAssertions();
    const escaped = '\u{0}\u{1B}\n\t\\"'.repeat(2000);
    const questions: QuestionDefinition[] = Array.from({ length: 4 }, (_, questionIndex) => ({
      id: `q${String(questionIndex)}`,
      header: `Q${String(questionIndex)}`,
      question: escaped.slice(0, 1000),
      multiSelect: true,
      options: Array.from({ length: 4 }, (_, optionIndex) => ({
        id: `o${String(optionIndex)}`,
        label: `Option ${String(optionIndex)}`,
        description: escaped.slice(0, 400),
        preview: escaped,
      })),
    }));
    let state = createInitialState(questions);
    for (let questionIndex = 0; questionIndex < questions.length; questionIndex++) {
      state = applyAction(state, { kind: "tab", tab: questionIndex }, questions);
      for (let optionIndex = 0; optionIndex < 4; optionIndex++) {
        const optionId = `o${String(optionIndex)}`;
        state = applyAction(state, { kind: "toggle", optionId }, questions);
        state = applyAction(state, { kind: "note", optionId, text: escaped }, questions);
      }
      state = applyAction(state, { kind: "other", text: escaped }, questions);
    }
    const details = buildResult("redirected", questions, state, {
      continuationId: "c0-maximum",
      redirect: escaped,
    });
    const serialized = JSON.stringify(details);
    expect(Buffer.byteLength(serialized, "utf8")).toBeLessThan(50 * 1024);
    expect(serialized).not.toContain("PREVIEW-");
    expect(serialized).not.toContain("\\u0000");
    expect(serialized).not.toContain("\\u001b");
  });

  it("sanitizes display text and rejects controls in structural model fields", () => {
    expect.hasAssertions();
    expect(sanitizeText("a\r\nb\rc\td\ne\u{0}\u{1B}\u{7F}")).toBe("a\nb\nc\td\ne���");
    expect(
      validateQuestions([
        {
          ...question,
          id: "bad\u{1B}-id",
          header: "bad\nheader",
          options: [{ ...options[0], label: "bad\u{0}label" }, options[1]],
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "questions[0].id must not contain control characters",
        "questions[0].header must not contain control characters",
        "questions[0] option label must not contain control characters",
      ]),
    );
  });

  it("preserves sticky hints and border with a heavily wrapped heading", () => {
    expect.hasAssertions();
    const longQuestion: QuestionDefinition = {
      ...question,
      question: "A very long heading ".repeat(30),
    };
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 5 },
        requestRender() {
          return;
        },
      },
      theme as never,
      { matches: () => false },
      [longQuestion],
      createInitialState([longQuestion]),
      () => {
        return;
      },
    );
    const lines = dialog.render(24);
    expect(lines).toHaveLength(5);
    expect(lines.at(-2)).toContain("navigate");
    expect(lines.at(-1)).toMatch(/^─+$/u);
    expect(lines.every((line) => visibleWidth(line) <= 24)).toBe(true);
  });

  it.each([
    ["Other", ["DOWN", "DOWN", "\r"]],
    ["Chat", ["DOWN", "DOWN", "DOWN", "\r"]],
    ["note", ["n"]],
  ] as const)("keeps the IME cursor visible for long %s editor input", (_mode, actions) => {
    expect.hasAssertions();
    const editorQuestion: QuestionDefinition = {
      ...question,
      options: [{ ...options[0], preview: "**Preview**" }, options[1]],
    };
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 10 },
        requestRender() {
          return;
        },
      },
      theme as never,
      {
        matches(data: string, id: string) {
          return (
            (id === "tui.select.confirm" && data === "\r") ||
            (id === "tui.select.down" && data === "DOWN")
          );
        },
      },
      [editorQuestion],
      createInitialState([editorQuestion]),
      () => {
        return;
      },
    );
    dialog.focused = true;
    for (const action of actions) dialog.handleInput(action);
    for (const character of "long editor input ".repeat(20)) dialog.handleInput(character);

    const lines = dialog.render(24);
    expect(lines).toHaveLength(10);
    expect(lines.join("\n")).toContain(CURSOR_MARKER);
    expect(lines.every((line) => visibleWidth(line) <= 24)).toBe(true);
  });

  it("sanitizes RPC question titles for single- and multi-select dialogs", async () => {
    expect.hasAssertions();
    const titles: string[] = [];
    const unsafeQuestion: QuestionDefinition = {
      ...question,
      question: "Choose\u{1B}[31m scope\u{0}",
    };
    const unsafeMulti: QuestionDefinition = { ...unsafeQuestion, id: "checks", multiSelect: true };
    const choices = ["A", "[ ] A", "Next →"];
    const context = rpcContext(choices);
    context.ui.select = (title: string) => {
      titles.push(title);
      return Promise.resolve(choices.shift());
    };

    await tool().execute(
      "single-title",
      { questions: [unsafeQuestion] },
      undefined,
      undefined,
      context,
    );
    await tool().execute(
      "multi-title",
      { questions: [unsafeMulti] },
      undefined,
      undefined,
      context,
    );

    expect(titles.some((title) => title.includes("�[31m") && title.includes("scope�"))).toBe(true);
    expect(titles.join("\n")).not.toContain("\u{0}");
    expect(titles.join("\n")).not.toContain("\u{1B}");
  });

  it("does not echo raw controls in duplicate validation errors", () => {
    expect.hasAssertions();
    const badId = "duplicate\u{1B}";
    const badLabel = "duplicate\u{0}";
    const errors = validateQuestions([
      {
        ...question,
        options: [
          { ...options[0], id: badId, label: badLabel },
          { ...options[1], id: badId, label: badLabel },
        ],
      },
    ]);
    expect(errors.join("\n")).toContain("duplicate option id");
    expect(errors.join("\n")).toContain("duplicate option label");
    expect(errors.join("\n")).not.toContain("\u{0}");
    expect(errors.join("\n")).not.toContain("\u{1B}");
  });

  it("accepts count-unbounded structures while enforcing the 48,000-byte details budget", () => {
    expect.hasAssertions();
    const many = Array.from({ length: 5 }, (_, index) => ({
      ...question,
      id: `q-${String(index)}`,
      header: `Q${String(index)}`,
      options: Array.from({ length: 5 }, (_, optionIndex) => ({
        id: `o-${String(optionIndex)}`,
        label: `Option ${String(optionIndex)}`,
        description: "A valid option",
      })),
    }));

    expect(validateQuestions(many)).toEqual([]);
  });

  it("builds focused windows from measured option rows", () => {
    expect.hasAssertions();
    expect(focusedItemWindowByRows(0, 5, 0, () => 1)).toEqual({
      start: 0,
      end: 0,
      hiddenBefore: 0,
      hiddenAfter: 0,
    });
    expect(focusedItemWindowByRows(5, 8, 2, () => 5)).toEqual({
      start: 2,
      end: 3,
      hiddenBefore: 2,
      hiddenAfter: 2,
    });
    const calls = [0, 0, 0, 0, 0];
    const heights = [5, 1, 1, 1, 1];
    expect(
      focusedItemWindowByRows(5, 5, 2, (index) => {
        calls[index] = (calls[index] ?? 0) + 1;
        return heights[index] ?? 1;
      }),
    ).toEqual({ start: 1, end: 5, hiddenBefore: 1, hiddenAfter: 0 });
    expect(calls[0]).toBe(1);
  });

  it("renders a compact progress navigator for large questionnaires", () => {
    expect.hasAssertions();
    const many = Array.from({ length: 47 }, (_, index) => ({
      ...question,
      id: `question-${String(index)}`,
      header: `Q${String(index + 1)}`,
    }));
    const state = applyAction(createInitialState(many), { kind: "tab", tab: 23 }, many);
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 24 },
        requestRender() {
          return;
        },
      },
      theme as never,
      { matches: () => false },
      many,
      state,
      () => {
        return;
      },
    );

    const output = dialog.render(80).join("\n");
    expect(output).toContain("Question 24 of 47");
    expect(output).not.toContain("Q1  □ Q2");
  });

  it("preflights the complete worst-case structural result before opening RPC", async () => {
    expect.hasAssertions();
    const oversized: QuestionDefinition = {
      ...question,
      id: "q".repeat(64),
      multiSelect: true,
      options: Array.from({ length: 500 }, (_, index) => ({
        id: `${String(index).padStart(3, "0")}-${"i".repeat(60)}`,
        label: `${String(index).padStart(3, "0")}-${"L".repeat(76)}`,
        description: "D".repeat(400),
      })),
    };
    const context = rpcContext([]);
    let calls = 0;
    context.ui.select = () => {
      calls++;
      return Promise.resolve(undefined);
    };

    const measured = preflightResultDetailsBytes([oversized]);
    expect(measured).toBeGreaterThan(MAX_RESULT_DETAILS_JSON_BYTES);
    const selectedIds = oversized.options.map((option) => option.id);
    const structuralState: QuestionnaireState = {
      tab: 0,
      cursorByQuestion: { [oversized.id]: 0 },
      drafts: {
        [oversized.id]: {
          selectedIds,
          notes: Object.fromEntries(selectedIds.map((optionId) => [optionId, "note"])),
          custom: "custom",
        },
      },
      complete: true,
    };
    expect(() =>
      buildResult("redirected", [oversized], structuralState, {
        continuationId: "question-oversized",
        redirect: "redirect",
      }),
    ).toThrow("Question result details exceed the 48000-byte structural contract");
    await expect(
      tool().execute("oversized", { questions: [oversized] }, undefined, undefined, context),
    ).rejects.toThrow(
      `Invalid question input: result details require ${String(measured)} JSON bytes; maximum is 48000`,
    );
    expect(calls).toBe(0);
  });

  it("keeps complete structure and useful ordered text inside the details budget", () => {
    expect.hasAssertions();
    const many: QuestionDefinition[] = Array.from({ length: 40 }, (_, questionIndex) => ({
      ...question,
      id: `q-${String(questionIndex)}`,
      header: `Q${String(questionIndex)}`,
      multiSelect: true,
      options: Array.from({ length: 4 }, (_, optionIndex) => ({
        id: `o-${String(optionIndex)}`,
        label: `Option ${String(optionIndex)} for question ${String(questionIndex)}`,
        description: "A stable choice",
      })),
    }));
    let state: QuestionnaireState = createInitialState(many);
    for (const [questionIndex, definition] of many.entries()) {
      state = applyAction(state, { kind: "tab", tab: questionIndex }, many);
      for (const option of definition.options) {
        state = applyAction(state, { kind: "toggle", optionId: option.id }, many);
        state = applyAction(
          state,
          {
            kind: "note",
            optionId: option.id,
            text: `note-${String(questionIndex)}-${"n".repeat(480)}`,
          },
          many,
        );
      }
      state = applyAction(
        state,
        { kind: "other", text: `custom-${String(questionIndex)}-${"c".repeat(1900)}` },
        many,
      );
    }

    const details = buildResult("redirected", many, state, {
      continuationId: `question-${"a".repeat(36)}`,
      continuedFrom: "prior-".repeat(20),
      redirect: "redirect-".repeat(240),
    });
    expect(resultDetailsBytes(details)).toBe(MAX_RESULT_DETAILS_JSON_BYTES);
    expect(details.answers).toHaveLength(40);
    expect(details.answers.every((answer) => answer.selections.length === 4)).toBe(true);
    expect(details.answers[39]?.selections.map((selection) => selection.optionId)).toEqual([
      "o-0",
      "o-1",
      "o-2",
      "o-3",
    ]);
    expect(details.answers[39]?.selections[3]?.label).toBe("Option 3 for question 39");
    expect(details.snapshot?.questions).toHaveLength(40);
    expect(details.answers[0]?.selections[0]?.note).toContain("note-0-");
    expect(JSON.stringify(details)).toContain("… [truncated]");
    const cancelled = buildResult("cancelled", many, state, { reason: "abort" });
    const unavailable = buildResult("unavailable", many, createInitialState(many), {
      reason: "no_ui",
    });
    expect(resultDetailsBytes(cancelled)).toBeLessThanOrEqual(MAX_RESULT_DETAILS_JSON_BYTES);
    expect(resultDetailsBytes(unavailable)).toBeLessThanOrEqual(MAX_RESULT_DETAILS_JSON_BYTES);
    expect(cancelled.answers).toHaveLength(40);
    expect(unavailable.answers).toEqual([]);
  });

  it("pages a focused option viewport with exact hidden counts and first/last jumps", () => {
    expect.hasAssertions();
    const manyOptions: QuestionDefinition = {
      ...question,
      multiSelect: true,
      options: Array.from({ length: 40 }, (_, index) => ({
        id: `o-${String(index)}`,
        label: `Option ${String(index + 1)}`,
        description: `Description ${String(index + 1)}`,
      })),
    };
    const bindings = {
      matches(data: string, id: string) {
        return (
          (id === "tui.select.pageDown" && data === "PAGE_DOWN") ||
          (id === "tui.select.pageUp" && data === "PAGE_UP")
        );
      },
    };
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 12 },
        requestRender() {
          return;
        },
      },
      theme as never,
      bindings,
      [manyOptions],
      createInitialState([manyOptions]),
      () => {
        return;
      },
    );

    const initial = dialog.render(80).join("\n");
    expect(initial).toContain("Option 1");
    expect(initial).toMatch(/↓ \d+ later options/u);
    expect(initial).not.toContain("Option 40");
    dialog.handleInput("PAGE_DOWN");
    expect(dialog.render(80).join("\n")).toContain("> [ ] Option 2");
    dialog.handleInput("PAGE_DOWN");
    const paged = dialog.render(80).join("\n");
    expect(paged).toMatch(/↑ \d+ earlier options/u);
    expect(paged).not.toContain("> [ ] Option 1");
    dialog.handleInput("\u{1B}[F");
    const ended = dialog.render(80).join("\n");
    expect(ended).toContain("> [ ] Option 40");
    expect(ended).toContain("Other…");
    dialog.handleInput("\u{1B}[H");
    expect(dialog.render(80).join("\n")).toContain("> [ ] Option 1");
  });

  it("counts every option hidden by wrapped descriptions", () => {
    expect.hasAssertions();
    const manyOptions: QuestionDefinition = {
      ...question,
      multiSelect: true,
      options: Array.from({ length: 40 }, (_, index) => ({
        id: `o-${String(index)}`,
        label: `Option ${String(index + 1)}`,
        description: `D${String(index + 1)} ${"word ".repeat(78)}`,
      })),
    };
    const initialState = applyAction(
      createInitialState([manyOptions]),
      { kind: "cursor", index: 20 },
      [manyOptions],
    );
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 24 },
        requestRender() {
          return;
        },
      },
      theme as never,
      {
        matches(data: string, id: string) {
          return id === "tui.select.pageDown" && data === "PAGE_DOWN";
        },
      },
      [manyOptions],
      initialState,
      () => {
        return;
      },
    );
    const displayedOptions = (output: string): number[] =>
      output.split("\n").flatMap((line) => {
        const match = /\[ \] Option (\d+)\s*$/u.exec(line);
        return match?.[1] ? [Number(match[1])] : [];
      });

    const initial = dialog.render(80).join("\n");
    const displayed = displayedOptions(initial);
    const earlier = /↑ (\d+) earlier options/u.exec(initial);
    const later = /↓ (\d+) later options/u.exec(initial);
    expect(displayed.length).toBeGreaterThan(0);
    expect(Number(earlier?.[1])).toBe((displayed[0] ?? 1) - 1);
    expect(Number(later?.[1])).toBe(40 - (displayed.at(-1) ?? 40));
    expect(initial.split("\n").some((line) => line.trim() === "↓")).toBe(false);
    dialog.handleInput("PAGE_DOWN");
    const paged = displayedOptions(dialog.render(80).join("\n"));
    expect(paged[0]).toBeLessThanOrEqual((displayed.at(-1) ?? 0) + 1);
  });

  it("keeps sentinel actions visible with progress in a short terminal", () => {
    expect.hasAssertions();
    const manyQuestions = Array.from({ length: 40 }, (_, index) => ({
      ...question,
      id: `q-${String(index)}`,
      header: `Q${String(index + 1)}`,
      multiSelect: true,
      options: Array.from({ length: 40 }, (__, optionIndex) => ({
        id: `o-${String(optionIndex)}`,
        label: `Option ${String(optionIndex + 1)}`,
        description: `Description ${String(optionIndex + 1)}`,
      })),
    }));
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 10 },
        requestRender() {
          return;
        },
      },
      theme as never,
      { matches: () => false },
      manyQuestions,
      createInitialState(manyQuestions),
      () => {
        return;
      },
    );

    const rendered = dialog.render(80).join("\n");
    expect(rendered).toContain("Question 1 of 40 · Q1 · 0 answered");
    expect(rendered).toContain("Other…");
    expect(rendered).toContain("Chat about this…");
    expect(rendered).toContain("Next →");
    expect(rendered).toMatch(/↓ 39(?: later options)?/u);
    expect(rendered.split("\n").some((line) => line.trim() === "↓")).toBe(false);
  });

  it("scrolls every review answer while keeping both review actions sticky", () => {
    expect.hasAssertions();
    const many = Array.from({ length: 47 }, (_, index) => ({
      ...question,
      id: `q-${String(index)}`,
      header: `Q${String(index + 1)}`,
    }));
    let state = createInitialState(many);
    for (const [index] of many.entries()) {
      state = applyAction(state, { kind: "tab", tab: index }, many);
      state = applyAction(state, { kind: "select", optionId: "a" }, many);
    }
    state = applyAction(state, { kind: "tab", tab: many.length }, many);
    const dialog = new QuestionDialog(
      {
        terminal: { rows: 12 },
        requestRender() {
          return;
        },
      },
      theme as never,
      {
        matches(data: string, id: string) {
          return id === "tui.select.pageDown" && data === "PAGE_DOWN";
        },
      },
      many,
      state,
      () => {
        return;
      },
    );

    const initial = dialog.render(80).join("\n");
    expect(initial).toContain("Q1: A");
    expect(initial).toContain("Review · 47 of 47 answered");
    expect(initial).not.toContain("Question 47 of 47 · Review");
    expect(initial).toMatch(/↓ \d+ later answers/u);
    expect(initial).toContain("Submit answers");
    expect(initial).toContain("Chat about this…");
    dialog.handleInput("PAGE_DOWN");
    const paged = dialog.render(80).join("\n");
    expect(paged).toMatch(/↑ \d+ earlier answers/u);
    expect(paged).toContain("Submit answers");
    expect(paged).toContain("Chat about this…");
    dialog.handleInput("\u{1B}[F");
    const ended = dialog.render(80).join("\n");
    expect(ended).toContain("Q47: A");
    expect(ended).toContain("Submit answers");
  });
});
