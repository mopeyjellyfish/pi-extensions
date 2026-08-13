import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");

const read = (path: string) => readFile(join(PACKAGE_ROOT, path), "utf8");

describe("engineering resources", () => {
  it("composes /work with public-seam TDD and evidence-based engineering practices", async () => {
    expect.hasAssertions();
    const [work, tdd, practices, prompt] = await Promise.all([
      read("skills/work/SKILL.md"),
      read("skills/test-driven-development/SKILL.md"),
      read("skills/engineering-practices/SKILL.md"),
      read("prompts/work.md"),
    ]);

    expect(work).toMatch(
      /approved slice[\s\S]*explicit bounded request[\s\S]*confirmed bug outcome/iu,
    );
    expect(work).toMatch(
      /repository instructions[\s\S]*Git state[\s\S]*public contracts[\s\S]*authority/iu,
    );
    expect(work).toMatch(/Git aggregate[\s\S]*pi-subagents[\s\S]*Blocked prerequisite/iu);
    expect(work).toMatch(/parent only when[\s\S]*sequential[\s\S]*low-risk/iu);
    expect(work).toMatch(/locally\s+understandable[\s\S]*cheap to validate/iu);
    expect(work).toMatch(/`test-driven-development`[\s\S]*`engineering-practices`/iu);

    expect(tdd).toMatch(
      /accepted\s+request[\s\S]*accepted pitch[\s\S]*accepted plan[\s\S]*seam approval/iu,
    );
    expect(tdd).toMatch(/public seam[\s\S]*fails? for the intended[\s\S]*minimum[\s\S]*pass/iu);
    expect(tdd).toMatch(/repeat[\s\S]*vertically/iu);
    expect(tdd).toMatch(/independent\s+expected value/iu);
    expect(tdd).toMatch(/process[\s\S]*filesystem[\s\S]*network[\s\S]*UI/iu);
    expect(tdd).toMatch(/pure refactor[\s\S]*existing tests[\s\S]*focused validation/iu);
    expect(tdd).toMatch(/documentation[\s\S]*metadata[\s\S]*mechanical[\s\S]*focused validation/iu);

    expect(practices).toMatch(
      /repository\s+helper[\s\S]*standard library[\s\S]*native\s+platform[\s\S]*installed dependency/iu,
    );
    expect(practices).toMatch(/same current rule[\s\S]*change together/iu);
    expect(practices).toMatch(/coherent policy or capability[\s\S]*reasons?\s+to change/iu);
    expect(practices).toMatch(/substitution[\s\S]*public-seam behavior tests/iu);
    expect(practices).toMatch(/dependency injection[\s\S]*volatile or external boundary/iu);
    expect(practices).toMatch(/small public interface[\s\S]*hides substantial behavior/iu);
    expect(practices).toMatch(/nearest `?CONTEXT\.md`?/iu);
    expect(practices).toMatch(
      /validation[\s\S]*cancellation[\s\S]*failures[\s\S]*cleanup[\s\S]*trust boundaries/iu,
    );
    expect(practices).toMatch(
      /concrete[\s\S]*(duplicated rule|shallow layer|broken public contract)/iu,
    );

    expect(prompt).toContain("Use the `work` skill.");
  });

  it("selects the bug executor before diagnosis and retains one writer through repair", async () => {
    expect.hasAssertions();
    const work = await read("skills/work/SKILL.md");

    expect(work).toMatch(
      /select (?:the )?(?:direct|parent)[\s\S]*(?:retained|writer)[\s\S]*before[\s\S]*`diagnosing-bugs`/iu,
    );
    expect(work).toMatch(
      /selected executor[\s\S]*reproduction[\s\S]*caller[\s\S]*sibling[\s\S]*root-cause repair[\s\S]*regression test[\s\S]*first red/iu,
    );
    expect(work).toMatch(
      /one retained `worker` with `context: "fresh"`[\s\S]*exclusive (?:active )?writer lease/iu,
    );
    expect(work).toMatch(
      /Sol `medium`[\s\S]*Sol `high`[\s\S]*security[\s\S]*data loss[\s\S]*concurrency[\s\S]*lifecycle[\s\S]*migration[\s\S]*public API[\s\S]*protocol[\s\S]*provider transport[\s\S]*cross-package[\s\S]*nondeterministic[\s\S]*expensive or unclear validation/iu,
    );
    expect(work).toMatch(/fresh Sol `high` reviewer/iu);
    expect(work).toContain('runs.run(key, { resume: "<run-id>", task: "follow-up" })');
    expect(work).toMatch(/latest returned `runId`[\s\S]*routine/iu);
    expect(work).toMatch(/decision-level\s+finding[\s\S]*writer lease[\s\S]*parent/iu);
    expect(work).toMatch(/`invalidated contract` state\s+is ineligible for direct execution/iu);
    expect(work).toMatch(/launch one new retained `worker` with\s+`context: "fresh"`/iu);
    expect(work).toMatch(/parent[\s\S]*final verification[\s\S]*delivery/iu);
  });

  it("ships the quality-first workflow, focused skills, and expandable prompts", async () => {
    expect.hasAssertions();
    const [developing, bug, domain, review, develop, diagnose, model, change] = await Promise.all([
      read("skills/developing-changes/SKILL.md"),
      read("skills/diagnosing-bugs/SKILL.md"),
      read("skills/domain-modeling/SKILL.md"),
      read("skills/reviewing-changes/SKILL.md"),
      read("prompts/develop.md"),
      read("prompts/diagnose.md"),
      read("prompts/model-domain.md"),
      read("prompts/review-change.md"),
    ]);

    expect(developing).toMatch(/Git aggregate[\s\S]*pi-subagents/iu);
    expect(developing).toMatch(/Blocked prerequisite[\s\S]*pi install npm:pi-subagents/iu);
    expect(developing).toMatch(/unresolved product intent[\s\S]*`shape`/iu);
    expect(developing).toMatch(/accepted non-trivial intent[\s\S]*`planning-changes`/iu);
    expect(developing).toMatch(
      /accepted current slice[\s\S]*bounded small fix[\s\S]*bug or unexplained\s+regression[\s\S]*refactor[\s\S]*documentation[\s\S]*metadata[\s\S]*mechanical[\s\S]*`work`/iu,
    );
    expect(developing).toMatch(
      /bug[\s\S]*`work`[\s\S]*selects the executor[\s\S]*before[\s\S]*`diagnosing-bugs`/iu,
    );
    expect(developing).toMatch(
      /QA-only[\s\S]*fresh read-only `qa`[\s\S]*Luna\s+`medium`[\s\S]*one-shot[\s\S]*ephemeral/iu,
    );
    expect(developing).toMatch(/QA never[^.]*formal\s+review/iu);
    expect(developing).toMatch(/review-only[\s\S]*fresh `reviewer`[\s\S]*`reviewing-changes`/iu);
    expect(developing).toMatch(
      /parent[\s\S]*route choice[\s\S]*final verification[\s\S]*delivery/iu,
    );
    for (const copiedPolicy of [
      'context: "fresh"',
      "runs.run",
      "latest returned `runId`",
      "Sol `medium`",
      "Sol `high`",
      "public-seam",
      "red and green",
      "routine implementation defect",
    ]) {
      expect(developing).not.toContain(copiedPolicy);
    }
    expect(bug).toMatch(/reproduce|observable feedback loop/iu);
    expect(bug).toMatch(/shared root cause/iu);
    expect(bug).toMatch(/nondeterministic|unreproducible/iu);
    expect(domain).toMatch(/nearest `?CONTEXT\.md`?/iu);
    expect(domain).toMatch(/each concept one\s+term|one term per concept/iu);
    expect(domain).toMatch(/ADR/iu);
    expect(review).toMatch(/spec|intent/iu);
    expect(review).toMatch(/engineering standards/iu);
    expect(review).toMatch(/make no\s+edits|no edits/iu);
    expect(develop).toContain("Use the `developing-changes` skill.");
    expect(diagnose).toContain("Use the `diagnosing-bugs` skill.");
    expect(model).toContain("Use the `domain-modeling` skill.");
    expect(change).toContain("Use the `reviewing-changes` skill.");

    const piPromptTemplates = (await import(
      pathToFileURL(
        join(
          REPOSITORY_ROOT,
          "node_modules",
          "@earendil-works",
          "pi-coding-agent",
          "dist",
          "core",
          "prompt-templates.js",
        ),
      ).href
    )) as {
      loadPromptTemplates(options: {
        cwd: string;
        agentDir: string;
        promptPaths: string[];
        includeDefaults: boolean;
      }): { name: string; content: string }[];
      expandPromptTemplate(text: string, templates: { name: string; content: string }[]): string;
    };
    const templates = piPromptTemplates.loadPromptTemplates({
      cwd: PACKAGE_ROOT,
      agentDir: PACKAGE_ROOT,
      promptPaths: [join(PACKAGE_ROOT, "prompts")],
      includeDefaults: false,
    });

    expect(piPromptTemplates.expandPromptTemplate("/develop", templates)).toContain(
      "Ask the user for the code change or QA outcome to deliver",
    );
    expect(piPromptTemplates.expandPromptTemplate("/work", templates)).toContain(
      "Ask for an approved slice, bounded request, or confirmed bug outcome",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/work tighten retry limit", templates),
    ).toContain("tighten retry limit");
    expect(
      piPromptTemplates.expandPromptTemplate("/develop fix upload retries", templates),
    ).toContain("fix upload retries");
    expect(piPromptTemplates.expandPromptTemplate("/diagnose", templates)).toContain(
      "Ask for the smallest observable symptom",
    );
    expect(piPromptTemplates.expandPromptTemplate("/model-domain", templates)).toContain(
      "Start by finding the nearest CONTEXT.md",
    );
    expect(piPromptTemplates.expandPromptTemplate("/review-change", templates)).toContain(
      "Ask for the review fixed point",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/diagnose login fails after refresh", templates),
    ).toContain("login fails after refresh");
  });

  it("declares only skills and prompts and packs their resources", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await read("package.json")) as {
      files: string[];
      pi: Record<string, string[]>;
      peerDependencies?: unknown;
      dependencies?: unknown;
    };
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: join(PACKAGE_ROOT, "..", ".."),
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const paths = packed[0]?.files.map(({ path }) => path) ?? [];

    expect(manifest.pi).toEqual({ skills: ["./skills"], prompts: ["./prompts"] });
    expect(manifest.peerDependencies).toBeUndefined();
    expect(manifest.dependencies).toBeUndefined();
    expect(paths).toEqual(
      expect.arrayContaining([
        "skills/developing-changes/SKILL.md",
        "skills/diagnosing-bugs/SKILL.md",
        "skills/domain-modeling/SKILL.md",
        "skills/reviewing-changes/SKILL.md",
        "skills/work/SKILL.md",
        "skills/test-driven-development/SKILL.md",
        "skills/engineering-practices/SKILL.md",
        "prompts/develop.md",
        "prompts/work.md",
        "prompts/diagnose.md",
        "prompts/model-domain.md",
        "prompts/review-change.md",
      ]),
    );
  });
});
