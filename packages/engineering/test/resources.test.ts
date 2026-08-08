import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");

const read = (path: string) => readFile(join(PACKAGE_ROOT, path), "utf8");

describe("engineering resources", () => {
  it("ships the three focused skills and expandable prompts", async () => {
    expect.hasAssertions();
    const [bug, domain, review, diagnose, model, change] = await Promise.all([
      read("skills/diagnosing-bugs/SKILL.md"),
      read("skills/domain-modeling/SKILL.md"),
      read("skills/reviewing-changes/SKILL.md"),
      read("prompts/diagnose.md"),
      read("prompts/model-domain.md"),
      read("prompts/review-change.md"),
    ]);

    expect(bug).toMatch(/reproduce|observable feedback loop/iu);
    expect(bug).toMatch(/shared root cause/iu);
    expect(bug).toMatch(/nondeterministic|unreproducible/iu);
    expect(domain).toMatch(/nearest `?CONTEXT\.md`?/iu);
    expect(domain).toMatch(/each concept one\s+term|one term per concept/iu);
    expect(domain).toMatch(/ADR/iu);
    expect(review).toMatch(/spec|intent/iu);
    expect(review).toMatch(/engineering standards/iu);
    expect(review).toMatch(/make no\s+edits|no edits/iu);
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
        "skills/diagnosing-bugs/SKILL.md",
        "skills/domain-modeling/SKILL.md",
        "skills/reviewing-changes/SKILL.md",
        "prompts/diagnose.md",
        "prompts/model-domain.md",
        "prompts/review-change.md",
      ]),
    );
  });
});
