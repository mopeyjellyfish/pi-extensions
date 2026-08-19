import {
  getLanguageFromPath,
  getMarkdownTheme,
  highlightCode,
  type Theme,
} from "@earendil-works/pi-coding-agent";
import {
  CURSOR_MARKER,
  Editor,
  type EditorTheme,
  Key,
  Markdown,
  matchesKey,
  truncateToWidth,
  visibleWidth,
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

const STICKY_BOTTOM_ROWS = 2;

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

function padDialogLines(lines: readonly string[], rows: number): string[] {
  if (lines.length >= rows) return [...lines];
  return [
    ...lines.slice(0, -STICKY_BOTTOM_ROWS),
    ...Array.from({ length: rows - lines.length }, () => ""),
    ...lines.slice(-STICKY_BOTTOM_ROWS),
  ];
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
  private documentMode = false;
  private documentViewportRows = 1;
  private readonly documentOffsets = new Map<string, number>();
  private readonly documentMaxOffsets = new Map<string, number>();
  private readonly documentCache = new Map<
    string,
    { readonly width: number; readonly lines: string[] }
  >();
  private settled = false;
  private _focused = false;
  private readonly tui: TuiLike;
  private readonly theme: Theme;
  private readonly keybindings: KeybindingsManager;
  private readonly questions: readonly QuestionDefinition[];
  private readonly rowBudget: () => number;
  private readonly done: (outcome: DialogOutcome) => void;

  constructor(
    tui: TuiLike,
    theme: Theme,
    keybindings: unknown,
    questions: readonly QuestionDefinition[],
    initialState: QuestionnaireState,
    done: (outcome: DialogOutcome) => void,
    rowBudget: () => number = () => tui.terminal.rows,
  ) {
    this.tui = tui;
    this.theme = theme;
    this.keybindings = keybindings as KeybindingsManager;
    this.questions = questions;
    this.done = done;
    this.rowBudget = rowBudget;
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
    this.documentCache.clear();
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
    this.editor.invalidate();
    this.tui.requestRender();
  }

  private submitSingleQuestion(): boolean {
    if (this.questions.length !== 1 || !this.state.complete) return false;
    this.finish({ kind: "submitted", state: this.state });
    return true;
  }

  private advanceOrSubmit(): void {
    if (this.submitSingleQuestion()) return;
    if (this.questions.length > 1) {
      this.documentMode = false;
      this.state = applyAction(this.state, { kind: "next" }, this.questions);
    }
    this.refresh();
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
    const question = this.questions[this.state.tab];
    if (mode.kind === "other" && !question?.multiSelect && this.submitSingleQuestion()) return;
    this.editMode = undefined;
    this.editor.setText("");
    this.editor.focused = false;
    this.refresh();
  }

  private moveTab(delta: number): void {
    const count = this.questions.length === 1 ? 1 : this.questions.length + 1;
    this.documentMode = false;
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
    const question = this.questions[this.state.tab];
    if (this.routeDocumentInput(data, question)) return;
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
    if (question) this.handleQuestionTab(data, question);
  }

  private routeDocumentInput(data: string, question: QuestionDefinition | undefined): boolean {
    if (this.documentMode) {
      if (question) this.handleDocumentInput(data, question);
      else {
        this.documentMode = false;
        this.refresh();
      }
      return true;
    }
    if (!question?.document || !matchesKey(data, "d")) return false;
    this.documentMode = true;
    this.refresh();
    return true;
  }

  private handleDocumentInput(data: string, question: QuestionDefinition): void {
    if (!question.document) {
      this.documentMode = false;
      this.refresh();
      return;
    }
    if (
      matchesKey(data, "d") ||
      matchesKey(data, Key.escape) ||
      this.keybindings.matches(data, "tui.select.cancel")
    ) {
      this.documentMode = false;
      this.refresh();
      return;
    }

    const current = this.documentOffsets.get(question.id) ?? 0;
    const page = Math.max(1, this.documentViewportRows - 1);
    const maximum = this.documentMaxOffsets.get(question.id) ?? 0;
    let next: number | undefined;
    if (this.keybindings.matches(data, "tui.select.up")) next = current - 1;
    else if (this.keybindings.matches(data, "tui.select.down")) next = current + 1;
    else if (this.keybindings.matches(data, "tui.select.pageUp")) next = current - page;
    else if (this.keybindings.matches(data, "tui.select.pageDown")) next = current + page;
    else if (matchesKey(data, Key.home)) next = 0;
    else if (matchesKey(data, Key.end)) next = maximum;
    if (next === undefined) return;
    const bounded = Math.max(0, Math.min(next, maximum));
    if (bounded === current) return;
    this.documentOffsets.set(question.id, bounded);
    this.refresh();
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
      this.advanceOrSubmit();
      return;
    }
    this.refresh();
  }

  private chooseSentinel(question: QuestionDefinition, cursor: number): void {
    const otherIndex = question.options.length;
    if (cursor === otherIndex) {
      this.beginEditing({ kind: "other" }, this.state.drafts[question.id]?.custom ?? "");
    } else if (cursor === otherIndex + 1) this.beginEditing({ kind: "chat" });
    else {
      this.advanceOrSubmit();
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

  private renderStackedQuestion(question: QuestionDefinition, width: number): RenderedBody {
    const options = this.optionRows(question, width);
    const focused = question.options[this.currentCursor()];
    const showPreview =
      focused?.preview && this.editMode?.kind !== "other" && this.editMode?.kind !== "chat";
    if (!showPreview) return options;

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

  private documentLines(question: QuestionDefinition, width: number): string[] {
    const cached = this.documentCache.get(question.id);
    if (cached?.width === width) return cached.lines;
    const document = question.document;
    if (!document) return [];

    const content = sanitizeText(document.content).replaceAll("\t", " ".repeat(3));
    let lines: string[];
    if (document.format === "md") {
      lines = new Markdown(content, 0, 0, getMarkdownTheme()).render(width);
    } else {
      const language = getLanguageFromPath(`document.${document.format}`);
      const highlighted = language
        ? highlightCode(content, language)
        : content.split("\n").map((line) => this.theme.fg("mdCodeBlock", line));
      lines = highlighted.flatMap((line) => {
        const result = wrapped(line, width);
        return result.length > 0 ? result : [""];
      });
    }
    const bounded = (lines.length > 0 ? lines : [""]).map((line) =>
      truncateToWidth(line, width, ""),
    );
    this.documentCache.set(question.id, { width, lines: bounded });
    return bounded;
  }

  private renderDocumentViewport(
    question: QuestionDefinition,
    width: number,
    rows: number,
  ): string[] {
    const document = question.document;
    if (!document) return [];
    const lines = this.documentLines(question, width);
    const contentRows = Math.max(0, rows - 1);
    const maximum = contentRows > 0 ? Math.max(0, lines.length - contentRows) : 0;
    const offset = Math.max(0, Math.min(this.documentOffsets.get(question.id) ?? 0, maximum));
    this.documentOffsets.set(question.id, offset);
    this.documentMaxOffsets.set(question.id, maximum);
    this.documentViewportRows = contentRows;

    const end = contentRows > 0 ? Math.min(lines.length, offset + contentRows) : 0;
    const marker =
      offset > 0 && end < lines.length ? "↕" : offset > 0 ? "↑" : end < lines.length ? "↓" : "";
    const label = sanitizeText(document.name ?? `document.${document.format}`);
    const position = contentRows > 0 ? `${String(offset + 1)}-${String(end)}` : "0";
    const heading = `${this.documentMode ? "▶" : " "} ${label} · ${document.format.toUpperCase()} · ${marker} ${position}/${String(lines.length)}`;
    const styledHeading = this.documentMode
      ? this.theme.bg("selectedBg", this.theme.fg("text", heading))
      : this.theme.fg("muted", heading);
    return [
      truncateToWidth(styledHeading, width, ""),
      ...lines.slice(offset, offset + contentRows),
    ];
  }

  private renderDocumentQuestion(
    question: QuestionDefinition,
    width: number,
    rows: number,
  ): RenderedBody {
    if (previewSideBySide(width)) {
      const columns = columnWidths(width);
      const options = this.renderStackedQuestion(question, columns.left);
      const fittedOptions = fitDialogToRows(options.lines, {
        rows,
        topRows: 0,
        bottomRows: 0,
        focusStart: options.focusStart,
        focusEnd: options.focusEnd,
      });
      const document = this.renderDocumentViewport(question, columns.right, rows);
      const lines = joinColumns(fittedOptions, document, width);
      return { lines, focusStart: 0, focusEnd: Math.max(0, lines.length - 1) };
    }

    const documentRows = Math.max(1, Math.floor(rows / 2));
    const optionRows = Math.max(1, rows - documentRows);
    const options = this.renderStackedQuestion(question, width);
    const fittedOptions = fitDialogToRows(options.lines, {
      rows: optionRows,
      topRows: 0,
      bottomRows: 0,
      focusStart: options.focusStart,
      focusEnd: options.focusEnd,
    });
    const lines = [...fittedOptions, ...this.renderDocumentViewport(question, width, documentRows)];
    return { lines, focusStart: 0, focusEnd: Math.max(0, lines.length - 1) };
  }

  private renderQuestion(question: QuestionDefinition, width: number, rows: number): RenderedBody {
    if (question.document) return this.renderDocumentQuestion(question, width, rows);

    const focused = question.options[this.currentCursor()];
    const showPreview =
      focused?.preview && this.editMode?.kind !== "other" && this.editMode?.kind !== "chat";
    if (!showPreview || !previewSideBySide(width)) {
      return this.renderStackedQuestion(question, width);
    }

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
    const rows = Math.max(1, this.rowBudget());
    const border = this.theme.fg("accent", "─".repeat(safeWidth));
    const tabs = this.renderTabs(safeWidth);
    const question = this.questions[this.state.tab];
    const heading = question
      ? wrapped(this.theme.fg("text", sanitizeText(question.question)), safeWidth)
      : [this.theme.fg("accent", this.theme.bold("Review your answers"))];
    const top = [border, ...tabs, ...heading, ""];
    const editorLines = this.editMode ? this.editor.render(safeWidth) : [];
    const editLines = this.editMode
      ? [
          "",
          this.theme.fg("muted", this.editMode.kind === "note" ? "Note:" : "Your message:"),
          ...editorLines,
        ]
      : [];
    const bodyRows = Math.max(1, rows - top.length - editLines.length - 3);
    const body = question
      ? this.renderQuestion(question, safeWidth, bodyRows)
      : this.renderReview(safeWidth);
    const hints = this.editMode
      ? "Enter submit · Esc back"
      : this.documentMode
        ? "Document: ↑↓ line · PgUp/PgDn page · Home/End · d/Esc back"
        : `↑↓ navigate · Tab switch · Enter select · Space toggle · n note${question?.document ? " · d document" : ""} · Esc cancel`;
    const all = [...top, ...body.lines, ...editLines, "", this.theme.fg("dim", hints), border].map(
      (line) => truncateToWidth(line, safeWidth, ""),
    );
    const cursorRow = editorLines.findIndex((line) => line.includes(CURSOR_MARKER));
    const editFocus =
      editLines.length > 0
        ? top.length + body.lines.length + 2 + Math.max(0, cursorRow)
        : undefined;
    const fitted = fitDialogToRows(all, {
      rows,
      topRows: top.length,
      bottomRows: STICKY_BOTTOM_ROWS,
      focusStart: editFocus ?? top.length + body.focusStart,
      focusEnd: editFocus ?? top.length + body.focusEnd,
    });
    const padded = padDialogLines(fitted, rows);
    return padded.map((line) => {
      const truncated = truncateToWidth(line, safeWidth, "");
      return `${truncated}${" ".repeat(Math.max(0, safeWidth - visibleWidth(truncated)))}`;
    });
  }
}
