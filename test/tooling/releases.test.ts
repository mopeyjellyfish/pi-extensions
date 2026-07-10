import { describe, expect, it } from "vitest";

import { validateReleaseState } from "../../scripts/lib/releases.ts";

import type { PackageDescriptor } from "../../scripts/lib/packages.ts";

const root = "/repository";

function descriptor(name: string, version: string): PackageDescriptor {
  return {
    kind: "production",
    manifest: { name: `@mopeyjellyfish/${name}`, version },
    root: `${root}/packages/${name.replace(/^pi-/u, "")}`,
  };
}

function configuration(
  packages: Record<string, Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    "release-type": "node",
    versioning: "default",
    "bump-minor-pre-major": false,
    "bump-patch-for-minor-pre-major": false,
    "include-component-in-tag": true,
    "include-v-in-tag": true,
    "tag-separator": "-",
    "separate-pull-requests": false,
    "sequential-calls": true,
    plugins: ["node-workspace"],
    "changelog-sections": [
      { type: "feat", section: "Features" },
      { type: "fix", section: "Bug Fixes" },
      { type: "perf", section: "Performance" },
      { type: "docs", section: "Documentation" },
      { type: "chore", section: "Maintenance" },
      { type: "refactor", section: "Code Refactoring" },
      { type: "revert", section: "Reverts" },
      { type: "build", section: "Build System" },
      { type: "deps", section: "Dependencies" },
    ],
    packages,
  };
}

function packageConfig(): Record<string, unknown> {
  return { "release-type": "node" };
}

describe("release configuration", () => {
  it("accepts the empty pre-extension state", () => {
    expect.hasAssertions();
    expect(validateReleaseState([], configuration(), {}, root)).toEqual([]);
  });

  it.each([
    ["non-default versioning", { versioning: "always-bump-patch" }, "versioning must be"],
    ["pre-major exceptions", { "bump-minor-pre-major": true }, "standard SemVer"],
    ["component-less tags", { "include-component-in-tag": false }, "component and v prefix"],
    ["separate release PRs", { "separate-pull-requests": true }, "one consolidated"],
    ["linked versions", { plugins: ["linked-versions"] }, "only the node-workspace"],
    [
      "hidden patch changelog types",
      { "changelog-sections": [{ type: "feat", section: "Features" }] },
      "changelog type docs must be visible",
    ],
  ])("rejects %s", (_label, changes, expectedMessage) => {
    expect.hasAssertions();
    const errors = validateReleaseState([], { ...configuration(), ...changes }, {}, root);
    expect(errors).toContainEqual(expect.stringContaining(expectedMessage));
  });

  it("accepts independent package versions and unscoped components", () => {
    expect.hasAssertions();
    const packages = [descriptor("pi-alpha", "0.3.2"), descriptor("pi-beta", "2.1.0")];
    expect(
      validateReleaseState(
        packages,
        configuration({
          "packages/alpha": packageConfig(),
          "packages/beta": packageConfig(),
        }),
        { "packages/alpha": "0.3.2", "packages/beta": "2.1.0" },
        root,
      ),
    ).toEqual([]);
  });

  it("rejects missing release entries", () => {
    expect.hasAssertions();
    const errors = validateReleaseState(
      [descriptor("pi-alpha", "0.0.0")],
      configuration(),
      {},
      root,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("release-please-config.json is missing package packages/alpha"),
        expect.stringContaining(".release-please-manifest.json is missing package packages/alpha"),
      ]),
    );
  });

  it("rejects orphan release entries", () => {
    expect.hasAssertions();
    const errors = validateReleaseState(
      [],
      configuration({ "packages/orphan": packageConfig() }),
      { "packages/orphan": "1.0.0" },
      root,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "release-please-config.json contains orphan package packages/orphan",
        ),
        expect.stringContaining(
          ".release-please-manifest.json contains orphan package packages/orphan",
        ),
      ]),
    );
  });

  it("rejects mismatched versions and invalid derived component names", () => {
    expect.hasAssertions();
    const invalid = {
      ...descriptor("pi-alpha", "1.2.3"),
      manifest: { name: "@mopeyjellyfish/alpha", version: "1.2.3" },
    };
    const errors = validateReleaseState(
      [invalid],
      configuration({ "packages/alpha": packageConfig() }),
      { "packages/alpha": "1.2.2" },
      root,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("package name must derive an unscoped pi-* release component"),
        expect.stringContaining("release manifest version 1.2.2 must match package version 1.2.3"),
      ]),
    );
  });

  it("rejects a wrong package strategy and unsupported identity overrides", () => {
    expect.hasAssertions();
    const errors = validateReleaseState(
      [descriptor("pi-alpha", "1.0.0")],
      configuration({
        "packages/alpha": {
          "release-type": "simple",
          component: "pi-alpha",
        },
      }),
      { "packages/alpha": "1.0.0" },
      root,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("release-type must be node"),
        expect.stringContaining("must derive identity from package.json"),
      ]),
    );
  });
});
