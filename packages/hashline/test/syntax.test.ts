import { describe, expect, it } from "vitest";

import {
  enclosingBoundaries,
  initializeSyntax,
  parsesCleanly,
  resolveTreeSitterBlock,
} from "../src/hashline/syntax.ts";

describe("Hashline syntax initialization", () => {
  it("requires explicit initialization, coalesces callers, then resolves synchronously", async () => {
    expect.hasAssertions();
    expect(() =>
      resolveTreeSitterBlock({ line: 1, path: "example.ts", text: "const value = 1;\n" }),
    ).toThrow(/not initialized.*initializeSyntax/i);

    const first = initializeSyntax();
    const second = initializeSyntax();
    expect(first).toBe(second);
    await Promise.all([first, second]);

    expect(
      resolveTreeSitterBlock({ line: 1, path: "example.ts", text: "const value = 1;\n" }),
    ).toEqual({
      start: 1,
      end: 1,
    });
  });

  it("returns null for unsupported, empty, blank, and invalid line block requests while cacheable whole-file checks remain strict", async () => {
    expect.hasAssertions();
    await initializeSyntax();
    expect(
      resolveTreeSitterBlock({ line: 0, path: "example.ts", text: "const x = 1;\n" }),
    ).toBeNull();
    expect(resolveTreeSitterBlock({ line: 1, path: "example.unknown", text: "text\n" })).toBeNull();
    expect(resolveTreeSitterBlock({ line: 1, path: "example.ts", text: "" })).toBeNull();
    expect(
      resolveTreeSitterBlock({ line: 1, path: "example.ts", text: "\nconst x = 1;\n" }),
    ).toBeNull();
    expect(
      resolveTreeSitterBlock({ line: 9, path: "example.ts", text: "const x = 1;\n" }),
    ).toBeNull();
    expect(
      resolveTreeSitterBlock({ line: 1, path: "example.ts", text: "\nconst x = 1;\n" }),
    ).toBeNull();
    expect(resolveTreeSitterBlock({ line: 1, path: "EXAMPLE.TS", text: "const x = 1;\n" })).toEqual(
      { start: 1, end: 1 },
    );
    expect(resolveTreeSitterBlock({ line: 1, path: "example.ts", text: "const x = 1;\n" })).toEqual(
      { start: 1, end: 1 },
    );
    expect(resolveTreeSitterBlock({ line: 1, path: "example.ts", text: "const x = 1;\n" })).toEqual(
      { start: 1, end: 1 },
    );
    expect(parsesCleanly(undefined, "const x = 1;\n")).toBe(false);
    expect(parsesCleanly("example.unknown", "text\n")).toBe(false);
    expect(enclosingBoundaries(["const x = 1;"], "example.unknown", 1, 1)).toEqual([]);
    expect(enclosingBoundaries(["const = ;"], "example.ts", 1, 1)).toEqual([]);
    expect(enclosingBoundaries(["const = ;"], "example.ts", 1, 1)).toEqual([]);
    expect(parsesCleanly("example.ts", "const x = 1;\n")).toBe(true);
    expect(parsesCleanly("example.ts", "const x = 1;\n")).toBe(true);
  });

  it("resolves a clean selected block despite unrelated root errors, while whole-file checks stay strict", async () => {
    expect.hasAssertions();
    await initializeSyntax();
    const text = "function good() {\n  return 1;\n}\nconst = ;\n";

    expect(resolveTreeSitterBlock({ line: 1, path: "example.ts", text })).toEqual({
      start: 1,
      end: 3,
    });
    expect(resolveTreeSitterBlock({ line: 4, path: "example.ts", text })).toBeNull();
    expect(parsesCleanly("example.ts", text)).toBe(false);
    expect(enclosingBoundaries(text.split("\n"), "example.ts", 1, 2)).toEqual([]);
  });

  it.each([
    ["example.html", "<div>\n  <span>x</span>\n</div>\n", { start: 1, end: 3 }],
    ["example.js", "function f() {\n  return 1;\n}\n", { start: 1, end: 3 }],
    ["example.cjs", "function f() {\n  return 1;\n}\n", { start: 1, end: 3 }],
    ["example.jsx", "function F() {\n  return <div />;\n}\n", { start: 1, end: 3 }],
    ["example.ts", "function f() {\n  return 1;\n}\n", { start: 1, end: 3 }],
    ["example.tsx", "function F() {\n  return <div />;\n}\n", { start: 1, end: 3 }],
    ["example.css", ".x {\n  color: red;\n}\n", { start: 1, end: 3 }],
    ["example.sh", "f() {\n  echo x\n}\n", { start: 1, end: 3 }],
    ["example.go", "func f() {\n  return\n}\n", { start: 1, end: 3 }],
    ["example.rs", "fn f() {\n}\n", { start: 1, end: 2 }],
    ["example.py", "def f():\n  return 1\n", { start: 1, end: 2 }],
    ["example.json", '{\n  "value": 1\n}\n', { start: 1, end: 3 }],
    ["example.md", "# Heading\n\nbody\n", { start: 1, end: 3 }],
    ["example.yaml", "key:\n  value: text\n", { start: 1, end: 2 }],
  ])("resolves accepted grammar blocks for %s", async (path, text, expected) => {
    expect.hasAssertions();
    await initializeSyntax();
    expect(resolveTreeSitterBlock({ line: 1, path, text })).toEqual(expected);
    expect(parsesCleanly(path, text)).toBe(true);
  });

  it.each([
    ["example.html", "<div>\n  <span>x</span>\n</div>\n", [3]],
    ["example.js", "function f() {\n  return 1;\n}\n", [3]],
    ["example.cjs", "function f() {\n  return 1;\n}\n", [3]],
    ["example.jsx", "function F() {\n  return <div />;\n}\n", [3]],
    ["example.ts", "function f() {\n  return 1;\n}\n", [3]],
    ["example.tsx", "function F() {\n  return <div />;\n}\n", [3]],
    ["example.css", ".x {\n  color: red;\n}\n", [3]],
    ["example.sh", "f() {\n  echo x\n}\n", [3]],
    ["example.go", "func f() {\n  return\n}\n", [3]],
    ["example.rs", "fn f() {\n  let x = 1;\n}\n", [3]],
    ["example.py", "def f():\n  return 1\n", [2]],
    ["example.json", '{\n  "value": {\n    "nested": 1\n  }\n}\n', [5]],
    ["example.md", "# Heading\n\nbody\n", [3]],
    ["example.yaml", "key:\n  value:\n    nested: text\n", [3]],
  ])("finds exact enclosing boundaries for %s", async (path, text, expected) => {
    expect.hasAssertions();
    await initializeSyntax();
    expect(enclosingBoundaries(text.split("\n"), path, 1, 1)).toEqual(expected);
  });
});
