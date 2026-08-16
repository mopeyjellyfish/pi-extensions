import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const read = (path: string) => readFile(join(PACKAGE_ROOT, path), "utf8");

describe("engineering resources", () => {
  it("routes root-profile work and review through fresh model-specific agents", async () => {
    expect.hasAssertions();
    const [implement, diagnosing, domainModeling, tdd, readme] = await Promise.all([
      read("skills/implement/SKILL.md"),
      read("skills/diagnosing-bugs/SKILL.md"),
      read("skills/domain-modeling/SKILL.md"),
      read("skills/test-driven-development/SKILL.md"),
      read("README.md"),
    ]);

    expect(implement).toMatch(/approved slice[\s\S]*bounded request[\s\S]*confirmed bug outcome/iu);
    expect(implement).toMatch(/`worker`[\s\S]*standard[\s\S]*plan-less[\s\S]*accepted hard/iu);
    expect(implement).toMatch(/`worker`[\s\S]*only configured implementation child/iu);
    expect(implement).toMatch(/`reviewer`[\s\S]*fresh[\s\S]*read-only/iu);
    expect(implement).toMatch(
      /`reviewer`[\s\S]*worktree[\s\S]*fixed[- ]point[\s\S]*intent[\s\S]*diff[\s\S]*evidence/iu,
    );
    expect(implement).toMatch(
      /question[\s\S]*evidence[\s\S]*expected benefit[\s\S]*bounded Sol task[\s\S]*explicit approval/iu,
    );
    expect(implement).not.toMatch(/difficulty[\s\S]{0,120}sol-worker|automatic[^.]*Sol/iu);
    expect(implement).toMatch(/trivial[\s\S]*direct(ly)? as the parent|parent[\s\S]*trivial/iu);
    expect(implement).toMatch(/`worker`[\s\S]*fresh[\s\S]*foreground/iu);
    expect(implement).toMatch(/unavailable[\s\S]*direct parent/iu);
    expect(implement).toMatch(/repository instructions[\s\S]*Git\s+state[\s\S]*public contracts/iu);
    expect(implement).toMatch(/before[^.]*edit[\s\S]*isolated[^.]*worktree/iu);
    expect(implement).toMatch(/never[^.]*main[^.]*checkout/iu);
    expect(implement).toMatch(/same[^.]*worktree[\s\S]*pitch[\s\S]*plan/iu);
    expect(implement).toMatch(/no safe[^.]*available[^.]*stop[^.]*before[^.]*edit/iu);
    expect(implement).toMatch(/test-driven-development|red-green-refactor/iu);
    expect(implement).toMatch(/focused tests[\s\S]*required completion checks/iu);
    expect(implement).toMatch(/parallel-ready/iu);
    expect(implement).toMatch(/isolated worktree[\s\S]*sole\s+write ownership/iu);
    expect(implement).toMatch(/parent[\s\S]*synthesi[sz]e[\s\S]*verif/iu);
    expect(implement).toMatch(/do not add workers merely because[^.]*large/iu);
    expect(implement).toMatch(/complete work evidence[\s\S]*document/iu);
    expect(implement).toMatch(/Review[\s\S]*Revise[\s\S]*Deepen verification[\s\S]*Pause/iu);
    expect(readme).toMatch(/Worker[\s\S]*Reviewer[\s\S]*direct parent/iu);
    expect(readme).toMatch(/before[^.]*writ[\s\S]*isolated[^.]*worktree/iu);

    for (const resource of [diagnosing, domainModeling, tdd]) {
      expect(resource).toMatch(/before[^.]*writ[\s\S]*isolated[^.]*worktree/iu);
      expect(resource).toMatch(/never[\s\S]{0,120}main-branch checkout/iu);
      expect(resource).toMatch(/unavailable[^.]*stop[^.]*before[^.]*writ/iu);
    }

    for (const resource of [implement, readme]) {
      expect(resource).not.toMatch(/runs\.all|writer lease|FFF|lsp_query/iu);
    }
  });

  it("keeps the focused optional skills and prompt templates installable", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await read("package.json")) as {
      files: string[];
      pi: Record<string, string[]>;
      dependencies?: unknown;
      peerDependencies?: unknown;
    };
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const paths = packed[0]?.files.map(({ path }) => path) ?? [];

    expect(manifest.pi).toEqual({ skills: ["./skills"], prompts: ["./prompts"] });
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.peerDependencies).toBeUndefined();
    expect(paths).toEqual(
      expect.arrayContaining([
        "skills/implement/SKILL.md",
        "skills/test-driven-development/SKILL.md",
        "skills/diagnosing-bugs/SKILL.md",
        "skills/diagnosing-bugs/scripts/hitl-loop.template.sh",
        "skills/code-review/SKILL.md",
        "prompts/debug.md",
        "prompts/implement.md",
        "prompts/review-change.md",
      ]),
    );
    expect(paths).not.toContain("skills/reviewing-changes/SKILL.md");
    expect(paths).toEqual(
      expect.arrayContaining([
        "skills/improve-codebase-architecture/SKILL.md",
        "prompts/improve.md",
      ]),
    );
  });

  it("ships one hash-checked code review method and an evidence-based design vocabulary", async () => {
    expect.hasAssertions();
    const [skill, design, prompt, developing, notice, readme, skillDirectories] = await Promise.all(
      [
        read("skills/code-review/SKILL.md"),
        read("skills/codebase-design/SKILL.md"),
        read("prompts/review-change.md"),
        read("skills/developing-changes/SKILL.md"),
        read("THIRD_PARTY_NOTICES.md"),
        read("README.md"),
        readdir(join(PACKAGE_ROOT, "skills"), { withFileTypes: true }),
      ],
    );
    const separator = "\n## Pi review additions\n";
    const separatorIndex = skill.indexOf(separator);

    expect(separatorIndex).toBeGreaterThan(0);
    expect(createHash("sha256").update(skill.slice(0, separatorIndex)).digest("hex")).toBe(
      "4e8eeefbf3bd32ec2c911ed6c7db103866ce11fedc98b1f8e358d2e1cada3895",
    );
    expect(skill.slice(separatorIndex)).toMatch(
      /override[\s\S]*parallel-subagent[\s\S]*issue-tracker setup/iu,
    );
    expect(skill.slice(separatorIndex)).toMatch(/one Opus Reviewer[\s\S]*one read-only pass/iu);
    expect(skill.slice(separatorIndex)).toMatch(/root profile[\s\S]*Opus Reviewer/iu);
    expect(skill.slice(separatorIndex)).toMatch(
      /without that profile[\s\S]*one read-only reviewer[\s\S]*direct parent/iu,
    );
    expect(skill.slice(separatorIndex)).toMatch(
      /pitch, plan, request, issue, or user-supplied intent/iu,
    );
    expect(skill.slice(separatorIndex)).toMatch(
      /correctness[\s\S]*regression[\s\S]*security[\s\S]*performance[\s\S]*edge cases[\s\S]*falsifiable\s+tests[\s\S]*architecture[\s\S]*maintainability/iu,
    );
    expect(skill.slice(separatorIndex)).toMatch(
      /file[\s\S]*location[\s\S]*evidence[\s\S]*consequence[\s\S]*axis[\s\S]*confidence/iu,
    );
    expect(
      skillDirectories.filter((entry) => entry.isDirectory()).map(({ name }) => name),
    ).toContain("code-review");
    expect(skillDirectories.map(({ name }) => name)).not.toContain("reviewing-changes");
    expect(prompt).toMatch(/`code-review` skill/iu);
    expect(developing).toMatch(/`code-review`/iu);
    expect(readme).toMatch(/`code-review`/iu);
    expect(notice).toMatch(
      /skills\/code-review\/SKILL\.md[\s\S]*068b6e0c62393147daf03530149cdce209c93da8[\s\S]*verbatim/iu,
    );
    expect(notice).toMatch(
      /skills\/codebase-design\/SKILL\.md[\s\S]*adapted[\s\S]*068b6e0c62393147daf03530149cdce209c93da8/iu,
    );

    for (const term of [
      "Module",
      "Interface",
      "Implementation",
      "Depth",
      "Seam",
      "Adapter",
      "Leverage",
      "Locality",
      "deletion test",
      "test surface",
    ]) {
      expect(design).toContain(term);
    }
    expect(design).toMatch(
      /one adapter[\s\S]*hypothetical seam[\s\S]*two adapters[\s\S]*real one/iu,
    );
    expect(design).toMatch(
      /speculative seams[\s\S]*forwarding-only layers[\s\S]*syntax-only\s+deduplication/iu,
    );
  });

  it("ships a safe, evidence-backed architecture discovery route", async () => {
    expect.hasAssertions();
    const [skill, prompt, notice, readme] = await Promise.all([
      read("skills/improve-codebase-architecture/SKILL.md"),
      read("prompts/improve.md"),
      read("THIRD_PARTY_NOTICES.md"),
      read("README.md"),
    ]);

    expect(skill).toMatch(
      /optional[\s\S]*module[\s\S]*subsystem[\s\S]*pain point[\s\S]*change-history scope/iu,
    );
    expect(skill).toMatch(/nearest domain context[\s\S]*architecture decisions/iu);
    expect(skill).toMatch(/one optional bounded Researcher handoff[\s\S]*direct parent/iu);
    expect(skill).toMatch(/hot-spot[\s\S]*caller scan/iu);
    expect(skill).toMatch(/`codebase-design`/u);
    expect(skill).toMatch(
      /ranked[\s\S]*current friction[\s\S]*involved files[\s\S]*proposed deeper module[\s\S]*locality[\s\S]*leverage[\s\S]*test effect[\s\S]*decision conflicts[\s\S]*strength/iu,
    );
    expect(skill).toMatch(/before[\s\S]*after[\s\S]*diagram/iu);
    expect(skill).toMatch(/`question`[\s\S]*select[\s\S]*tool is unavailable[\s\S]*conversation/iu);
    expect(skill).toMatch(/Shape[\s\S]*planning[\s\S]*Shape is unavailable[\s\S]*parent/iu);
    expect(skill).toMatch(/do not edit production code directly/iu);
    expect(prompt).toMatch(/`improve-codebase-architecture` skill/iu);
    expect(prompt).toMatch(/\$\{ARGUMENTS:-/u);
    expect(readme).toMatch(/`\/improve`/u);
    expect(notice).toMatch(
      /skills\/improve-codebase-architecture\/SKILL\.md[\s\S]*adapted[\s\S]*068b6e0c62393147daf03530149cdce209c93da8/iu,
    );
  });

  it("keeps the upstream debugging skill and HITL template verbatim with Pi additions", async () => {
    expect.hasAssertions();
    const [skill, template] = await Promise.all([
      read("skills/diagnosing-bugs/SKILL.md"),
      read("skills/diagnosing-bugs/scripts/hitl-loop.template.sh"),
    ]);
    const separator = "\n## Pi debug additions\n";
    const separatorIndex = skill.indexOf(separator);

    expect(separatorIndex).toBeGreaterThan(0);
    expect(createHash("sha256").update(skill.slice(0, separatorIndex)).digest("hex")).toBe(
      "573142d28dc5a4d931dd4a6faa3e615e731f8e9cc65d2dd4468045a2efd6148c",
    );
    expect(createHash("sha256").update(template).digest("hex")).toBe(
      "18ae07e1cc49b32c71767e241a6e8de4be74ef21d5e3b7e39034d9c7335f2d80",
    );
    expect(skill.slice(separatorIndex)).toMatch(/dedicated worktree/iu);
    expect(skill.slice(separatorIndex)).toMatch(/`question` tool/iu);
    expect(skill.slice(separatorIndex)).toMatch(/`test-driven-development` skill/iu);
  });

  it("expands the /implement, /debug, and /improve prompts", async () => {
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

    expect(piPromptTemplates.expandPromptTemplate("/implement", templates)).toContain(
      "Ask for an approved slice",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/implement tighten retry limit", templates),
    ).toContain("tighten retry limit");
    expect(piPromptTemplates.expandPromptTemplate("/debug", templates)).toContain(
      "diagnosing-bugs",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/debug export crashes after sign-in", templates),
    ).toContain("export crashes after sign-in");
    expect(piPromptTemplates.expandPromptTemplate("/improve", templates)).toContain(
      "Infer a bounded scope",
    );
    expect(piPromptTemplates.expandPromptTemplate("/improve checkout flow", templates)).toContain(
      "checkout flow",
    );
  });
});
