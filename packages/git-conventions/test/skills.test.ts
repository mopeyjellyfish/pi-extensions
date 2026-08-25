import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const execFileAsync = promisify(execFile);

describe("git convention skills", () => {
  it.each(["commit", "git-rebase-base", "resolving-merge-conflicts"])(
    "ships the %s skill",
    async (name) => {
      expect.hasAssertions();
      const skill = await readFile(join(PACKAGE_ROOT, "skills", name, "SKILL.md"), "utf8");
      expect(skill).toContain(`name: ${name}`);
    },
  );

  it("removes the replaced conventional-commit skill", async () => {
    expect.hasAssertions();
    for (const path of ["SKILL.md", join("agents", "openai.yaml")]) {
      await expect(
        readFile(join(PACKAGE_ROOT, "skills", "conventional-commit", path), "utf8"),
      ).rejects.toMatchObject({ code: "ENOENT" });
    }
  });

  it("grounds Conventional Commits in the staged change and explicit authorization", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "commit", "SKILL.md"), "utf8");
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
      readFile(join(PACKAGE_ROOT, "skills", "commit", "SKILL.md"), "utf8"),
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
    expect(skill.match(/git write-tree/gu)?.length).toBeGreaterThanOrEqual(2);
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
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "commit", "SKILL.md"), "utf8");
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

  it("keeps commit topology local and excludes pull-request publication", async () => {
    expect.hasAssertions();
    const [skill, readme, metadata] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "skills", "commit", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "commit", "agents", "openai.yaml"), "utf8"),
    ]);

    expect(skill).not.toMatch(/gh (?:stack|pr)\b/iu);
    expect(skill).not.toMatch(/pull[ -]request/iu);
    expect(skill).not.toMatch(/git push|--force-with-lease/iu);
    expect(readme).not.toContain("`gh stack`");
    expect(metadata).not.toMatch(/stacked pull requests|publish/iu);
    expect(metadata).toContain("$commit");
    expect(skill).toContain('git switch -c "$next" "$lower"');
    expect(skill).toMatch(/explicit authority[^.]*named branch creation/iu);
    expect(skill).toContain("git merge-base --is-ancestor");
    expect(skill).toContain("git rev-list --count");
    expect(skill).toMatch(/branch directly below/iu);
    expect(skill).toMatch(/one logical unit[^.]*branch/iu);
    expect(skill).toMatch(/new\s+worktree[\s\S]*does not inherit[\s\S]*dirty changes/iu);
    expect(skill).toMatch(/mixed\s+changes[\s\S]*stop[\s\S]*approv[\s\S]*transfer/iu);
    expect(skill).toMatch(/Worktrunk[\s\S]*local branches/iu);
  });

  it("accepts explicit workflow-stage authority and preserves ad hoc authorization", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "commit", "SKILL.md"), "utf8");

    expect(skill).toMatch(/explicit accepted workflow-stage authority[^.]*commit authority/iu);
    expect(skill).toMatch(/ad hoc[^.]*explicitly requests the commit/iu);
  });

  it("suggests repository-aware branch names without inventing a standard", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "commit", "SKILL.md"), "utf8");
    expect(skill).toContain("Branch naming is not part of Conventional Commits");
    expect(skill).toContain("`<type>/<kebab-slug>`");
    expect(skill).toContain("git check-ref-format --branch");
    expect(skill).toContain("Never create or rename a branch");
  });

  it("ships an attributed conflict method and a bounded publication boundary", async () => {
    expect.hasAssertions();
    const [skill, rebase, notice, readme, manifest] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "skills", "resolving-merge-conflicts", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "git-rebase-base", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "THIRD_PARTY_NOTICES.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "package.json"), "utf8"),
    ]);
    const packed = JSON.parse(
      (
        await execFileAsync(
          "npm",
          ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT],
          {
            cwd: join(PACKAGE_ROOT, "..", ".."),
          },
        )
      ).stdout,
    ) as { files: { path: string }[] }[];
    const packedPaths = packed[0]?.files.map(({ path }) => path) ?? [];
    const manifestValue = JSON.parse(manifest) as { files?: unknown };

    expect(manifestValue.files).toContain("THIRD_PARTY_NOTICES.md");
    expect(packedPaths).toEqual(
      expect.arrayContaining([
        "skills/commit/SKILL.md",
        "skills/commit/agents/openai.yaml",
        "skills/resolving-merge-conflicts/SKILL.md",
        "THIRD_PARTY_NOTICES.md",
      ]),
    );
    expect(notice).toContain("068b6e0c62393147daf03530149cdce209c93da8");
    expect(notice).toContain("resolving-merge-conflicts/SKILL.md");
    expect(notice).toContain("Permission is hereby granted");
    expect(readme).toMatch(/resolving-merge-conflicts[\s\S]*intent-preserving/iu);
    expect(skill).toMatch(/resolution sections[\s\S]*in-progress merge or rebase/iu);
    expect(skill).toMatch(/publication section[\s\S]*conflict-free merge or rebase/iu);
    expect(skill).toMatch(/in-progress (?:merge|rebase)[\s\S]*recorded state/iu);
    expect(skill).toMatch(
      /commit messages[\s\S]*pull requests[\s\S]*issues[\s\S]*tests[\s\S]*accepted local intent/iu,
    );
    expect(skill).toMatch(/each hunk[\s\S]*preserve both intents[\s\S]*do not invent/iu);
    expect(skill).toMatch(/incompatible[\s\S]*ask/iu);
    expect(skill).toMatch(/repository-required[\s\S]*focused[\s\S]*completion checks/iu);
    expect(skill).toMatch(/user chooses[\s\S]*git (?:merge|rebase) --abort/iu);
    expect(skill).toMatch(/git merge --continue[\s\S]*git rebase --continue/iu);
    expect(skill).toMatch(/current[\s\S]*non-default[\s\S]*non-protected[\s\S]*origin/iu);
    expect(skill).toMatch(/```bash\nset -euo pipefail\ncurrent_branch=/u);
    expect(skill).toContain("current_branch=$(git branch --show-current)");
    expect(skill).toMatch(
      /git fetch origin[\s\S]*record[\s\S]*expected remote state[\s\S]*check/iu,
    );
    expect(skill).toContain('--force-with-lease="refs/heads/$current_branch:$expected_remote"');
    expect(skill).toMatch(/after a rebase[\s\S]*normal push[\s\S]*remote branch is absent/iu);
    expect(skill).toMatch(/remote branch exists[\s\S]*explicit[\s\S]*expected_remote/iu);
    expect(skill).toMatch(/Never use plain `--force`/iu);
    expect(skill).toMatch(
      /never push[\s\S]*tags[\s\S]*another remote[\s\S]*default[\s\S]*protected/iu,
    );
    expect(rebase).toMatch(/resolving-merge-conflicts/iu);
    expect(rebase).toMatch(/--force-with-lease/iu);
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
  it("reuses only evidence attested to the current staged tree and definitions", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "commit", "SKILL.md"), "utf8");
    expect(skill).toMatch(/verified-tree identifier[\s\S]*exact tested contents/iu);
    expect(skill).toMatch(/plain `git write-tree`[^.]*unstaged[^.]*not valid evidence/iu);
    expect(skill).toMatch(/temporary index/iu);
    expect(skill).toMatch(/complete explicit approved\s+path set/iu);
    expect(skill).toMatch(/base `HEAD`[\s\S]*command definitions[\s\S]*setup fingerprint/iu);
    expect(skill).toMatch(/stale[\s\S]*only the invalidated required checks/iu);
    expect(skill).toMatch(/all match[\s\S]*do not rerun unchanged gates/iu);
  });
});
