import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");

describe("feature-flow resources", () => {
  it("guides rich research-led shaping through one reviewed document approval and repitch", async () => {
    expect.hasAssertions();
    const [skill, shaping, artifacts, template, evaluation] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "skills", "shape", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "shape", "references", "shaping.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "shape", "references", "artifacts.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "shape", "templates", "pitch.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "shape", "references", "evaluation.md"), "utf8"),
    ]);

    expect(skill).toContain("[shaping and acceptance](references/shaping.md)");
    expect(shaping).toMatch(/repository truth[\s\S]*primary sources[\s\S]*material/iu);
    expect(shaping).toMatch(/separate read-only reviewer[\s\S]*blocker-free/iu);
    expect(shaping.indexOf("validate-pitch <feature>")).toBeLessThan(
      shaping.indexOf("whole-pitch approval question"),
    );
    expect(shaping).toMatch(/stable whole-pitch[\s\S]*exact current `pitch\.md` document bytes/iu);
    expect(shaping).toMatch(/explicit `accept` and `revise` options/iu);
    expect(shaping).toMatch(/redirects[\s\S]*continuation[\s\S]*stable question and option IDs/iu);
    expect(shaping).toMatch(/never[\s\S]*substitute a summary or link/iu);
    expect(shaping).toContain("accept <feature> <prospective-sha256>");
    expect(shaping).not.toContain("question({");
    expect(template).toMatch(/^---\nschema: feature-flow-pitch\/v3/mu);
    expect(template).toMatch(/add, remove, or rename\s+headings/iu);
    expect(artifacts).toContain("validate-pitch <feature>");
    expect(artifacts).toContain("accept <feature> <prospective-sha256>");
    expect(artifacts).toContain("verify <feature>");
    expect(artifacts).toContain("repitch <feature>");
    expect(artifacts).toMatch(
      /pitch\.md\.tmp-<pid>[\s\S]*index\.json\.tmp-<pid>[\s\S]*\.feature-flow-repitch-/u,
    );
    expect(evaluation).toContain("Acceptance and repitch rubric");
  });

  it("discovers and activates resume candidates through Worktrunk with one bounded choice", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "shape", "SKILL.md"), "utf8");
    const workspace = await readFile(
      join(PACKAGE_ROOT, "skills", "shape", "references", "workspace.md"),
      "utf8",
    );

    expect(skill).toContain('Call `worktree` with `action: "status"` first');
    expect(skill).toContain('then `action: "list"`');
    expect(skill.indexOf('action: "list"')).toBeLessThan(skill.indexOf("inspect-candidates"));
    expect(skill).toContain("Always report every stale and invalid diagnostic");
    expect(skill).toContain("one structured choice");
    expect(skill).toContain("activates its recorded branch");
    expect(skill).toContain("ask for a new feature brief only when all three arrays are empty");
    expect(workspace).toContain("Candidate inspection is read-only");
  });

  it("packs and aggregate-registers one shape skill and one /shape prompt", async () => {
    expect.hasAssertions();
    const packageManifest = JSON.parse(
      await readFile(join(PACKAGE_ROOT, "package.json"), "utf8"),
    ) as { files: string[]; pi: { skills: string[]; prompts: string[] } };
    const rootManifest = JSON.parse(
      await readFile(join(REPOSITORY_ROOT, "package.json"), "utf8"),
    ) as { pi: { skills: string[]; prompts: string[] } };
    const skillDirectories = await readdir(join(PACKAGE_ROOT, "skills"));
    const promptFiles = await readdir(join(PACKAGE_ROOT, "prompts"));
    const prompt = await readFile(join(PACKAGE_ROOT, "prompts", "shape.md"), "utf8");
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const packedPaths = packed[0]?.files.map(({ path }) => path);

    expect(packageManifest.pi).toEqual({ skills: ["./skills"], prompts: ["./prompts"] });
    expect(packageManifest.files).toContain("prompts/");
    expect(rootManifest.pi.skills).toContain("./packages/*/skills");
    expect(rootManifest.pi.prompts).toEqual(["./packages/*/prompts"]);
    expect(skillDirectories).toEqual(["shape"]);
    expect(promptFiles).toEqual(["shape.md"]);
    expect(prompt).toContain("Use the `shape` skill.");
    expect(prompt).toContain("${ARGUMENTS:-Resume the active feature from its ledger.}");
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
    const loadedPrompts = piPromptTemplates.loadPromptTemplates({
      cwd: PACKAGE_ROOT,
      agentDir: PACKAGE_ROOT,
      promptPaths: [join(PACKAGE_ROOT, "prompts")],
      includeDefaults: false,
    });
    expect(piPromptTemplates.expandPromptTemplate("/shape", loadedPrompts).trim()).toBe(
      "<!-- markdownlint-disable MD041 -->\n\nUse the `shape` skill. Resume the active feature from its ledger.",
    );
    expect(packedPaths).toEqual(
      expect.arrayContaining([
        "README.md",
        "prompts/shape.md",
        "scripts/feature-flow.mjs",
        "skills/shape/SKILL.md",
        "skills/shape/references/artifacts.md",
        "skills/shape/references/evaluation.md",
        "skills/shape/references/shaping.md",
        "skills/shape/references/workspace.md",
        "skills/shape/templates/index.json",
        "skills/shape/templates/pitch.md",
      ]),
    );
    expect(packedPaths?.some((path) => path.startsWith("test/"))).toBe(false);
  });
});
