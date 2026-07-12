import { Buffer } from "node:buffer";

import { initTheme } from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";
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

    const review = await tool().execute(
      "review-nested",
      { questions: [question] },
      abortOnRead(4),
      undefined,
      rpcContext(["A", "Submit answers"]),
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
});
