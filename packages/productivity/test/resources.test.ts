import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");
const REPOSITORY_ROOT = join(ROOT, "..", "..");
const read = (...parts: string[]) => readFile(join(ROOT, ...parts), "utf8");

describe("productivity resources", () => {
  it("ships the writing-for-agents skill", async () => {
    expect.hasAssertions();
    const skill = await read("skills", "writing-for-agents", "SKILL.md");
    expect(skill).toContain("name: writing-for-agents");
    expect(skill).toMatch(/context pointers[\s\S]*source of truth/iu);
    expect(skill).toMatch(/goal[\s\S]*constraints[\s\S]*evidence[\s\S]*completion criteria/iu);
    expect(skill).toMatch(/exact technical content/iu);
    expect(skill).toMatch(/stale[\s\S]*no-op/iu);
    expect(skill).toMatch(/CONTEXT\.md/iu);
  });

  it("ships an expandable repair prompt with the required decision path", async () => {
    expect.hasAssertions();
    const prompt = await read("prompts", "wait-what.md");
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
      cwd: ROOT,
      agentDir: ROOT,
      promptPaths: [join(ROOT, "prompts")],
      includeDefaults: false,
    });

    expect(prompt).toContain("${ARGUMENTS:-");
    expect(piPromptTemplates.expandPromptTemplate("/wait-what", templates)).toContain(
      "Re-pitch the current message using this structure.",
    );
    expect(
      piPromptTemplates.expandPromptTemplate("/wait-what explain the release gate", templates),
    ).toContain("explain the release gate");
    expect(prompt).toMatch(/missing context[\s\S]*problem[\s\S]*current state/iu);
    expect(prompt).toMatch(/proposal or tradeoff[\s\S]*next human decision/iu);
    expect(prompt).toMatch(/Simplified Technical English|simple-english/iu);
  });

  it("declares only skills and prompts and packs their resources", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await read("package.json")) as Record<string, unknown>;
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", ROOT], {
        cwd: join(ROOT, "..", ".."),
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const paths = packed[0]?.files.map(({ path }) => path) ?? [];

    expect(manifest).toMatchObject({
      name: "@mopeyjellyfish/pi-productivity",
      version: "0.0.0",
      license: "MIT",
      pi: { skills: ["./skills"], prompts: ["./prompts"] },
    });
    expect(manifest).not.toHaveProperty("dependencies");
    expect(manifest).not.toHaveProperty("peerDependencies");
    expect(manifest).not.toHaveProperty("pi.extensions");
    expect(paths).toEqual(
      expect.arrayContaining(["skills/writing-for-agents/SKILL.md", "prompts/wait-what.md"]),
    );
  });
});
