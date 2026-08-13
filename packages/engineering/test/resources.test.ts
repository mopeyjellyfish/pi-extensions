import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");

const read = (path: string) => readFile(join(PACKAGE_ROOT, path), "utf8");

describe("engineering resources", () => {
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
    expect(developing).toMatch(
      /`worker`, `qa`, and `reviewer` agents[\s\S]*`shape`\s+skill[\s\S]*`subagent` tool/iu,
    );
    expect(developing).toMatch(/Blocked prerequisite[\s\S]*pi install npm:pi-subagents/iu);
    expect(developing).toMatch(/feature pitch[\s\S]*`shape` skill/iu);
    expect(developing).toMatch(/bug or unexplained regression[\s\S]*`diagnosing-bugs`/iu);
    expect(developing).toMatch(
      /QA-only[\s\S]*one fresh read-only `qa` agent[\s\S]*Luna\s+`medium`[\s\S]*public surface/iu,
    );
    expect(developing).toMatch(
      /sequential[\s\S]*low-risk[\s\S]*locally understandable[\s\S]*cheap to validate/iu,
    );
    expect(developing).toMatch(/one retained `worker` with `context: "fresh"`/iu);
    expect(developing).toMatch(/configured Sol\s+`medium` worker/iu);
    expect(developing).toMatch(/fresh Sol `high` reviewer/iu);
    expect(developing).toContain('runs.run(key, { resume: "<run-id>", task: "follow-up" })');
    expect(developing).toMatch(/latest\s+returned `runId`[^.]*further repair/iu);
    expect(developing).toMatch(/exclusive active writer lease/iu);
    expect(developing).toMatch(/one-shot QA[\s\S]*without creating\s+`docs\/qa\/`/iu);
    expect(developing).toMatch(/artifact or evidence paths/iu);
    expect(developing).toMatch(/Do not return raw logs/iu);
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
        "prompts/develop.md",
        "prompts/diagnose.md",
        "prompts/model-domain.md",
        "prompts/review-change.md",
      ]),
    );
  });
});
