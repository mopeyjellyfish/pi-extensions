import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");

const readPackageFile = (...parts: string[]) => readFile(join(PACKAGE_ROOT, ...parts), "utf8");

describe("simple-english skill", () => {
  it("ships pragmatic ASD-STE100 guidance for human-facing text", async () => {
    expect.hasAssertions();
    const [skill, useCases, checklist, readme] = await Promise.all([
      readPackageFile("skills", "simple-english", "SKILL.md"),
      readPackageFile("skills", "simple-english", "references", "use-cases.md"),
      readPackageFile("skills", "simple-english", "references", "checklist.md"),
      readPackageFile("README.md"),
    ]);

    expect(skill).toContain("name: simple-english");
    expect(skill).toMatch(/documentation[\s\S]*human communication/iu);
    expect(skill).toContain("ASD-STE100");
    expect(readme).not.toContain("## Source");
    expect(skill).toMatch(/Pragmatic[\s\S]*default/iu);
    expect(skill).toMatch(/20 words[\s\S]*25 words/iu);
    expect(skill).toContain("references/checklist.md");
    expect(skill).toContain("references/use-cases.md");
    expect(skill).toMatch(/full compliance[\s\S]*official dictionary/iu);
    expect(useCases).toContain("## Commit messages and PR descriptions");
    expect(checklist).toContain("## Mechanical checks");
  });

  it("applies Simple English to feature pitches and plans without changing contracts", async () => {
    expect.hasAssertions();
    const shape = await readFile(
      join(import.meta.dirname, "..", "..", "feature-flow", "skills", "shape", "SKILL.md"),
      "utf8",
    );

    expect(shape).toContain("`simple-english` skill");
    expect(shape).toMatch(/pitch[\s\S]*descriptive[\s\S]*plan[\s\S]*procedural/iu);
    expect(shape).toMatch(/preserve[\s\S]*headings[\s\S]*frontmatter[\s\S]*checkbox/iu);
  });
});
