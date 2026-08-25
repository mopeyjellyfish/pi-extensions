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
});
