import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const SKILL_ROOT = join(PACKAGE_ROOT, "skills", "github-cli");

async function readSkillFile(path: string): Promise<string> {
  return readFile(join(SKILL_ROOT, path), "utf8");
}

describe("GitHub CLI skill", () => {
  it("is distributed as a skill-only Pi package", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await readFile(join(PACKAGE_ROOT, "package.json"), "utf8")) as {
      dependencies?: unknown;
      peerDependencies?: unknown;
      pi?: { extensions?: unknown; skills?: string[] };
    };

    expect(manifest.pi?.skills).toEqual(["./skills"]);
    expect(manifest.pi?.extensions).toBeUndefined();
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.peerDependencies).toBeUndefined();
  });

  it("ships a compact routing skill with focused references", async () => {
    expect.hasAssertions();
    const skill = await readSkillFile("SKILL.md");

    expect(skill).toContain("name: github-cli");
    expect(skill).toContain("gh CLI");
    expect(skill).toContain("references/pull-requests.md");
    expect(skill).toContain("references/actions.md");
    expect(skill).toContain("references/issues.md");
    expect(skill).toContain("references/repositories.md");
    expect(skill).toContain("Read only the reference");
    expect(skill.split("\n").length).toBeLessThan(140);
  });

  it("requires authenticated, bounded, repository-aware gh usage", async () => {
    expect.hasAssertions();
    const skill = await readSkillFile("SKILL.md");

    expect(skill).toContain("gh auth status");
    expect(skill).toContain("gh repo view");
    expect(skill).toContain("--json");
    expect(skill).toContain("--jq");
    expect(skill).toContain("--limit");
    expect(skill).toContain("Never print credentials");
    expect(skill).toContain("explicitly requested");
    expect(skill).toContain("untrusted");
  });

  it("covers pull request creation, all comment surfaces, and safe commenting", async () => {
    expect.hasAssertions();
    const reference = await readSkillFile("references/pull-requests.md");

    expect(reference).toContain("gh pr create");
    expect(reference).toContain("gh pr view");
    expect(reference).toContain("comments,reviews");
    expect(reference).toContain("reviewThreads");
    expect(reference).toContain('pr_number="$(gh pr view');
    expect(reference).toContain('-F number="$pr_number"');
    expect(reference).toContain("100-comments-per-thread");
    expect(reference).toContain("gh pr comment");
    expect(reference).toContain("--body-file");
    expect(reference).toContain("gh pr checks");
    expect(reference).toContain("current branch");
  });

  it("covers bounded GitHub Actions status and failure inspection", async () => {
    expect.hasAssertions();
    const reference = await readSkillFile("references/actions.md");

    expect(reference).toContain("gh run list");
    expect(reference).toContain("gh run view");
    expect(reference).toContain("--log-failed");
    expect(reference).toContain("gh run watch");
    expect(reference).toContain("gh run rerun");
    expect(reference).toContain("external checks");
  });

  it("covers common issue and label operations", async () => {
    expect.hasAssertions();
    const reference = await readSkillFile("references/issues.md");

    expect(reference).toContain("gh issue list");
    expect(reference).toContain("gh issue view");
    expect(reference).toContain("gh issue create");
    expect(reference).toContain("gh issue comment");
    expect(reference).toContain("gh issue edit");
    expect(reference).toContain("gh issue close");
    expect(reference).toContain("gh label");
    expect(reference).toContain("--body-file");
  });

  it("covers common repository, search, release, and API fallbacks", async () => {
    expect.hasAssertions();
    const reference = await readSkillFile("references/repositories.md");

    expect(reference).toContain("gh repo view");
    expect(reference).toContain("gh repo clone");
    expect(reference).toContain("gh search");
    expect(reference).toContain("gh release");
    expect(reference).toContain("--json tagName,name,isDraft,isPrerelease,publishedAt");
    expect(reference).not.toContain(`gh release list \\
  --limit 20 \\
  --json tagName,name,isDraft,isPrerelease,publishedAt,url`);
    expect(reference).toContain("gh api");
    expect(reference).toContain("gh help");
  });
});
