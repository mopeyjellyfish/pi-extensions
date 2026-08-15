import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");

const read = (path: string) => readFile(join(PACKAGE_ROOT, path), "utf8");

describe("engineering resources", () => {
  it("composes /implement as the only implementation command", async () => {
    expect.hasAssertions();
    const [implement, tdd, design, prompt, skillDirectories] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("skills/test-driven-development/SKILL.md"),
      read("skills/codebase-design/SKILL.md"),
      read("prompts/implement.md"),
      readdir(join(PACKAGE_ROOT, "skills")),
    ]);

    expect(skillDirectories).toContain("implement");
    expect(skillDirectories).toContain("codebase-design");
    expect(skillDirectories).not.toContain("engineering-practices");
    expect(skillDirectories).not.toContain("work");
    expect(implement).toMatch(
      /approved slice[\s\S]*explicit bounded request[\s\S]*confirmed bug outcome/iu,
    );
    expect(implement).toContain("repository instructions");
    expect(implement).toContain("Git state");
    expect(implement).toContain("public contracts");
    expect(implement).toContain("delivery authority");
    expect(implement).toMatch(/Direct\s+parent execution[^.]*no agent package/iu);
    expect(implement).toMatch(/retained execution or requested[\s\S]*`pi-subagents`/iu);
    expect(implement).toMatch(/direct parent execution only[\s\S]*sequential[\s\S]*low-risk/iu);
    expect(implement).toMatch(/locally\s+understandable[\s\S]*cheap to validate/iu);
    expect(implement).toMatch(/`test-driven-development`[\s\S]*`codebase-design`/iu);

    expect(tdd).toMatch(
      /accepted\s+request[\s\S]*accepted pitch[\s\S]*accepted plan[\s\S]*seam approval/iu,
    );
    expect(tdd).toMatch(/observable capability[\s\S]*public interface/iu);
    expect(tdd).toMatch(/narrowest stable[\s\S]*approved seam/iu);
    expect(tdd).toMatch(/public seam[\s\S]*fails? for the intended[\s\S]*minimum[\s\S]*pass/iu);
    expect(tdd).toMatch(/refactor while green[\s\S]*vertically/iu);
    expect(tdd).toMatch(/independent\s+expected value/iu);
    expect(tdd).toMatch(/mock-call-only[\s\S]*private helper[\s\S]*implementation\s+structure/iu);
    expect(tdd).toMatch(/tautological[\s\S]*horizontal[\s\S]*imagined\s+behavior/iu);
    expect(tdd).toMatch(/process[\s\S]*filesystem[\s\S]*network[\s\S]*UI/iu);
    expect(tdd).toMatch(/pure refactor[\s\S]*existing tests[\s\S]*focused validation/iu);
    expect(tdd).toMatch(/documentation[\s\S]*metadata[\s\S]*mechanical[\s\S]*focused validation/iu);

    expect(design).toMatch(/deep module[\s\S]*small stable interface/iu);
    expect(design).toMatch(
      /hide[\s\S]*sequencing[\s\S]*representation[\s\S]*defaults[\s\S]*recoverable complexity/iu,
    );
    expect(design).toMatch(/stable capability[\s\S]*not around every class or\s+function/iu);
    expect(design).toMatch(/adapter[\s\S]*real volatile or external\s+boundary/iu);
    expect(design).toMatch(
      /repository[\s\S]*standard library[\s\S]*native platform[\s\S]*installed\s+dependenc/iu,
    );
    expect(design).toMatch(/same current rule[\s\S]*change\s+together/iu);
    expect(design).toMatch(/callers[\s\S]*reasons? to change[\s\S]*coherent\s+responsibility/iu);
    expect(design).toMatch(/forwarding-only[\s\S]*speculative\s+interfaces/iu);
    expect(design).toMatch(/testability friction[\s\S]*seam/iu);

    expect(prompt).toContain("Use the `implement` skill.");
  });

  it("selects the bug executor before diagnosis and retains one writer when needed", async () => {
    expect.hasAssertions();
    const work = await read("skills/implement/SKILL.md");

    expect(work).toMatch(/Select\s+the executor before[^.]*`diagnosing-bugs`/iu);
    expect(work).toMatch(
      /selected executor[\s\S]*reproduction[\s\S]*caller[\s\S]*sibling[\s\S]*root-cause repair[\s\S]*regression test[\s\S]*first red/iu,
    );
    expect(work).toMatch(
      /one retained `worker`\s+with\s+`context: "fresh"`[\s\S]*exclusive (?:active )?writer lease/iu,
    );
    expect(work).toMatch(/approved Shape slice[\s\S]*worker[\s\S]*fresh[\s\S]*Sol\s+`medium`/iu);
    expect(work).toMatch(
      /worker verifies[^.]*accepted slice[\s\S]*done conditions[\s\S]*tests[\s\S]*lint[\s\S]*integrated path/iu,
    );
    expect(work).toMatch(/direct parent execution[^.]*bounded non-Shape request/iu);
    expect(work).toMatch(
      /Sol\s+`medium`[\s\S]*Sol\s+`high`[\s\S]*security[\s\S]*data loss[\s\S]*concurrency[\s\S]*lifecycle[\s\S]*migration[\s\S]*public API[\s\S]*protocol[\s\S]*provider transport[\s\S]*cross-package[\s\S]*nondeterministic[\s\S]*expensive or unclear\s+validation/iu,
    );
    expect(work).toMatch(/Do not launch code review by default/iu);
    expect(work).toMatch(
      /one fresh Sol `high` reviewer[^.]*user requests[^.]*repository instructions/iu,
    );
    expect(work).toContain('runs.run(key, { resume: "<run-id>", task: "follow-up" })');
    expect(work).toMatch(/latest returned `runId`[^.]*once for repair/iu);
    expect(work).toMatch(/decision-level findings[^.]*parent or Shape/iu);
    expect(work).toMatch(/`invalidated contract` state[^.]*new fresh worker/iu);
    expect(work).toContain("The controlling parent verifies the evidence");
    expect(work).toMatch(/retained\s+execution[\s\S]*returns the\s+exclusive writer lease/iu);
    expect(work).toMatch(/Direct parent execution[^.]*no worker\s+lease to return/iu);
    expect(work).toMatch(
      /approved Shape plan slice[\s\S]*updates the plan checkbox[\s\S]*direct bounded request[^.]*without a plan edit/iu,
    );
    expect(work).toMatch(/Only\s+with explicit authority[^.]*parent applies/iu);
    expect(work).toMatch(/parent keeps final[\s\S]*verification\s+authority/iu);
  });

  it("uses verification signals and leaves code review to an explicit gate", async () => {
    expect.hasAssertions();
    const [implement, developing, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("skills/developing-changes/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(
      /signal progress[\s\S]*focused tests[\s\S]*(?:lint|static checks)[\s\S]*required suite/iu,
    );
    expect(implement).toMatch(/do not launch code review by default/iu);
    expect(implement).toMatch(/do not set[^.]*`turnBudget`[^.]*`toolBudget`[^.]*worker/iu);
    expect(implement).toMatch(/30-minute[^.]*runtime deadline/iu);
    expect(implement).toMatch(
      /interactive parent[\s\S]*completion wake[\s\S]*do not block[^.]*`subagent_wait`/iu,
    );
    expect(implement).toMatch(
      /wait[^.]*aborted[^.]*does not mean[^.]*child failed[\s\S]*inspect[^.]*lifecycle[^.]*once/iu,
    );
    expect(implement).toMatch(/user requests it[^.]*repository instructions require it/iu);
    expect(developing).toMatch(
      /check route-specific agent and tool\s+prerequisites only after choosing the route/iu,
    );
    expect(readme).toMatch(/human\s+reviews the pull request[^.]*requests one final code review/iu);
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

    expect(developing).toMatch(/route-specific agent and tool[\s\S]*after choosing the route/iu);
    expect(developing).toMatch(
      /Direct Shape[^.]*planning[^.]*parent[\s\S]*do not require `pi-subagents`/iu,
    );
    expect(developing).toMatch(/unresolved product intent[\s\S]*`shape`/iu);
    expect(developing).toMatch(/accepted non-trivial intent[\s\S]*`planning-changes`/iu);
    expect(developing).toMatch(
      /accepted current slice[\s\S]*bounded small fix[\s\S]*bug or unexplained\s+regression[\s\S]*refactor[\s\S]*documentation[\s\S]*metadata[\s\S]*mechanical[\s\S]*`implement`/iu,
    );
    expect(developing).toMatch(
      /bug[\s\S]*`implement`[\s\S]*selects the executor[\s\S]*before[\s\S]*`diagnosing-bugs`/iu,
    );
    expect(developing).toMatch(
      /QA-only[\s\S]*fresh read-only `qa`[\s\S]*Luna\s+`medium`[\s\S]*one-shot[\s\S]*ephemeral/iu,
    );
    expect(developing).toMatch(/QA does not create a code\s+review gate/iu);
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
    expect(bug).toMatch(/redact[\s\S]*secret[\s\S]*<REDACTED>/iu);
    expect(bug).toMatch(/tight[\s\S]*observable feedback loop/iu);
    expect(bug).toMatch(/reproduce[\s\S]*minimi/iu);
    expect(bug).toMatch(/competing[\s\S]*testable hypotheses/iu);
    expect(bug).toMatch(/instrumentation[\s\S]*discriminates/iu);
    expect(bug).toMatch(/shared root cause/iu);
    expect(bug).toMatch(/regression[\s\S]*fails before[\s\S]*passes after/iu);
    expect(bug).toMatch(/original scenario[\s\S]*cleanup[\s\S]*uncertainty/iu);
    expect(bug).toMatch(/nondeterministic|unreproducible/iu);
    expect(domain).toMatch(/nearest `?CONTEXT\.md`?/iu);
    expect(domain).toMatch(/each concept one\s+term|one term per concept/iu);
    expect(domain).toMatch(/ADR/iu);
    expect(review).toMatch(/spec|intent/iu);
    expect(review).toMatch(/engineering standards/iu);
    expect(review).toMatch(/make no\s+edits|no edits/iu);
    expect(review).toMatch(/one reviewer[^.]*both axes[^.]*single pass/iu);
    expect(review).toMatch(/do not fan out[^.]*human requests/iu);
    expect(review).toMatch(/do not rerun[^.]*tests or lint[^.]*current evidence/iu);
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
    expect(templates.map(({ name }) => name)).not.toContain("work");
    expect(piPromptTemplates.expandPromptTemplate("/implement", templates)).toContain(
      "Ask for an approved slice, bounded request, or confirmed bug outcome",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/implement tighten retry limit", templates),
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

  it("documents the composed route and complete pinned attribution", async () => {
    expect.hasAssertions();
    const [readme, notice] = await Promise.all([read("README.md"), read("THIRD_PARTY_NOTICES.md")]);

    expect(readme).toMatch(/```mermaid[\s\S]*flowchart[\s\S]*\/develop[\s\S]*implement/iu);
    expect(readme).toContain("Develop -->|Accepted non-trivial intent| Plan");
    expect(readme).not.toContain("/work");
    expect(readme).toMatch(/independent[\s\S]*Git aggregate[\s\S]*pi-subagents/iu);
    expect(readme).toMatch(/no\s+`engineering-practices` skill/iu);
    expect(readme).toMatch(/selectively adapt[\s\S]*scaffolding was not\s+ported/iu);

    expect(notice).toContain("8b78b531ab965735c5dc74f6f7a219e1e37326df");
    expect(notice.match(/^- `skills\/.+\/SKILL\.md`, adapted from$/gmu)).toHaveLength(4);
    for (const skill of [
      "implement",
      "test-driven-development",
      "codebase-design",
      "diagnosing-bugs",
    ]) {
      expect(notice).toContain(`skills/${skill}/SKILL.md`);
    }
    expect(notice).toContain("Copyright (c) 2026 Matt Pocock");
    expect(notice).toContain(
      "Permission is hereby granted, free of charge, to any person obtaining a copy of",
    );
    expect(notice).toContain('THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND');
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
        "skills/codebase-design/SKILL.md",
        "skills/developing-changes/SKILL.md",
        "skills/diagnosing-bugs/SKILL.md",
        "skills/domain-modeling/SKILL.md",
        "skills/reviewing-changes/SKILL.md",
        "skills/implement/SKILL.md",
        "skills/test-driven-development/SKILL.md",
        "prompts/develop.md",
        "prompts/implement.md",
        "prompts/diagnose.md",
        "prompts/model-domain.md",
        "prompts/review-change.md",
        "THIRD_PARTY_NOTICES.md",
      ]),
    );
  });
});
