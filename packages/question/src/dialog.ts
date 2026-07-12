import { getMarkdownTheme, type Theme } from "@earendil-works/pi-coding-agent";
import {
  CURSOR_MARKER,
  Editor,
  type EditorTheme,
  Key,
  Markdown,
  matchesKey,
  truncateToWidth,
  wrapTextWithAnsi,
  type Component,
  type Focusable,
  type KeybindingsManager,
  type TUI,
} from "@earendil-works/pi-tui";

import { sanitizeText } from "./bounds.ts";
import { columnWidths, fitDialogToRows, joinColumns, previewSideBySide } from "./layout.ts";
import { answersFromState } from "./results.ts";
import { applyAction, firstUnansweredTab } from "./state.ts";

import type { QuestionDefinition, QuestionnaireState } from "./types.ts";

export type DialogOutcome =
  | { readonly kind: "submitted"; readonly state: QuestionnaireState }
  | { readonly kind: "redirected"; readonly state: QuestionnaireState; readonly text: string }
  | {
      readonly kind: "cancelled";
      readonly state: QuestionnaireState;
      readonly reason: "abort" | "escape";
    };

type EditMode =
  | { readonly kind: "other" }
  | { readonly kind: "chat" }
  | { readonly kind: "note"; readonly optionId: string }
  | undefined;

interface RenderedBody {
  readonly lines: string[];
  readonly focusStart: number;
  readonly focusEnd: number;
}

function editorTheme(theme: Theme): EditorTheme {
  const color = (value: string) => theme.fg("accent", value);
  return {
    borderColor: color,
    selectList: {
      selectedPrefix: color,
      selectedText: color,
      description: color,
      scrollInfo: color,
      noMatch: color,
    },
  };
}

function wrapped(text: string, width: number): string[] {
  return wrapTextWithAnsi(text, Math.max(1, width)).map((line) => truncateToWidth(line, width, ""));
}

interface TuiLike {
  readonly terminal: { readonly rows: number };
  requestRender(force?: boolean): void;
}

export class QuestionDialog implements Component, Focusable {
  private state: QuestionnaireState;
  private readonly editor: Editor;
  private editMode: EditMode;
  private submitCursor = 0;
  private settled = false;
  private _focused = false;
  private readonly tui: TuiLike;
  private readonly theme: Theme;
  private readonly keybindings: KeybindingsManager;
  private readonly questions: readonly QuestionDefinition[];
  private readonly done: (outcome: DialogOutcome) => void;

  constructor(
    tui: TuiLike,
    theme: Theme,
    keybindings: unknown,
    questions: readonly QuestionDefinition[],
    initialState: QuestionnaireState,
    done: (outcome: DialogOutcome) => void,
  ) {
    this.tui = tui;
    this.theme = theme;
    this.keybindings = keybindings as KeybindingsManager;
    this.questions = questions;
    this.done = done;
    this.state = initialState;
    this.editor = new Editor(tui as unknown as TUI, editorTheme(theme));
    this.editor.onSubmit = (value) => {
      this.finishEditing(value);
    };
  }

  get focused(): boolean {
    return this._focused;
  }

  set focused(value: boolean) {
    this._focused = value;
    this.editor.focused = value && this.editMode !== undefined;
  }

  invalidate(): void {
    this.editor.invalidate();
  }

  cancelAbort(): void {
    this.finish({ kind: "cancelled", state: this.state, reason: "abort" });
  }

  private finish(outcome: DialogOutcome): void {
    if (this.settled) return;
    this.settled = true;
    this.done(outcome);
  }

  private refresh(): void {
    this.invalidate();
    this.tui.requestRender();
  }

  private beginEditing(mode: Exclude<EditMode, undefined>, prefill = ""): void {
    this.editMode = mode;
    this.editor.setText(prefill);
    this.editor.focused = this.focused;
    this.refresh();
  }

