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
  costUsd: 1.23,
  cwd: "/Users/david/code/personal/pi-extensions",
  effort: "high",
  extensionStatuses: [],
  gitDetails: { ahead: 2, behind: 1, changed: 4, conflicts: 0, staged: 3 },
  gitState: "modified",
  model: "GPT-5.6 Sol",
  subagents: { active: 2, attention: 1 },
  todo: {
    closed: 2,
    current: "Implement status integration",
    total: 5,
  },
  tokens: 28_000_000,
  workflow: {
    activeSlice: "VS-002",
    appetite: "attention",
    attention: "attention",
    phase: "build",
  },
};

describe("Powerlevel10k status rendering", () => {
  it("matches pi-powerline-footer's thin inline style and requested segment order", () => {
    expect.hasAssertions();
    const line = renderStatusLine(baseView, 240);
    const plain = stripAnsi(line);

    expect(line).toContain("\u{E0B1}");
    expect(line).not.toContain("\u{E0B0}");
    expect(line).not.toContain("\u{E0B2}");
    expect(plain).toContain(
      " GPT-5.6 Sol  think:high   pi-extensions   feat/status-line-integration ↑2 ↓1 +3 ~4   72.5%/372k 󰁨    28M · $1.23   2 !1  flow build · VS-002 · appetite!   2/5 · Implement status integration",
    );

    const styled = renderStatusLine(baseView, 240, testTheme);
    expect(styled).toContain("\u{1B}[38;5;1mthink:high\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;3m feat/status-line-integration ↑2 ↓1 +3 ~4\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;3m 72.5%/372k 󰁨\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;4m  28M · $1.23\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;5m 2 !1\u{1B}[0m");
    expect(styled).toContain("\u{1B}[38;5;3mflow build · VS-002 · appetite!\u{1B}[0m");
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

  it("formats cost ranges and a healthy compact subagent fleet", () => {
    expect.hasAssertions();
    const low = stripAnsi(
      renderStatusLine(
        {
          branch: "main",
          costUsd: 0.004,
          cwd: baseView.cwd,
          extensionStatuses: [],
          gitDetails: { ahead: 0, behind: 0, changed: 0, conflicts: 1, staged: 0 },
          gitState: "conflicted",
          subagents: { active: 1, attention: 0 },
        },
        140,
      ),
    );
    expect(low).toContain(" main !1");
    expect(low).toContain("$0.004");
    expect(low).toContain(" 1");
    expect(low).not.toContain("!1   1 !");

    expect(stripAnsi(renderStatusLine({ ...baseView, costUsd: 12.3 }, 240))).toContain("$12.3");
    expect(stripAnsi(renderStatusLine({ ...baseView, costUsd: 101 }, 240))).toContain("$101");
  });

  it("renders workflow appetite states and sanitizes slice text", () => {
    expect.hasAssertions();
    const expired = renderStatusLine(
      {
        ...baseView,
        workflow: {
          activeSlice: "VS-003\nunsafe",
          appetite: "expired",
          phase: "review",
        },
      },
      300,
      testTheme,
    );
    expect(stripAnsi(expired)).toContain("flow review · VS-003 unsafe");
    expect(stripAnsi(expired)).not.toContain("appetite!");
    expect(expired).toContain("\u{1B}[38;5;5mflow review");
    expect(visibleWidth(expired)).toBeLessThanOrEqual(300);

    const blocked = stripAnsi(
      renderStatusLine(
        {
          ...baseView,
          workflow: { appetite: "active", attention: "blocked", phase: "build" },
        },
        300,
        testTheme,
      ),
    );
    expect(blocked).toContain("flow build · blocked");
    expect(blocked).not.toContain("appetite!");

    const paused = stripAnsi(
      renderStatusLine(
        {
          ...baseView,
          workflow: { appetite: "active", attention: "paused", phase: "build" },
        },
        300,
        testTheme,
      ),
    );
    expect(paused).toContain("flow build · paused");

    const completed = renderStatusLine(
      {
        ...baseView,
        workflow: { appetite: "expired", attention: "completed", phase: "ship" },
      },
      300,
      testTheme,
    );
    expect(stripAnsi(completed)).toContain("flow ship · completed");
    expect(completed).toContain("\u{1B}[38;5;2mflow ship · completed");
    expect(completed).not.toContain("\u{1B}[38;5;3mflow ship");
    expect(stripAnsi(completed)).not.toContain("appetite!");

    const ready = renderStatusLine(
      {
        ...baseView,
        workflow: { appetite: "active", attention: "ready", phase: "ship" },
      },
      300,
      testTheme,
    );
    expect(stripAnsi(ready)).toContain("flow ship · ready");
    expect(ready).not.toContain("\u{1B}[38;5;3mflow ship");
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
