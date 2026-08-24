import { readFile, readdir } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);

async function resource(path: string): Promise<string> {
  return readFile(new URL(path, root), "utf8");
}

async function markdownResources(directory: string): Promise<string[]> {
  const paths: string[] = [];
  async function walk(relative: string): Promise<void> {
    const entries = await readdir(new URL(`${relative}/`, root), { withFileTypes: true });
    for (const entry of entries) {
      const path = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith(".md")) paths.push(path);
    }
  }
  await walk(directory);
  return Promise.all(paths.map(resource));
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
  const operations = [
    "design",
    "extract",
    "document",
    "critique",
    "audit",
    "polish",
    "bolder",
    "quieter",
    "distill",
    "harden",
    "onboard",
    "animate",
    "colorize",
    "typeset",
    "layout",
    "delight",
    "overdrive",
    "clarify",
    "adapt",
    "optimize",
    "live",
  ];

  it("routes natural web-interface requests through complete, portable operation guidance", async () => {
    expect.hasAssertions();
    const [
      catalog,
      documentation,
      prompt,
      frontendDesign,
      frontendDevelopment,
      interfaceDesign,
      readme,
      manifest,
      license,
      notice,
    ] = await Promise.all([
      resource("skills/interface-craft/SKILL.md"),
      resource("skills/interface-craft/references/document.md"),
      resource("prompts/design.md"),
      resource("skills/frontend-design/SKILL.md"),
      resource("skills/frontend-development/SKILL.md"),
      resource("skills/interface-design/SKILL.md"),
      resource("README.md"),
      resource("package.json"),
      resource("LICENSE"),
      resource("NOTICE.md"),
    ]);
    expect(catalog).toMatch(/^---\nname: interface-craft\ndescription:[\s\S]*web-interface/imu);
    expect(catalog).toMatch(/first-class.*natural-language.*router/isu);
    expect(catalog).toMatch(
      /settings flow.*mobile layout.*make this calmer.*document.*design system/isu,
    );
    expect(catalog).toMatch(/`\/shape` remains the feature pitch lifecycle/iu);
    expect(catalog).toMatch(/package-level Apache attribution[\s\S]*`NOTICE\.md`/iu);
    const frontmatter = catalog.slice(0, catalog.indexOf("\n---", 4));
    for (const operation of ["clarify", "adapt", "optimize", "bolder", "quieter", "distill"])
      expect(frontmatter).toMatch(new RegExp(`\\b${operation}\\b`, "u"));
    for (const phrase of [
      "polish this",
      "audit the settings flow",
      "fix the mobile layout",
      "make this calmer",
      "improve onboarding",
      "clarify the errors",
      "document the design system",
      "teach me this design system",
      "Normalize",
    ])
      expect(prompt).toMatch(new RegExp(phrase.replaceAll(" ", "\\s+"), "iu"));
    for (const source of [frontendDesign, frontendDevelopment, interfaceDesign, readme])
      expect(source).toMatch(/interface-craft/iu);
    expect(documentation).toMatch(/repository-native.*`\/design` workflow/iu);
    expect(documentation).toMatch(/upstream.*does not provide.*`design\.md`/isu);
    expect(documentation).toMatch(/explicit human approval[\s\S]*DESIGN\.md/iu);
    expect(manifest).toMatch(/"license": "MIT AND Apache-2\.0"/u);
    expect(manifest).toMatch(/"NOTICE\.md"/u);
    expect(license).toMatch(/Apache License\s+Version 2\.0/iu);
    expect(license).toMatch(/APPENDIX: How to apply the Apache License/iu);
    expect(notice).toMatch(/Impeccable[\s\S]*4\.1\.1/iu);
    expect(notice).toContain("56f44523f76efdcec813e67b38ee550e49b16f48");
    expect(notice).toMatch(/Apache-2\.0[\s\S]*Paul Bakaus/iu);

    for (const operation of operations) {
      const source = await resource(`skills/interface-craft/references/${operation}.md`);
      expect(source).not.toMatch(/^(?:Modified from|Source:|Adapted from) Impeccable/mu);
    }

    const references = await Promise.all(
      operations.map(async (operation) => ({
        operation,
        source: await resource(`skills/interface-craft/references/${operation}.md`),
      })),
    );
    for (const { operation, source } of references) {
      expect(catalog).toMatch(new RegExp(`\\b${operation}\\b`, "u"));
      expect(source.split(/\s+/u).length).toBeGreaterThan(300);
    }
    expect(new Set(references.map(({ source }) => source))).toHaveLength(operations.length);
    const productUiReferences = await Promise.all(
      [
        "adapt",
        "animate",
        "bolder",
        "colorize",
        "critique",
        "delight",
        "layout",
        "overdrive",
        "quieter",
        "typeset",
      ].map((operation) => resource(`skills/interface-craft/references/${operation}.md`)),
    );
    for (const source of productUiReferences)
      expect(source).not.toMatch(/Persuade \+ Experience|marketing|landing pages?|portfolios?/iu);
    const adapt = await resource("skills/interface-craft/references/adapt.md");
    expect(adapt).not.toMatch(/\biOS\b|\bAndroid\b|\badaptive\b/iu);
    const polish = await resource("skills/interface-craft/references/polish.md");
    expect(polish).not.toMatch(/phone and tablet|supported OS versions|on native/iu);

    const nonAttributionResources = [
      ...(await markdownResources("skills")),
      ...(await markdownResources("prompts")),
      readme,
    ];
    const packedResources = [...nonAttributionResources, notice];
    for (const source of packedResources) {
      for (const forbidden of [
        "npx impeccable",
        ".impeccable/",
        "PRODUCT.md",
        "`/impeccable`",
        "impeccable/scripts",
        "design.json",
        "question server",
        "hooks.json",
        "bundled detector",
        "detect.mjs",
        "sub-agent",
        "Questions skipped",
      ])
        expect(source).not.toContain(forbidden);
    }
    for (const source of nonAttributionResources) {
      expect(source).not.toMatch(/\/(?:Users|home|tmp)\//u);
      expect(source).not.toMatch(/pi-extensions|packages\/frontend-developer/iu);
    }
  });

  it("provides one approval-gated portable DESIGN.md workflow for humans and agents", async () => {
    expect.hasAssertions();
    const [
      documentation,
      template,
      prompt,
      frontendDesign,
      designContract,
      interfaceDesign,
      readme,
      rootReadme,
      agents,
    ] = await Promise.all([
      resource("skills/design-documentation/SKILL.md"),
      resource("skills/design-documentation/assets/DESIGN.template.md"),
      resource("prompts/design.md"),
      resource("skills/frontend-design/SKILL.md"),
      resource("skills/frontend-design/references/design-contract.md"),
      resource("skills/interface-design/SKILL.md"),
      resource("README.md"),
      resource("../../README.md"),
      resource("../../AGENTS.md"),
    ]);
    expect(documentation).toMatch(/^---\nname: design-documentation\ndescription:.*DESIGN\.md/im);
    expect(prompt).toMatch(/design document[\s\S]*design-documentation/iu);
    expect(documentation).toMatch(/scan mode[\s\S]*seed mode[\s\S]*merge\/refresh mode/iu);
    expect(documentation).toMatch(/complete proposal[\s\S]*format: "md"[\s\S]*fullscreen/iu);
    expect(documentation).toMatch(
      /explicit human approval[\s\S]*create[\s\S]*material(?:ly)? rewrite/iu,
    );
    expect(documentation).toMatch(/cancel[\s\S]*not\s+approval/iu);
    expect(documentation).toMatch(
      /repository instructions[\s\S]*verified behavior[\s\S]*outrank/iu,
    );
    expect(documentation).toMatch(/preserve unknown[\s\S]*no silent overwrite/iu);
    for (const key of ["version", "name", "description", "omitted"])
      expect(template).toMatch(new RegExp(`^${key}:`, "mu"));
    for (const tokenGroup of ["colors", "typography", "rounded", "spacing", "components"])
      expect(documentation).toMatch(new RegExp(`\\b${tokenGroup}\\b`, "u"));
    expect(template).toMatch(
      /## Overview[\s\S]*## Colors[\s\S]*## Typography[\s\S]*## Layout[\s\S]*## Elevation & Depth[\s\S]*## Shapes[\s\S]*## Components[\s\S]*## Do's and Don'ts/iu,
    );
    for (const source of [frontendDesign, designContract, interfaceDesign, readme]) {
      expect(source).toMatch(/design-documentation/iu);
      expect(source).not.toMatch(/frontend-design\/assets\/DESIGN\.template\.md/iu);
    }
    await expect(resource("skills/frontend-design/assets/DESIGN.template.md")).rejects.toThrow();
    for (const profile of [rootReadme, agents]) {
      expect(profile).toMatch(/interface-craft/iu);
      expect(profile).toMatch(/design-documentation/iu);
    }
    for (const forbidden of ["PRODUCT.md", ".impeccable/", "design.json"]) {
      expect(documentation).not.toContain(forbidden);
      expect(template).not.toContain(forbidden);
    }
    for (const unsupported of ["motion:", "breakpoints:", "shadows:"]) {
      expect(template).not.toContain(unsupported);
    }
  });
});
