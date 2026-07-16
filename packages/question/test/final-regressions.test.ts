import { Buffer } from "node:buffer";

import { initTheme } from "@earendil-works/pi-coding-agent";
import { CURSOR_MARKER, visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import questionExtension, {
  MAX_CUSTOM_JSON_BYTES,
  MAX_NOTE_JSON_BYTES,
  MAX_REDIRECT_JSON_BYTES,
  QuestionDialog,
  applyAction,
  buildResult,
  createInitialState,
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
});
