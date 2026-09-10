import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  discoverProductionPackages,
  findForbiddenPackedPaths,
  loadFixturePackage,
  resolvePackageEntrypoints,
  resolvePackagePrompts,
  resolvePackageSkills,
  validatePackage,
  validateRootProfile,
  type PackageDescriptor,
} from "../../scripts/lib/packages.ts";
import { validateReleaseConfiguration } from "../../scripts/lib/releases.ts";
import { repositoryRoot, toPosixPath } from "../../scripts/lib/repository.ts";

const temporaryRoots: string[] = [];
const ROOT_PROFILE = {
  extensions: [
    "./packages/frontend-developer/src/index.ts",
    "./packages/hashline/src/index.ts",
    "./packages/playwright-cleanup/src/index.ts",
    "./packages/question/src/index.ts",
    "./packages/simple-english/src/index.ts",
    "./packages/status-line/src/index.ts",
    "./packages/todo/src/index.ts",
    "./packages/web-search/src/index.ts",
    "./packages/worktrunk/src/index.ts",
    "./node_modules/pi-claude-bridge/src/index.ts",
    "./node_modules/pi-subagents/index.ts",
  ],
  skills: [
    "./packages/feature-flow/skills",
    "./packages/engineering/skills",
    "./packages/productivity/skills",
    "./packages/simple-english/skills",
    "./packages/git-conventions/skills",
    "./packages/github/skills",
    "./packages/worktrunk/skills",
    "./packages/frontend-developer/skills",
    "./packages/go/skills",
    "./packages/grafana-skills/skills",
    "./packages/typescript/skills",
  ],
  prompts: [
    "./packages/feature-flow/prompts/shape.md",
    "./packages/feature-flow/prompts/plan.md",
    "./packages/engineering/prompts",
    "./packages/productivity/prompts",
    "./packages/frontend-developer/prompts/design.md",
    "./packages/frontend-developer/prompts/generate-image.md",
    "./node_modules/pi-subagents/prompts",
  ],
  subagents: { agents: ["./agents"] },
} as const;
const ROOT_DEPENDENCIES = {
  "@playwright/cli": "0.1.18",
  "pi-claude-bridge": "0.7.0",
  "pi-subagents": "0.50.0",
} as const;

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
      dependencies: ROOT_DEPENDENCIES,
      devDependencies: { "@types/node": nodeTypes },
      pi: ROOT_PROFILE,
    }),
    "utf8",
  );
  return root;
}

async function futureProfilePackage(root: string): Promise<void> {
  const packageRoot = join(root, "packages", "future");
  await mkdir(packageRoot, { recursive: true });
  await writeFile(
    join(packageRoot, "package.json"),
    JSON.stringify({
      name: "@mopeyjellyfish/pi-future",
      pi: {
        extensions: ["./src/future.ts"],
        skills: ["./skills/specific"],
      },
    }),
    "utf8",
  );
}
async function lspProfilePackage(root: string, extension = "./src/index.ts"): Promise<void> {
  const packageRoot = join(root, "packages", "lsp");
  await mkdir(packageRoot, { recursive: true });
  await writeFile(
    join(packageRoot, "package.json"),
    JSON.stringify({
      name: "@mopeyjellyfish/pi-lsp",
      pi: { extensions: [extension] },
    }),
    "utf8",
  );
}

async function skillOnlyPackage(): Promise<PackageDescriptor> {
  const temporaryParent = join(repositoryRoot, ".tmp");
  await mkdir(temporaryParent, { recursive: true });
  const root = await mkdtemp(join(temporaryParent, "pi-skill-package-"));
  temporaryRoots.push(root);
  await mkdir(join(root, "skills", "example"), { recursive: true });
  const manifest = {
    name: "@mopeyjellyfish/pi-skill-probe",
    version: "0.0.0",
    description: "A production skill-only package fixture.",
    license: "MIT",
    type: "module",
    engines: { node: ">=22.20.0" },
    files: ["skills/", "README.md", "CHANGELOG.md", "LICENSE"],
    keywords: ["pi-package", "pi-skill"],
    pi: { skills: ["./skills"] },
    repository: {
      type: "git",
      url: "git+https://github.com/mopeyjellyfish/pi-extensions.git",
      directory: toPosixPath(relative(repositoryRoot, root)),
    },
  };
  await Promise.all([
    writeFile(join(root, "package.json"), JSON.stringify(manifest), "utf8"),
    writeFile(join(root, "README.md"), "# Skill package\n", "utf8"),
    writeFile(join(root, "CHANGELOG.md"), "# Changelog\n", "utf8"),
    writeFile(join(root, "LICENSE"), "MIT\n", "utf8"),
    writeFile(
      join(root, "skills", "example", "SKILL.md"),
      "---\nname: example\ndescription: Example skill.\n---\n\n# Example\n",
      "utf8",
    ),
  ]);
  return { kind: "production", manifest, root };
}

