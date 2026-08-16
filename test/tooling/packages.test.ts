import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  discoverProductionPackages,
  findForbiddenPackedPaths,
  loadFixturePackage,
  validatePackage,
  validateRootProfile,
  resolvePackageSkills,
  type PackageDescriptor,
} from "../../scripts/lib/packages.ts";
import { validateReleaseConfiguration } from "../../scripts/lib/releases.ts";
import { repositoryRoot, toPosixPath } from "../../scripts/lib/repository.ts";

const temporaryRoots: string[] = [];
const ROOT_PROFILE = {
  extensions: [
    "./packages/playwright-cleanup/src/index.ts",
    "./packages/question/src/index.ts",
    "./packages/status-line/src/index.ts",
    "./packages/todo/src/index.ts",
    "./packages/web-search/src/index.ts",
    "./packages/worktrunk/src/index.ts",
    "./node_modules/pi-claude-bridge/src/index.ts",
    "./node_modules/pi-subagents/index.ts",
  ],
  skills: [
    "./packages/feature-flow/skills/shape",
    "./packages/feature-flow/skills/planning-changes",
    "./packages/engineering/skills/implement",
    "./packages/git-conventions/skills",
    "./packages/github/skills",
    "./packages/worktrunk/skills",
  ],
  prompts: [
    "./packages/feature-flow/prompts/shape.md",
    "./packages/feature-flow/prompts/plan.md",
    "./packages/engineering/prompts/implement.md",
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

async function skillOnlyPackage(): Promise<PackageDescriptor> {
  const temporaryParent = join(repositoryRoot, ".tmp");
  await mkdir(temporaryParent, { recursive: true });
  const root = await mkdtemp(join(temporaryParent, "pi-skill-package-"));
  temporaryRoots.push(root);
  await mkdir(join(root, "skills", "example"), { recursive: true });
  await mkdir(join(root, "test"));
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
    scripts: { test: "vitest run" },
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
    writeFile(join(root, "test", "skills.test.ts"), "export {};\n", "utf8"),
  ]);
  return { kind: "production", manifest, root };
}

