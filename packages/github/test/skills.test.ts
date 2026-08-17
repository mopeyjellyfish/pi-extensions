import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const SKILL_ROOT = join(PACKAGE_ROOT, "skills", "github-cli");

async function readSkillFile(path: string): Promise<string> {
  return readFile(join(SKILL_ROOT, path), "utf8");
}

async function readResource(skill: string): Promise<string> {
  return readFile(join(PACKAGE_ROOT, "skills", skill, "SKILL.md"), "utf8");
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
    expect(reference).toContain("mutation ResolveReviewThread($threadId:ID!)");
    expect(reference).toContain("resolveReviewThread(input:{threadId:$threadId})");
    expect(reference).toContain("node(id:$threadId)");
    expect(reference).toContain("comments: [.comments.nodes[]");
    expect(reference).toContain('pr_number="$(gh pr view');
    expect(reference).toContain('-F number="$pr_number"');
    expect(reference).toContain("100-comments-per-thread");
    expect(reference).toContain("gh pr comment");
    expect(reference).toContain("--body-file");
    expect(reference).toContain("gh pr checks");
    expect(reference).toContain("current branch");
  });

  it("ships open-pr with bounded standalone and stacked publication", async () => {
    expect.hasAssertions();
    const skill = await readResource("open-pr");

    expect(skill).toContain("name: open-pr");
    expect(skill).toContain("github-cli");
    expect(skill).toContain("gh auth status");
    expect(skill).toContain("gh repo view");
    expect(skill).toContain("explicit base and head");
    expect(skill).toContain("git push -u origin");
    expect(skill).toContain("git log");
    expect(skill).toContain("git diff");
    expect(skill).toContain("gh pr checks");
    expect(skill).toContain("Problem");
    expect(skill).toContain("Outcome");
    expect(skill).toContain("Important implementation details");
    expect(skill).toContain("Tests and evidence");
    expect(skill).toContain("Risks");
    expect(skill).toContain("Stack position and dependencies");
    expect(skill).toContain("--body-file");
    expect(skill).toContain("gh stack --version");
    expect(skill).toContain("gh extension install github/gh-stack");
    expect(skill).toMatch(/Never fall back from a planned\s+stack to `gh pr create`/u);
    expect(skill).toContain("gh stack link --base <trunk> <bottom> ... <top>");
    expect(skill).toContain("Branch arguments to `gh stack link` implicitly push");
    expect(skill).toMatch(/Every branch\s+argument must be an approved named branch/u);
    expect(skill).toContain("prefer reviewed PR URLs or PR numbers");
    expect(skill).toContain("gh stack submit");
    expect(skill).toContain("gh stack sync");
    expect(skill).toContain("git push --atomic origin");
    expect(skill).toContain("--force-with-lease=<branch>:<expected-SHA>");
    expect(skill).toContain(
      "Supply one exact `--force-with-lease=<branch>:<expected-SHA>` per approved",
    );
    expect(skill).toMatch(/Do\s+not run a second push after `gh stack sync`/u);
    expect(skill).toContain("link/sync output");
    expect(skill).toContain("structured PR metadata");
    expect(skill).toContain("gh stack view --json");
    expect(skill).toContain("git merge-base --is-ancestor");
    expect(skill).toContain("git rev-list --count");
    expect(skill).toContain("Worktrunk");
    expect(skill).toMatch(/generated metadata differs from the\s+reviewed title or body/u);
    expect(skill).toMatch(/Verification cannot complete until generated\s+metadata matches/u);
    expect(skill).toContain("gh pr edit");
    expect(skill).toContain("--body-file");
    expect(skill).toContain("`gh stack submit` opens an editor by default");
    expect(skill).toMatch(/both `gh stack submit` and `gh stack link`[\s\S]*`--open` flag/iu);
    expect(skill).toContain("Never use `--open` without explicit ready authority");
    expect(skill).toContain("gh pr ready");
    expect(skill).toContain("Never run `gh stack merge`");
    expect(skill).toMatch(/Never\s+run `gh stack unstack`/u);
    expect(skill).toContain("Never merge");
    expect(skill).toContain("bounded recovery");
    expect(skill).toContain("one-commit review units");
  });

  it("ships triage with bounded feedback collection and verified resolution", async () => {
    expect.hasAssertions();
    const [skill, readme] = await Promise.all([
      readResource("triage"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
    ]);

    expect(skill).toContain("name: triage");
    expect(readme).toContain("@mopeyjellyfish/pi-engineering");
    expect(readme).toContain("@mopeyjellyfish/pi-git-conventions");
    expect(skill).toContain("github-cli");
    expect(skill).toContain("explicit pull request");
    expect(skill).toContain("current branch");
    expect(skill).toContain("conversation context");
    expect(skill).toContain("comments,reviews");
    expect(skill).toContain("gh pr checks");
    expect(skill).toContain("reviewThreads(first:100)");
    expect(skill).toContain("actionable");
    expect(skill).toContain("invalid");
    expect(skill).toContain("obsolete");
    expect(skill).toContain("duplicate");
    expect(skill).toContain("question-only");
    expect(skill).toMatch(/`implement`[\s\S]*then `commit`[\s\S]*then `open-pr`/iu);
    expect(skill).toMatch(/implement, commit, or open-pr is\s+unavailable/iu);
    expect(skill).toContain("inventory and recovery evidence");
    expect(skill).toContain("Draft");
    expect(skill).toContain("addressed and verified");
    expect(skill).toContain("resolveReviewThread");
    expect(skill).toContain("Use the shared bounded mutation and");
    expect(skill).toContain("Never infer approval");
    expect(skill).toContain("Never merge");
    expect(skill).toContain("No destructive action");
  });

  it("publishes stable delivery units and diagnoses failures before one correction", async () => {
    expect.hasAssertions();
    const [openPr, triage, actions, readme] = await Promise.all([
      readResource("open-pr"),
      readResource("triage"),
      readSkillFile("references/actions.md"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
    ]);

    expect(openPr).toMatch(/standalone[^.]*one coherent delivery unit[^.]*default/iu);
    expect(openPr).toMatch(/standalone pull request[^.]*multiple verified atomic commits/iu);
    expect(openPr).toMatch(/one-commit review units/iu);
    expect(openPr).toMatch(
      /independent value[\s\S]*check\s+viability[\s\S]*integration[\s\S]*fan-out[\s\S]*cascade/iu,
    );
    expect(openPr).toMatch(/batch[\s\S]*stable delivery unit/iu);
    expect(openPr).toMatch(
      /one corrective action[\s\S]*configuration[\s\S]*triggering\s+event[\s\S]*current\s+state[\s\S]*bounded logs/iu,
    );
    expect(openPr).toMatch(/do not blindly rerun/iu);
    expect(openPr).toMatch(/materially exceeds[\s\S]*forecast[\s\S]*pause[\s\S]*report/iu);
    expect(triage).toMatch(
      /configuration[\s\S]*triggering event[\s\S]*current state[\s\S]*bounded logs/iu,
    );
    expect(actions).toMatch(
      /configuration[\s\S]*triggering\s+event[\s\S]*current state[\s\S]*bounded logs/iu,
    );
    expect(readme).toMatch(/one coherent delivery unit[\s\S]*multiple verified atomic commits/iu);

    for (const resource of [openPr, triage]) {
      expect(resource).not.toMatch(
        /pi-extensions|packages\/|npm (?:run|test)|\bFable\b|\bSol\b|GPT-\d|Opus/iu,
      );
      expect(resource).not.toMatch(/\/(?:Users|home|tmp)\//u);
    }
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
