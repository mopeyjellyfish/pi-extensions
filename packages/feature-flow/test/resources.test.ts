import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");
const PITCH_HEADINGS = [
  "Executive summary",
  "Problem",
  "Appetite",
  "Research and prior art",
  "Solution",
  "Fixed decisions",
  "Rabbit holes",
  "No-gos",
  "Acceptance criteria",
];

describe("feature-flow resources", () => {
  it("guides one Git-native Shape Up flow", async () => {
    expect.hasAssertions();
    const [skill, pitch, plan, readme] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "skills", "shape", "SKILL.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "shape", "templates", "pitch.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "shape", "templates", "plan.md"), "utf8"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
    ]);

    expect(skill).toMatch(/Worktrunk[\s\S]*only\s+worktree lifecycle authority/iu);
    expect(skill).toContain('action: "status"');
    expect(skill).toContain('action: "list"');
    expect(skill).toContain("`feat/<slug>`");
    expect(skill).toContain("git branch --show-current");
    expect(skill).toMatch(/complete pitch[\s\S]*read-only review[\s\S]*human approval/iu);
    expect(skill).toMatch(/first unchecked slice[\s\S]*dirty[\s\S]*Git/iu);
    expect(skill).toMatch(/tests[\s\S]*required checks[\s\S]*read-only review/iu);
    expect(skill).toMatch(/never infer[^.]*commit[^.]*push[^.]*deploy/iu);
    expect(skill).toMatch(/fresh human approval[\s\S]*status: accepted/iu);
    expect(skill).not.toMatch(/feature-flow\.mjs|index\.json|sha-?256|banking|Feature-Slice/iu);
    expect(readme).toMatch(/aggregate package[\s\S]*not a standalone/iu);
    expect(readme).toContain("pi install git:github.com/mopeyjellyfish/pi-extensions");
    expect(`${skill}\n${readme}`).not.toMatch(/shape\/(?:<slug>|\*)/u);

    expect(pitch).toMatch(/^---\nstatus: draft\n---/u);
    expect(pitch.match(/^## .+$/gmu)?.map((heading) => heading.slice(3))).toEqual(PITCH_HEADINGS);
    expect(plan).toContain("## [ ] 001 — Observable vertical outcome");
    expect(plan).toMatch(/first unchecked slice/iu);
    expect(plan).not.toMatch(/depends_on|evidence|banking|estimate/iu);
  });

  it("expands one /shape prompt with or without a brief", async () => {
    expect.hasAssertions();
    const prompt = await readFile(join(PACKAGE_ROOT, "prompts", "shape.md"), "utf8");
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

    expect(prompt).toContain("${ARGUMENTS:-Resume the active feature from Git and its plan.}");
    expect(piPromptTemplates.expandPromptTemplate("/shape", templates)).toContain(
      "Resume the active feature from Git and its plan.",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/shape add resumable uploads", templates),
    ).toContain("add resumable uploads");
  });

  it("packs only the skill, prompt, and two templates", async () => {
    expect.hasAssertions();
    const packageManifest = JSON.parse(
      await readFile(join(PACKAGE_ROOT, "package.json"), "utf8"),
    ) as { files: string[]; pi: { skills: string[]; prompts: string[] } };
    const rootManifest = JSON.parse(
      await readFile(join(REPOSITORY_ROOT, "package.json"), "utf8"),
    ) as { pi: { skills: string[]; prompts: string[] } };
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: REPOSITORY_ROOT,
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const packedPaths = packed[0]?.files.map(({ path }) => path) ?? [];

    expect(packageManifest.pi).toEqual({ skills: ["./skills"], prompts: ["./prompts"] });
    expect(packageManifest.files).not.toContain("scripts/feature-flow.mjs");
    expect(rootManifest.pi.skills).toContain("./packages/*/skills");
    expect(rootManifest.pi.prompts).toEqual(["./packages/*/prompts"]);
    expect(await readdir(join(PACKAGE_ROOT, "skills"))).toEqual(["shape"]);
    expect(await readdir(join(PACKAGE_ROOT, "prompts"))).toEqual(["shape.md"]);
    expect(packedPaths).toEqual(
      expect.arrayContaining([
        "README.md",
        "prompts/shape.md",
        "skills/shape/SKILL.md",
        "skills/shape/templates/pitch.md",
        "skills/shape/templates/plan.md",
      ]),
    );
    expect(
      packedPaths.some(
        (path) =>
          path.startsWith("scripts/") ||
          path.startsWith("test/") ||
          path.startsWith("docs/") ||
          path.includes("/references/") ||
          path.endsWith("templates/index.json"),
      ),
    ).toBe(false);
  });
});