describe("package contracts", () => {
  it("rejects a re-added LSP extension with its compatibility reason", async () => {
    expect.hasAssertions();
    const root = await rootWithRuntime(">=22.20.0", "22.20.0");
    await lspProfilePackage(root);
    const manifestPath = join(root, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    manifest["pi"] = {
      ...ROOT_PROFILE,
      extensions: [...ROOT_PROFILE.extensions, "./packages/lsp/src/index.ts"],
    };
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");

    await expect(validateRootProfile(root)).resolves.toEqual(
      expect.arrayContaining([
        `Root pi.extensions must equal ${JSON.stringify(ROOT_PROFILE.extensions)}.`,
        "Root pi.extensions must omit ./packages/lsp/src/index.ts: Pi hard-fails because pi-lsp and Hashline both register write and edit.",
      ]),
    );
  });

  it("keeps the LSP exception valid when no LSP package exists", async () => {
    expect.hasAssertions();
    const root = await rootWithRuntime(">=22.20.0", "22.20.0");

    await expect(validateRootProfile(root)).resolves.not.toContainEqual(
      "Root extension exception for ./packages/lsp/src/index.ts is stale: @mopeyjellyfish/pi-lsp no longer declares that resource.",
    );
  });

  it("rejects a stale LSP exception", async () => {
    expect.hasAssertions();
    const root = await rootWithRuntime(">=22.20.0", "22.20.0");
    await lspProfilePackage(root, "./src/server.ts");

    await expect(validateRootProfile(root)).resolves.toContainEqual(
      "Root extension exception for ./packages/lsp/src/index.ts is stale: @mopeyjellyfish/pi-lsp no longer declares that resource.",
    );
  });

  it("rejects omitted future local extension and skill resources", async () => {
    expect.hasAssertions();
    const root = await rootWithRuntime(">=22.20.0", "22.20.0");
    await futureProfilePackage(root);

    await expect(validateRootProfile(root)).resolves.toEqual(
      expect.arrayContaining([
        "Root pi.extensions must include every local production extension: ./packages/future/src/future.ts.",
        "Root pi.skills must include every local production skill: ./packages/future/skills/specific.",
      ]),
    );
  });

  it("rejects an unpinned or additional root production dependency", async () => {
    expect.hasAssertions();
    const root = await rootWithRuntime(">=22.20.0", "22.20.0");
    const manifestPath = join(root, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    manifest["dependencies"] = { "pi-subagents": "^0.50.0", unexpected: "1.0.0" };
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");

    await expect(validateRootProfile(root)).resolves.toContainEqual(
      `Root dependencies must equal ${JSON.stringify(ROOT_DEPENDENCIES)}.`,
    );
  });

  it("accepts the private lifecycle fixture", async () => {
    expect.hasAssertions();
    await expect(validatePackage(await loadFixturePackage())).resolves.toEqual([]);
  });

  it("accepts a text-only package without tests or a test script", async () => {
    expect.hasAssertions();
    await expect(validatePackage(await skillOnlyPackage())).resolves.toEqual([]);
  });

  it("requires real tests when a skill package declares a test script", async () => {
    expect.hasAssertions();
    const descriptor = await skillOnlyPackage();
    descriptor.manifest["scripts"] = { test: "vitest run" };
    await expect(validatePackage(descriptor)).resolves.toContainEqual(
      expect.stringContaining("at least one test/**/*.test.ts file is required."),
    );
  });

  it("requires test and typecheck scripts for extension packages", async () => {
    expect.hasAssertions();
    const descriptor = await fixtureWith({ scripts: {} }, "production");
    await expect(validatePackage(descriptor)).resolves.toEqual(
      expect.arrayContaining([
        expect.stringContaining("scripts.test is required."),
        expect.stringContaining("scripts.typecheck is required."),
      ]),
    );
  });

  it("enforces the default MIT license and declarative package exceptions", async () => {
    expect.hasAssertions();
    const frontend = await fixtureWith({
      name: "@mopeyjellyfish/pi-frontend-developer",
      license: "MIT AND Apache-2.0",
    });
    expect(
      (await validatePackage(frontend)).filter((error) => error.includes("license must be")),
    ).toEqual([]);

    const engineering = await fixtureWith({
      name: "@mopeyjellyfish/pi-engineering",
      license: "MIT AND Apache-2.0",
    });
    expect(
      (await validatePackage(engineering)).filter((error) => error.includes("license must be")),
    ).toEqual([]);

    const wrongEngineering = await fixtureWith({
      name: "@mopeyjellyfish/pi-engineering",
      license: "MIT",
    });
    await expect(validatePackage(wrongEngineering)).resolves.toContainEqual(
      'minimal-extension: license must be "MIT AND Apache-2.0".',
    );

    const future = await fixtureWith({
      name: "@mopeyjellyfish/pi-future-skill",
      license: "Apache-2.0",
    });
    await expect(validatePackage(future)).resolves.toContainEqual(
      'minimal-extension: license must be "MIT".',
    );

    const wrongFrontend = await fixtureWith({
      name: "@mopeyjellyfish/pi-frontend-developer",
      license: "Apache-2.0",
    });
    await expect(validatePackage(wrongFrontend)).resolves.toContainEqual(
      'minimal-extension: license must be "MIT AND Apache-2.0".',
    );
  });

  it("discovers and validates every installable Pi package and skill", async () => {
    expect.hasAssertions();
    const packages = await discoverProductionPackages();
    expect(packages.map((descriptor) => descriptor.manifest["name"])).toEqual([
      "@mopeyjellyfish/pi-engineering",
      "@mopeyjellyfish/pi-feature-flow",
      "@mopeyjellyfish/pi-frontend-developer",
      "@mopeyjellyfish/pi-git-conventions",
      "@mopeyjellyfish/pi-github",
      "@mopeyjellyfish/pi-go",
      "@mopeyjellyfish/pi-grafana-skills",
      "@mopeyjellyfish/pi-hashline",
      "@mopeyjellyfish/pi-lsp",
      "@mopeyjellyfish/pi-playwright-cleanup",
      "@mopeyjellyfish/pi-productivity",
      "@mopeyjellyfish/pi-question",
      "@mopeyjellyfish/pi-simple-english",
      "@mopeyjellyfish/pi-status-line",
      "@mopeyjellyfish/pi-todo",
      "@mopeyjellyfish/pi-typescript",
      "@mopeyjellyfish/pi-web-search",
      "@mopeyjellyfish/pi-worktrunk",
    ]);
    for (const descriptor of packages) {
      await expect(validatePackage(descriptor)).resolves.toEqual([]);
    }
    const gitConventions = packages.find(
      (descriptor) => descriptor.manifest["name"] === "@mopeyjellyfish/pi-git-conventions",
    );
    if (gitConventions === undefined) {
      throw new Error("Git conventions package was not discovered.");
    }
    await expect(resolvePackageSkills(gitConventions)).resolves.toHaveLength(3);
    const github = packages.find(
      (descriptor) => descriptor.manifest["name"] === "@mopeyjellyfish/pi-github",
    );
    if (github === undefined) {
      throw new Error("GitHub package was not discovered.");
    }
    await expect(resolvePackageSkills(github)).resolves.toHaveLength(3);
    const frontendDeveloper = packages.find(
      (descriptor) => descriptor.manifest["name"] === "@mopeyjellyfish/pi-frontend-developer",
    );
    if (frontendDeveloper === undefined) {
      throw new Error("Frontend developer package was not discovered.");
    }
    await expect(resolvePackageEntrypoints(frontendDeveloper)).resolves.toEqual([
      expect.stringMatching(/packages\/frontend-developer\/src\/index\.ts$/u),
    ]);
    await expect(resolvePackageSkills(frontendDeveloper)).resolves.toHaveLength(10);
    await expect(resolvePackagePrompts(frontendDeveloper)).resolves.toEqual([
      expect.stringMatching(/packages\/frontend-developer\/prompts\/design\.md$/u),
      expect.stringMatching(/packages\/frontend-developer\/prompts\/generate-image\.md$/u),
    ]);
    await expect(validateRootProfile()).resolves.toEqual([]);
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
    const errors = await validateRootProfile(root);
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
    const errors = await validateRootProfile(root);
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
