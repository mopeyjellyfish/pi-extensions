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
  type MarkdownTheme,
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
import {
  columnWidths,
  fitDialogToRows,
  focusedItemWindow,
  focusedItemWindowByRows,
  joinColumns,
  previewSideBySide,
  type ItemWindow,
} from "./layout.ts";
import { answersFromState } from "./results.ts";
import { applyAction, firstUnansweredTab } from "./state.ts";

import type { QuestionAnswer, QuestionDefinition, QuestionnaireState } from "./types.ts";

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

function compactOptionWindowLine(
  line: string,
  width: number,
  hiddenBefore: number,
  hiddenAfter: number,
): string {
  const before = hiddenBefore > 0 ? `↑ ${String(hiddenBefore)} ` : "";
  const after = hiddenAfter > 0 ? ` ↓ ${String(hiddenAfter)}` : "";
  const optionWidth = Math.max(1, width - visibleWidth(before) - visibleWidth(after));
  return `${before}${truncateToWidth(line, optionWidth, "")}${after}`;
}

const CODE_BLOCK_START = "\u{E000}";
const CODE_BLOCK_END = "\u{E001}";

function documentMarkdownTheme(): MarkdownTheme {
  const markdownTheme = getMarkdownTheme();
  let nextCodeBlockBorder = CODE_BLOCK_START;
  return {
    ...markdownTheme,
    codeBlockBorder: () => {
      const border = nextCodeBlockBorder;
      nextCodeBlockBorder =
        nextCodeBlockBorder === CODE_BLOCK_START ? CODE_BLOCK_END : CODE_BLOCK_START;
      return border;
    },
    listBullet: (marker) => markdownTheme.listBullet(marker.replace(/^[-+*] /u, "• ")),
  };
}

