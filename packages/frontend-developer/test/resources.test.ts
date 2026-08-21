import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const packageRoot = resolve(import.meta.dirname, "..");
const root = resolve(packageRoot, "../..");

async function text(path: string): Promise<string> {
  return readFile(resolve(packageRoot, path), "utf8");
}

describe("frontend developer package resources", () => {
  it("ships the independent design workflow and its public prompts", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await text("package.json")) as {
      name: string;
      pi: { prompts: string[]; skills: string[] };
    };
    expect(manifest.name).toBe("@mopeyjellyfish/pi-frontend-developer");
    expect(manifest.pi.skills).toEqual(["./skills"]);
    expect(manifest.pi.prompts).toEqual(["./prompts"]);

    const [workflow, design, contract, template, frontendPrompt, designPrompt] = await Promise.all([
      text("skills/frontend-development/SKILL.md"),
      text("skills/frontend-design/SKILL.md"),
      text("skills/frontend-design/references/design-contract.md"),
      text("skills/frontend-design/assets/DESIGN.template.md"),
      text("prompts/frontend.md"),
      text("prompts/design-ui.md"),
    ]);
    expect(workflow).toContain("frontend-design");
    expect(design).toMatch(
      /Repository instructions and observed\s+product behavior take precedence over DESIGN\.md/,
    );
    expect(contract).toMatch(
      /Ask for approval before\s+creating or materially\s+rewriting DESIGN\.md/,
    );
    expect(template).toContain("## Visual thesis");
    expect(frontendPrompt).toContain("frontend request");
    expect(designPrompt).toContain("design request");
    expect(`${workflow}\n${design}\n${contract}`).toMatch(/ambiguity|ambiguous/i);
    expect(`${workflow}\n${design}\n${contract}`).toMatch(/native accessible/i);
    expect(`${workflow}\n${design}\n${contract}`).not.toMatch(
      /pi-extensions|Playwright tool|Anthropic|OpenAI/,
    );
    const react = await text("skills/react-interface/SKILL.md");
    expect(react).toMatch(/preserve.*target.*stack/i);
    expect(react).toMatch(/loading.*empty.*error.*focus.*hover.*disabled.*responsive/i);
    expect(react).toMatch(/semantic|keyboard|reduced motion|contrast/i);
    expect(react).not.toMatch(/require.*Tailwind|require.*component library/i);
    const visual = await text("skills/visual-validation/SKILL.md");
    expect(visual).toMatch(/browser[\s\S]*capability[\s\S]*unmet proof/i);
    expect(visual).toMatch(/desktop[\s\S]*mobile[\s\S]*viewport[\s\S]*state/i);
    expect(visual).toMatch(
      /mismatch ledger[\s\S]*severity[\s\S]*evidence[\s\S]*likely cause[\s\S]*recheck/i,
    );
    expect(visual).toMatch(
      /keyboard[\s\S]*focus[\s\S]*reduced.motion[\s\S]*console[\s\S]*overflow/i,
    );

    await expect(access(resolve(packageRoot, "README.md"))).resolves.toBeUndefined();
    await expect(access(resolve(packageRoot, "CHANGELOG.md"))).resolves.toBeUndefined();
    await expect(access(resolve(packageRoot, "LICENSE"))).resolves.toBeUndefined();
    const releases = await readFile(resolve(root, "release-please-config.json"), "utf8");
    expect(releases).toContain('"packages/frontend-developer"');
  });
});
