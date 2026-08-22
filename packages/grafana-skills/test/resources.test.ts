import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const UPSTREAM_COMMIT = "51d33e71e191b409bbd25fc7be2684c610d18166";
const SKILLS = {
  dashboarding: ["references/json-schema.md"],
  "grafana-oss": [
    "references/alerting.md",
    "references/api.md",
    "references/config.md",
    "references/dashboard-json.md",
    "references/dashboards.md",
    "references/datasources.md",
    "references/panel-types.md",
    "references/panels.md",
  ],
  promql: ["references/patterns.md"],
} as const;

describe("Grafana skills package", () => {
  it("is an independent skill-only Pi package", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await readFile(join(PACKAGE_ROOT, "package.json"), "utf8")) as {
      dependencies?: unknown;
      license?: unknown;
      peerDependencies?: unknown;
      pi?: { extensions?: unknown; skills?: string[] };
      scripts?: Record<string, string>;
    };

    expect(manifest.pi?.skills).toEqual(["./skills"]);
    expect(manifest.license).toBe("Apache-2.0");
    expect(manifest.pi?.extensions).toBeUndefined();
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.peerDependencies).toBeUndefined();
    expect(manifest.scripts).toEqual({
      test: "vitest run --root ../.. packages/grafana-skills/test",
    });
  });

  it("redistributes exactly the pinned Grafana skills and their references", async () => {
    expect.hasAssertions();
    const entries = await readdir(join(PACKAGE_ROOT, "skills"), { withFileTypes: true });

    expect(
      entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(Object.keys(SKILLS));
    for (const [name, references] of Object.entries(SKILLS)) {
      const skillRoot = join(PACKAGE_ROOT, "skills", name);
      const skill = await readFile(join(skillRoot, "SKILL.md"), "utf8");
      const files = await readdir(join(skillRoot, "references"));

      expect(skill).toContain(`name: ${name}`);
      expect(skill).toContain("license: Apache-2.0");
      expect(files.sort((left, right) => left.localeCompare(right))).toEqual(
        references
          .map((reference) => reference.replace("references/", ""))
          .sort((left, right) => left.localeCompare(right)),
      );
      for (const reference of references) {
        expect(skill).toContain(`(${reference})`);
      }
    }
  });

  it("preserves Grafana's Apache-2.0 attribution and upstream pin", async () => {
    expect.hasAssertions();
    const [license, readme] = await Promise.all([
      readFile(join(PACKAGE_ROOT, "LICENSE"), "utf8"),
      readFile(join(PACKAGE_ROOT, "README.md"), "utf8"),
    ]);

    expect(license).toContain("Copyright 2026 Grafana Labs");
    expect(license).toContain("Apache License, Version 2.0");
    expect(readme).toContain(`grafana/skills@${UPSTREAM_COMMIT}`);
    expect(readme).toContain("Apache-2.0");
  });

  it("does not require target repositories to contain this monorepo", async () => {
    expect.hasAssertions();
    const contents = await Promise.all(
      Object.keys(SKILLS).map((name) =>
        readFile(join(PACKAGE_ROOT, "skills", name, "SKILL.md"), "utf8"),
      ),
    );

    for (const skill of contents) {
      expect(skill).not.toMatch(/pi-extensions|packages\/|node_modules|\/Users\//iu);
    }
  });
});
