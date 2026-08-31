import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const SKILLS = {
  typescript: [
    "inference",
    "boundaries",
    "unions",
    "narrowing",
    "generics",
    "assertions",
    "errors",
    "async",
    "modules",
    "api-design",
  ],
  "typescript-library": [
    "package-design",
    "esm",
    "exports",
    "public-types",
    "dependencies",
    "compatibility",
  ],
  "typescript-testing": ["unit-testing", "integration-testing", "type-testing", "async-testing"],
  "typescript-review": ["correctness", "type-safety", "architecture", "maintainability"],
  "typescript-modernize": [
    "legacy-patterns",
    "remove-any",
    "remove-assertions",
    "simplify-architecture",
    "improve-state-models",
  ],
} as const;

describe("TypeScript skills package", () => {
  it("is an independent, discoverable skill-only Pi package", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await readFile(join(PACKAGE_ROOT, "package.json"), "utf8")) as {
      dependencies?: unknown;
      devDependencies?: unknown;
      peerDependencies?: unknown;
      pi?: { extensions?: unknown; skills?: string[] };
    };

    expect(manifest.pi?.skills).toEqual(["./skills"]);
    expect(manifest.pi?.extensions).toBeUndefined();
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.devDependencies).toEqual({ vitest: "4.1.10" });
    expect(manifest.peerDependencies).toBeUndefined();
  });

  it("ships exactly five compact entry skills and all requested references", async () => {
    expect.hasAssertions();
    const entries = await readdir(join(PACKAGE_ROOT, "skills"), { withFileTypes: true });
    expect(
      entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(Object.keys(SKILLS).sort((left, right) => left.localeCompare(right)));

    for (const [name, references] of Object.entries(SKILLS)) {
      const root = join(PACKAGE_ROOT, "skills", name);
      const [skill, files] = await Promise.all([
        readFile(join(root, "SKILL.md"), "utf8"),
        readdir(join(root, "references")),
      ]);
      expect(skill).toContain(`name: ${name}`);
      expect(skill.length).toBeLessThan(5000);
      expect(
        files
          .filter((file) => file.endsWith(".md"))
          .sort((left, right) => left.localeCompare(right)),
      ).toEqual(
        references
          .map((reference) => `${reference}.md`)
          .sort((left, right) => left.localeCompare(right)),
      );
      for (const reference of references) expect(skill).toContain(`references/${reference}.md`);
    }
  });

  it("makes every reference a substantive, topic-specific chapter", async () => {
    expect.hasAssertions();
    for (const [skill, references] of Object.entries(SKILLS)) {
      for (const reference of references) {
        const content = await readFile(
          join(PACKAGE_ROOT, "skills", skill, "references", `${reference}.md`),
          "utf8",
        );
        expect(content.trim().split(/\s+/u).length).toBeGreaterThanOrEqual(140);
        expect((content.match(/^## /gmu) ?? []).length).toBeGreaterThanOrEqual(3);
        expect(content).toMatch(/decision|choose|prefer|when to use/iu);
        expect(content).toMatch(/failure|risk|avoid|wrong|break/iu);
        expect(content).toMatch(/example|procedure|step|before|after/iu);
      }
    }
  });

  it("records the PRD-specific workflows that shallow placeholders miss", async () => {
    expect.hasAssertions();
    const read = (path: string) => readFile(join(PACKAGE_ROOT, "skills", path), "utf8");
    const [core, review, library, testing, modernize] = await Promise.all([
      read("typescript/SKILL.md"),
      read("typescript-review/SKILL.md"),
      read("typescript-library/SKILL.md"),
      read("typescript-testing/SKILL.md"),
      read("typescript-modernize/SKILL.md"),
    ]);
    const allReferences = await Promise.all(
      Object.entries(SKILLS).flatMap(([skill, references]) =>
        references.map((reference) => read(`${skill}/references/${reference}.md`)),
      ),
    );
    const content = [core, review, library, testing, modernize, ...allReferences].join("\n");

    expect(core).toMatch(/instructions.*package\.json.*tsconfig.*commands/isu);
    expect(core).toMatch(/inspect.*before.*change.*typecheck.*targeted test.*inspect/isu);
    for (let priority = 1; priority <= 10; priority += 1) {
      expect(review).toMatch(new RegExp(`(?:^|\\n)${String(priority)}\\.`, "u"));
    }
    for (const rule of [
      "no-unsafe-assignment",
      "no-unsafe-call",
      "no-unsafe-member-access",
      "no-unsafe-return",
      "no-floating-promises",
      "no-misused-promises",
      "no-unnecessary-condition",
      "no-unnecessary-type-assertion",
      "switch-exhaustiveness-check",
    ]) {
      expect(content).toContain(rule);
    }
    expect(content).toMatch(/installed version.*preset/isu);
    expect(content).toMatch(/canonical.*(?:"idle"|idle).*"loading"/isu);
    expect(content).toMatch(/Vitest.*Jest.*node:test.*Playwright/isu);
    expect(content).toMatch(/runtime.*static|static.*runtime/isu);
    expect(content).toMatch(/declaration.*public.*inference|public.*inference.*declaration/isu);
    expect(content).toMatch(/export.*test|test.*export/isu);
    expect(content).toMatch(/incremental.*(?:compiler|eslint|ESM)/isu);
  });

  it("teaches a JavaScript-native, calibrated core workflow", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills/typescript/SKILL.md"), "utf8");
    for (const phrase of [
      "not Java or C# with structural typing",
      "inference",
      "meaningful boundaries",
      "unknown",
      "narrowing",
      "parsing",
      "discriminated unions",
      "canonical runtime values",
      "satisfies",
      "narrow exports",
      "demonstrated abstraction",
      "compiler",
      "continuous typechecking",
      "strict",
      "useUnknownInCatchVariables",
      "noUncheckedIndexedAccess",
      "exactOptionalPropertyTypes",
      "noImplicitOverride",
      "incremental",
    ]) {
      expect(skill).toContain(phrase);
    }
  });

  it("keeps specialist methods repository-aware and portable", async () => {
    expect.hasAssertions();
    const contents = await Promise.all(
      Object.keys(SKILLS).map((name) =>
        readFile(join(PACKAGE_ROOT, "skills", name, "SKILL.md"), "utf8"),
      ),
    );
    const [core, library, testing, review, modernize] = contents;
    expect(core).toMatch(/target repository.*instructions/isu);
    expect(library).toMatch(/exports.*ESM.*public type.*dependenc.*compatib/isu);
    expect(testing).toMatch(/runtime.*boundary.*type-level.*target.*runner/isu);
    expect(review).toMatch(/impact.*unsafe.*state.*async.*export/isu);
    expect(modernize).toMatch(/small.*reviewable.*before.*after.*rewrite/isu);
    for (const skill of contents) {
      expect(skill).not.toMatch(/pi-extensions|packages\/|node_modules|\/Users\//iu);
    }
  });

  it("documents installation, commands, examples, and classified sources", async () => {
    expect.hasAssertions();
    const readme = await readFile(join(PACKAGE_ROOT, "README.md"), "utf8");
    expect(readme).toContain("pi install npm:@mopeyjellyfish/pi-typescript");
    for (const name of Object.keys(SKILLS)) expect(readme).toContain(`/skill:${name}`);
    for (const url of [
      "https://www.typescriptlang.org/docs/",
      "https://www.typescriptlang.org/tsconfig/",
      "https://typescript-eslint.io/",
      "https://effectivetypescript.com/",
      "https://github.com/sindresorhus/tsconfig",
    ]) {
      expect(readme).toContain(url);
    }
    for (const revision of [
      "e67851cfcca008592c7c4965b8220c7cb37e2f1c",
      "6654f6b60cd9d5be8b54c6fafe44346dabeb3b76",
      "a74f281a27dadc02397bc1a174b0f2c97531b6ae",
      "063bee94c3f4df8453406c830b0a7df0f2860278",
      "5be6cdab9c13bc2a7eb9ef345d497ba8ae43f919",
      "5db01b5dc2492011deee834e5bb175804f05c198",
    ]) {
      expect(readme).toContain(revision);
    }
    expect(readme).toMatch(/contextual.*activat/iu);
    expect(readme).toMatch(/example.*unknown.*parsing/isu);
    expect(readme).toMatch(/Microsoft.*semantics/iu);
    expect(readme).toMatch(/typescript-eslint.*executable/iu);
    expect(readme).toMatch(/practitioner/iu);
    expect(readme).toMatch(/example/iu);
  });

  it("packs every skill entry and reference", () => {
    expect.hasAssertions();
    const packed = JSON.parse(
      execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts", PACKAGE_ROOT], {
        cwd: join(PACKAGE_ROOT, "..", ".."),
        encoding: "utf8",
      }),
    ) as { files: { path: string }[] }[];
    const paths = packed[0]?.files.map(({ path }) => path) ?? [];

    for (const [name, references] of Object.entries(SKILLS)) {
      expect(paths).toContain(`skills/${name}/SKILL.md`);
      for (const reference of references) {
        expect(paths).toContain(`skills/${name}/references/${reference}.md`);
      }
    }
  });
});
