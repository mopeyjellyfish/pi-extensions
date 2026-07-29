import { execFile, execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const HELPER = join(PACKAGE_ROOT, "scripts", "feature-flow.mjs");
const roots: string[] = [];

interface RunResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

async function createRepository(branch = "main") {
  const root = await mkdtemp(join(tmpdir(), "feature-flow-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet", "--initial-branch", branch], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Feature Flow Test"], { cwd: root });
  await writeFile(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "fixture"], { cwd: root });
  const base = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  return { root, base, featureRoot: join(root, "docs", "features", "sample-feature") };
}

async function createPlannedFeature() {
  const repository = await createRepository("shape/sample-feature");
  const initialized = run(
    repository.root,
    "init",
    "sample-feature",
    "--branch",
    "shape/sample-feature",
    "--base",
    repository.base,
  );
  if (initialized.status !== 0) throw new Error(initialized.stderr);
  const pitchPath = join(repository.featureRoot, "pitch.md");
  const pitch = (await readFile(pitchPath, "utf8")).replace("status: draft", "status: accepted");
  await writeFile(pitchPath, pitch);
  const ledgerPath = join(repository.featureRoot, "index.json");
  const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as Record<string, unknown>;
  ledger["pitch"] = {
    path: "pitch.md",
    number: 1,
    sha256: createHash("sha256").update(pitch).digest("hex"),
  };
  const evidence = { red_green: null, review: null, dogfood: null, checks: null, banking: null };
  ledger["slices"] = [
    {
      id: "001",
      plan: "plans/001-first.md",
      goal: "First outcome",
      depends_on: [],
      status: "pending",
      blocker: null,
      evidence: { ...evidence },
    },
    {
      id: "002",
      plan: "plans/002-second.md",
      goal: "Second outcome",
      depends_on: ["001"],
      status: "pending",
      blocker: null,
      evidence: { ...evidence },
    },
  ];
  await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  return { ...repository, ledgerPath };
}

function run(cwd: string, ...args: string[]): RunResult {
  const result = spawnSync(process.execPath, [HELPER, ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

async function runAsync(cwd: string, helper: string, ...args: string[]): Promise<RunResult> {
  return new Promise((resolvePromise) => {
    execFile(
      process.execPath,
      [helper, ...args],
      { cwd, encoding: "utf8" },
      (error, stdout, stderr) => {
        resolvePromise({
          status: error === null ? 0 : typeof error.code === "number" ? error.code : 1,
          stdout,
          stderr,
        });
      },
    );
  });
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map(async (root) => rm(root, { recursive: true, force: true })),
  );
});

describe("feature-flow helper", () => {
  it("refuses ledger writes when the recorded route no longer matches", async () => {
    expect.hasAssertions();
    const { root, base, ledgerPath } = await createPlannedFeature();
    const before = await readFile(ledgerPath, "utf8");
    execFileSync("git", ["switch", "--quiet", "-c", "wrong-route"], { cwd: root });

    const result = run(root, "activate", "sample-feature", "001");

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      decision: {
        kind: "routing",
        reason: "branch-mismatch",
        expected: { branch: "shape/sample-feature", base_sha: base },
        actual: { branch: "wrong-route", head_sha: base },
        next_action: "Use Worktrunk to activate the recorded feature route, then retry.",
      },
    });
    expect(await readFile(ledgerPath, "utf8")).toBe(before);
  });

  it("rejects commit banking while post-bank files are dirty", async () => {
    expect.hasAssertions();
    const { root } = await createPlannedFeature();
    expect(run(root, "activate", "sample-feature", "001").status).toBe(0);
    expect(
      run(
        root,
        "complete",
        "sample-feature",
        "001",
        "--red-green",
        "red then green",
        "--review",
        "blocker-free",
        "--dogfood",
        "integrated path passed",
        "--checks",
        "checks passed",
        "--banking",
        "commit",
      ).status,
    ).toBe(0);
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync(
      "git",
      ["commit", "--quiet", "-m", "feat(sample): complete first slice", "-m", "Feature-Slice: 001"],
      { cwd: root },
    );
    await writeFile(join(root, "dirty.txt"), "not banked\n");

    const activation = run(root, "activate", "sample-feature", "002");

    expect(activation.status).toBe(1);
    expect(JSON.parse(activation.stderr)).toMatchObject({
      errors: [{ reason: "checkout must be clean before commit banking permits activation" }],
    });
  });

  it("rejects a stale bank commit after cleanly committed evidence changes", async () => {
    expect.hasAssertions();
    const { root, ledgerPath } = await createPlannedFeature();
    expect(run(root, "activate", "sample-feature", "001").status).toBe(0);
    expect(
      run(
        root,
        "complete",
        "sample-feature",
        "001",
        "--red-green",
        "red then green",
        "--review",
        "blocker-free",
        "--dogfood",
        "integrated path passed",
        "--checks",
        "checks passed",
        "--banking",
        "commit",
      ).status,
    ).toBe(0);
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync(
      "git",
      ["commit", "--quiet", "-m", "feat(sample): complete first slice", "-m", "Feature-Slice: 001"],
      { cwd: root },
    );
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as {
      slices: { evidence: { review: string } }[];
    };
    const firstSlice = ledger.slices[0];
    if (firstSlice === undefined) throw new Error("fixture is missing slice 001");
    firstSlice.evidence.review = "later evidence without a matching trailer";
    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "--quiet", "-m", "docs(sample): change evidence"], {
      cwd: root,
    });

    const inspection = run(root, "inspect", "sample-feature");

    expect(inspection.status).toBe(0);
    expect(JSON.parse(inspection.stdout)).toMatchObject({
      phase: "banking",
      current_slice: "001",
    });
  });

  it("keeps repository-policy checkpoints valid without a commit", async () => {
    expect.hasAssertions();
    const { root } = await createPlannedFeature();
    expect(run(root, "activate", "sample-feature", "001").status).toBe(0);

    const completion = run(
      root,
      "complete",
      "sample-feature",
      "001",
      "--red-green",
      "red then green",
      "--review",
      "blocker-free",
      "--dogfood",
      "integrated path passed",
      "--checks",
      "checks passed",
      "--banking",
      "checkpoint: repository policy forbids commits",
    );
    const activation = run(root, "activate", "sample-feature", "002");

    expect(completion.status).toBe(0);
    expect(JSON.parse(completion.stdout)).toMatchObject({
      phase: "building",
      next_action: "Activate dependency-ready slice 002.",
    });
    expect(activation.status).toBe(0);
  });

  it("recognizes a Feature-Slice commit and permits the next activation", async () => {
    expect.hasAssertions();
    const { root } = await createPlannedFeature();
    expect(run(root, "activate", "sample-feature", "001").status).toBe(0);
    expect(
      run(
        root,
        "complete",
        "sample-feature",
        "001",
        "--red-green",
        "red then green and refactor green",
        "--review",
        "blocker-free",
        "--dogfood",
        "integrated path passed",
        "--checks",
        "checks passed",
        "--banking",
        "commit",
      ).status,
    ).toBe(0);
    execFileSync("git", ["add", "docs/features/sample-feature"], { cwd: root });
    execFileSync(
      "git",
      ["commit", "--quiet", "-m", "feat(sample): complete first slice", "-m", "Feature-Slice: 001"],
      { cwd: root },
    );

    const inspection = run(root, "inspect", "sample-feature");
    const activation = run(root, "activate", "sample-feature", "002");

    expect(JSON.parse(inspection.stdout)).toMatchObject({
      phase: "building",
      current_slice: null,
      next_action: "Activate dependency-ready slice 002.",
    });
    expect(activation.status).toBe(0);
    expect(JSON.parse(activation.stdout)).toMatchObject({ current_slice: "002" });
  });

  it("requires complete evidence and blocks advancement until commit banking", async () => {
    expect.hasAssertions();
    const { root, ledgerPath } = await createPlannedFeature();
    expect(run(root, "activate", "sample-feature", "001").status).toBe(0);

    const completed = run(
      root,
      "complete",
      "sample-feature",
      "001",
      "--red-green",
      "resource and route tracers observed red then green; refactor stayed green",
      "--review",
      "independent review blocker-free",
      "--dogfood",
      "route cases and canonical writes exercised",
      "--checks",
      "focused and repository checks passed",
      "--banking",
      "commit",
    );

    expect(completed.status).toBe(0);
    expect(JSON.parse(completed.stdout)).toMatchObject({
      ok: true,
      command: "complete",
      phase: "banking",
      current_slice: "001",
      next_action: "Bank slice 001 before any other transition.",
    });
    const advance = run(root, "activate", "sample-feature", "002");
    expect(advance.status).toBe(1);
    const advanceOutput = JSON.parse(advance.stderr) as {
      ok: boolean;
      errors: { path: string; reason: string }[];
    };
    expect(advanceOutput.ok).toBe(false);
    expect(advanceOutput.errors).toHaveLength(1);
    expect(advanceOutput.errors[0]?.path).toMatch(/docs\/features\/sample-feature\/index\.json$/u);
    expect(advanceOutput.errors[0]?.reason).toBe(
      "an earlier done slice must be banked before activation",
    );
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as {
      slices: { status: string; evidence: Record<string, string | null> }[];
    };
    expect(ledger.slices[0]).toMatchObject({
      status: "done",
      evidence: {
        red_green: "resource and route tracers observed red then green; refactor stayed green",
        review: "independent review blocker-free",
        dogfood: "route cases and canonical writes exercised",
        checks: "focused and repository checks passed",
        banking: "commit",
      },
    });
    expect(ledger.slices[1]?.status).toBe("pending");
  });

  it("rejects blank completion evidence without changing one ledger byte", async () => {
    expect.hasAssertions();
    const { root, ledgerPath } = await createPlannedFeature();
    expect(run(root, "activate", "sample-feature", "001").status).toBe(0);
    const before = await readFile(ledgerPath, "utf8");

    const result = run(
      root,
      "complete",
      "sample-feature",
      "001",
      "--red-green",
      "red then green",
      "--review",
      " ",
      "--dogfood",
      "integrated path passed",
      "--checks",
      "checks passed",
      "--banking",
      "commit",
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      ok: false,
      errors: [{ path: "<arguments>" }],
    });
    expect(await readFile(ledgerPath, "utf8")).toBe(before);
  });

  it("activates one dependency-ready pending slice", async () => {
    expect.hasAssertions();
    const { root, ledgerPath } = await createPlannedFeature();

    const result = run(root, "activate", "sample-feature", "001");

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: "activate",
      feature: "sample-feature",
      phase: "building",
      current_slice: "001",
      next_action: "Deliver slice 001.",
    });
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as {
      slices: { id: string; status: string }[];
    };
    expect(ledger.slices.map(({ id, status }) => ({ id, status }))).toEqual([
      { id: "001", status: "active" },
      { id: "002", status: "pending" },
    ]);
  });

  it("inspects the canonical ledger and derives the shaping next action", async () => {
    expect.hasAssertions();
    const { root, base } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);

    const result = run(root, "inspect", "sample-feature");

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      ok: true,
      command: "inspect",
      feature: "sample-feature",
      phase: "shaping",
      current_slice: null,
      next_action: "Continue shaping the draft pitch.",
    });
  });

  it("publishes neither canonical artifact when the atomic directory rename fails", async () => {
    expect.hasAssertions();
    const { root, base, featureRoot } = await createRepository("shape/sample-feature");
    const copiedPackage = await mkdtemp(join(tmpdir(), "feature-flow-shipped-"));
    roots.push(copiedPackage);
    const copiedHelper = join(copiedPackage, "scripts", "feature-flow.mjs");
    const copiedTemplates = join(copiedPackage, "skills", "shape", "templates");
    await mkdir(join(copiedPackage, "scripts"), { recursive: true });
    await mkdir(copiedTemplates, { recursive: true });
    await copyFile(HELPER, copiedHelper);
    await copyFile(
      join(PACKAGE_ROOT, "skills", "shape", "templates", "index.json"),
      join(copiedTemplates, "index.json"),
    );
    const pitchTemplate = await readFile(
      join(PACKAGE_ROOT, "skills", "shape", "templates", "pitch.md"),
      "utf8",
    );
    await writeFile(
      join(copiedTemplates, "pitch.md"),
      `${pitchTemplate}${"x".repeat(16 * 1024 * 1024)}`,
    );

    const running = runAsync(
      root,
      copiedHelper,
      "init",
      "sample-feature",
      "--branch",
      "shape/sample-feature",
      "--base",
      base,
    );
    const featuresRoot = join(root, "docs", "features");
    await Promise.race([
      (async () => {
        for (;;) {
          let entries: string[] = [];
          try {
            entries = await readdir(featuresRoot);
          } catch {
            // The canonical parent does not exist until init begins staging.
          }
          if (entries.some((entry) => entry.startsWith(".sample-feature.tmp-"))) return;
          await new Promise((resolvePromise) => setTimeout(resolvePromise, 1));
        }
      })(),
      (async () => {
        const result = await running;
        throw new Error(`init exited before staging artifacts: ${result.stderr}`);
      })(),
    ]);
    await mkdir(featureRoot);
    await writeFile(join(featureRoot, "blocker.txt"), "force publish failure\n");

    const result = await running;

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(await readdir(featureRoot)).toEqual(["blocker.txt"]);
    expect(await exists(join(featureRoot, "pitch.md"))).toBe(false);
    expect(await exists(join(featureRoot, "index.json"))).toBe(false);
    expect(
      (await readdir(featuresRoot)).some((entry) => entry.startsWith(".sample-feature.tmp-")),
    ).toBe(false);
  });

  it("creates only the canonical draft pitch and top-level ledger on the verified route", async () => {
    expect.hasAssertions();
    const { root, base, featureRoot } = await createRepository("shape/sample-feature");

    const result = run(
      root,
      "init",
      "sample-feature",
      "--branch",
      "shape/sample-feature",
      "--base",
      base,
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: "init",
      feature: "sample-feature",
      phase: "shaping",
      next_action: "Continue shaping the draft pitch.",
    });
    expect(await readdir(featureRoot)).toEqual(["index.json", "pitch.md"]);
    expect(await readFile(join(featureRoot, "pitch.md"), "utf8")).toContain(
      'schema: feature-flow-pitch/v3\nfeature: "sample-feature"\npitch: 1\nstatus: draft',
    );
    expect(JSON.parse(await readFile(join(featureRoot, "index.json"), "utf8"))).toEqual({
      schema: "feature-flow/v3",
      feature: "sample-feature",
      worktree: { branch: "shape/sample-feature", base_sha: base },
      pitch: { path: "pitch.md", number: 1, sha256: null },
      slices: [],
    });
    expect(await exists(join(featureRoot, "plans"))).toBe(false);
    expect(await exists(join(featureRoot, "assets"))).toBe(false);
    expect(await exists(join(featureRoot, "prototypes"))).toBe(false);
  });

  it("requests one routing decision and writes nothing on a base mismatch", async () => {
    expect.hasAssertions();
    const { root, featureRoot } = await createRepository("shape/sample-feature");
    const wrongBase = "0".repeat(40);

    const result = run(
      root,
      "init",
      "sample-feature",
      "--branch",
      "shape/sample-feature",
      "--base",
      wrongBase,
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      ok: false,
      decision: {
        kind: "routing",
        reason: "base-mismatch",
        expected: { branch: "shape/sample-feature", base_sha: wrongBase },
        actual: { branch: "shape/sample-feature" },
        next_action: "Use Worktrunk to recreate the route from the expected base, then retry init.",
      },
    });
    expect(await exists(featureRoot)).toBe(false);
  });

  it("requests one routing decision and writes nothing on a branch collision", async () => {
    expect.hasAssertions();
    const { root, base, featureRoot } = await createRepository();
    execFileSync("git", ["branch", "shape/sample-feature"], { cwd: root });

    const result = run(
      root,
      "init",
      "sample-feature",
      "--branch",
      "shape/sample-feature",
      "--base",
      base,
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      decision: {
        kind: "routing",
        reason: "branch-collision",
        expected: { branch: "shape/sample-feature", base_sha: base },
        actual: { branch: "main", head_sha: base },
        next_action: "Inspect the existing branch with Worktrunk before choosing a route.",
      },
    });
    expect(await exists(featureRoot)).toBe(false);
  });

  it("requests one routing decision and writes nothing when the base is ambiguous", async () => {
    expect.hasAssertions();
    const { root, base, featureRoot } = await createRepository("shape/sample-feature");

    const result = run(root, "init", "sample-feature", "--branch", "shape/sample-feature");

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      decision: {
        kind: "routing",
        reason: "ambiguous-base",
        expected: { branch: "shape/sample-feature", base_sha: null },
        actual: { branch: "shape/sample-feature", head_sha: base },
        next_action: "Choose one verified base commit, then retry init with --base.",
      },
    });
    expect(await exists(featureRoot)).toBe(false);
  });

  it("requests one routing decision and writes nothing on a dirty checkout", async () => {
    expect.hasAssertions();
    const { root, base, featureRoot } = await createRepository("shape/sample-feature");
    await writeFile(join(root, "dirty.txt"), "dirty\n");

    const result = run(
      root,
      "init",
      "sample-feature",
      "--branch",
      "shape/sample-feature",
      "--base",
      base,
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      decision: {
        kind: "routing",
        reason: "dirty-checkout",
        expected: { branch: "shape/sample-feature", base_sha: base },
        actual: { branch: "shape/sample-feature", head_sha: base },
        next_action: "Choose how to preserve or move the existing changes before retrying init.",
      },
    });
    expect(await exists(featureRoot)).toBe(false);
  });

  it("requests one routing decision and writes nothing on a branch mismatch", async () => {
    expect.hasAssertions();
    const { root, base, featureRoot } = await createRepository();

    const result = run(
      root,
      "init",
      "sample-feature",
      "--branch",
      "shape/sample-feature",
      "--base",
      base,
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      decision: {
        kind: "routing",
        reason: "branch-mismatch",
        expected: { branch: "shape/sample-feature", base_sha: base },
        actual: { branch: "main", head_sha: base },
        next_action: "Use Worktrunk to activate the expected branch, then retry init.",
      },
    });
    expect(await exists(featureRoot)).toBe(false);
  });
});