describe("package contracts", () => {
  it("keeps the private root profile curated", async () => {
    expect.hasAssertions();
    const manifest = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8")) as {
      readonly dependencies?: unknown;
      readonly pi?: Record<string, unknown>;
    };

    expect(manifest.pi).toEqual(ROOT_PROFILE);
    expect(manifest.dependencies).toEqual(ROOT_DEPENDENCIES);
  });

  it("ships fresh model-routed work and review agents", async () => {
    expect.hasAssertions();
    const [worker, escalationWorker, reviewer] = await Promise.all([
      readFile(join(repositoryRoot, "agents", "terra-worker.md"), "utf8"),
      readFile(join(repositoryRoot, "agents", "sol-worker.md"), "utf8"),
      readFile(join(repositoryRoot, "agents", "fable-reviewer.md"), "utf8"),
    ]);

    expect(worker).toMatch(/model: openai-codex\/gpt-5\.6-terra/iu);
    expect(worker).toMatch(/thinking: medium/iu);
    expect(worker).toMatch(/defaultContext: fresh/iu);
    expect(worker).toMatch(/acceptanceRole: writer/iu);
    expect(escalationWorker).toMatch(/model: openai-codex\/gpt-5\.6-sol/iu);
    expect(escalationWorker).toMatch(/thinking: high/iu);
    expect(escalationWorker).toMatch(/defaultContext: fresh/iu);
    expect(escalationWorker).toMatch(/acceptanceRole: writer/iu);
    expect(reviewer).toMatch(/model: claude-bridge\/claude-fable-5/iu);
    expect(reviewer).toMatch(/thinking: high/iu);
    expect(reviewer).toMatch(/defaultContext: fresh/iu);
    expect(reviewer).toMatch(/acceptanceRole: read-only/iu);
  });

  it("documents the conservative subagent profile and its evaluation gate", async () => {
    expect.hasAssertions();
    const [readme, evaluation] = await Promise.all([
      readFile(join(repositoryRoot, "README.md"), "utf8"),
      readFile(join(repositoryRoot, "docs", "evaluations", "pi-profile-ab.md"), "utf8"),
    ]);

    expect(readme).toContain('"toolDescriptionMode": "compact"');
    expect(readme).toContain('"asyncByDefault": false');
    expect(readme).toContain('"maxSubagentDepth": 1');
    expect(readme).toContain('"maxTasks": 3');
    expect(readme).toContain('"concurrency": 2');
    expect(readme).toContain('"scheduledRuns": {');
    expect(readme).toContain('"enabled": false');
    expect(evaluation).toMatch(/baseline/iu);
    expect(evaluation).toMatch(/candidate/iu);
    expect(evaluation).toMatch(/total model tokens/iu);
    expect(evaluation).toMatch(/deferred tool|compaction/iu);
  });

  it("documents the parent and child model stages", async () => {
    expect.hasAssertions();
    const readme = await readFile(join(repositoryRoot, "README.md"), "utf8");

    expect(readme).toContain('"defaultProvider": "claude-bridge"');
    expect(readme).toContain('"defaultModel": "claude-fable-5"');
    expect(readme).toContain('"defaultThinkingLevel": "medium"');
    expect(readme).toContain('"askClaude": {');
    expect(readme).toContain('"enabled": true');
    expect(readme).toContain('"defaultMode": "read"');
    expect(readme).toContain('"defaultIsolated": true');
    expect(readme).toContain('"allowFullMode": false');
    expect(readme).toMatch(/Shape[\s\S]*Plan[\s\S]*Fable 5[\s\S]*medium/iu);
    expect(readme).toMatch(/Work[\s\S]*GPT-5\.6 Terra[\s\S]*medium/iu);
    expect(readme).toMatch(/Escalation[\s\S]*GPT-5\.6 Sol[\s\S]*high/iu);
    expect(readme).toMatch(/Review[\s\S]*Fable 5[\s\S]*high/iu);
    expect(readme).toMatch(/fresh\s+context/iu);
  });

  it("rejects a missing or additional root profile resource", async () => {
    expect.hasAssertions();
    const root = await rootWithRuntime(">=22.20.0", "22.20.0");
    const manifestPath = join(root, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, unknown>;
    manifest["pi"] = {
      ...ROOT_PROFILE,
      extensions: [...ROOT_PROFILE.extensions, "./packages/lsp/src/index.ts"],
      prompts: ROOT_PROFILE.prompts.slice(1),
    };
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");

    await expect(validateRootProfile(root)).resolves.toEqual(
      expect.arrayContaining([
        `Root pi.extensions must equal ${JSON.stringify(ROOT_PROFILE.extensions)}.`,
        `Root pi.prompts must equal ${JSON.stringify(ROOT_PROFILE.prompts)}.`,
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

  it("accepts a production skill-only package without extension scaffolding", async () => {
    expect.hasAssertions();
    await expect(validatePackage(await skillOnlyPackage())).resolves.toEqual([]);
  });

  it("discovers and validates every installable Pi package and skill", async () => {
    expect.hasAssertions();
    const packages = await discoverProductionPackages();
    expect(packages.map((descriptor) => descriptor.manifest["name"])).toEqual([
      "@mopeyjellyfish/pi-engineering",
      "@mopeyjellyfish/pi-feature-flow",
      "@mopeyjellyfish/pi-git-conventions",
      "@mopeyjellyfish/pi-github",
      "@mopeyjellyfish/pi-lsp",
      "@mopeyjellyfish/pi-playwright-cleanup",
      "@mopeyjellyfish/pi-productivity",
      "@mopeyjellyfish/pi-question",
      "@mopeyjellyfish/pi-simple-english",
      "@mopeyjellyfish/pi-status-line",
      "@mopeyjellyfish/pi-todo",
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
    await expect(resolvePackageSkills(gitConventions)).resolves.toHaveLength(2);
    const github = packages.find(
      (descriptor) => descriptor.manifest["name"] === "@mopeyjellyfish/pi-github",
    );
    if (github === undefined) {
      throw new Error("GitHub package was not discovered.");
    }
    await expect(resolvePackageSkills(github)).resolves.toHaveLength(1);
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