  private finishEditing(value: string): void {
    const mode = this.editMode;
    if (!mode) return;
    const text = value.trim();
    if (mode.kind === "chat") {
      if (!text) return;
      this.finish({ kind: "redirected", state: this.state, text });
      return;
    }
    const action =
      mode.kind === "other"
        ? ({ kind: "other", text } as const)
        : ({ kind: "note", optionId: mode.optionId, text } as const);
    this.state = applyAction(this.state, action, this.questions);
    this.editMode = undefined;
    this.editor.setText("");
    this.editor.focused = false;
    this.refresh();
  }

  private moveTab(delta: number): void {
    const count = this.questions.length + 1;
    this.state = applyAction(
      this.state,
      { kind: "tab", tab: (this.state.tab + delta + count) % count },
      this.questions,
    );
    this.refresh();
  }

  private currentCursor(): number {
    const question = this.questions[this.state.tab];
    return question ? (this.state.cursorByQuestion[question.id] ?? 0) : this.submitCursor;
  }

  private itemCount(question: QuestionDefinition): number {
    return question.options.length + 2 + (question.multiSelect ? 1 : 0);
  }

  handleInput(data: string): void {
    if (this.settled) return;
    if (this.editMode) {
      this.handleEditorInput(data);
      return;
    }
    if (matchesKey(data, Key.tab) || matchesKey(data, Key.right)) {
      this.moveTab(1);
      return;
    }
    if (matchesKey(data, Key.shift("tab")) || matchesKey(data, Key.left)) {
      this.moveTab(-1);
      return;
    }
    if (matchesKey(data, Key.escape) || this.keybindings.matches(data, "tui.select.cancel")) {
      this.finish({ kind: "cancelled", state: this.state, reason: "escape" });
      return;
    }
    if (this.state.tab === this.questions.length) {
      this.handleSubmitTab(data);
      return;
    }
    const question = this.questions[this.state.tab];
    if (question) this.handleQuestionTab(data, question);
  }

  private handleEditorInput(data: string): void {
    if (matchesKey(data, Key.escape) || this.keybindings.matches(data, "tui.select.cancel")) {
      this.editMode = undefined;
      this.editor.setText("");
      this.editor.focused = false;
    } else {
      this.editor.handleInput(data);
    }
    this.refresh();
  }

  private moveCursor(data: string, question: QuestionDefinition): boolean {
    const count = this.itemCount(question);
    const cursor = this.currentCursor();
    const delta = this.keybindings.matches(data, "tui.select.up")
      ? -1
      : this.keybindings.matches(data, "tui.select.down")
        ? 1
        : 0;
    if (delta === 0) return false;
    this.state = applyAction(
      this.state,
      { kind: "cursor", index: (cursor + delta + count) % count },
      this.questions,
    );
    this.refresh();
    return true;
  }

  private handleQuestionTab(data: string, question: QuestionDefinition): void {
    if (this.moveCursor(data, question)) return;
    const cursor = this.currentCursor();
    const option = question.options[cursor];
    if (data === "n" && option?.preview) {
      this.beginEditing(
        { kind: "note", optionId: option.id },
        this.state.drafts[question.id]?.notes[option.id] ?? "",
      );
      return;
    }
    if (matchesKey(data, Key.space) && question.multiSelect && option) {
      this.chooseOption(question, option.id);
      return;
    }
    if (!this.keybindings.matches(data, "tui.select.confirm")) return;
    if (option) {
      this.chooseOption(question, option.id);
      return;
    }
    this.chooseSentinel(question, cursor);
  }

  private chooseOption(question: QuestionDefinition, optionId: string): void {
    this.state = applyAction(
      this.state,
      { kind: question.multiSelect ? "toggle" : "select", optionId },
      this.questions,
    );
    if (!question.multiSelect) {
      this.state = applyAction(this.state, { kind: "next" }, this.questions);
    }
    this.refresh();
  }

