import { describe, expect, it } from "vitest";

import {
  discoverProductionPackages,
  loadFixturePackage,
  validatePackage,
  validateRootAggregate,
  type PackageDescriptor,
} from "../../scripts/lib/packages.ts";

async function fixtureWith(
  changes: Record<string, unknown>,
  kind: PackageDescriptor["kind"] = "fixture",
): Promise<PackageDescriptor> {
  const fixture = await loadFixturePackage();
  return { ...fixture, kind, manifest: { ...fixture.manifest, ...changes } };
}

describe("package contracts", () => {
  it("accepts the private lifecycle fixture", async () => {
    expect.hasAssertions();
    await expect(validatePackage(await loadFixturePackage())).resolves.toEqual([]);
  });

  it("accepts an empty production workspace with an aggregate glob", async () => {
    expect.hasAssertions();
    const packages = await discoverProductionPackages();
    expect(packages).toEqual([]);
    await expect(validateRootAggregate(packages)).resolves.toEqual([]);
  });

  it("rejects publishing the private fixture as a production package", async () => {
    expect.hasAssertions();
    const fixture = await loadFixturePackage();
    const errors = await validatePackage({ ...fixture, kind: "production" });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("production package private must be absent or false"),
        expect.stringContaining("production package names must start with @mopeyjellyfish/pi-"),
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