function renderMarkdownDocument(content: string, width: number, theme: Theme): string[] {
  let inCodeBlock = false;
  return new Markdown(content, 0, 0, documentMarkdownTheme()).render(width).map((line) => {
    if (line.includes(CODE_BLOCK_START)) {
      inCodeBlock = true;
      return theme.bg("toolPendingBg", line.replace(CODE_BLOCK_START, " "));
    }
    if (line.includes(CODE_BLOCK_END)) {
      const paddedLine = theme.bg("toolPendingBg", line.replace(CODE_BLOCK_END, " "));
      inCodeBlock = false;
      return paddedLine;
    }
    return inCodeBlock ? theme.bg("toolPendingBg", line) : line;
  });
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
  private readonly optionPageSizes = new Map<string, number>();
  private reviewOffset = 0;
  private reviewPageSize = 1;
  private reviewMaxOffset = 0;
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
  private readonly padToRows: boolean;
  private readonly done: (outcome: DialogOutcome) => void;

  constructor(
    tui: TuiLike,
    theme: Theme,
    keybindings: unknown,
    questions: readonly QuestionDefinition[],
    initialState: QuestionnaireState,
    done: (outcome: DialogOutcome) => void,
    rowBudget: () => number = () => tui.terminal.rows,
    padToRows = true,
  ) {
    this.tui = tui;
    this.theme = theme;
    this.keybindings = keybindings as KeybindingsManager;
    this.questions = questions;
    this.done = done;
    this.rowBudget = rowBudget;
    this.padToRows = padToRows;
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

  private setQuestionCursor(index: number): void {
    this.state = applyAction(this.state, { kind: "cursor", index }, this.questions);
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
    this.setQuestionCursor((cursor + delta + count) % count);
    return true;
  }

  private moveOptionPage(data: string, question: QuestionDefinition): boolean {
    const cursor = this.currentCursor();
    const lastOption = Math.max(0, question.options.length - 1);
    const page = this.optionPageSizes.get(question.id) ?? 1;
    let next: number | undefined;
    if (this.keybindings.matches(data, "tui.select.pageUp")) {
      next = Math.max(0, Math.min(cursor, lastOption) - page);
    } else if (this.keybindings.matches(data, "tui.select.pageDown")) {
      next = Math.min(lastOption, Math.min(cursor, lastOption) + page);
    } else if (matchesKey(data, Key.home)) next = 0;
    else if (matchesKey(data, Key.end)) next = lastOption;
    if (next === undefined) return false;
    if (next !== cursor) this.setQuestionCursor(next);
    return true;
  }

  private handleQuestionTab(data: string, question: QuestionDefinition): void {
    if (this.moveOptionPage(data, question) || this.moveCursor(data, question)) return;
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

  private moveReviewPage(data: string): boolean {
    let next: number | undefined;
    if (this.keybindings.matches(data, "tui.select.pageUp")) {
      next = this.reviewOffset - this.reviewPageSize;
    } else if (this.keybindings.matches(data, "tui.select.pageDown")) {
      next = this.reviewOffset + this.reviewPageSize;
    } else if (matchesKey(data, Key.home)) next = 0;
    else if (matchesKey(data, Key.end)) next = this.reviewMaxOffset;
    if (next === undefined) return false;
    const bounded = Math.max(0, Math.min(next, this.reviewMaxOffset));
    if (bounded !== this.reviewOffset) {
      this.reviewOffset = bounded;
      this.refresh();
    }
    return true;
  }

  private handleSubmitTab(data: string): void {
    if (this.moveReviewPage(data)) return;
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

  private renderProgress(width: number): string[] {
    if (this.questions.length === 1) return [];
    const answered = this.questions.filter((question) => {
      const draft = this.state.drafts[question.id];
      return Boolean(draft && (draft.selectedIds.length > 0 || draft.custom));
    }).length;
    const question = this.questions[this.state.tab];
    const progress = question
      ? `Question ${String(this.state.tab + 1)} of ${String(this.questions.length)} · ${sanitizeText(question.header)} · ${String(answered)} answered`
      : `Review · ${String(answered)} of ${String(this.questions.length)} answered`;
    return [truncateToWidth(this.theme.fg("muted", progress), width, "")];
  }

  private renderVisibleOptions(
    question: QuestionDefinition,
    width: number,
    startIndex: number,
    endIndex: number,
    cursor: number,
    showDescriptions: boolean,
  ): { readonly lines: string[]; readonly focusLine: number } {
    const draft = this.state.drafts[question.id];
    const lines: string[] = [];
    let focusLine = 0;
    for (let index = startIndex; index < endIndex; index++) {
      const option = question.options[index];
      if (!option) continue;
      const start = lines.length;
      const selected = draft?.selectedIds.includes(option.id) ?? false;
      const marker = question.multiSelect ? (selected ? "[x]" : "[ ]") : selected ? "●" : "○";
      const prefix = index === cursor ? "> " : "  ";
      lines.push(...wrapped(`${prefix}${marker} ${option.label}`, width));
      if (showDescriptions) {
        lines.push(
          ...wrapped(`    ${this.theme.fg("muted", sanitizeText(option.description))}`, width),
        );
      }
      const note = draft?.notes[option.id];
      if (note) lines.push(...wrapped(`    ${this.theme.fg("dim", `Note: ${note}`)}`, width));
      if (index === cursor) focusLine = start;
    }
    return { lines, focusLine };
  }

  private optionWindow(
    question: QuestionDefinition,
    width: number,
    rows: number,
    sentinelCount: number,
    cursor: number,
  ): {
    readonly window: ItemWindow;
    readonly compact: boolean;
    readonly showDescriptions: boolean;
  } {
    const optionFocus = Math.min(cursor, question.options.length - 1);
    const viewportRows = Math.max(1, rows - sentinelCount);
    const markerRows = Number(optionFocus > 0) + Number(optionFocus + 1 < question.options.length);
    let compact = viewportRows < 3;
    let showDescriptions = rows > sentinelCount + 2;
    if (!compact) {
      let focusRows = this.renderVisibleOptions(
        question,
        width,
        optionFocus,
        optionFocus + 1,
        cursor,
        showDescriptions,
      ).lines.length;
      if (showDescriptions && focusRows + markerRows > viewportRows) {
        showDescriptions = false;
        focusRows = this.renderVisibleOptions(
          question,
          width,
          optionFocus,
          optionFocus + 1,
          cursor,
          false,
        ).lines.length;
      }
      compact = focusRows + markerRows > viewportRows;
    }
    const window = compact
      ? focusedItemWindow(question.options.length, 1, optionFocus)
      : focusedItemWindowByRows(
          question.options.length,
          viewportRows,
          optionFocus,
          (index) =>
            this.renderVisibleOptions(question, width, index, index + 1, cursor, showDescriptions)
              .lines.length,
        );
    return { window, compact, showDescriptions };
  }

  private optionRows(question: QuestionDefinition, width: number, rows: number): RenderedBody {
    const cursor = this.currentCursor();
    const sentinels = ["Other…", "Chat about this…", ...(question.multiSelect ? ["Next →"] : [])];
    const { window, compact, showDescriptions } = this.optionWindow(
      question,
      width,
      rows,
      sentinels.length,
      cursor,
    );
    this.optionPageSizes.set(question.id, window.end - window.start);
    const before =
      !compact && window.hiddenBefore > 0
        ? [this.theme.fg("muted", `↑ ${String(window.hiddenBefore)} earlier options`)]
        : [];
    const after =
      !compact && window.hiddenAfter > 0
        ? [this.theme.fg("muted", `↓ ${String(window.hiddenAfter)} later options`)]
        : [];
    const visible = this.renderVisibleOptions(
      question,
      width,
      window.start,
      window.end,
      cursor,
      showDescriptions,
    );
    const fittedOptions = compact
      ? [
          compactOptionWindowLine(
            visible.lines[visible.focusLine] ?? "",
            width,
            window.hiddenBefore,
            window.hiddenAfter,
          ),
        ]
      : visible.lines;
    const lines = [...before, ...fittedOptions, ...after];
    let focusStart = before.length + (compact ? 0 : visible.focusLine);
    let focusEnd = focusStart;
    for (const [offset, label] of sentinels.entries()) {
      const index = question.options.length + offset;
      const start = lines.length;
      lines.push(`${index === cursor ? "> " : "  "}${label}`);
      if (index === cursor) focusStart = focusEnd = start;
    }
    return { lines, focusStart, focusEnd };
  }

  private renderStackedQuestion(
    question: QuestionDefinition,
    width: number,
    rows: number,
  ): RenderedBody {
    const options = this.optionRows(question, width, rows);
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
      lines = renderMarkdownDocument(content, width, this.theme);
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
      const options = this.renderStackedQuestion(question, columns.left, rows);
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
    const options = this.renderStackedQuestion(question, width, optionRows);
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

    if (!previewSideBySide(width)) return this.renderStackedQuestion(question, width, rows);

    const focused = question.options[this.currentCursor()];
    const showPreview =
      focused?.preview && this.editMode?.kind !== "other" && this.editMode?.kind !== "chat";

    const columns = columnWidths(width);
    const options = this.optionRows(question, columns.left, rows);
    const previewLines = showPreview
      ? new Markdown(sanitizeText(focused.preview), 0, 0, getMarkdownTheme()).render(columns.right)
      : [];
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

  private reviewAnswerLines(
    answer: QuestionAnswer,
    questionsById: ReadonlyMap<string, QuestionDefinition>,
    width: number,
  ): string[] {
    const question = questionsById.get(answer.questionId);
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
    return wrapped(`${question?.header ?? answer.questionId}: ${value || "Unanswered"}`, width);
  }

  private renderReview(width: number, rows: number): RenderedBody {
    const wide = previewSideBySide(width);
    const contentWidth = wide ? columnWidths(width).left : width;
    const answers = answersFromState(this.questions, this.state);
    const missing = firstUnansweredTab(this.state, this.questions);
    const maximumStart = Math.max(0, answers.length - 1);
    const start = Math.max(0, Math.min(this.reviewOffset, maximumStart));
    this.reviewOffset = start;
    this.reviewMaxOffset = maximumStart;
    const warningLines =
      missing === undefined
        ? []
        : wrapped(
            this.theme.fg("warning", "Answer every question before submitting."),
            contentWidth,
          );
    const markerRows = Number(start > 0) + Number(start < answers.length - 1);
    const answerBudget = Math.max(1, rows - 2 - warningLines.length - markerRows);
    const questionsById = new Map(this.questions.map((question) => [question.id, question]));
    const answerLines: string[] = [];
    let end = start;
    for (let index = start; index < answers.length; index++) {
      const answer = answers[index];
      if (!answer) continue;
      const group = this.reviewAnswerLines(answer, questionsById, contentWidth);
      if (answerLines.length + group.length > answerBudget) {
        if (answerLines.length === 0) {
          answerLines.push(
            ...fitDialogToRows(group, {
              rows: answerBudget,
              topRows: 0,
              bottomRows: 0,
              focusStart: 0,
              focusEnd: 0,
            }),
          );
          end = index + 1;
        }
        break;
      }
      answerLines.push(...group);
      end = index + 1;
    }
    this.reviewPageSize = Math.max(1, end - start);
    const lines: string[] = [];
    if (start > 0) {
      lines.push(this.theme.fg("muted", `↑ ${String(start)} earlier answers`));
    }
    lines.push(...answerLines);
    if (end < answers.length) {
      lines.push(this.theme.fg("muted", `↓ ${String(answers.length - end)} later answers`));
    }
    lines.push(...warningLines);
    const cursor = this.currentCursor();
    const submitStart = lines.length;
    lines.push(
      `${cursor === 0 ? "> " : "  "}${this.state.complete ? "Submit answers" : "Submit answers (disabled)"}`,
      `${cursor === 1 ? "> " : "  "}Chat about this…`,
    );
    return {
      lines: wide ? joinColumns(lines, [], width) : lines,
      focusStart: submitStart + cursor,
      focusEnd: submitStart + cursor,
    };
  }

  private dialogChrome(
    rows: number,
    border: string,
    progress: readonly string[],
    heading: readonly string[],
    editLines: readonly string[],
    question: QuestionDefinition | undefined,
  ): { readonly top: string[]; readonly bottomGap: string[]; readonly bodyRows: number } {
    const topBase = [border, ...progress, ...heading];
    const minimumBodyRows = 3 + Number(question?.multiSelect ?? false);
    const showGaps =
      rows >= topBase.length + editLines.length + minimumBodyRows + STICKY_BOTTOM_ROWS + 2;
    const top = [...topBase, ...(showGaps ? [""] : [])];
    const bottomGap = showGaps ? [""] : [];
    const bodyRows = Math.max(
      1,
      rows - top.length - editLines.length - bottomGap.length - STICKY_BOTTOM_ROWS,
    );
    return { top, bottomGap, bodyRows };
  }

  render(width: number): string[] {
    const safeWidth = Math.max(1, width);
    const rows = Math.max(1, this.rowBudget());
    const border = this.theme.fg("accent", "─".repeat(safeWidth));
    const progress = this.renderProgress(safeWidth);
    const question = this.questions[this.state.tab];
    const heading = question
      ? wrapped(this.theme.fg("text", sanitizeText(question.question)), safeWidth)
      : [this.theme.fg("accent", this.theme.bold("Review your answers"))];
    const editorLines = this.editMode ? this.editor.render(safeWidth) : [];
    const editLines = this.editMode
      ? [
          "",
          this.theme.fg("muted", this.editMode.kind === "note" ? "Note:" : "Your message:"),
          ...editorLines,
        ]
      : [];
    const { top, bottomGap, bodyRows } = this.dialogChrome(
      rows,
      border,
      progress,
      heading,
      editLines,
      question,
    );
    const body = question
      ? this.renderQuestion(question, safeWidth, bodyRows)
      : this.renderReview(safeWidth, bodyRows);
    const hints = this.editMode
      ? "Enter submit · Esc back"
      : this.documentMode
        ? "Document: ↑↓ line · PgUp/PgDn page · Home/End · d/Esc back"
        : question
          ? `↑↓ navigate · PgUp/PgDn page · Home/End option · Tab switch · Enter select · Space toggle · n note${question.document ? " · d document" : ""} · Esc cancel`
          : "Review: PgUp/PgDn page · Home/End · ↑↓ actions · Tab switch · Enter select · Esc cancel";
    const all = [
      ...top,
      ...body.lines,
      ...editLines,
      ...bottomGap,
      this.theme.fg("dim", hints),
      border,
    ].map((line) => truncateToWidth(line, safeWidth, ""));
    const cursorRow = editorLines.findIndex((line) => line.includes(CURSOR_MARKER));
    const editFocus =
      editLines.length > 0
        ? top.length + body.lines.length + 2 + Math.max(0, cursorRow)
        : undefined;
    const fitted = fitDialogToRows(all, {
      rows,
      topRows: this.padToRows ? top.length : Math.min(top.length, 2),
      bottomRows: STICKY_BOTTOM_ROWS,
      focusStart: editFocus ?? top.length + body.focusStart,
      focusEnd: editFocus ?? top.length + body.focusEnd,
    });
    const padded = this.padToRows ? padDialogLines(fitted, rows) : fitted;
    return padded.map((line) => {
      const truncated = truncateToWidth(line, safeWidth, "");
      return `${truncated}${" ".repeat(Math.max(0, safeWidth - visibleWidth(truncated)))}`;
    });
  }
}
