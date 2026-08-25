import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");

describe("Go skill package", () => {
  it("discovers the Go skill through its independent package manifest", async () => {
    expect.hasAssertions();
    const [manifestText, skill] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "package.json"), "utf8"),
      readFile(join(PACKAGE_ROOT, "skills", "go", "SKILL.md"), "utf8"),
    ]);
    const manifest = JSON.parse(manifestText) as {
      name?: unknown;
      pi?: { extensions?: unknown; skills?: unknown };
    };

    expect(manifest.name).toBe("@mopeyjellyfish/pi-go");
    expect(manifest.pi?.skills).toEqual(["./skills"]);
    expect(manifest.pi?.extensions).toBeUndefined();
    expect(skill).toMatch(/^---\nname: go\ndescription:/u);
    expect(skill).toMatch(/Use whenever Go code is written/u);
  });
  it("recommends Testify assertions with concise table-driven test names", async () => {
    expect.hasAssertions();
    const skill = await readFile(join(PACKAGE_ROOT, "skills", "go", "SKILL.md"), "utf8");
    const testingPatterns = /## Testing Patterns\n([\s\S]*?)(?=\n## |$)/u.exec(skill)?.[1];

    expect(testingPatterns).toContain("https://github.com/stretchr/testify");
    expect(testingPatterns).toContain("require.NoError(t, err)");
    expect(testingPatterns).toContain("assert.Equal(t, tt.want, got)");
    expect(testingPatterns).not.toContain("go-cmp");
    expect(testingPatterns).toContain(
      "TestThatThisThingWorksWhenSomethingGoesWrongOneTuesdayInMay",
    );
    expect(testingPatterns).toContain("TestThingWorks");
    expect(testingPatterns).toContain("Table-driven subtests are the Go unit-testing standard.");
    expect(testingPatterns).toContain(`import (
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)`);
    expect(testingPatterns).toContain('"Tuesday, May 6, 2025"');
    expect(testingPatterns).toContain('"Thursday, February 29, 2024"');
    expect(testingPatterns).toMatch(/days, months, years/u);
  });
});
