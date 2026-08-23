import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);

async function resource(path: string): Promise<string> {
  return readFile(new URL(path, root), "utf8");
}

describe("design review resource contract", () => {
  it("requires compact image-backed, verified board feedback and lifecycle control for material design", async () => {
    expect.hasAssertions();
    const [prompt, frontendDesign, interfaceDesign, imageGeneration, visualValidation, readme] =
      await Promise.all([
        resource("prompts/design.md"),
        resource("skills/frontend-design/SKILL.md"),
        resource("skills/interface-design/SKILL.md"),
        resource("skills/image-generation/SKILL.md"),
        resource("skills/visual-validation/SKILL.md"),
        resource("README.md"),
      ]);
    expect(prompt).toMatch(/design_board[\s\S]*before asking for a visual choice/iu);
    expect(frontendDesign).toMatch(/mechanical[\s\S]*direct/iu);
    expect(interfaceDesign).toMatch(/at\s+most four/iu);
    expect(interfaceDesign).toMatch(/two to eight[\s\S]*image evidence/iu);
    expect(interfaceDesign).toMatch(
      /design_board[\s\S]*verif[\s\S]*URL[\s\S]*before requesting[\s\S]*feedback/iu,
    );
    expect(interfaceDesign).toMatch(/feedbackMode:[^\n]*cli[\s\S]*question/iu);
    expect(interfaceDesign).toMatch(
      /For image-backed CLI feedback,[^.]*question[^.]*presentation:\s*"inline"[^.]*below[^.]*\.[^.]*fallback\./iu,
    );
    expect(readme).toMatch(
      /For image-backed CLI feedback,[^.]*presentation:\s*"inline"[^.]*below[^.]*\.[^.]*fallback\./iu,
    );
    expect(interfaceDesign).toMatch(/separate target-owned live-site\s+URL/iu);
    expect(interfaceDesign).toMatch(/milestone[\s\S]*same\s+`design_board`/iu);
    expect(interfaceDesign).toMatch(/open[\s\S]*keep serving[\s\S]*close/iu);
    expect(imageGeneration).toMatch(/explicit consent/iu);
    expect(visualValidation).toMatch(/unmet proof/iu);
    expect(readme).toMatch(/board\/site distinction/iu);
    expect(readme).toMatch(/localhost-only/iu);
    expect(readme).toMatch(/full-width visual[\s\S]*feedbackMode: "board"/iu);
    expect(readme).toMatch(/unavailable review surface/iu);
  });
});

describe("interface craft resource contract", () => {
  const operations = ["design", "extract", "document", "critique", "audit", "polish", "bolder", "quieter", "distill", "harden", "onboard", "animate", "colorize", "typeset", "layout", "delight", "overdrive", "clarify", "adapt", "optimize", "live"];

  it("discovers and routes the complete attributed operation catalog without an Impeccable runtime", async () => {
    expect.hasAssertions();
    const [catalog, prompt, frontendDesign, frontendDevelopment, interfaceDesign, readme, manifest, license, notice] = await Promise.all([
      resource("skills/interface-craft/SKILL.md"), resource("prompts/design.md"), resource("skills/frontend-design/SKILL.md"), resource("skills/frontend-development/SKILL.md"), resource("skills/interface-design/SKILL.md"), resource("README.md"), resource("package.json"), resource("LICENSE"), resource("NOTICE.md"),
    ]);
    expect(catalog).toMatch(/^---\nname: interface-craft\ndescription:.*polish.*audit.*layout.*clarify.*adapt.*optimize.*onboard.*bolder.*quieter/im);
    expect(catalog).toMatch(/operation router/iu);
    for (const operation of operations) {
      const reference = await resource(`skills/interface-craft/references/${operation}.md`);
      expect(catalog).toMatch(new RegExp(`\\b${operation}\\b`, "u"));
      expect(reference).toMatch(/Modified from Impeccable 4\.1\.1/iu);
      expect(reference).toMatch(/56f44523f76efdcec813e67b38ee550e49b16f48/u);
      expect(reference).toMatch(/Scope[\s\S]*Evidence[\s\S]*Handoff[\s\S]*Completion/iu);
      expect(reference).toMatch(/implement|developing-changes/iu);
    }
    for (const phrase of ["polish this", "audit", "settings flow", "mobile layout", "make this calmer", "improve", "onboarding", "clarify", "errors", "document the design system", "Normalize"]) expect(prompt).toContain(phrase);
    expect(prompt).toMatch(/teach me this design\s+system/iu);
    for (const source of [frontendDesign, frontendDevelopment, interfaceDesign, readme]) expect(source).toMatch(/interface-craft/iu);
    expect(manifest).toMatch(/"license": "MIT AND Apache-2\.0"/u);
    expect(manifest).toMatch(/"NOTICE\.md"/u);
    expect(license).toMatch(/Apache License\s+Version 2\.0/iu);
    expect(notice).toMatch(/Impeccable/iu);
    for (const forbidden of ["npx impeccable", ".impeccable/", "PRODUCT.md", "/impeccable", "question server"]) expect(catalog).not.toContain(forbidden);
    expect(catalog).toContain("feature pitch lifecycle");
    expect(catalog).toContain("`init` or `craft`");
  });
});
