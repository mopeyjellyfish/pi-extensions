import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
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
    "./packages/engineering/skills",
    "./packages/productivity/skills",
    "./packages/git-conventions/skills",
    "./packages/github/skills",
    "./packages/worktrunk/skills",
  ],
  prompts: [
    "./packages/feature-flow/prompts/shape.md",
    "./packages/feature-flow/prompts/plan.md",
    "./packages/engineering/prompts",
    "./packages/productivity/prompts",
    "./node_modules/pi-subagents/prompts",
  ],
  subagents: { agents: ["./agents"] },
} as const;
const ROOT_DEPENDENCIES = {
  "@playwright/cli": "0.1.18",
  "pi-claude-bridge": "0.7.0",
  "pi-subagents": "0.50.0",
} as const;

function parseAgentFrontmatter(source: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---/u.exec(source);
  if (match?.[1] === undefined) throw new Error("Agent is missing YAML frontmatter.");
  const fields: Record<string, unknown> = {};
  let listKey: string | undefined;
  for (const line of match[1].split("\n")) {
    const listItem = /^ {2}- (.+)$/u.exec(line);
    if (listItem?.[1] !== undefined && listKey !== undefined) {
      const values = fields[listKey];
      if (Array.isArray(values)) values.push(listItem[1]);
      continue;
    }
    const field = /^([A-Za-z]+):(?: (.+))?$/u.exec(line);
    if (field?.[1] === undefined) continue;
    const [, key, raw] = field;
    listKey = raw === undefined ? key : undefined;
    fields[key] = raw === undefined ? [] : raw === "true" ? true : raw === "false" ? false : raw;
  }
  return fields;
}

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

  it("ships exactly six fixed, private-skill model-routed agents", async () => {
    expect.hasAssertions();
    const expected = {
      worker: {
        model: "openai-codex/gpt-5.6-terra",
        thinking: "medium",
        role: "writer",
        completionGuard: undefined,
        tools: ["read", "grep", "find", "ls", "bash", "edit", "write", "playwright_browser"],
        skills: [
          "test-driven-development",
          "codebase-design",
          "diagnosing-bugs",
          "domain-modeling",
          "writing-for-agents",
        ],
        skillPaths: [
          "../packages/engineering/skills/test-driven-development",
          "../packages/engineering/skills/codebase-design",
          "../packages/engineering/skills/diagnosing-bugs",
          "../packages/engineering/skills/domain-modeling",
          "../packages/productivity/skills/writing-for-agents",
        ],
      },
      researcher: {
        model: "openai-codex/gpt-5.6-luna",
        thinking: "low",
        role: "read-only",
        completionGuard: false,
        tools: ["read", "grep", "find", "ls", "bash", "web_search"],
        skills: [],
        skillPaths: [],
      },
      qa: {
        model: "openai-codex/gpt-5.6-luna",
        thinking: "medium",
        role: "read-only",
        completionGuard: false,
        tools: ["read", "grep", "find", "ls", "bash", "playwright_browser"],
        skills: [],
        skillPaths: [],
      },
      reviewer: {
        model: "claude-bridge/claude-opus-5",
        thinking: "medium",
        role: "read-only",
        completionGuard: false,
        tools: ["read", "grep", "find", "ls", "bash"],
        skills: ["code-review", "codebase-design"],
        skillPaths: [
          "../packages/engineering/skills/code-review",
          "../packages/engineering/skills/codebase-design",
        ],
      },
      git: {
        model: "openai-codex/gpt-5.6-terra",
        thinking: "medium",
        role: "writer",
        completionGuard: false,
        tools: ["read", "grep", "find", "ls", "bash", "edit", "write", "worktree"],
        skills: [
          "commit",
          "git-rebase-base",
          "resolving-merge-conflicts",
          "github-cli",
          "open-pr",
          "triage",
          "pi-worktrunk",
        ],
        skillPaths: [
          "../packages/git-conventions/skills/commit",
          "../packages/git-conventions/skills/git-rebase-base",
          "../packages/git-conventions/skills/resolving-merge-conflicts",
          "../packages/github/skills/github-cli",
          "../packages/github/skills/open-pr",
          "../packages/github/skills/triage",
          "../packages/worktrunk/skills/pi-worktrunk",
        ],
      },
      utility: {
        model: "openai-codex/gpt-5.6-luna",
        thinking: "medium",
        role: "read-only",
        completionGuard: false,
        tools: ["read", "grep", "find", "ls", "bash", "web_search"],
        skills: [],
        skillPaths: [],
      },
    } as const;
    const agentsRoot = join(repositoryRoot, "agents");
    const entries = (await readdir(agentsRoot))
      .filter((entry) => entry.endsWith(".md"))
      .sort((left, right) => left.localeCompare(right));

    expect(entries).toEqual(
      Object.keys(expected)
        .map((name) => `${name}.md`)
        .sort((left, right) => left.localeCompare(right)),
    );
    for (const [name, contract] of Object.entries(expected)) {
      const text = await readFile(join(agentsRoot, `${name}.md`), "utf8");
      const agent = parseAgentFrontmatter(text);

      expect(agent["name"]).toBe(name);
      expect(agent["model"]).toBe(contract.model);
      expect(agent["thinking"]).toBe(contract.thinking);
      expect(agent["systemPromptMode"]).toBe("replace");
      expect(agent["inheritProjectContext"]).toBe(true);
      expect(agent["inheritSkills"]).toBe(false);
      expect(agent["defaultContext"]).toBe("fresh");
      expect(agent["acceptanceRole"]).toBe(contract.role);
      expect(agent["completionGuard"]).toBe(contract.completionGuard);
      expect(agent["fallbackModels"]).toBeUndefined();
      expect(agent["defaultModel"]).toBeUndefined();
      expect(agent["tools"]).toEqual(contract.tools);
      expect(agent["skills"] ?? []).toEqual(contract.skills);
      const skillPaths =
        agent["skillPath"] === undefined
          ? []
          : Array.isArray(agent["skillPath"])
            ? agent["skillPath"]
            : [agent["skillPath"]];
      expect(skillPaths).toEqual(contract.skillPaths);
    }
    const [reviewer, git] = await Promise.all([
      readFile(join(agentsRoot, "reviewer.md"), "utf8"),
      readFile(join(agentsRoot, "git.md"), "utf8"),
    ]);
    expect(reviewer).toMatch(/`code-review` method[\s\S]*do not spawn[\s\S]*issue-tracker setup/iu);
    expect(reviewer).toMatch(/Pitch and plan[\s\S]*Standards/iu);
    expect(git).toMatch(/Never remove a worktree[\s\S]*explicitly grants removal/iu);
  });

  it("works around pi-subagents issue 1207 for every configured agent", async () => {
    expect.hasAssertions();
    const agentsRoot = join(repositoryRoot, "agents");
    const entries = (await readdir(agentsRoot)).filter((entry) => entry.endsWith(".md"));

    for (const entry of entries) {
      const text = await readFile(join(agentsRoot, entry), "utf8");
      const agent = parseAgentFrontmatter(text);
      const prose = text.replaceAll(/\s+/gu, " ");
      expect.soft(agent["tools"], entry).not.toContain("contact_supervisor");
      expect
        .soft(prose, entry)
        .toMatch(
          /runtime bridge[^.]*`contact_supervisor`[^.]*`need_decision`[\s\S]*unavailable[^.]*final[\s\S]*no routine completion/iu,
        );
    }

    const readme = await readFile(join(repositoryRoot, "README.md"), "utf8");
    expect(readme).toMatch(/pi-subagents[^.]*0\.50\.0[\s\S]*issue\s+#?1207/iu);
    expect(readme).toMatch(/remove[^.]*`contact_supervisor`[^.]*explicit[^.]*`tools`/iu);
    expect(readme).toMatch(/bridge[^.]*adds[^.]*`contact_supervisor`[^.]*runtime/iu);
  });

  it("gives read-only support agents bounded retry contracts", async () => {
    expect.hasAssertions();
    const [qa, researcher, reviewer, utility] = await Promise.all(
      ["qa", "researcher", "reviewer", "utility"].map(async (name) =>
        (await readFile(join(repositoryRoot, "agents", `${name}.md`), "utf8")).replaceAll(
          /\s+/gu,
          " ",
        ),
      ),
    );

    expect.soft(qa).toMatch(/fresh worktree[^.]*setup[^.]*before[^.]*check/iu);
    expect.soft(qa).toMatch(/diagnose[^.]*failed[^.]*before[^.]*rerun/iu);
    expect.soft(researcher).toMatch(/one[^.]*search pass[\s\S]*follow-up[^.]*specific gap/iu);
    expect.soft(reviewer).toMatch(/one[^.]*fixed[^.]*pass[\s\S]*do not rerun[^.]*unchanged/iu);
    expect.soft(utility).toMatch(/one[^.]*bounded[^.]*pass[\s\S]*do not rerun[^.]*unchanged/iu);
  });

  it("gives the Git agent a bounded skill-owned delivery contract", async () => {
    expect.hasAssertions();
    const prose = (await readFile(join(repositoryRoot, "agents", "git.md"), "utf8")).replaceAll(
      /\s+/gu,
      " ",
    );

    expect.soft(prose).toMatch(/Focus on the supplied Git and GitHub skills/iu);
    expect.soft(prose).toMatch(/authenticated `gh` CLI methods from `github-cli`/iu);
    expect
      .soft(prose)
      .toMatch(
        /commit\/publish the worktree changes[^.]*worktree[^.]*branch[^.]*authority[^.]*intent[^.]*evidence/iu,
      );
    expect
      .soft(prose)
      .toMatch(
        /explicit accepted authority[^.]*atomic units[^.]*Conventional Commit messages[^.]*stage[^.]*commit[^.]*push[^.]*create or update[^.]*pull request/iu,
      );
    expect
      .soft(prose)
      .toMatch(
        /safe base updates\/rebases[^.]*merge-conflict workflows[^.]*collecting pull-request comments and reviews/iu,
      );
    expect
      .soft(prose)
      .toMatch(/does not implement product changes[^.]*independently resolve review findings/iu);
    expect
      .soft(prose)
      .toMatch(/Never watch pull-request checks[^.]*Actions runs[^.]*CI[^.]*long-running status/iu);
    expect
      .soft(prose)
      .toMatch(
        /Never use `--watch`, `gh run watch`, polling, sleeps, servers, interactive editors/iu,
      );
    expect.soft(prose).toMatch(/one bounded structured verification of each mutation/iu);
    expect.soft(prose).toMatch(/queued or pending CI[^.]*report the current state[^.]*hand off/iu);
    expect
      .soft(prose)
      .toMatch(/transport failure[^.]*diagnose once[^.]*stop[^.]*recovery evidence/iu);
  });

  it("makes fresh-worktree setup and diagnose-before-rerun worker table stakes", async () => {
    expect.hasAssertions();
    const prose = (await readFile(join(repositoryRoot, "agents", "worker.md"), "utf8")).replaceAll(
      /\s+/gu,
      " ",
    );

    expect
      .soft(prose)
      .toMatch(
        /fresh worktree[^.]*repository-defined runtime[^.]*dependency setup[^.]*before[^.]*test/iu,
      );
    expect.soft(prose).toMatch(/setup failure[^.]*not[^.]*red proof/iu);
    expect.soft(prose).toMatch(/diagnose[^.]*failed check[^.]*before[^.]*rerun/iu);
    expect.soft(prose).toMatch(/same failure[^.]*stop[^.]*inspect[^.]*complete failure/iu);
    expect.soft(prose).toMatch(/focused checks[^.]*required completion gate[^.]*once/iu);
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
    expect(readme).toContain('"subagents": {\n    "disableBuiltins": true');
    expect(readme).toMatch(
      /`subagents\.defaultModel` is unnecessary[\s\S]*frontmatter model precedence/iu,
    );
    expect(readme).toMatch(/per-run model[\s\S]*explicitly approves/iu);
    expect(readme).toMatch(/retain `"disableBuiltins": true`[\s\S]*exact six-agent catalog/iu);
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
    expect(readme).toMatch(/human selects[\s\S]*Fable or Sol parent/iu);
    expect(readme).toMatch(/Worker[\s\S]*GPT-5\.6 Terra[\s\S]*medium/iu);
    expect(readme).toMatch(/Researcher[\s\S]*GPT-5\.6 Luna[\s\S]*low/iu);
    expect(readme).toMatch(/QA[\s\S]*GPT-5\.6 Luna[\s\S]*medium/iu);
    expect(readme).toMatch(/Reviewer[\s\S]*Opus 5[\s\S]*medium/iu);
    expect(readme).toMatch(/Git[\s\S]*GPT-5\.6 Terra[\s\S]*medium/iu);
    expect(readme).toMatch(/Utility[\s\S]*GPT-5\.6 Luna[\s\S]*medium/iu);
    expect(readme).toMatch(/AskClaude[\s\S]*non-claude-bridge parent/iu);
    expect(readme).toMatch(/Fable parent\s+cannot[\s\S]*call/iu);
    expect(readme).toMatch(/justified\s+`question`[\s\S]*explicit human approval[\s\S]*Sol/iu);
    expect(readme).toMatch(/`\/improve`[\s\S]*code review[\s\S]*design/iu);
    expect(readme).toMatch(/Git\s+conflict support/iu);
    expect(readme).toMatch(
      /normal push[\s\S]*(after a rebase|post-rebase)[\s\S]*--force-with-lease/iu,
    );
    expect(readme).toMatch(/fresh\s+context/iu);
  });

  it("documents the portable target-repository resource boundary", async () => {
    expect.hasAssertions();
    const [agents, architecture] = await Promise.all([
      readFile(join(repositoryRoot, "AGENTS.md"), "utf8"),
      readFile(join(repositoryRoot, "docs", "architecture.md"), "utf8"),
    ]);

    for (const resource of [agents, architecture]) {
      expect(resource).toMatch(/unrelated target\s+repositories/iu);
      expect(resource).toMatch(/target repository['’]s instructions/iu);
      expect(resource).toMatch(/cannot|never assume/iu);
      expect(resource).toMatch(/paths[\s\S]*agents[\s\S]*tools[\s\S]*skills[\s\S]*extensions/iu);
    }
    expect(agents).toMatch(/does not make it[\s\S]*available[\s\S]*active Pi process/iu);
    expect(agents).toMatch(/No production resource\s+may be specific to this repository/iu);
    expect(agents).toMatch(/Playwright-cleanup[\s\S]*complete Engineering and Productivity/iu);
    expect(agents).toMatch(/six[\s\S]*model-routed package agents/iu);
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
    await expect(resolvePackageSkills(gitConventions)).resolves.toHaveLength(3);
    const github = packages.find(
      (descriptor) => descriptor.manifest["name"] === "@mopeyjellyfish/pi-github",
    );
    if (github === undefined) {
      throw new Error("GitHub package was not discovered.");
    }
    await expect(resolvePackageSkills(github)).resolves.toHaveLength(3);
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
