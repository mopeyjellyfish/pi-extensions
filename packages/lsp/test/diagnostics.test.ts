import { describe, expect, it } from "vitest";

import { introducedDiagnostics, renderDiagnostics } from "../src/diagnostics.ts";

import type { Diagnostic } from "vscode-languageserver-protocol";

function diagnostic(line: number, message: string, code = "TS1"): Diagnostic {
  return {
    code,
    message,
    range: {
      end: { character: 4, line },
      start: { character: 1, line },
    },
    severity: 1,
    source: "typescript",
  };
}

describe("diagnostic deltas", () => {
  it("does not report an unchanged diagnostic merely because preceding lines moved", () => {
    expect.hasAssertions();
    const beforeText = "one\ntwo\nthree\nfour\n";
    const afterText = "zero\none\ntwo\nthree\nfour\n";
    const before = [diagnostic(3, "existing")];
    const after = [diagnostic(4, "existing"), diagnostic(2, "introduced", "TS2")];

    expect(introducedDiagnostics(before, after, beforeText, afterText)).toEqual([
      diagnostic(2, "introduced", "TS2"),
    ]);
  });

  it("preserves genuinely duplicated diagnostics at different locations", () => {
    expect.hasAssertions();
    const before = [diagnostic(1, "same")];
    const after = [diagnostic(1, "same"), diagnostic(4, "same")];
    expect(introducedDiagnostics(before, after, "a\nb\n", "a\nb\nc\nd\ne\n")).toEqual([
      diagnostic(4, "same"),
    ]);
  });
});

describe("diagnostic rendering", () => {
  it("returns compact sanitized errors with hard count and byte bounds", () => {
    expect.hasAssertions();
    const diagnostics = Array.from({ length: 12 }, (_, index) =>
      diagnostic(index, `bad\nmessage ${String(index)} ${"x".repeat(350)}`, `C${String(index)}`),
    );
    const rendered = renderDiagnostics(diagnostics);

    expect(rendered).toContain("LSP: 12 new errors");
    expect(rendered).toContain("1:2 C0 [typescript] bad message 0");
    expect(rendered).toContain("… 4 more errors");
    expect(rendered).not.toContain("bad\nmessage");
    expect(Buffer.byteLength(rendered, "utf8")).toBeLessThanOrEqual(2048);
  });

  it("emits no model content for a clean result", () => {
    expect.hasAssertions();
    expect(renderDiagnostics([])).toBe("");
    expect(renderDiagnostics([{ ...diagnostic(0, "warning"), severity: 2 }])).toBe("");
  });

  it("handles missing source text and diagnostics inside replaced lines", () => {
    expect.hasAssertions();
    const existing = diagnostic(0, "existing");
    expect(introducedDiagnostics([existing], [existing])).toEqual([]);
    expect(
      introducedDiagnostics([existing], [diagnostic(0, "existing")], "old\n", "new\n"),
    ).toEqual([diagnostic(0, "existing")]);
    expect(introducedDiagnostics([], [])).toEqual([]);
  });

  it("renders optional and hostile diagnostic fields safely", () => {
    expect.hasAssertions();
    const rendered = renderDiagnostics([
      {
        code: 123,
        message: "bad\u{0} value\twith space",
        range: {
          end: { character: 1, line: 0 },
          start: { character: 0, line: 0 },
        },
      },
      {
        message: "second",
        range: {
          end: { character: 1, line: 1 },
          start: { character: 0, line: 1 },
        },
        severity: 1,
      },
    ]);
    expect(rendered).toContain("1:1 123 bad value with space");
    expect(rendered).toContain("2:1 second");
    expect(rendered).not.toContain("[undefined]");
  });
});
