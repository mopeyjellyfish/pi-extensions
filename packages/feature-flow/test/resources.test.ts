import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const read = (path: string) => readFile(join(PACKAGE_ROOT, path), "utf8");

describe("feature-flow resources", () => {
  it("provides a lean pitch and a complete delivery-plan lifecycle", async () => {
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
    expect(shape).toMatch(/complete pitch[\s\S]*document/iu);
    expect(shape).toMatch(/Approve and plan[\s\S]*Revise[\s\S]*Deepen[\s\S]*Independent review/iu);
    expect(shape).toMatch(/explicit human approval[\s\S]*`commit`[\s\S]*planning-changes/iu);
    expect(shape).toMatch(/`open-pr`[\s\S]*only when[\s\S]*independent review or merge value/iu);
    expect(shape).toMatch(/docs\/features\/<slug>\/pitch\.md/iu);
    expect(shape).toMatch(/only[\s\S]*decision-changing[\s\S]*research/iu);
    expect(shape).toMatch(/product[\s\S]*architecture[\s\S]*approval/iu);
    expect(shape).toMatch(/direct-parent fallback[\s\S]*unavailable/iu);
    expect(shape).toMatch(/exceptional high-capability role requires explicit[\s\S]*approval/iu);
    expect(shape).toMatch(/required `gh stack`[\s\S]*fails? closed[\s\S]*publication/iu);
    expect(shape).toMatch(/continue[\s\S]*pitch-to-plan handoff[\s\S]*without publishing/iu);

    expect(planning).toMatch(/explicit accepted intent|accepted Shape pitch/iu);
    expect(planning).toMatch(
      /first action[\s\S]*isolated[^.]*worktree[\s\S]*before[\s\S]*(instructions|contracts|tests)/iu,
    );
    expect(planning).toMatch(/never[^.]*main[^.]*checkout/iu);
    expect(planning).toMatch(
      /complete[\s\S]*delivery[\s\S]*plan[\s\S]*before[\s\S]*implementation/iu,
    );
    expect(planning).toMatch(/critical path[\s\S]*independent lanes/iu);
    expect(planning).toMatch(/overlap[\s\S]*parallel/iu);
    expect(planning).toMatch(/plan[\s\S]*work[\s\S]*plan[\s\S]*work/iu);
    expect(planning).toMatch(/worktree[\s\S]*sole writer/iu);
    expect(planning).toMatch(/one independent[\s\S]*review/iu);
    expect(planning).toMatch(/direct-parent fallback[\s\S]*unavailable/iu);
    expect(planning).toMatch(/exceptional high-capability role requires explicit[\s\S]*approval/iu);
    expect(planning).toMatch(
      /Approve and implement[\s\S]*Revise[\s\S]*Deepen[\s\S]*Independent review/iu,
    );
    expect(planning).toMatch(/explicit human approval[\s\S]*`commit`[\s\S]*implement/iu);
    expect(planning).toMatch(/`open-pr`[\s\S]*only when[\s\S]*independent review or merge value/iu);
    expect(planning).toMatch(/docs\/features\/<slug>\/plan\.md/iu);
    expect(planning).toMatch(/planned stack[\s\S]*`gh stack`/iu);
    expect(planning).toMatch(/fails? closed[\s\S]*publication/iu);
    expect(planning).toMatch(/continue[\s\S]*plan-to-implementation handoff/iu);
    expect(planning).toMatch(/`implement` is unavailable[\s\S]*direct\s+parent/iu);
    expect(planning).toMatch(/`gh stack link`[\s\S]*Worktrunk-managed/iu);
    expect(planning).toMatch(/`gh stack view --json`[\s\S]*local tracked view/iu);

    expect(pitch).toMatch(/^---\nstatus: draft\n---/u);
    expect(pitch).toMatch(/## Problem and evidence/iu);
    expect(pitch).toMatch(/## Proposed solution/iu);
    expect(pitch).toMatch(/## Boundaries and no-gos/iu);
    expect(pitch).toMatch(/## Decision-changing research and risks/iu);
    expect(pitch).toMatch(/## Authority/iu);
    expect(pitch).toMatch(/## Observable acceptance criteria/iu);
    expect(pitch).not.toMatch(
      /^## (?:Executive summary|Appetite|Research and prior art|Solution|Fixed decisions|Rabbit holes)$/imu,
    );

    expect(plan).toMatch(/^---\nstatus: draft\n---/u);
    expect(plan).toMatch(/complete[\s\S]*delivery plan[\s\S]*before[\s\S]*implementation/iu);
    expect(plan).toMatch(/critical path[\s\S]*dependencies[\s\S]*lanes/iu);
    expect(plan).toMatch(/## \[ \] 001 — Observable vertical outcome/u);
    expect(plan).toMatch(/Seam and files/iu);
    expect(plan).toMatch(/Execution lane and ownership/iu);
    expect(plan).toMatch(/`serial`[\s\S]*`parallel-ready`/iu);
    expect(plan).toMatch(/Red proof[\s\S]*Green proof/iu);
    expect(plan).toMatch(/Atomic commit[\s\S]*Pull request/iu);
    expect(plan).toMatch(/pull-request base[\s\S]*only when[\s\S]*different delivery unit/iu);
    expect(plan).toMatch(/Stack position/iu);
    expect(plan).toMatch(/Done when/iu);
    expect(plan).not.toMatch(/Work the first unchecked slice/iu);

    expect(readme).toMatch(/direct parent[\s\S]*pitch[\s\S]*plan/iu);
    expect(readme).toMatch(/complete[\s\S]*delivery plan[\s\S]*before[\s\S]*implementation/iu);
    expect(readme).toMatch(/`commit`[\s\S]*`open-pr`/iu);
    expect(readme).toMatch(
      /fails closed for publication[\s\S]*continues[\s\S]*without publishing/iu,
    );
    expect(readme).toMatch(/independent installation[\s\S]*direct parent/iu);

    for (const resource of [shape, planning, plan, readme]) {
      expect(resource).not.toMatch(
        /pi-subagents|runs\.all|writer lease|parallel-safe|FFF|\bFable\b|\bSol\b/iu,
      );
    }
  });

  it("defines delivery units without coupling portable planning guidance to one repository", async () => {
    expect.hasAssertions();
    const [context, shape, planning, plan, readme] = await Promise.all([
      readFile(join(REPOSITORY_ROOT, "CONTEXT.md"), "utf8"),
      read("skills/shape/SKILL.md"),
      read("skills/planning-changes/SKILL.md"),
      read("skills/shape/templates/plan.md"),
      read("README.md"),
    ]);

    expect(context).toMatch(
      /delivery unit[^.]*coherent review[^.]*validation[^.]*publication boundary/iu,
    );
    expect(context).toMatch(/vertical slice[^.]*smallest end-to-end behavior/iu);
    expect(context).toMatch(/atomic commit[^.]*coherent change/iu);
    expect(context).toMatch(/branch[^.]*delivery unit/iu);
    expect(context).toMatch(/pull request[^.]*delivery unit/iu);
    expect(shape).toMatch(
      /planning documents[^.]*implementation\s+delivery unit[^.]*independent review or merge value/iu,
    );
    expect(planning).toMatch(/fewest coherent delivery units/iu);
    expect(planning).toMatch(/narrow deterministic red.green signal/iu);
    expect(planning).toMatch(/one delivery unit[^.]*pull request[^.]*default/iu);
    expect(planning).toMatch(
      /independent value[^.]*required-check viability[^.]*integration[^.]*fan-out[^.]*cascade/iu,
    );
    expect(planning).toMatch(
      /critical-path forecast[\s\S]*invalidation map[\s\S]*materially exceeds/iu,
    );
    expect(plan).toMatch(/Delivery unit[^.]*Vertical slices/iu);
    expect(plan).toMatch(
      /independent value[^.]*check viability[^.]*integration[^.]*fan-out[^.]*cascade/iu,
    );
    const planProse = plan.replaceAll(/\s+/gu, " ");
    expect(planProse).toMatch(
      /stack[^.]*intentional[^.]*not automatic[\s\S]*large change[^.]*right-sized[^.]*independently reviewable[^.]*ordered dependency/iu,
    );
    expect(planProse).toMatch(/not[^.]*stack positions[^.]*multiple slices or commits/iu);
    expect(readme).toMatch(/one delivery unit[^.]*one branch[^.]*one pull request[^.]*default/iu);

    for (const resource of [shape, planning, plan]) {
      expect(resource).not.toMatch(
        /pi-extensions|packages\/|npm (?:run|test)|GitHub Actions|\bFable\b|\bSol\b|GPT-\d|Opus/iu,
      );
      expect(resource).not.toMatch(/\/(?:Users|home|tmp)\//u);
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
