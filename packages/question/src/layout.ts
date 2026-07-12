import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

export const PREVIEW_MIN_WIDTH = 100;
const COLUMN_GAP = 2;

export interface ColumnWidths {
  readonly left: number;
  readonly right: number;
  readonly gap: number;
}

export function columnWidths(width: number): ColumnWidths {
  const gap = COLUMN_GAP;
  const left = Math.max(20, Math.floor((width - gap) * 0.42));
  return { left, right: Math.max(1, width - left - gap), gap };
}

export interface FitDialogOptions {
  readonly rows: number;
  readonly topRows: number;
  readonly bottomRows: number;
  /** Absolute row in `lines` containing the focused body's first row. */
  readonly focusStart: number;
  /** Absolute row in `lines` containing the focused body's last row. */
  readonly focusEnd: number;
}

export function previewSideBySide(width: number): boolean {
  return width >= PREVIEW_MIN_WIDTH;
}

interface Window {
  readonly lines: string[];
  readonly clippedUp: boolean;
  readonly clippedDown: boolean;
}

function focusedWindow(
  body: readonly string[],
  capacity: number,
  focusStart: number,
  focusEnd: number,
): Window {
  let start = Math.max(0, focusEnd - capacity + 1);
  if (focusStart < start) start = focusStart;
  start = Math.min(start, Math.max(0, body.length - capacity));
  return {
    lines: body.slice(start, start + capacity),
    clippedUp: start > 0,
    clippedDown: start + capacity < body.length,
  };
}

function prefixedIndicators(window: Window): string[] {
  const lines = [...window.lines];
  if (lines.length === 1) {
    const marker = window.clippedUp && window.clippedDown ? "↕" : window.clippedUp ? "↑" : "↓";
    lines[0] = `${marker} ${String(lines[0])}`;
    return lines;
  }
  if (window.clippedUp) lines[0] = `↑ ${String(lines[0])}`;
  if (window.clippedDown) lines[lines.length - 1] = `↓ ${String(lines.at(-1))}`;
  return lines;
}

export function fitDialogToRows(lines: readonly string[], options: FitDialogOptions): string[] {
  const rows = Math.max(1, options.rows);
  if (lines.length <= rows) return [...lines];
  const bottomRows = Math.min(options.bottomRows, Math.max(0, rows - 1));
  const topRows = Math.min(options.topRows, rows - bottomRows);
  const available = rows - topRows - bottomRows;
  const top = lines.slice(0, topRows);
  const bottom = bottomRows > 0 ? lines.slice(lines.length - bottomRows) : [];
  if (available <= 0) return [...top, ...bottom].slice(0, rows);

  const bodyStart = Math.min(options.topRows, lines.length - bottomRows);
  const body = lines.slice(bodyStart, lines.length - bottomRows);
  const focusStart = Math.max(0, Math.min(body.length - 1, options.focusStart - bodyStart));
  const focusEnd = Math.max(focusStart, Math.min(body.length - 1, options.focusEnd - bodyStart));
  const initial = focusedWindow(body, available, focusStart, focusEnd);
  const indicatorCount = Number(initial.clippedUp) + Number(initial.clippedDown);
  if (available <= indicatorCount + 1) {
    return [...top, ...prefixedIndicators(initial), ...bottom].slice(0, rows);
  }

  let reservedIndicators = indicatorCount;
  let content = focusedWindow(body, available - reservedIndicators, focusStart, focusEnd);
  const contentIndicators = Number(content.clippedUp) + Number(content.clippedDown);
  if (contentIndicators > reservedIndicators) {
    reservedIndicators = contentIndicators;
    content = focusedWindow(body, available - reservedIndicators, focusStart, focusEnd);
  }
  return [
    ...top,
    ...(content.clippedUp ? ["↑"] : []),
    ...content.lines,
    ...(content.clippedDown ? ["↓"] : []),
    ...bottom,
  ].slice(0, rows);
}

export function joinColumns(
  left: readonly string[],
  right: readonly string[],
  width: number,
): string[] {
  const columns = columnWidths(width);
  const rows = Math.max(left.length, right.length);
  return Array.from({ length: rows }, (_, index) => {
    const leftLine = truncateToWidth(left[index] ?? "", columns.left, "");
    const padded = leftLine + " ".repeat(Math.max(0, columns.left - visibleWidth(leftLine)));
    return truncateToWidth(
      `${padded}${" ".repeat(columns.gap)}${truncateToWidth(right[index] ?? "", columns.right, "")}`,
      width,
      "",
    );
  });
}
