import { describe, expect, it } from "vitest";

import { routeBashCommand, routeOptionalPath, routePath } from "../src/routing.ts";

const MAIN_PATH = "/projects/example";
const ACTIVE_PATH = "/projects/example-feature";

describe("Pi worktree routing", () => {
  it("moves relative and main-worktree paths into the active Worktrunk worktree", () => {
    expect.hasAssertions();

    expect(routePath("src/index.ts", MAIN_PATH, ACTIVE_PATH)).toBe(
      "/projects/example-feature/src/index.ts",
    );
    expect(routePath("@/projects/example/src/index.ts", MAIN_PATH, ACTIVE_PATH)).toBe(
      "/projects/example-feature/src/index.ts",
    );
    expect(routePath("/outside/example.txt", MAIN_PATH, ACTIVE_PATH)).toBe("/outside/example.txt");

    const input: Record<string, unknown> = { path: "README.md" };
    routeOptionalPath(input, MAIN_PATH, ACTIVE_PATH);
    expect(input).toEqual({ path: "/projects/example-feature/README.md" });
  });

  it("prefixes agent Bash once with a POSIX-safe active-worktree cd", () => {
    expect.hasAssertions();
    const activePath = "/projects/owner's example";
    const routed = routeBashCommand("git status --short", activePath);

    expect(routed).toBe("cd -- '/projects/owner'\"'\"'s example' && git status --short");
    expect(routeBashCommand(routed, activePath)).toBe(routed);
  });
});
