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
    expect(shape).toMatch(
      /separate optional execution-mode question[\s\S]*checkpointed[\s\S]*default[\s\S]*accept-all preference/iu,
    );
    expect(shape).toMatch(/tool[^.]*unavailable[\s\S]*cancels[\s\S]*checkpointed[^.]*default/iu);
    expect(shape).toMatch(/preference[^.]*not[^.]*implementation authority/iu);

    expect(shape).toMatch(/complete\s+pitch[^.]*document[^.]*format: "md"/iu);
    expect(shape).toMatch(/document field[^.]*available/iu);
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
    expect(planning).toMatch(/one optional read-only adviser capability at most/iu);
    expect(planning).toMatch(/source disclosure[^.]*permitted/iu);
    expect(planning).toMatch(/may receive at most one\s+planning-perspective question/iu);
    expect(planning).toMatch(/one distinct rigorous-challenge question/iu);
    expect(planning).toMatch(/must not duplicate[^.]*question[^.]*required review/iu);
    expect(planning).toMatch(/adviser provides evidence only/iu);
    expect(planning).toMatch(
      /parent[^.]*architecture[^.]*synthesis[^.]*approval[^.]*verification/iu,
    );
    expect(planning).toMatch(/rigorous challenge[^.]*one independent-review budget/iu);
    expect(planning).toMatch(/mandatory[^.]*specification review[^.]*precedence/iu);
    expect(planning).toMatch(/adviser capability[\s\S]*unavailable[\s\S]*direct-parent fallback/iu);
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
    expect(planning).toMatch(
      /repeat[^.]*execution mode[\s\S]*whole-plan approval[\s\S]*accept-all authority/iu,
    );
    expect(planning).toMatch(
      /accept-all[^.]*named accepted plan[^.]*merge[^.]*release[^.]*deployment[^.]*destructive cleanup[^.]*unrelated work/iu,
    );
    expect(planning).toMatch(
      /accepted intent[^.]*without[^.]*pitch[^.]*checkpointed[^.]*explicitly selected accept-all/iu,
    );
    expect(planning).toMatch(
      /whole-plan\s+approval\s+presentation[^.]*question[^.]*selected\s+execution\s+mode/iu,
    );
    expect(planning).toMatch(/whole\s+plan[^.]*document[^.]*format: "md"/iu);
    expect(planning).toMatch(/document field[^.]*available/iu);

    for (const approvalSkill of [shape, planning]) {
      expect(approvalSkill).toMatch(/formal\s+document\s+approval[^.]*full-screen/iu);
      expect(approvalSkill).toMatch(/presentation:\s*"fullscreen"[^.]*field\s+is\s+available/iu);
      expect(approvalSkill).toMatch(/default\s+full-screen\s+presentation\s+applies/iu);
    }

    expect(pitch).toMatch(/^---\nstatus: draft\n---/u);
    expect(pitch).toMatch(/## Problem and evidence/iu);
    expect(pitch).toMatch(/## Proposed solution/iu);
    expect(pitch).toMatch(/## Boundaries and no-gos/iu);
    expect(pitch).toMatch(/## Decision-changing research and risks/iu);
    expect(pitch).toMatch(/## Authority/iu);
    expect(pitch).toMatch(
      /execution mode[^.]*checkpointed[^.]*default[^.]*accept-all preference/iu,
    );
    expect(pitch).toMatch(/## Observable acceptance criteria/iu);
    expect(pitch).not.toMatch(
      /^## (?:Executive summary|Appetite|Research and prior art|Solution|Fixed decisions|Rabbit holes)$/imu,
    );

    expect(plan).toMatch(/^---\nstatus: draft\n---/u);
    expect(plan).toMatch(/complete[\s\S]*delivery plan[\s\S]*before[\s\S]*implementation/iu);
    expect(plan).toMatch(/critical path[\s\S]*dependencies[\s\S]*lanes/iu);
    expect(plan).toMatch(
      /execution mode[^.]*checkpointed[^.]*default[^.]*accept-all[\s\S]*whole-plan approval/iu,
    );
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
    expect(readme).toMatch(
      /separate optional execution-mode question[\s\S]*checkpointed[^.]*default[\s\S]*accept-all[^.]*preference/iu,
    );
    expect(readme).toMatch(/whole-plan approval[^.]*accept-all authority/iu);

    expect(readme).toMatch(
      /^During planning, at most one optional read-only adviser capability/imu,
    );
    expect(readme).not.toMatch(/^An optional read-only adviser capability/imu);
    expect(readme).toMatch(/disclosure[^.]*permitted/iu);
    expect(readme).toMatch(/may receive at most one\s+planning-perspective question/iu);
    expect(readme).toMatch(/one distinct rigorous-challenge question/iu);
    expect(readme).toMatch(/must not duplicate[^.]*question[^.]*required review/iu);
    expect(readme).toMatch(/returns evidence only/iu);
    expect(readme).toMatch(
      /one independent-review budget[^.]*mandatory[^.]*review[^.]*precedence/iu,
    );
    expect(readme).toMatch(/capability is unavailable[^.]*direct-parent\s+fallback/iu);

    for (const portableAdviserResource of [planning, readme]) {
      expect(portableAdviserResource).not.toMatch(
        /AskClaude|claude-(?:bridge|fable|opus)|\bFable\b|\bOpus\b|\bSol\b|GPT-\d/iu,
      );
    }
    for (const resource of [shape, planning, plan, readme]) {
      expect(resource).not.toMatch(
        /pi-subagents|runs\.all|writer lease|parallel-safe|FFF|\bFable\b|\bSol\b/iu,
      );
    }
  });

  it("requires evidence-based Go specification review before Go document approval", async () => {
    expect.hasAssertions();
    const [shape, planning, pitch, plan, readme] = await Promise.all([
      read("skills/shape/SKILL.md"),
      read("skills/planning-changes/SKILL.md"),
      read("skills/shape/templates/pitch.md"),
      read("skills/shape/templates/plan.md"),
      read("README.md"),
    ]);

    for (const workflow of [shape, planning]) {
      expect(workflow).toMatch(
        /Go-targeted[\s\S]*Go source[\s\S]*Go module[\s\S]*Go CLI[\s\S]*Go-specific guidance[\s\S]*unrelated `go\.mod`[\s\S]*toolchain[\s\S]*not/iu,
      );
      expect(workflow).toMatch(
        /one[\s\S]*fixed-document Go specification[\s\S]*before[\s\S]*approval/iu,
      );
      expect(workflow).toMatch(
        /consumes[\s\S]*one independent-review budget[\s\S]*other standards[\s\S]*inline/iu,
      );
      expect(workflow).toMatch(
        /proposed[- ]solution[\s\S]*boundar(?:y|ies)[\s\S]*authority[\s\S]*acceptance[- ]criterion[\s\S]*replacement/iu,
      );
      expect(workflow).toMatch(
        /installed skill resolution by name[\s\S]*unmet method[\s\S]*target-repository Go standards/iu,
      );
    }
    expect(shape).toMatch(/`go`[^.]*`cobra-viper`[^.]*CLI/iu);
    expect(planning).toMatch(
      /guidance[\s\S]*routing[\s\S]*accuracy[\s\S]*consistency[\s\S]*applicability[\s\S]*implementation readiness/iu,
    );
    for (const template of [pitch, plan]) {
      expect(template).toMatch(/## Review evidence/iu);
      expect(template).toMatch(/Applicability:[\s\S]*not applicable/iu);
      expect(template).toMatch(/Fixed document/iu);
      expect(template).toMatch(/Status/iu);
      expect(template).toMatch(/Invalidation/iu);
    }
    expect(readme).toMatch(
      /Go-targeted[\s\S]*fixed-document Go specification[\s\S]*before[\s\S]*approval/iu,
    );
    expect(readme).toMatch(
      /independent installation[\s\S]*named resolution[\s\S]*unmet method[\s\S]*target-repository Go standards/iu,
    );
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
    const planningProse = planning.replaceAll(/\s+/gu, " ");
    const planProse = plan.replaceAll(/\s+/gu, " ");
    const readmeProse = readme.replaceAll(/\s+/gu, " ");

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
    expect(planningProse).toContain(
      "Independent delivery units use sibling branches and sibling standalone pull requests from their accepted common base.",
    );
    expect(planningProse).toContain(
      "Sequentially dependent delivery units use one ordered GitHub stack.",
    );
    expect(planningProse).toContain(
      "A mixed plan can contain parallel sibling pull requests and one or more dependent stacks.",
    );
    expect(planningProse).toContain(
      "Every delivery unit, sibling or stacked, must retain independent review value and required-check viability.",
    );
    expect(planningProse).toContain(
      "Parallel lanes require separate isolated worktrees, sole writers, non-overlapping ownership, and a named integration point.",
    );
    expect(planning).toMatch(
      /critical-path forecast[\s\S]*invalidation map[\s\S]*materially exceeds/iu,
    );
    expect(plan).toMatch(
      /\|\s*Delivery unit\s*\|\s*Topology\s*\|\s*Stack position\s*\|\s*Branch\s*\|\s*Pull request base\s*\|\s*Dependencies\s*\|\s*Checks\s*\|\s*Ownership\s*\|\s*Integration point\s*\|\s*CI fan-out\s*\|\s*Cascade cost\s*\|/iu,
    );
    expect(planProse).toContain(
      "Use sibling standalone pull requests for independent delivery units and an ordered GitHub stack for each sequential dependency chain.",
    );
    expect(planProse).toContain(
      "Every delivery unit, sibling or stacked, must retain independent review value and required-check viability.",
    );
    expect(planProse).toContain(
      "Multiple slices or commits inside one delivery unit do not create branches, pull requests, or stack positions.",
    );
    expect(readme).toMatch(/one delivery unit[^.]*one branch[^.]*one pull request[^.]*default/iu);
    expect(readmeProse).toContain(
      "Independent delivery units use sibling standalone pull requests, while sequential dependency chains use ordered GitHub stacks.",
    );
    expect(readmeProse).toContain(
      "Every delivery unit retains independent review value and required-check viability.",
    );

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

  it("adds proportional UI evidence gates without coupling feature-flow to frontend resources", async () => {
    expect.hasAssertions();
    const [shape, planning, pitch, plan, readme] = await Promise.all([
      read("skills/shape/SKILL.md"),
      read("skills/planning-changes/SKILL.md"),
      read("skills/shape/templates/pitch.md"),
      read("skills/shape/templates/plan.md"),
      read("README.md"),
    ]);
    expect(shape).toMatch(
      /material user interface[\s\S]*load and follow `frontend-design`[\s\S]*before\s+pitch\s+approval[\s\S]*installed capability/iu,
    );
    for (const term of [
      "person and task",
      "surface mode",
      "design authority",
      "desired feel",
      "focal workflow",
      "representative states",
      "responsive",
      "accessibility",
      "operation needs",
      "visual decisions",
      "disposition",
    ])
      expect(shape).toMatch(new RegExp(term.replaceAll(" ", "\\s+"), "iu"));
    expect(shape).toMatch(/`DESIGN\.md`/u);
    expect(shape).toMatch(
      /unresolved\s+material\s+visual\s+direction[\s\S]*image-backed[\s\S]*explicit\s+human\s+choice/iu,
    );
    expect(shape).toMatch(/mechanical[\s\S]*direct/iu);
    expect(planning).toMatch(/accepted\s+interface\s+criteria[\s\S]*vertical\s+slices/iu);
    for (const term of [
      "representative states",
      "responsive surfaces",
      "accessibility paths",
      "design-system reuse",
      "operation-specific checks",
      "browser evidence",
      "mismatch ledger",
      "approval",
    ])
      expect(planning).toMatch(new RegExp(term.replaceAll(" ", "\\s+"), "iu"));
    expect(planning).toMatch(/`DESIGN\.md`/u);
    expect(planning).toMatch(/design-evidence\s+slice[\s\S]*before[\s\S]*UI\s+implementation/iu);
    expect(planning).toMatch(/`implement`[\s\S]*engineering\s+orchestration/iu);
    expect(pitch).toMatch(/material interface scope[\s\S]*design evidence/iu);
    for (const term of ["design authority", "chosen visual direction", "operation needs"])
      expect(pitch).toMatch(new RegExp(term.replaceAll(" ", "\\s+"), "iu"));
    expect(planning).toMatch(/target-owned[\s\S]*browser\s+evidence/iu);
    expect(plan).toMatch(/interface slice[\s\S]*states[\s\S]*responsive[\s\S]*visual proof/iu);
    expect(readme).toMatch(
      /conditional[\s\S]*interface evidence[\s\S]*independently installable/iu,
    );
    for (const source of [shape, planning, pitch, plan]) {
      expect(source).not.toMatch(/pi-extensions|packages\//iu);
      expect(source).not.toMatch(/npm (?:run|test)|GitHub Actions|\bFable\b|\bSol\b/iu);
    }
  });

  it("composes installed frontend methods through material UI shaping and planning", async () => {
    expect.hasAssertions();
    const [shape, planning] = await Promise.all([
      read("skills/shape/SKILL.md"),
      read("skills/planning-changes/SKILL.md"),
    ]);

    expect(shape).toMatch(
      /material user interface[\s\S]*load and follow `frontend-design`[\s\S]*before\s+pitch\s+approval[\s\S]*installed capability/iu,
    );
    expect(shape).toMatch(
      /`frontend-design`[\s\S]*(?:`interface-craft`|`interface-design`|`design-documentation`)/u,
    );
    expect(shape).toMatch(/direct-parent fallback[\s\S]*`frontend-design`[^.]*unavailable/iu);
    expect(planning).toMatch(/material UI[\s\S]*`frontend-development`/iu);
    expect(planning).toMatch(/accepted\s+design\s+or\s+operation\s+method/iu);
    expect(planning).toMatch(/`react-best-practices`[^.]*only for a React target/iu);
    expect(planning).toMatch(/evidence capability[\s\S]*`visual-validation`/iu);
    expect(planning).toMatch(/parent-owned[\s\S]*`design-documentation`[\s\S]*approval/iu);
    expect(planning).toMatch(/frontend methods[\s\S]*unavailable[\s\S]*direct-parent fallback/iu);

    for (const resource of [shape, planning]) {
      expect(resource).not.toMatch(/pi-extensions|packages\//iu);
    }
  });
});

describe("image-first UI delivery resource contract", () => {
  it("carries selected image evidence into native implementation and visual proof", async () => {
    expect.hasAssertions();
    const [shape, planning, pitch, plan, readme] = await Promise.all([
      read("skills/shape/SKILL.md"),
      read("skills/planning-changes/SKILL.md"),
      read("skills/shape/templates/pitch.md"),
      read("skills/shape/templates/plan.md"),
      read("README.md"),
    ]);

    expect(shape).toMatch(
      /greenfield\s+web\s+application[\s\S]*generation-first[\s\S]*before\s+pitch\s+approval/iu,
    );
    expect(shape).toMatch(/selected evidence[\s\S]*image-to-interface contract/iu);
    expect(planning).toMatch(
      /image-to-interface contract[\s\S]*native accessible structure[\s\S]*target components[\s\S]*semantic tokens/iu,
    );
    expect(planning).toMatch(
      /representative\s+desktop\s+and\s+mobile\s+browser\s+evidence[\s\S]*resolved\s+or\s+explicitly\s+accepted\s+visual\s+mismatch\s+ledger/iu,
    );
    expect(pitch).toMatch(/selected evidence[\s\S]*image-to-interface contract/iu);
    expect(plan).toMatch(
      /native\s+accessible structure[\s\S]*semantic tokens[\s\S]*mismatch\s+ledger/iu,
    );
    expect(readme).toMatch(
      /Material UI scope[\s\S]*greenfield web application[\s\S]*generation-first[\s\S]*direct-parent fallback[\s\S]*independently installable/iu,
    );
  });
});
