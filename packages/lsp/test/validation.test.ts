import { describe, expect, it } from "vitest";

import { buildValidationOutcome, renderValidationOutcome } from "../src/validation.ts";

import type { Diagnostic } from "vscode-languageserver-protocol";

function diagnostic(severity: Diagnostic["severity"], message: string): Diagnostic {
  return {
    code: "X1",
    message,
    range: {
      end: { character: 4, line: 1 },
      start: { character: 1, line: 1 },
    },
    ...(severity === undefined ? {} : { severity }),
    source: "fake",
  };
}

describe("LSP validation output", () => {
  it("filters severity, deduplicates diagnostics, and renders locations", () => {
    expect.hasAssertions();
    const error = diagnostic(1, "bad\nvalue");
    const outcome = buildValidationOutcome(
      "document",
      "warning",
      ["Fake LSP", "Fake LSP"],
      [
        { diagnostics: [error, error, diagnostic(2, "warning")], path: "/tmp/example.ts" },
        { diagnostics: [diagnostic(3, "info")], path: "/tmp/info.ts" },
      ],
    );
    expect(outcome.serverNames).toEqual(["Fake LSP"]);
    expect(outcome.diagnostics[0]?.diagnostics).toHaveLength(2);
    expect(outcome.diagnostics).toHaveLength(1);
    const rendered = renderValidationOutcome("/tmp", outcome);
    expect(rendered).toContain("example.ts:2:2 error fake X1: bad value");
    expect(rendered).toContain("warning fake X1: warning");
  });

  it("supports error-only and all-severity empty output", () => {
    expect.hasAssertions();
    const errorOnly = buildValidationOutcome(
      "workspace",
      "error",
      ["Fake LSP"],
      [{ diagnostics: [diagnostic(2, "warning"), diagnostic(undefined, "unknown")], path: "a.ts" }],
    );
    expect(errorOnly.diagnostics).toEqual([]);
    expect(renderValidationOutcome("/tmp", errorOnly)).toContain("No matching diagnostics");

    const all = buildValidationOutcome(
      "workspace",
      "all",
      [],
      [{ diagnostics: [diagnostic(undefined, "unknown")], path: "relative.ts" }],
    );
    expect(renderValidationOutcome("/tmp", all)).toContain("relative.ts:2:2 info fake X1: unknown");
    const detailed = diagnostic(undefined, "plain");
    const bare: Diagnostic = { message: detailed.message, range: detailed.range };
    const paths = renderValidationOutcome("/tmp", {
      diagnostics: [
        { diagnostics: [bare], path: "/tmp" },
        { diagnostics: [bare], path: "/outside/example.ts" },
      ],
      omitted: 1,
      scope: "document",
      serverNames: [],
    });
    expect(paths).toContain(".:2:2 info plain");
    expect(paths).toContain("/outside/example.ts");
    expect(paths).toContain("1 additional diagnostic omitted");
  });

  it("bounds large diagnostic reports", () => {
    expect.hasAssertions();
    const groups = Array.from({ length: 70 }, (_, fileIndex) => ({
      diagnostics: Array.from({ length: 4 }, (_, diagnosticIndex) =>
        diagnostic(1, `failure-${String(fileIndex)}-${String(diagnosticIndex)}`),
      ),
      path: `/tmp/${String(fileIndex)}.ts`,
    }));
    const outcome = buildValidationOutcome("workspace", "all", ["Fake LSP"], groups);
    expect(outcome.diagnostics.length).toBeLessThanOrEqual(64);
    expect(outcome.omitted).toBeGreaterThan(0);
    expect(renderValidationOutcome("/tmp", outcome)).toContain("additional diagnostics omitted");

    const manyFiles = buildValidationOutcome(
      "workspace",
      "all",
      ["Fake LSP"],
      Array.from({ length: 70 }, (_, index) => ({
        diagnostics: [diagnostic(1, `file-${String(index)}`)],
        path: `/tmp/single-${String(index)}.ts`,
      })),
    );
    expect(manyFiles.diagnostics).toHaveLength(64);
    expect(manyFiles.omitted).toBe(6);
  });
});
