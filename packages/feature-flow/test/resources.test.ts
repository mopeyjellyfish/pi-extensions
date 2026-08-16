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
    expect(shape).toMatch(
      /first action[\s\S]*isolated[^.]*worktree[\s\S]*before[\s\S]*(discovery|question|read)/iu,
    );
    expect(shape).toMatch(/same[^.]*worktree[\s\S]*planning[\s\S]*implementation/iu);
    expect(shape).toMatch(/no safe[^.]*available[^.]*stop[^.]*before[^.]*Shape work/iu);
    expect(shape).toMatch(/`question` tool/iu);
    expect(shape).toMatch(/pitch\.md[\s\S]*status: draft/iu);
    expect(shape).toMatch(/complete pitch[\s\S]*document/iu);
    expect(shape).toMatch(/Approve and plan[\s\S]*Revise[\s\S]*Deepen[\s\S]*Independent review/iu);
    expect(shape).toMatch(/explicit human approval[\s\S]*`planning-changes`/iu);
    expect(shape).toMatch(/appetite[\s\S]*boundaries[\s\S]*risks[\s\S]*acceptance criteria/iu);
    expect(planning).toMatch(/explicit accepted intent|accepted Shape pitch/iu);
    expect(planning).toMatch(
      /first action[\s\S]*isolated[^.]*worktree[\s\S]*before[\s\S]*(instructions|contracts|tests)/iu,
    );
    expect(planning).toMatch(/never[^.]*main[^.]*checkout/iu);
    expect(planning).toMatch(/no safe[^.]*available[^.]*stop[^.]*before[^.]*planning work/iu);
    expect(planning).toMatch(/smallest ordered[\s\S]*vertical slices/iu);
    expect(planning).toMatch(/serial by default/iu);
    expect(planning).toMatch(/execution mode[\s\S]*serial[\s\S]*parallel-ready/iu);
    expect(planning).toMatch(/difficulty[\s\S]*standard[\s\S]*hard[\s\S]*reason/iu);
    expect(planning).toMatch(/test posture[\s\S]*red signal[\s\S]*green signal/iu);
    expect(planning).toMatch(
      /Approve and implement[\s\S]*Revise[\s\S]*Deepen[\s\S]*Independent review/iu,
    );
    expect(planning).toMatch(/whole plan[\s\S]*explicit human approval/iu);
    expect(pitch).toMatch(/^---\nstatus: draft\n---/u);
    expect(plan).toMatch(/^---\nstatus: draft\n---/u);
    expect(plan).toMatch(/## \[ \] 001 — Observable vertical outcome/u);
    expect(plan).toMatch(/Execution mode[\s\S]*serial.*parallel-ready/iu);
    expect(plan).toMatch(/Difficulty[\s\S]*standard[\s\S]*hard[\s\S]*reason/iu);
    expect(plan).toMatch(/Test posture[\s\S]*Red signal[\s\S]*Green signal/iu);
    expect(shape).toMatch(
      /selected parent[\s\S]*product[\s\S]*architecture[\s\S]*approval[\s\S]*synthesis/iu,
    );
    expect(shape).toMatch(/lifecycle['’]s one bounded Researcher/iu);
    expect(shape).toMatch(/output in[\s\S]*pitch[\s\S]*planning does not repeat/iu);
    expect(shape).toMatch(/no product[\s\S]*architecture[\s\S]*approval decision/iu);
    expect(shape).toMatch(/direct-parent fallback[\s\S]*unavailable/iu);
    expect(shape).toMatch(/ambiguous routing[\s\S]*`question`/iu);
    expect(planning).toMatch(/selected parent[\s\S]*slice design[\s\S]*approval[\s\S]*synthesis/iu);
    expect(planning).toMatch(/combined Shape-and-[\s\S]*planning lifecycle['’]s one bounded/iu);
    expect(planning).toMatch(/accepted pitch[\s\S]*handoff[\s\S]*do not\s+start another/iu);
    expect(planning).toMatch(/module shape[\s\S]*codebase-design/iu);
    expect(planning).toMatch(/direct-parent evidence-based fallback[\s\S]*unavailable/iu);
    expect(planning).toMatch(/ambiguous routing[\s\S]*`question`/iu);
    expect(readme).toMatch(/direct parent[\s\S]*pitch[\s\S]*plan/iu);
    expect(readme).toMatch(/selected Fable or Sol parent[\s\S]*one bounded Researcher/iu);
    expect(readme).toMatch(/independent installation[\s\S]*direct parent/iu);
    expect(readme).toMatch(/isolated[^.]*worktree[\s\S]*before[^.]*discovery/iu);

    for (const resource of [shape, planning]) {
      expect(resource).not.toMatch(/Fable\s+or\s+Sol/iu);
    }
    for (const resource of [shape, planning, plan, readme]) {
      expect(resource).not.toMatch(/pi-subagents|runs\.all|writer lease|parallel-safe|FFF/iu);
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
