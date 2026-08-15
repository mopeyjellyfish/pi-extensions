import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const read = (path: string) => readFile(join(PACKAGE_ROOT, path), "utf8");

describe("feature-flow resources", () => {
  it("provides a direct pitch-to-plan lifecycle", async () => {
    expect.hasAssertions();
    const [shape, planning, pitch, plan, readme] = await Promise.all([
      read("skills/shape/SKILL.md"),
      read("skills/planning-changes/SKILL.md"),
      read("skills/shape/templates/pitch.md"),
      read("skills/shape/templates/plan.md"),
      read("README.md"),
    ]);

    expect(shape).toMatch(/direct parent[^.]*default executor/iu);
    expect(shape).toMatch(/`question` tool/iu);
    expect(shape).toMatch(/pitch\.md[\s\S]*status: draft/iu);
    expect(shape).toMatch(/explicit human approval[\s\S]*`planning-changes`/iu);
    expect(shape).toMatch(/appetite[\s\S]*boundaries[\s\S]*risks[\s\S]*acceptance criteria/iu);
    expect(planning).toMatch(/explicit accepted intent|accepted Shape pitch/iu);
    expect(planning).toMatch(/smallest ordered[\s\S]*vertical slices/iu);
    expect(planning).toMatch(/serial by default/iu);
    expect(planning).toMatch(/test posture[\s\S]*verification/iu);
    expect(pitch).toMatch(/^---\nstatus: draft\n---/u);
    expect(plan).toMatch(/## \[ \] 001 — Observable vertical outcome/u);
    expect(plan).toMatch(/Test posture[\s\S]*Verification/iu);
    expect(readme).toMatch(/direct parent[\s\S]*pitch[\s\S]*plan/iu);

    for (const resource of [shape, planning, plan, readme]) {
      expect(resource).not.toMatch(
        /pi-subagents|runs\.all|writer lease|Worktrunk|parallel-safe|FFF/iu,
      );
    }
  });

  it("expands the /shape and /plan prompts", async () => {
    expect.hasAssertions();
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

    expect(piPromptTemplates.expandPromptTemplate("/shape", templates)).toContain(
      "Ask the user for a feature brief",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/plan accepted upload pitch", templates),
    ).toContain("accepted upload pitch");
  });

  it("packs both skills, prompts, and templates", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await read("package.json")) as {
      pi: { skills: string[]; prompts: string[] };
    };
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const paths = packed[0]?.files.map(({ path }) => path) ?? [];

    expect(manifest.pi).toEqual({ skills: ["./skills"], prompts: ["./prompts"] });
    expect(await readdir(join(PACKAGE_ROOT, "skills"))).toEqual(["planning-changes", "shape"]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "prompts/plan.md",
        "prompts/shape.md",
        "skills/planning-changes/SKILL.md",
        "skills/shape/SKILL.md",
        "skills/shape/templates/pitch.md",
        "skills/shape/templates/plan.md",
      ]),
    );
  });
});