  private chooseSentinel(question: QuestionDefinition, cursor: number): void {
    const otherIndex = question.options.length;
    if (cursor === otherIndex) {
      this.beginEditing({ kind: "other" }, this.state.drafts[question.id]?.custom ?? "");
    } else if (cursor === otherIndex + 1) this.beginEditing({ kind: "chat" });
    else {
      this.state = applyAction(this.state, { kind: "next" }, this.questions);
      this.refresh();
    }
  }

  private handleSubmitTab(data: string): void {
    const cursor = this.currentCursor();
    if (
      this.keybindings.matches(data, "tui.select.up") ||
      this.keybindings.matches(data, "tui.select.down")
    ) {
      this.submitCursor = cursor === 0 ? 1 : 0;
      this.refresh();
      return;
    }
    if (!this.keybindings.matches(data, "tui.select.confirm")) return;
    if (cursor === 1) {
      this.beginEditing({ kind: "chat" });
      return;
    }
    if (this.state.complete) {
      this.finish({ kind: "submitted", state: this.state });
      return;
    }
    const unanswered = firstUnansweredTab(this.state, this.questions);
    if (unanswered !== undefined) {
      this.state = applyAction(this.state, { kind: "tab", tab: unanswered }, this.questions);
      this.refresh();
    }
  }

  private renderTabs(width: number): string[] {
    if (this.questions.length === 1) return [];
    const labels = this.questions.map((question, index) => {
      const draft = this.state.drafts[question.id];
      const answered = Boolean(draft && (draft.selectedIds.length > 0 || draft.custom));
      const text = ` ${answered ? "■" : "□"} ${question.header} `;
      return index === this.state.tab
        ? this.theme.bg("selectedBg", this.theme.fg("text", text))
        : this.theme.fg(answered ? "success" : "muted", text);
    });
    const submit = " ✓ Submit ";
    labels.push(
      this.state.tab === this.questions.length
        ? this.theme.bg("selectedBg", this.theme.fg("text", submit))
        : this.theme.fg(this.state.complete ? "success" : "dim", submit),
    );
    return wrapped(labels.join(" "), width);
  }

  private optionRows(question: QuestionDefinition, width: number): RenderedBody {
    const cursor = this.currentCursor();
    const draft = this.state.drafts[question.id];
    const lines: string[] = [];
    let focusStart = 0;
    let focusEnd = 0;
    for (const [index, option] of question.options.entries()) {
      const start = lines.length;
      const selected = draft?.selectedIds.includes(option.id) ?? false;
      const marker = question.multiSelect ? (selected ? "[x]" : "[ ]") : selected ? "●" : "○";
      const prefix = index === cursor ? "> " : "  ";
      lines.push(
        ...wrapped(`${prefix}${marker} ${option.label}`, width),
        ...wrapped(`    ${this.theme.fg("muted", sanitizeText(option.description))}`, width),
      );
      const note = draft?.notes[option.id];
      if (note) {
        lines.push(...wrapped(`    ${this.theme.fg("dim", `Note: ${note}`)}`, width));
      }
      if (index === cursor) {
        focusStart = start;
        focusEnd = Math.max(start, lines.length - 1);
      }
    }
    const sentinels = ["Other…", "Chat about this…", ...(question.multiSelect ? ["Next →"] : [])];
    for (const [offset, label] of sentinels.entries()) {
      const index = question.options.length + offset;
      const start = lines.length;
      lines.push(`${index === cursor ? "> " : "  "}${label}`);
      if (index === cursor) focusStart = focusEnd = start;
    }
    return { lines, focusStart, focusEnd };
  }

