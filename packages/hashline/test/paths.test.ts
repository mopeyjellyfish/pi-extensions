import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { absolutePath, normalizePiPath, resolvePiReadPath } from "../src/paths.ts";

describe("Pi-compatible path normalization", () => {
  it.each([
    ["~", "/home/pi"],
    ["~/a.txt", "/home/pi/a.txt"],
    ["@src/a.ts", "src/a.ts"],
    ["file:///tmp/a.ts", "/tmp/a.ts"],
    ["a\u{A0}b.txt", "a b.txt"],
    ["plain.txt", "plain.txt"],
    ["/mnt/c/x", "/mnt/c/x"],
  ])("normalizes POSIX path %s", (input, expected) => {
    expect.hasAssertions();
    expect(normalizePiPath(input, "linux", "/home/pi")).toBe(expected);
  });

  it.each([
    ["/c/work/x", "C:\\work\\x"],
    ["/mnt/c/x", "C:\\x"],
    ["/cygdrive/d/y", "D:\\y"],
    ["/c", "C:\\"],
    ["~\\a.txt", "C:\\Users\\pi\\a.txt"],
    ["//server/share", "//server/share"],
    ["/c\\work", "/c\\work"],
    ["/notadrive/x", "/notadrive/x"],
  ])("normalizes Windows path %s", (input, expected) => {
    expect.hasAssertions();
    expect(normalizePiPath(input, "win32", "C:\\Users\\pi")).toBe(expected);
  });

  it("resolves relative and absolute normalized paths against cwd", () => {
    expect.hasAssertions();
    expect(absolutePath("relative.txt", "/workspace")).toBe(resolve("/workspace/relative.txt"));
    expect(absolutePath("/tmp/absolute.txt", "/workspace")).toBe(resolve("/tmp/absolute.txt"));
  });

  it.each([
    ["plain.txt", "/workspace/plain.txt"],
    ["Capture 1 PM.txt", "/workspace/Capture 1\u{202F}PM.txt"],
    ["café.txt", "/workspace/cafe\u{301}.txt"],
    ["user's.txt", "/workspace/user’s.txt"],
    ["café's.txt", "/workspace/cafe\u{301}’s.txt"],
    ["missing.txt", undefined],
  ])("resolves built-in read variant for %s", (input, existing) => {
    expect.hasAssertions();
    expect(resolvePiReadPath(input, "/workspace", (candidate) => candidate === existing)).toBe(
      existing ?? `/workspace/${input}`,
    );
  });
});
