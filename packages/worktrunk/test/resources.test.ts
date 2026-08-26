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

  it("keeps bulk cleanup guidance aligned across the README and skill", async () => {
    expect.hasAssertions();
    const [skill, readme] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "skills", "pi-worktrunk", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
    ]);

    for (const resource of [skill, readme]) {
      const prose = resource.replaceAll(/\s+/gu, " ");
      expect.soft(prose).toMatch(/cleanup[^.]*preview/iu);
      expect.soft(prose).toMatch(/exact (?:preview )?fingerprint/iu);
      expect.soft(prose).toMatch(/explicit approval|confirmation/iu);
      expect.soft(prose).toMatch(/main[^.]*current[^.]*dirty[^.]*open/iu);
      expect.soft(prose).toMatch(/preserv(?:e|es)[^.]*branches/iu);
      expect.soft(prose).toMatch(/gh[^.]*optional/iu);
      expect.soft(prose).toMatch(/never uses? force/iu);
      expect.soft(prose).toMatch(/(?:never uses?|no) `?--reap`?/iu);
      expect.soft(prose).toMatch(/removed[^.]*changed[^.]*skipped[^.]*failed/iu);
      expect.soft(prose).toMatch(/20[^.]*list|list[^.]*20/iu);
      expect.soft(prose).toMatch(/100[^.]*cleanup|cleanup[^.]*100/iu);
    }
  });
});
