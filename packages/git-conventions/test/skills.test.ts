import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");

describe("git convention skills", () => {
  it.each(["conventional-commit", "git-rebase-base"])("ships the %s skill", async (name) => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", name, "SKILL.md"), "utf8");
    expect(skill).toContain(`name: ${name}`);
  });

  it("grounds Conventional Commits in the staged change and explicit authorization", async () => {
    expect.hasAssertions();
    const skill = await readFile(
      join(PACKAGE_ROOT, "skills", "conventional-commit", "SKILL.md"),
      "utf8",
    );
    expect(skill).not.toContain("TODO");
    expect(skill).toContain("AGENTS.md");
    expect(skill).toContain("git diff --cached");
    expect(skill).toContain("Never run `git add -A`");
    expect(skill).toContain("explicitly requests the commit");
    expect(skill).toContain("breaking-change marker");
    expect(skill).toContain("repository-provided commit validation");
    expect(skill).toContain("Never push");
  });

  it("suggests repository-aware branch names without inventing a standard", async () => {
    expect.hasAssertions();
    const skill = await readFile(
      join(PACKAGE_ROOT, "skills", "conventional-commit", "SKILL.md"),
      "utf8",
    );
    expect(skill).toContain("Branch naming is not part of Conventional Commits");
    expect(skill).toContain("`<type>/<kebab-slug>`");
    expect(skill).toContain("git check-ref-format --branch");
    expect(skill).toContain("Never create or rename a branch");
  });

  it("rebases only a clean branch onto a verified origin base", async () => {
    expect.hasAssertions();
    const skill = await readFile(
      join(PACKAGE_ROOT, "skills", "git-rebase-base", "SKILL.md"),
      "utf8",
    );
    expect(skill).not.toContain("TODO");
    expect(skill).toContain("Git does not record");
    expect(skill).toContain("explicit base");
    expect(skill).toContain("git status --short");
    expect(skill).toContain("Never use `--autostash`");
    expect(skill).toContain("git fetch origin");
    expect(skill).toContain("git rebase origin/$base");
    expect(skill).toContain("git merge-base --is-ancestor");
    expect(skill).toContain("conflict");
    expect(skill).toContain("Never push");
  });
});
