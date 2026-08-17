import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");

describe("Worktrunk resources", () => {
  it("treats repository-defined setup as part of activating a fresh worktree", async () => {
    expect.hasAssertions();
    const [skill, readme] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "skills", "pi-worktrunk", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
    ]);

    for (const resource of [skill, readme]) {
      const prose = resource.replaceAll(/\s+/gu, " ");
      expect.soft(prose).toMatch(/repository setup[^.]*fresh (?:linked )?worktree/iu);
      expect.soft(prose).toMatch(/ignored dependencies[^.]*generated files/iu);
      expect.soft(prose).toMatch(/repository instructions[^.]*runtime[^.]*dependencies/iu);
      expect.soft(prose).toMatch(/before[^.]*test[^.]*build[^.]*repository-defined setup/iu);
      expect.soft(prose).toMatch(/setup fails[^.]*diagnose[^.]*do not rerun/iu);
    }
  });
});