  private renderQuestion(question: QuestionDefinition, width: number): RenderedBody {
    const focused = question.options[this.currentCursor()];
    const showPreview =
      focused?.preview && this.editMode?.kind !== "other" && this.editMode?.kind !== "chat";
    if (!showPreview) return this.optionRows(question, width);

    if (previewSideBySide(width)) {
      const columns = columnWidths(width);
      const options = this.optionRows(question, columns.left);
      const previewLines = new Markdown(
        sanitizeText(focused.preview),
        0,
        0,
        getMarkdownTheme(),
      ).render(columns.right);
      const alignedPreview = [
        ...Array.from({ length: options.focusStart }, () => ""),
        ...previewLines,
      ];
      return {
        lines: joinColumns(options.lines, alignedPreview, width),
        focusStart: options.focusStart,
        focusEnd: Math.max(options.focusEnd, options.focusStart + previewLines.length - 1),
      };
    }

    const options = this.optionRows(question, width);
    const previewLines = new Markdown(
      sanitizeText(focused.preview),
      0,
      0,
      getMarkdownTheme(),
    ).render(width);
    const insertion = options.focusStart + 1;
    return {
      lines: [
        ...options.lines.slice(0, insertion),
        "",
        ...previewLines,
        ...options.lines.slice(insertion),
      ],
      focusStart: options.focusStart,
      focusEnd: insertion + previewLines.length,
    };
  }

  private renderReview(width: number): RenderedBody {
    const lines: string[] = [];
    for (const answer of answersFromState(this.questions, this.state)) {
      const question = this.questions.find((item) => item.id === answer.questionId);
      const value = [
        answer.selections
          .map((selection) =>
            selection.note ? `${selection.label} (note: ${selection.note})` : selection.label,
          )
          .join(", "),
        answer.custom,
      ]
        .filter(Boolean)
        .join("; ");
      lines.push(
        ...wrapped(`${question?.header ?? answer.questionId}: ${value || "Unanswered"}`, width),
      );
    }
    const missing = firstUnansweredTab(this.state, this.questions);
    if (missing !== undefined) {
      lines.push(
        ...wrapped(this.theme.fg("warning", "Answer every question before submitting."), width),
      );
    }
    const cursor = this.currentCursor();
    const submitStart = lines.length;
    lines.push(
      `${cursor === 0 ? "> " : "  "}${this.state.complete ? "Submit answers" : "Submit answers (disabled)"}`,
      `${cursor === 1 ? "> " : "  "}Chat about this…`,
    );
    return { lines, focusStart: submitStart + cursor, focusEnd: submitStart + cursor };
  }

  render(width: number): string[] {
    const safeWidth = Math.max(1, width);
    const border = this.theme.fg("accent", "─".repeat(safeWidth));
    const tabs = this.renderTabs(safeWidth);
    const question = this.questions[this.state.tab];
    const heading = question
      ? wrapped(this.theme.fg("text", sanitizeText(question.question)), safeWidth)
      : [this.theme.fg("accent", this.theme.bold("Review your answers"))];
    const body = question ? this.renderQuestion(question, safeWidth) : this.renderReview(safeWidth);
    const top = [border, ...tabs, ...heading, ""];
    const editorLines = this.editMode ? this.editor.render(safeWidth) : [];
    const editLines = this.editMode
      ? [
          "",
          this.theme.fg("muted", this.editMode.kind === "note" ? "Note:" : "Your message:"),
          ...editorLines,
        ]
      : [];
    const hints = this.editMode
      ? "Enter submit · Esc back"
      : "↑↓ navigate · Tab switch · Enter select · Space toggle · n note · Esc cancel";
    const all = [...top, ...body.lines, ...editLines, "", this.theme.fg("dim", hints), border].map(
      (line) => truncateToWidth(line, safeWidth, ""),
    );
    const cursorRow = editorLines.findIndex((line) => line.includes(CURSOR_MARKER));
    const editFocus =
      editLines.length > 0
        ? top.length + body.lines.length + 2 + Math.max(0, cursorRow)
        : undefined;
    const fitted = fitDialogToRows(all, {
      rows: Math.max(1, this.tui.terminal.rows),
      topRows: top.length,
      bottomRows: 2,
      focusStart: editFocus ?? top.length + body.focusStart,
      focusEnd: editFocus ?? top.length + body.focusEnd,
    });
    return fitted.map((line) => truncateToWidth(line, safeWidth, ""));
  }
}
