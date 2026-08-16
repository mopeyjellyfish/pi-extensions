import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
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
    expect(implement).toMatch(/terra-worker[\s\S]*standard[\s\S]*sol-worker[\s\S]*hard/iu);
    expect(implement).toMatch(/plan-less[\s\S]*standard/iu);
    expect(implement).toMatch(/escalate[\s\S]*sol-worker/iu);
    expect(implement).toMatch(/never retry[\s\S]*same tier/iu);
    expect(implement).toMatch(/trivial[\s\S]*direct(ly)? as the parent|parent[\s\S]*trivial/iu);
    expect(implement).toMatch(
      /sol-worker[\s\S]*fresh[\s\S]*foreground|terra-worker[\s\S]*fresh[\s\S]*foreground/iu,
    );
    expect(implement).toMatch(/fable-reviewer[\s\S]*fresh[\s\S]*read-only/iu);
    expect(implement).toMatch(
      /fable-reviewer[\s\S]*worktree[\s\S]*base\s+ref[\s\S]*pitch[\s\S]*plan[\s\S]*diff[\s\S]*verification\s+evidence/iu,
    );
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
    expect(readme).toMatch(/terra-worker[\s\S]*sol-worker[\s\S]*Fable[\s\S]*direct parent/iu);
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
        "skills/reviewing-changes/SKILL.md",
        "prompts/debug.md",
        "prompts/implement.md",
        "prompts/review-change.md",
      ]),
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

  it("expands the /implement and /debug prompts", async () => {
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
  });
});
