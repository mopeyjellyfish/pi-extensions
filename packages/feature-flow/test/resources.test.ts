import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(PACKAGE_ROOT, "..", "..");

describe("feature-flow resources", () => {
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
        "skills/shape/references/workspace.md",
        "skills/shape/templates/index.json",
        "skills/shape/templates/pitch.md",
      ]),
    );
    expect(packedPaths?.some((path) => path.startsWith("test/"))).toBe(false);
  });
});
