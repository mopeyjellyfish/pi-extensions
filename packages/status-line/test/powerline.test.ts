import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";

import {
  renderStatusLine,
  stripAnsi,
  type StatusLineTheme,
  type StatusLineView,
} from "../src/powerline.ts";

const testTheme: StatusLineTheme = {
  fg: (color, text) => {
    const code =
      color === "thinkingHigh"
        ? 1
        : color === "success"
          ? 2
          : color === "warning"
            ? 3
            : color === "muted"
              ? 4
              : 5;
    return `\u{1B}[38;5;${String(code)}m${text}\u{1B}[0m`;
  },
};

const baseView: StatusLineView = {
  branch: "feat/status-line-integration",
  context: { contextWindow: 372_000, percent: 72.5 },
  cwd: "/Users/david/code/personal/pi-extensions",
  effort: "high",
  extensionStatuses: [],
  gitState: "clean",
  model: "GPT-5.6 Sol",
  todo: {
    closed: 2,
    current: "Implement status integration",
    total: 5,
  },
  tokens: 28_000_000,
};

describe("Powerlevel10k status rendering", () => {
  it("matches pi-powerline-footer's thin inline style and requested segment order", () => {
    expect.hasAssertions();
    const line = renderStatusLine(baseView, 180);
    const plain = stripAnsi(line);

    expect(line).toContain("\u{E0B1}");
    expect(line).not.toContain("\u{E0B0}");
    expect(line).not.toContain("\u{E0B2}");
    expect(plain).toContain(
      " GPT-5.6 Sol  think:high   pi-extensions   feat/status-line-integration   72.5%/372k 󰁨    28M   2/5 · Implement status integration",
    );

    const styled = renderStatusLine(baseView, 180, testTheme);
    expect(styled).toContain("\u{1B}[38;5;1mthink:high\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;2m feat/status-line-integration\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;3m 72.5%/372k 󰁨\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;4m  28M\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;3m 2/5 · Implement status integration\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;5m\u{1B}[0m");
  });

  it("keeps every rendered line within its width and omits absent segments", () => {
    expect.hasAssertions();
    const dirty = renderStatusLine({ ...baseView, gitState: "modified" }, 72);
    expect(visibleWidth(dirty)).toBeLessThanOrEqual(72);
    expect(renderStatusLine(baseView, 0)).toBe("");
    expect(
      stripAnsi(
        renderStatusLine(
          {
            cwd: baseView.cwd,
            extensionStatuses: [],
            gitState: "clean",
            tokens: 12_000,
          },
          60,
        ),
      ),
    ).not.toContain("feat/status-line-integration");

    for (const width of [20, 32, 48, 80, 120]) {
      expect(visibleWidth(renderStatusLine(baseView, width))).toBeLessThanOrEqual(width);
    }
  });

  it("sanitizes external text and reports an all-closed list", () => {
    expect.hasAssertions();
    const line = renderStatusLine(
      {
        ...baseView,
        branch: "feat/injected\nbranch",
        extensionStatuses: ["safe\tstatus\u{85}"],
        todo: { closed: 4, current: "👨‍👩‍👧‍👦".repeat(20), total: 5 },
      },
      300,
    );
    const plain = stripAnsi(line);

    expect(plain).not.toMatch(/[\n\r\t\u{85}]/u);
    expect(plain).toContain("feat/injected branch");
    expect(plain).toContain(" 4/5");
    expect(plain).toContain("safe status");
    expect(visibleWidth(line)).toBeLessThanOrEqual(300);
  });
});
