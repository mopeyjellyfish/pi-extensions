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
      pi: { extensions: string[]; prompts: string[]; skills: string[] };
    };
    expect(manifest.name).toBe("@mopeyjellyfish/pi-frontend-developer");
    expect(manifest.pi.extensions).toEqual(["./src/index.ts"]);
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
      /Repository instructions and observed\s+product behavior\s+take precedence over DESIGN\.md/,
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
    const [imageSkill, imagePrompt] = await Promise.all([
      text("skills/image-generation/SKILL.md"),
      text("prompts/generate-image.md"),
    ]);
    expect(imageSkill).toMatch(/separately billed|privacy|OpenAI Platform/i);
    expect(imageSkill).toMatch(/credential|no request/i);
    expect(imagePrompt).toContain("image-generation");

    await expect(access(resolve(packageRoot, "README.md"))).resolves.toBeUndefined();
    await expect(access(resolve(packageRoot, "CHANGELOG.md"))).resolves.toBeUndefined();
    await expect(access(resolve(packageRoot, "LICENSE"))).resolves.toBeUndefined();
    const releases = await readFile(resolve(root, "release-please-config.json"), "utf8");
    expect(releases).toContain('"packages/frontend-developer"');
  });

  it("ships the integrated, attributable app-interface method", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await text("package.json")) as { files: string[] };
    const [method, license, contract, template, router, workflow, prompt, readme] =
      await Promise.all([
        text("skills/interface-design/SKILL.md"),
        text("skills/interface-design/LICENSE.txt"),
        text("skills/frontend-design/references/design-contract.md"),
        text("skills/frontend-design/assets/DESIGN.template.md"),
        text("skills/frontend-design/SKILL.md"),
        text("skills/frontend-development/SKILL.md"),
        text("prompts/design-ui.md"),
        text("README.md"),
      ]);

    expect(manifest.files).toContain("skills/");
    expect(method).toMatch(/dashboards[\s\S]*admin panels[\s\S]*data interfaces/i);
    expect(license).toMatch(/MIT License[\s\S]*Copyright \(c\) 2026 Damola Akinleye/i);
    expect(license).toMatch(/permission is hereby granted/i);
    expect(readme).toMatch(/modified derivative/i);
    expect(readme).toContain("2f9be3206855bcb2d1d0af262c8bae25cba6658d");
    expect(readme).toMatch(/LICENSE\.txt/i);
    expect(method).not.toMatch(
      /Modified source notice|modified derivative|2f9be3206855bcb2d1d0af262c8bae25cba6658d/i,
    );

    expect(router).toMatch(/mechanical[\s\S]*direct/i);
    expect(router).toMatch(/non-trivial[\s\S]*app[\s\S]*interface-design/i);
    expect(router).toMatch(/marketing-site-design[\s\S]*available/i);
    expect(workflow).toMatch(/non-trivial[\s\S]*interface-design/i);
    expect(prompt).toContain("interface-design");

    expect(readme).toMatch(/interface-design/i);
    expect(readme).toMatch(/non-trivial app/i);
    expect(method).toMatch(/approval[\s\S]*(?:create|rewrite)[\s\S]*DESIGN\.md/i);
    expect(method).not.toMatch(/\b(?:\.interface-design\/)?system\.md\b/i);
    expect(contract).toMatch(
      /Ask for approval before\s+creating or materially\s+rewriting DESIGN\.md/,
    );
    expect(template).toContain("## Visual thesis");
    expect(method).toContain("[design contract](../frontend-design/references/design-contract.md)");
    expect(method).toContain("[DESIGN template](../frontend-design/assets/DESIGN.template.md)");
    expect(method).toMatch(/person[\s\S]*task[\s\S]*feel/i);
    expect(method).toMatch(/domain[\s\S]*color world[\s\S]*signature[\s\S]*defaults/i);
    expect(method).toMatch(/focal/i);
    expect(method).toMatch(/typography/i);
    expect(method).toMatch(/density/i);
    expect(method).toMatch(/spatial rhythm/i);
    expect(method).toMatch(/semantic tokens/i);
    expect(method).toMatch(/depth strategy/i);
    expect(method).toMatch(/existing accessible controls/i);
    expect(method).toMatch(/swap test[\s\S]*squint test[\s\S]*signature test[\s\S]*token test/i);
    expect(method).toMatch(/new or materially restyled component work/i);
    expect(method).toMatch(/mechanical edit[\s\S]*direct\s+build path/i);
    expect(method).toMatch(/## Visual Hierarchy & Composition[\s\S]*### One focal point per view/);

    expect(method).toMatch(/image-generation[\s\S]*privacy[\s\S]*cost[\s\S]*consent/i);
    expect(method).toMatch(
      /coherent material[\s\S]*feedback[\s\S]*structured-question[\s\S]*fallback/i,
    );
    expect(method).toMatch(/target.*hot-reload[\s\S]*cleanup/i);
    expect(method).toMatch(/preserves the target framework/i);
    expect(method).toMatch(/react-interface[\s\S]*target uses React/i);
    expect(method).toMatch(/visual-validation[\s\S]*unmet proof/i);
    expect(readme).toContain("/generate-image");
  });
});
