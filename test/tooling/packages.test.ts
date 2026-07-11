import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  discoverProductionPackages,
  findForbiddenPackedPaths,
  loadFixturePackage,
  validatePackage,
  validateRootAggregate,
  type PackageDescriptor,
} from "../../scripts/lib/packages.ts";
import { validateReleaseConfiguration } from "../../scripts/lib/releases.ts";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (root) => {
      await rm(root, { force: true, recursive: true });
    }),
  );
});

async function fixtureWith(
  changes: Record<string, unknown>,
  kind: PackageDescriptor["kind"] = "fixture",
): Promise<PackageDescriptor> {
  const fixture = await loadFixturePackage();
  return { ...fixture, kind, manifest: { ...fixture.manifest, ...changes } };
}

async function rootWithRuntime(node: string, nodeTypes: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "pi-packages-test-"));
  temporaryRoots.push(root);
  await mkdir(join(root, "packages"));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      private: true,
      workspaces: ["packages/*"],
      engines: { node },
      devDependencies: { "@types/node": nodeTypes },
      pi: { extensions: ["./packages/*/src/index.ts"] },
    }),
    "utf8",
  );
  return root;
}

describe("package contracts", () => {
  it("accepts the private lifecycle fixture", async () => {
    expect.hasAssertions();
    await expect(validatePackage(await loadFixturePackage())).resolves.toEqual([]);
  });

  it("discovers and validates the one installable Worktrunk package", async () => {
    expect.hasAssertions();
    const packages = await discoverProductionPackages();
    expect(packages).toHaveLength(1);
    const worktrunk = packages[0];
    if (worktrunk === undefined) {
      throw new Error("Worktrunk package was not discovered.");
    }
    expect(worktrunk.manifest["name"]).toBe("@mopeyjellyfish/pi-worktrunk");
    await expect(validatePackage(worktrunk)).resolves.toEqual([]);
    await expect(validateRootAggregate(packages)).resolves.toEqual([]);
    await expect(validateReleaseConfiguration(packages)).resolves.toEqual([]);
  });

  it("rejects runtime and development artifacts from packed packages", () => {
    expect.hasAssertions();
    expect(
      findForbiddenPackedPaths([
        "README.md",
        ".pi/sessions/current.jsonl",
        "src/.pi/sessions/current.jsonl",
        ".pi-subagents/worker.json",
        ".worktree/state.json",
        ".worktrees/feature/session.json",
        "coverage/lcov.info",
        "sessions/old.jsonl",
      ]),
    ).toEqual([
      ".pi/sessions/current.jsonl",
      "src/.pi/sessions/current.jsonl",
      ".pi-subagents/worker.json",
      ".worktree/state.json",
      ".worktrees/feature/session.json",
      "coverage/lcov.info",
      "sessions/old.jsonl",
    ]);
  });

  it("requires package engines to match the minimum Node runtime", async () => {
    expect.hasAssertions();
    const errors = await validatePackage(await fixtureWith({ engines: { node: ">=22.19.0" } }));
    expect(errors).toContainEqual("minimal-extension: engines.node must be >=22.20.0.");
  });

  it("requires wildcard ranges for every Pi-hosted peer", async () => {
    expect.hasAssertions();
    const errors = await validatePackage(
      await fixtureWith({
        peerDependencies: {
          "@earendil-works/pi-ai": "^0.80.1",
          "@earendil-works/pi-coding-agent": "*",
          typebox: "^1.1.38",
        },
      }),
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        'minimal-extension: @earendil-works/pi-ai must use the "*" peerDependency range.',
        'minimal-extension: typebox must use the "*" peerDependency range.',
      ]),
    );
  });

  it("keeps root engines and Node types on the minimum runtime line", async () => {
    expect.hasAssertions();
    const root = await rootWithRuntime(">=22.19.0", "22.19.21");
    const errors = await validateRootAggregate([], root);
    expect(errors).toEqual(
      expect.arrayContaining([
        "Root engines.node must be >=22.20.0.",
        "Root @types/node must remain on the 22.20.x minimum-runtime line.",
      ]),
    );
  });

  it.each([
    ["22.20.0", true],
    ["22.20.7", true],
    ["22.21.0", false],
  ])("validates Node types line %s", async (nodeTypes, valid) => {
    expect.hasAssertions();
    const root = await rootWithRuntime(">=22.20.0", nodeTypes);
    const errors = await validateRootAggregate([], root);
    const typeErrors = errors.filter((error) => error.includes("@types/node"));
    expect(typeErrors).toEqual(
      valid ? [] : ["Root @types/node must remain on the 22.20.x minimum-runtime line."],
    );
  });

  it("rejects publishing the private fixture as a production package", async () => {
    expect.hasAssertions();
    const fixture = await loadFixturePackage();
    const errors = await validatePackage({ ...fixture, kind: "production" });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("production package private must be absent or false"),
        expect.stringContaining("production package names must start with @mopeyjellyfish/pi-"),
        expect.stringContaining("files must include CHANGELOG.md"),
        expect.stringContaining("CHANGELOG.md is required"),
        expect.stringContaining("test is required"),
        expect.stringContaining("tsconfig.json is required"),
      ]),
    );
  });

  it.each([
    ["absent", undefined, true],
    ["literal false", false, true],
    ["literal true", true, false],
    ["a string", "false", false],
    ["a number", 0, false],
  ])("validates production private when it is %s", async (_label, value, valid) => {
    expect.hasAssertions();
    const descriptor = await fixtureWith({ private: value }, "production");
    if (value === undefined) {
      delete descriptor.manifest["private"];
    }
    const errors = await validatePackage(descriptor);
    const privateErrors = errors.filter((error) => error.includes("package private"));
    const expectedErrors = valid
      ? []
      : ["minimal-extension: production package private must be absent or false."];
    expect(privateErrors).toEqual(expectedErrors);
  });

  it.each(["0.0.0", "1.2.3", "1.2.3-alpha.1", "1.2.3+build.5", "1.2.3-alpha.1+build.5"])(
    "accepts the semantic version %s",
    async (version) => {
      expect.hasAssertions();
      await expect(validatePackage(await fixtureWith({ version }))).resolves.toEqual([]);
    },
  );

  it.each(["1.2", "v1.2.3", "1.2.3-01", "1.2.3-alpha..1", "1.2.3+build..5", " 1.2.3"])(
    "rejects the invalid semantic version %s",
    async (version) => {
      expect.hasAssertions();
      const errors = await validatePackage(await fixtureWith({ version }));
      expect(errors).toContainEqual(expect.stringContaining("version must be a semantic version"));
    },
  );
});
