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
  const left = Math.max(20, Math.floor((width - gap) / 3));
  return { left, right: Math.max(1, width - left - gap), gap };
}

export interface ItemWindow {
  readonly start: number;
  readonly end: number;
  readonly hiddenBefore: number;
  readonly hiddenAfter: number;
}

export function itemWindow(
  itemCount: number,
  capacity: number,
  requestedStart: number,
): ItemWindow {
  const count = Math.max(0, itemCount);
  const size = Math.min(count, Math.max(1, capacity));
  const start = Math.max(0, Math.min(requestedStart, Math.max(0, count - size)));
  const end = start + size;
  return { start, end, hiddenBefore: start, hiddenAfter: count - end };
}

export function focusedItemWindow(
  itemCount: number,
  capacity: number,
  focusIndex: number,
): ItemWindow {
  const count = Math.max(0, itemCount);
  if (count === 0) return itemWindow(0, capacity, 0);
  const size = Math.min(count, Math.max(1, capacity));
  const focus = Math.max(0, Math.min(focusIndex, count - 1));
  return itemWindow(count, size, focus - Math.floor(size / 2));
}

function itemWindowMarkerRows(start: number, end: number, itemCount: number): number {
  return Number(start > 0) + Number(end < itemCount);
}

export function focusedItemWindowByRows(
  itemCount: number,
  rowCapacity: number,
  focusIndex: number,
  rowHeight: (index: number) => number,
): ItemWindow {
  const count = Math.max(0, itemCount);
  if (count === 0) return itemWindow(0, 1, 0);
  const capacity = Math.max(1, rowCapacity);
  const focus = Math.max(0, Math.min(focusIndex, count - 1));
  const heights = new Map<number, number>();
  const height = (index: number): number => {
    const cached = heights.get(index);
    if (cached !== undefined) return cached;
    const measured = Math.max(1, Math.ceil(rowHeight(index)));
    heights.set(index, measured);
    return measured;
  };
  let start = focus;
  let end = focus + 1;
  let usedRows = height(focus);
  for (;;) {
    const left = start - 1;
    const right = end;
    const candidates: number[] = [];
    if (left >= 0 && (right >= count || focus - left <= right - focus)) candidates.push(left);
    if (right < count) candidates.push(right);
    if (left >= 0 && candidates[0] !== left) candidates.push(left);
    if (candidates.length === 0) break;

    let expanded = false;
    for (const candidate of candidates) {
      const nextStart = Math.min(candidate, start);
      const nextEnd = Math.max(candidate + 1, end);
      const nextRows = usedRows + height(candidate);
      if (nextRows + itemWindowMarkerRows(nextStart, nextEnd, count) > capacity) continue;
      start = nextStart;
      end = nextEnd;
      usedRows = nextRows;
      expanded = true;
      break;
    }
    if (!expanded) break;
  }
  return { start, end, hiddenBefore: start, hiddenAfter: count - end };
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
