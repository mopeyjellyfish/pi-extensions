import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const execFileAsync = promisify(execFile);

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

  it("plans safe atomic commit splits before staging", async () => {
    expect.hasAssertions();
    const [skill, readme] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "skills", "conventional-commit", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
    ]);

    expect(readme).toMatch(/atomic[^.]*Conventional Commit/iu);
    expect(skill).toContain("## Plan an atomic split");
    expect(skill).toContain("git diff --cached --quiet");
    const stageSection = skill.slice(
      skill.indexOf("## Stage one approved unit"),
      skill.indexOf("## Draft the message"),
    );
    expect(stageSection.indexOf("git diff --cached --quiet")).toBeGreaterThanOrEqual(0);
    expect(stageSection.indexOf("git diff --cached --quiet")).toBeLessThan(
      stageSection.indexOf("Stage only explicit paths"),
    );
    expect(skill).toContain("git status --short --untracked-files=all");
    expect(skill).toMatch(/inspect each untracked file/iu);
    expect(skill).toMatch(/staged or partially staged[^.]*stop/iu);
    expect(skill).toMatch(/overlap[^.]*dependency cycle[^.]*before staging/iu);
    expect(skill).toMatch(/lockfile[^.]*semantic grouping/iu);
    expect(skill).toMatch(/shared lockfile[^.]*one unit/iu);
    expect(skill).toMatch(/explicit paths or approved hunks/iu);
    expect(skill.match(/git write-tree/gu)).toHaveLength(2);
    expect(skill).toContain("HEAD^{tree}");
    expect(skill).toMatch(/validate the actual `HEAD` message/iu);
    expect(skill).toMatch(/sequential lockfile regeneration is the narrow\s+exception/iu);
    expect(skill).toContain("Do not use `git commit-tree`");
    expect(skill).toMatch(/report the commit hash[^.]*stop/iu);
    expect(skill).toMatch(/Do not amend, reset, revert, or replace/iu);
    expect(skill).toMatch(/source behavior[^.]*headline/iu);
  });

  it("detects intent-to-add entries before staging a split", async () => {
    expect.hasAssertions();
    const skill = await readFile(
      join(PACKAGE_ROOT, "skills", "conventional-commit", "SKILL.md"),
      "utf8",
    );
    expect(skill.match(/git diff --cached --quiet --ita-visible-in-index/gu)).toHaveLength(2);

    const repository = await mkdtemp(join(tmpdir(), "pi-git-conventions-"));
    const git = (...arguments_: string[]) => execFileAsync("git", arguments_, { cwd: repository });
    try {
      await git("init", "--quiet");
      await expect(
        git("diff", "--cached", "--quiet", "--ita-visible-in-index"),
      ).resolves.toBeDefined();
      await writeFile(join(repository, "pending.txt"), "pending\n", "utf8");
      await git("add", "--intent-to-add", "pending.txt");
      await expect(
        git("diff", "--cached", "--quiet", "--ita-visible-in-index"),
      ).rejects.toMatchObject({ code: 1 });
    } finally {
      await rm(repository, { force: true, recursive: true });
    }
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
