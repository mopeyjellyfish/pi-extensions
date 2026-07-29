import { execFile, execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
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

async function createCandidateWorktrees(withStale = false) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "feature-flow-candidates-"));
  roots.push(fixtureRoot);
  const root = join(fixtureRoot, "main");
  await mkdir(root);
  execFileSync("git", ["init", "--quiet", "--initial-branch", "main"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Feature Flow Test"], { cwd: root });
  await writeFile(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "fixture"], { cwd: root });
  const base = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const validRoot = join(fixtureRoot, "valid");
  execFileSync("git", ["worktree", "add", "--quiet", "-b", "shape/valid-feature", validRoot], {
    cwd: root,
  });
  expect(
    run(validRoot, "init", "valid-feature", "--branch", "shape/valid-feature", "--base", base)
      .status,
  ).toBe(0);

  const staleRoot = withStale ? join(fixtureRoot, "stale") : "";
  let staleLedgerPath = "";
  if (withStale) {
    execFileSync("git", ["worktree", "add", "--quiet", "-b", "shape/stale-feature", staleRoot], {
      cwd: root,
    });
    expect(
      run(staleRoot, "init", "stale-feature", "--branch", "shape/stale-feature", "--base", base)
        .status,
    ).toBe(0);
    staleLedgerPath = join(staleRoot, "docs", "features", "stale-feature", "index.json");
    const staleLedger = JSON.parse(await readFile(staleLedgerPath, "utf8")) as {
      worktree: { branch: string };
    };
    staleLedger.worktree.branch = "shape/other-feature";
    await writeFile(staleLedgerPath, `${JSON.stringify(staleLedger, null, 2)}\n`);
  }
  return { base, root, staleLedgerPath, staleRoot, validRoot };
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
  const evidence = emptyEvidence();
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

function runWithHelper(cwd: string, helper: string, ...args: string[]): RunResult {
  const result = spawnSync(process.execPath, [helper, ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function run(cwd: string, ...args: string[]): RunResult {
  return runWithHelper(cwd, HELPER, ...args);
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

const emptyEvidence = () => ({
  red_green: null,
  review: null,
  dogfood: null,
  checks: null,
  banking: null,
});

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function prospectiveHash(cwd: string, feature = "sample-feature"): string {
  const result = run(cwd, "validate-pitch", feature);
  if (result.status !== 0) throw new Error(result.stderr);
  return (JSON.parse(result.stdout) as { prospective_sha256: string }).prospective_sha256;
}

function acceptPitch(cwd: string, feature = "sample-feature"): RunResult {
  return run(cwd, "accept", feature, prospectiveHash(cwd, feature));
}

async function patchedHelper(
  root: string,
  name: string,
  marker: string,
  replacement: string,
): Promise<string> {
  const path = join(root, name);
  const source = await readFile(HELPER, "utf8");
  if (!source.includes(marker)) throw new Error(`missing helper fault marker: ${marker}`);
  if (source.indexOf(marker) !== source.lastIndexOf(marker)) {
    throw new Error(`ambiguous helper fault marker: ${marker}`);
  }
  const patched = source.replace(marker, replacement);
  if (patched === source) throw new Error("helper fault marker was not replaced");
  await writeFile(path, patched);
  return path;
}

async function registerSinglePlan(
  featureRoot: string,
  slice: Record<string, unknown> = {},
): Promise<void> {
  await mkdir(join(featureRoot, "plans"));
  await writeFile(join(featureRoot, "plans", "001-first.md"), "# First used plan\n");
  const ledgerPath = join(featureRoot, "index.json");
  const ledger = await readJson(ledgerPath);
  ledger["slices"] = [
    {
      id: "001",
      plan: "plans/001-first.md",
      goal: "First outcome",
      depends_on: [],
      status: "pending",
      blocker: null,
      evidence: emptyEvidence(),
      ...slice,
    },
  ];
  await writeJson(ledgerPath, ledger);
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map(async (root) => rm(root, { recursive: true, force: true })),
  );
});

describe("feature-flow helper", () => {
  it("accepts a draft by changing only its status and pins the final file hash", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    const pitchPath = join(featureRoot, "pitch.md");
    const ledgerPath = join(featureRoot, "index.json");
    const draft = await readFile(pitchPath, "utf8");

    const approvedHash = prospectiveHash(root);
    const result = run(root, "accept", "sample-feature", approvedHash);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const accepted = await readFile(pitchPath, "utf8");
    expect(accepted).toBe(draft.replace("status: draft", "status: accepted"));
    const hash = createHash("sha256").update(accepted).digest("hex");
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: "accept",
      feature: "sample-feature",
      sha256: hash,
      phase: "planning",
    });
    expect(await readJson(ledgerPath)).toMatchObject({ pitch: { sha256: hash } });
  });

  it("rejects acceptance when the approved prospective bytes changed after validation", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    const approvedHash = prospectiveHash(root);
    const pitchPath = join(featureRoot, "pitch.md");
    const ledgerPath = join(featureRoot, "index.json");
    await writeFile(pitchPath, `${await readFile(pitchPath, "utf8")}edited after approval\n`);
    const [pitchBefore, ledgerBefore] = await Promise.all([
      readFile(pitchPath, "utf8"),
      readFile(ledgerPath, "utf8"),
    ]);

    const result = run(root, "accept", "sample-feature", approvedHash);

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toMatchObject({
      errors: [{ reason: "current prospective pitch sha256 does not match the approved hash" }],
    });
    await expect(readFile(pitchPath, "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
  });

  it("requires a full lowercase 64-hex approved hash without writing", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    const pitchPath = join(featureRoot, "pitch.md");
    const ledgerPath = join(featureRoot, "index.json");
    const [pitchBefore, ledgerBefore] = await Promise.all([
      readFile(pitchPath, "utf8"),
      readFile(ledgerPath, "utf8"),
    ]);

    const result = run(root, "accept", "sample-feature", "a".repeat(63));

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toMatchObject({ errors: [{ path: "<arguments>" }] });
    await expect(readFile(pitchPath, "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
  });

  it("rejects prospective acceptance when premature plans exist and writes nothing", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    await mkdir(join(featureRoot, "plans"));
    await writeFile(join(featureRoot, "plans", "001-premature.md"), "# Premature plan\n");
    const pitchPath = join(featureRoot, "pitch.md");
    const ledgerPath = join(featureRoot, "index.json");
    const [pitchBefore, ledgerBefore] = await Promise.all([
      readFile(pitchPath, "utf8"),
      readFile(ledgerPath, "utf8"),
    ]);

    const result = run(root, "validate-pitch", "sample-feature");

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toMatchObject({
      errors: [{ reason: "plans must not exist before pitch acceptance" }],
    });
    await expect(readFile(pitchPath, "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
  });

  it("validates the prospective accepted pitch without writing either artifact", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    const pitchPath = join(featureRoot, "pitch.md");
    const ledgerPath = join(featureRoot, "index.json");
    const [pitchBefore, ledgerBefore] = await Promise.all([
      readFile(pitchPath, "utf8"),
      readFile(ledgerPath, "utf8"),
    ]);
    const expectedHash = createHash("sha256")
      .update(pitchBefore.replace("status: draft", "status: accepted"))
      .digest("hex");

    const result = run(root, "validate-pitch", "sample-feature");

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: "validate-pitch",
      feature: "sample-feature",
      prospective_sha256: expectedHash,
      ready_for_approval: true,
    });
    await expect(readFile(pitchPath, "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
  });

  it("accepts a 100000-character question document and rejects one character more", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    const pitchPath = join(featureRoot, "pitch.md");
    const ledgerPath = join(featureRoot, "index.json");
    const pitch = await readFile(pitchPath, "utf8");
    const boundaryPitch = `${pitch}${"🪼".repeat(100_000 - pitch.length)}`;
    await writeFile(pitchPath, boundaryPitch);

    const atBoundary = run(root, "validate-pitch", "sample-feature");
    expect(atBoundary.status).toBe(0);

    const nearBoundary = `${pitch}${"x".repeat(99_999 - pitch.length)}`;
    for (const suffix of ["👍🏽", "\r\n", "x\u{FE0F}"]) {
      await writeFile(pitchPath, `${nearBoundary}${suffix}`);
      const incompatibleBoundary = run(root, "validate-pitch", "sample-feature");
      expect({ suffix, status: incompatibleBoundary.status }).toEqual({ suffix, status: 1 });
    }

    await writeFile(pitchPath, `${boundaryPitch}🪼`);
    const ledgerBefore = await readFile(ledgerPath, "utf8");
    const overBoundary = run(root, "validate-pitch", "sample-feature");

    expect(overBoundary.status).toBe(1);
    expect(JSON.parse(overBoundary.stderr)).toMatchObject({
      errors: [{ reason: "pitch must fit the question tool's 100000-character document limit" }],
    });
    await expect(readFile(pitchPath, "utf8")).resolves.toBe(`${boundaryPitch}🪼`);
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
  });

  it("rejects a symlinked feature root without changing external bytes", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    const externalRoot = await mkdtemp(join(tmpdir(), "feature-flow-external-"));
    roots.push(externalRoot);
    await Promise.all([
      copyFile(join(featureRoot, "pitch.md"), join(externalRoot, "pitch.md")),
      copyFile(join(featureRoot, "index.json"), join(externalRoot, "index.json")),
    ]);
    const [pitchBefore, ledgerBefore] = await Promise.all([
      readFile(join(externalRoot, "pitch.md"), "utf8"),
      readFile(join(externalRoot, "index.json"), "utf8"),
    ]);
    await rm(featureRoot, { recursive: true });
    await symlink(externalRoot, featureRoot, "dir");

    const result = run(root, "accept", "sample-feature", "0".repeat(64));

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toMatchObject({
      errors: [{ reason: "feature path must resolve inside the canonical repository" }],
    });
    await expect(readFile(join(externalRoot, "pitch.md"), "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(join(externalRoot, "index.json"), "utf8")).resolves.toBe(ledgerBefore);
    await expect(readdir(externalRoot)).resolves.toEqual(["index.json", "pitch.md"]);
  });

  it("rejects a symlinked features ancestor without changing external bytes", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    const externalRoot = await mkdtemp(join(tmpdir(), "feature-flow-external-features-"));
    roots.push(externalRoot);
    const externalFeatureRoot = join(externalRoot, "sample-feature");
    await mkdir(externalFeatureRoot);
    await Promise.all([
      copyFile(join(featureRoot, "pitch.md"), join(externalFeatureRoot, "pitch.md")),
      copyFile(join(featureRoot, "index.json"), join(externalFeatureRoot, "index.json")),
    ]);
    const [pitchBefore, ledgerBefore] = await Promise.all([
      readFile(join(externalFeatureRoot, "pitch.md"), "utf8"),
      readFile(join(externalFeatureRoot, "index.json"), "utf8"),
    ]);
    const featuresRoot = join(root, "docs", "features");
    await rm(featuresRoot, { recursive: true });
    await symlink(externalRoot, featuresRoot, "dir");

    const result = run(root, "accept", "sample-feature", "0".repeat(64));

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toMatchObject({
      errors: [{ reason: "features path must resolve inside the canonical repository" }],
    });
    await expect(readFile(join(externalFeatureRoot, "pitch.md"), "utf8")).resolves.toBe(
      pitchBefore,
    );
    await expect(readFile(join(externalFeatureRoot, "index.json"), "utf8")).resolves.toBe(
      ledgerBefore,
    );
    await expect(readdir(externalFeatureRoot)).resolves.toEqual(["index.json", "pitch.md"]);
  });

  it("rolls back both acceptance artifacts after an ordinary second-write failure", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    const pitchPath = join(featureRoot, "pitch.md");
    const ledgerPath = join(featureRoot, "index.json");
    const [pitchBefore, ledgerBefore] = await Promise.all([
      readFile(pitchPath, "utf8"),
      readFile(ledgerPath, "utf8"),
    ]);
    const copiedHelper = await patchedHelper(
      root,
      "feature-flow-failing-accept.mjs",
      "    await writeLedger(path, acceptedLedger);",
      '    throw new Error("simulated second acceptance write failure");',
    );

    const result = runWithHelper(
      root,
      copiedHelper,
      "accept",
      "sample-feature",
      prospectiveHash(root),
    );

    expect(result.status).toBe(1);
    await expect(readFile(pitchPath, "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
  });

  it("archives accepted pitch bytes and used plans before starting the next complete draft", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    expect(acceptPitch(root).status).toBe(0);
    const pitchPath = join(featureRoot, "pitch.md");
    const accepted = await readFile(pitchPath, "utf8");
    const plansPath = join(featureRoot, "plans");
    await mkdir(plansPath);
    await writeFile(join(plansPath, "001-first.md"), "# First used plan\n");
    const ledgerPath = join(featureRoot, "index.json");
    const ledger = await readJson(ledgerPath);
    ledger["slices"] = [
      {
        id: "001",
        plan: "plans/001-first.md",
        goal: "First outcome",
        depends_on: [],
        status: "pending",
        blocker: null,
        evidence: emptyEvidence(),
      },
    ];
    await writeJson(ledgerPath, ledger);
    await writeFile(join(root, "banked-code.txt"), "preserve me\n");

    const result = run(root, "repitch", "sample-feature");

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: "repitch",
      feature: "sample-feature",
      archived_pitch: "pitch-v001.md",
      archived_plans: "plans-v001",
      pitch_number: 2,
      phase: "shaping",
    });
    await expect(readFile(join(featureRoot, "pitch-v001.md"), "utf8")).resolves.toBe(accepted);
    await expect(readFile(join(featureRoot, "plans-v001", "001-first.md"), "utf8")).resolves.toBe(
      "# First used plan\n",
    );
    expect(await exists(plansPath)).toBe(false);
    expect(await readFile(pitchPath, "utf8")).toBe(
      accepted.replace("pitch: 1", "pitch: 2").replace("status: accepted", "status: draft"),
    );
    expect(await readJson(ledgerPath)).toMatchObject({
      pitch: { path: "pitch.md", number: 2, sha256: null },
      slices: [],
    });
    await expect(readFile(join(root, "banked-code.txt"), "utf8")).resolves.toBe("preserve me\n");
    expect(await exists(join(featureRoot, "assets"))).toBe(false);
    expect(await exists(join(featureRoot, "prototypes"))).toBe(false);
  });

  it("rejects repitch while a done slice is unbanked and changes no bytes", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    expect(acceptPitch(root).status).toBe(0);
    await registerSinglePlan(featureRoot, {
      status: "done",
      evidence: {
        red_green: "red then green",
        review: "blocker-free",
        dogfood: "integrated path passed",
        checks: "checks passed",
        banking: "commit",
      },
    });
    const pitchPath = join(featureRoot, "pitch.md");
    const ledgerPath = join(featureRoot, "index.json");
    const planPath = join(featureRoot, "plans", "001-first.md");
    const [pitchBefore, ledgerBefore, planBefore, entriesBefore] = await Promise.all([
      readFile(pitchPath, "utf8"),
      readFile(ledgerPath, "utf8"),
      readFile(planPath, "utf8"),
      readdir(featureRoot),
    ]);

    const result = run(root, "repitch", "sample-feature");

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toMatchObject({
      errors: [{ reason: "all done slices must be banked before repitching" }],
    });
    await expect(readFile(pitchPath, "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
    await expect(readFile(planPath, "utf8")).resolves.toBe(planBefore);
    await expect(readdir(featureRoot)).resolves.toEqual(entriesBefore);
  });

  it("permits repitch when a done slice has a checkpoint or verified commit bank", async () => {
    expect.hasAssertions();
    for (const banking of ["checkpoint: repository policy forbids commits", "commit"]) {
      const { base, featureRoot, root } = await createRepository("shape/sample-feature");
      expect(
        run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
          .status,
      ).toBe(0);
      expect(acceptPitch(root).status).toBe(0);
      await registerSinglePlan(featureRoot, {
        status: "done",
        evidence: {
          red_green: "red then green",
          review: "blocker-free",
          dogfood: "integrated path passed",
          checks: "checks passed",
          banking,
        },
      });
      if (banking === "commit") {
        execFileSync("git", ["add", "docs/features/sample-feature"], { cwd: root });
        execFileSync(
          "git",
          ["commit", "--quiet", "-m", "feat(sample): bank slice", "-m", "Feature-Slice: 001"],
          { cwd: root },
        );
      }

      const result = run(root, "repitch", "sample-feature");

      expect({ banking, status: result.status }).toEqual({ banking, status: 0 });
      await expect(readFile(join(featureRoot, "pitch-v001.md"), "utf8")).resolves.toContain(
        "status: accepted",
      );
      await expect(readFile(join(featureRoot, "plans-v001", "001-first.md"), "utf8")).resolves.toBe(
        "# First used plan\n",
      );
    }
  });

  it("preflights archive collisions and missing registered plan sources without writes", async () => {
    expect.hasAssertions();
    const cases = ["pitch archive", "plan archive", "missing plan source"] as const;
    for (const scenario of cases) {
      const { base, featureRoot, root } = await createRepository("shape/sample-feature");
      expect(
        run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
          .status,
      ).toBe(0);
      expect(acceptPitch(root).status).toBe(0);
      await registerSinglePlan(featureRoot);
      if (scenario === "pitch archive") {
        await writeFile(join(featureRoot, "pitch-v001.md"), "collision\n");
      } else if (scenario === "plan archive") {
        await mkdir(join(featureRoot, "plans-v001"));
      } else {
        await rm(join(featureRoot, "plans", "001-first.md"));
      }
      const pitchPath = join(featureRoot, "pitch.md");
      const ledgerPath = join(featureRoot, "index.json");
      const [pitchBefore, ledgerBefore, entriesBefore] = await Promise.all([
        readFile(pitchPath, "utf8"),
        readFile(ledgerPath, "utf8"),
        readdir(featureRoot),
      ]);

      const result = run(root, "repitch", "sample-feature");

      expect({ scenario, status: result.status }).toEqual({ scenario, status: 1 });
      await expect(readFile(pitchPath, "utf8")).resolves.toBe(pitchBefore);
      await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
      await expect(readdir(featureRoot)).resolves.toEqual(entriesBefore);
    }
  });

  it("removes every staged repitch artifact when prospective publication fails", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    expect(acceptPitch(root).status).toBe(0);
    const writeStagedLedger =
      '    await writeFile(stagedLedger, `${JSON.stringify(nextLedger, null, 2)}\\n`, { flag: "wx" });';
    const copiedHelper = await patchedHelper(
      root,
      "feature-flow-failing-stage.mjs",
      writeStagedLedger,
      `${writeStagedLedger}\n    throw new Error("simulated staged write failure");`,
    );
    const pitchBefore = await readFile(join(featureRoot, "pitch.md"), "utf8");
    const ledgerBefore = await readFile(join(featureRoot, "index.json"), "utf8");

    const result = runWithHelper(root, copiedHelper, "repitch", "sample-feature");

    expect(result.status).toBe(1);
    await expect(readFile(join(featureRoot, "pitch.md"), "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(join(featureRoot, "index.json"), "utf8")).resolves.toBe(ledgerBefore);
    expect((await readdir(featureRoot)).some((entry) => entry.startsWith(".feature-flow-"))).toBe(
      false,
    );
  });

  it("rolls back pitch and plan archives after an ordinary repitch failure", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    expect(acceptPitch(root).status).toBe(0);
    const pitchPath = join(featureRoot, "pitch.md");
    const plansPath = join(featureRoot, "plans");
    await mkdir(plansPath);
    await writeFile(join(plansPath, "001-first.md"), "# First used plan\n");
    const ledgerPath = join(featureRoot, "index.json");
    const ledger = await readJson(ledgerPath);
    ledger["slices"] = [
      {
        id: "001",
        plan: "plans/001-first.md",
        goal: "First outcome",
        depends_on: [],
        status: "pending",
        blocker: null,
        evidence: emptyEvidence(),
      },
    ];
    await writeJson(ledgerPath, ledger);
    const [pitchBefore, ledgerBefore] = await Promise.all([
      readFile(pitchPath, "utf8"),
      readFile(ledgerPath, "utf8"),
    ]);
    const copiedHelper = await patchedHelper(
      root,
      "feature-flow-failing-repitch.mjs",
      "    await rename(path, ledgerBackup);",
      '    throw new Error("simulated repitch publish failure");',
    );

    const result = runWithHelper(root, copiedHelper, "repitch", "sample-feature");

    expect(result.status).toBe(1);
    await expect(readFile(pitchPath, "utf8")).resolves.toBe(pitchBefore);
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(ledgerBefore);
    await expect(readFile(join(plansPath, "001-first.md"), "utf8")).resolves.toBe(
      "# First used plan\n",
    );
    expect(await exists(join(featureRoot, "pitch-v001.md"))).toBe(false);
    expect(await exists(join(featureRoot, "plans-v001"))).toBe(false);
    expect((await readdir(featureRoot)).some((entry) => entry.startsWith(".feature-flow-"))).toBe(
      false,
    );
  });

  it("verifies accepted bytes and rejects one later byte change", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    expect(
      run(root, "init", "sample-feature", "--branch", "shape/sample-feature", "--base", base)
        .status,
    ).toBe(0);
    expect(acceptPitch(root).status).toBe(0);
    const verified = run(root, "verify", "sample-feature");
    expect(verified.status).toBe(0);
    expect(JSON.parse(verified.stdout)).toMatchObject({
      ok: true,
      command: "verify",
      feature: "sample-feature",
      immutable: true,
    });
    const pitchPath = join(featureRoot, "pitch.md");
    await writeFile(pitchPath, `${await readFile(pitchPath, "utf8")}changed\n`);

    const changed = run(root, "verify", "sample-feature");

    expect(changed.status).toBe(1);
    expect(JSON.parse(changed.stderr)).toMatchObject({
      errors: [{ reason: "accepted pitch sha256 does not match ledger" }],
    });
  });

  it("inspects supplied linked-worktree candidates read-only and separates stale ledgers", async () => {
    expect.hasAssertions();
    const { base, root, staleLedgerPath, staleRoot, validRoot } =
      await createCandidateWorktrees(true);
    const validLedgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    const [validBefore, staleBefore] = await Promise.all([
      readFile(validLedgerPath, "utf8"),
      readFile(staleLedgerPath, "utf8"),
    ]);

    const result = run(root, "inspect-candidates", validRoot, staleRoot);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      ok: true,
      command: "inspect-candidates",
      valid: [
        {
          feature: "valid-feature",
          branch: "shape/valid-feature",
          phase: "shaping",
          current_slice: null,
          next_action: "Continue shaping the draft pitch.",
        },
      ],
      stale: [
        {
          feature: "stale-feature",
          ledger: "docs/features/stale-feature/index.json",
          expected: { branch: "shape/other-feature", base_sha: base },
          actual: { branch: "shape/stale-feature", head_sha: base },
          reason: "recorded branch does not match the candidate worktree branch",
          next_action: "Do not activate this stale candidate; inspect its recorded route.",
        },
      ],
      invalid: [],
    });
    await expect(readFile(validLedgerPath, "utf8")).resolves.toBe(validBefore);
    await expect(readFile(staleLedgerPath, "utf8")).resolves.toBe(staleBefore);
  });

  it("reports a recorded base outside candidate HEAD lineage as stale", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const ledgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as {
      worktree: { base_sha: string };
    };
    ledger.worktree.base_sha = "0".repeat(40);
    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [],
      stale: [
        {
          feature: "valid-feature",
          ledger: "docs/features/valid-feature/index.json",
          expected: { branch: "shape/valid-feature", base_sha: "0".repeat(40) },
          actual: { branch: "shape/valid-feature" },
          reason: "recorded base is not an ancestor of the candidate worktree HEAD",
        },
      ],
      invalid: [],
    });
  });

  it("derives the active slice next action for an accepted candidate", async () => {
    expect.hasAssertions();
    const { root } = await createPlannedFeature();
    expect(run(root, "activate", "sample-feature", "001").status).toBe(0);

    const result = run(root, "inspect-candidates", root);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [
        {
          feature: "sample-feature",
          branch: "shape/sample-feature",
          phase: "building",
          current_slice: "001",
          next_action: "Deliver slice 001.",
        },
      ],
      stale: [],
      invalid: [],
    });
  });

  it("returns the blocked slice's exact recorded next action", async () => {
    expect.hasAssertions();
    const { ledgerPath, root } = await createPlannedFeature();
    const ledger = await readJson(ledgerPath);
    const slices = ledger["slices"] as Record<string, unknown>[];
    const first = slices[0];
    if (first === undefined) throw new Error("fixture is missing slice 001");
    first["status"] = "blocked";
    first["blocker"] = {
      reason: "Need a product decision",
      next_action: "Ask the owner whether archived records remain visible.",
    };
    await writeJson(ledgerPath, ledger);

    const result = run(root, "inspect", "sample-feature");

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      phase: "blocked",
      current_slice: "001",
      next_action: "Ask the owner whether archived records remain visible.",
    });
  });

  it("returns an empty bounded result when supplied worktrees contain no ledger", async () => {
    expect.hasAssertions();
    const { root } = await createRepository();

    const result = run(root, "inspect-candidates", root);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      ok: true,
      command: "inspect-candidates",
      valid: [],
      stale: [],
      invalid: [],
    });
  });

  it("returns every valid candidate for one later human choice", async () => {
    expect.hasAssertions();
    const { root, staleLedgerPath, staleRoot, validRoot } = await createCandidateWorktrees(true);
    const staleLedger = JSON.parse(await readFile(staleLedgerPath, "utf8")) as {
      worktree: { branch: string };
    };
    staleLedger.worktree.branch = "shape/stale-feature";
    await writeFile(staleLedgerPath, `${JSON.stringify(staleLedger, null, 2)}\n`);

    const result = run(root, "inspect-candidates", validRoot, staleRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [
        { feature: "valid-feature", branch: "shape/valid-feature", phase: "shaping" },
        { feature: "stale-feature", branch: "shape/stale-feature", phase: "shaping" },
      ],
      stale: [],
      invalid: [],
    });
  });

  it("canonicalizes aliases and inspects one worktree only once", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const alias = join(root, "valid-alias");
    await symlink(validRoot, alias, "dir");

    const result = run(root, "inspect-candidates", validRoot, alias);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [{ feature: "valid-feature" }],
      stale: [],
      invalid: [
        {
          candidate: 2,
          reason: "candidate resolves to a duplicate canonical worktree",
          next_action: "Exclude this duplicate candidate alias.",
        },
      ],
    });
  });

  it("inspects only the canonical feature on a shape branch", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const featuresRoot = join(validRoot, "docs", "features");
    const historicalRoot = join(featuresRoot, "historical-feature");
    await mkdir(historicalRoot);
    const currentRoot = join(featuresRoot, "valid-feature");
    await copyFile(join(currentRoot, "index.json"), join(historicalRoot, "index.json"));
    await copyFile(join(currentRoot, "pitch.md"), join(historicalRoot, "pitch.md"));
    const ledger = await readJson(join(historicalRoot, "index.json"));
    ledger["feature"] = "historical-feature";
    await writeJson(join(historicalRoot, "index.json"), ledger);
    await writeFile(
      join(historicalRoot, "pitch.md"),
      (await readFile(join(historicalRoot, "pitch.md"), "utf8")).replace(
        'feature: "valid-feature"',
        'feature: "historical-feature"',
      ),
    );

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [{ feature: "valid-feature" }],
      stale: [],
      invalid: [],
    });
  });

  it("ignores merged historical feature ledgers on a non-shape branch", async () => {
    expect.hasAssertions();
    const { root } = await createPlannedFeature();
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "--quiet", "-m", "historical feature"], { cwd: root });
    execFileSync("git", ["switch", "--quiet", "-c", "main"], { cwd: root });

    const result = run(root, "inspect-candidates", root);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      ok: true,
      command: "inspect-candidates",
      valid: [],
      stale: [],
      invalid: [],
    });
  });

  it("sanitizes candidate filesystem failures", async () => {
    expect.hasAssertions();
    const { root } = await createRepository();
    const missing = join(root, "private", "missing-worktree");

    const result = run(root, "inspect-candidates", missing);
    const output = JSON.parse(result.stdout) as {
      invalid: { reason: string }[];
    };

    expect(result.status).toBe(0);
    expect(output.invalid).toHaveLength(1);
    expect(output.invalid[0]?.reason).toBe("cannot inspect candidate Git facts");
    expect(output.invalid[0]?.reason).not.toContain(missing);
  });

  it("reports malformed candidate JSON without rewriting it", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const ledgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    await writeFile(ledgerPath, "{ malformed\n");
    const before = await readFile(ledgerPath, "utf8");

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [],
      stale: [],
      invalid: [{ candidate: 1, feature: "valid-feature" }],
    });
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(before);
  });

  it("rejects unknown ledger fields without rewriting the candidate", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const ledgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as Record<string, unknown>;
    ledger["projection"] = { phase: "shaping" };
    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
    const before = await readFile(ledgerPath, "utf8");

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [],
      stale: [],
      invalid: [
        {
          candidate: 1,
          feature: "valid-feature",
          reason: "ledger must contain only schema, feature, worktree, pitch, and slices",
        },
      ],
    });
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(before);
  });

  it("rejects out-of-bounds ledger fields", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const ledgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as { slices: unknown[] };
    ledger.slices = [
      {
        id: "001",
        plan: "plans/001-first.md",
        goal: "x".repeat(1025),
        depends_on: [],
        status: "pending",
        blocker: null,
        evidence: emptyEvidence(),
      },
    ];
    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [],
      invalid: [{ candidate: 1, feature: "valid-feature", reason: "slice has invalid fields" }],
    });
  });

  it("rejects local absolute paths anywhere in free text but permits HTTPS URLs", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const ledgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    const original = await readJson(ledgerPath);
    const cases = [
      ["POSIX root", "Inspect /etc before continuing", false],
      ["mounted POSIX path", "Evidence lives at /mnt", false],
      ["punctuation-adjacent POSIX path", "See (/Users/example/private).", false],
      ["home-relative path", "Read ~/private/notes", false],
      ["Windows drive with backslashes", String.raw`Read C:\Users\example\notes`, false],
      ["Windows drive with slashes", "Read D:/private/notes", false],
      ["Windows UNC path", String.raw`Read \\server\share\notes`, false],
      ["forward-slash UNC path", "Read //server/share/notes", false],
      ["file URL", "Read file:///Users/example/notes", false],
      ["short file URL", "Read file:/etc/hosts", false],
      ["repeated-slash POSIX path", "Read ///tmp/private", false],
      ["HTTPS URL", "Read https://example.com/docs", true],
      ["slash commands", "Run /shape, then /reload", true],
    ] as const;

    for (const [label, goal, valid] of cases) {
      const ledger = structuredClone(original);
      ledger["slices"] = [
        {
          id: "001",
          plan: "plans/001-first.md",
          goal,
          depends_on: [],
          status: "pending",
          blocker: null,
          evidence: emptyEvidence(),
        },
      ];
      await writeJson(ledgerPath, ledger);

      const result = JSON.parse(run(root, "inspect-candidates", validRoot).stdout) as {
        valid: unknown[];
        invalid: unknown[];
      };
      expect({ label, count: result.valid.length }).toEqual({
        label,
        count: valid ? 1 : 0,
      });
      expect({ label, count: result.invalid.length }).toEqual({
        label,
        count: valid ? 0 : 1,
      });
    }
  });

  it("rejects an active slice whose dependency is incomplete", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const ledgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as { slices: unknown[] };
    const evidence = emptyEvidence();
    ledger.slices = [
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
        status: "active",
        blocker: null,
        evidence: { ...evidence },
      },
    ];
    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [],
      invalid: [
        {
          candidate: 1,
          feature: "valid-feature",
          reason: "slice 002 has an incomplete dependency",
        },
      ],
    });
  });

  it("rejects a pending slice whose dependency was cut", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const ledgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    const ledger = await readJson(ledgerPath);
    ledger["slices"] = [
      {
        id: "001",
        plan: "plans/001-first.md",
        goal: "Removed outcome",
        depends_on: [],
        status: "cut",
        blocker: null,
        evidence: emptyEvidence(),
      },
      {
        id: "002",
        plan: "plans/002-second.md",
        goal: "Impossible pending outcome",
        depends_on: ["001"],
        status: "pending",
        blocker: null,
        evidence: emptyEvidence(),
      },
    ];
    await writeJson(ledgerPath, ledger);

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [],
      invalid: [
        {
          candidate: 1,
          feature: "valid-feature",
          reason: "pending slice 002 depends on cut slice 001",
        },
      ],
    });
  });

  it("rejects an accepted candidate whose pitch hash was hand-edited", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const featureRoot = join(validRoot, "docs", "features", "valid-feature");
    const pitchPath = join(featureRoot, "pitch.md");
    await writeFile(
      pitchPath,
      (await readFile(pitchPath, "utf8")).replace("status: draft", "status: accepted"),
    );
    const ledgerPath = join(featureRoot, "index.json");
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as {
      pitch: { sha256: string | null };
    };
    ledger.pitch.sha256 = "0".repeat(64);
    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [],
      invalid: [
        {
          candidate: 1,
          feature: "valid-feature",
          reason: "accepted pitch sha256 does not match ledger",
        },
      ],
    });
  });

  it("rejects a hand-edited absolute plan path without rewriting the candidate", async () => {
    expect.hasAssertions();
    const { root, validRoot } = await createCandidateWorktrees();
    const ledgerPath = join(validRoot, "docs", "features", "valid-feature", "index.json");
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as { slices: unknown[] };
    ledger.slices = [
      {
        id: "001",
        plan: "/Users/example/private-plan.md",
        goal: "First outcome",
        depends_on: [],
        status: "pending",
        blocker: null,
        evidence: emptyEvidence(),
      },
    ];
    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
    const before = await readFile(ledgerPath, "utf8");

    const result = run(root, "inspect-candidates", validRoot);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: [],
      stale: [],
      invalid: [
        {
          candidate: 1,
          feature: "valid-feature",
          reason: "slice 001 plan must be a canonical feature-relative plan path",
        },
      ],
    });
    await expect(readFile(ledgerPath, "utf8")).resolves.toBe(before);
  });

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

  it("finds a legitimate bank beyond many same-trailer commits on unrelated paths", async () => {
    expect.hasAssertions();
    const { ledgerPath, root } = await createPlannedFeature();
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
    const completedLedger = await readFile(ledgerPath, "utf8");
    execFileSync("git", ["add", "docs/features/sample-feature"], { cwd: root });
    execFileSync(
      "git",
      ["commit", "--quiet", "-m", "feat(sample): bank slice", "-m", "Feature-Slice: 001"],
      { cwd: root },
    );
    execFileSync("git", ["rm", "--quiet", "docs/features/sample-feature/index.json"], {
      cwd: root,
    });
    execFileSync("git", ["commit", "--quiet", "-m", "test: hide ledger from later trees"], {
      cwd: root,
    });
    for (let index = 0; index < 101; index += 1) {
      await writeFile(join(root, "unrelated.txt"), `${String(index)}\n`);
      execFileSync("git", ["add", "unrelated.txt"], { cwd: root });
      execFileSync(
        "git",
        [
          "commit",
          "--quiet",
          "-m",
          `chore: unrelated ${String(index)}`,
          "-m",
          "Feature-Slice: 001",
        ],
        { cwd: root },
      );
    }
    await writeFile(ledgerPath, completedLedger);

    const result = run(root, "inspect", "sample-feature");

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      phase: "building",
      next_action: "Activate dependency-ready slice 002.",
    });
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

  it("validates the generated ledger before publishing either init artifact", async () => {
    expect.hasAssertions();
    const { base, featureRoot, root } = await createRepository("shape/sample-feature");
    const copiedPackage = await mkdtemp(join(tmpdir(), "feature-flow-invalid-template-"));
    roots.push(copiedPackage);
    const copiedHelper = join(copiedPackage, "scripts", "feature-flow.mjs");
    const copiedTemplates = join(copiedPackage, "skills", "shape", "templates");
    await mkdir(join(copiedPackage, "scripts"), { recursive: true });
    await mkdir(copiedTemplates, { recursive: true });
    await copyFile(HELPER, copiedHelper);
    await copyFile(
      join(PACKAGE_ROOT, "skills", "shape", "templates", "pitch.md"),
      join(copiedTemplates, "pitch.md"),
    );
    const template = JSON.parse(
      await readFile(join(PACKAGE_ROOT, "skills", "shape", "templates", "index.json"), "utf8"),
    ) as Record<string, unknown>;
    template["unexpected"] = true;
    await writeJson(join(copiedTemplates, "index.json"), template);

    const result = runWithHelper(
      root,
      copiedHelper,
      "init",
      "sample-feature",
      "--branch",
      "shape/sample-feature",
      "--base",
      base,
    );

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toMatchObject({
      errors: [{ reason: "ledger must contain only schema, feature, worktree, pitch, and slices" }],
    });
    expect(await exists(featureRoot)).toBe(false);
  });

  it("enforces ledger feature and branch bounds before init writes", async () => {
    expect.hasAssertions();
    const { base, root } = await createRepository("shape/sample-feature");
    const tooLongFeature = `a${"b".repeat(100)}`;
    const featureResult = run(
      root,
      "init",
      tooLongFeature,
      "--branch",
      "shape/sample-feature",
      "--base",
      base,
    );

    expect(featureResult.status).toBe(1);
    expect(JSON.parse(featureResult.stderr)).toMatchObject({ errors: [{ path: "<arguments>" }] });
    expect(await exists(join(root, "docs", "features", tooLongFeature))).toBe(false);

    const tooLongBranch = `shape/${"a".repeat(125)}/${"b".repeat(125)}`;
    execFileSync("git", ["switch", "--quiet", "-c", tooLongBranch], { cwd: root });
    const branchResult = run(
      root,
      "init",
      "sample-feature",
      "--branch",
      tooLongBranch,
      "--base",
      base,
    );
    expect(branchResult.status).toBe(1);
    expect(JSON.parse(branchResult.stderr)).toMatchObject({ errors: [{ path: "<arguments>" }] });
    expect(await exists(join(root, "docs", "features", "sample-feature"))).toBe(false);
  });

  it("rejects symlinked init ancestors without writing outside the repository", async () => {
    expect.hasAssertions();
    for (const ancestor of ["docs", "docs/features"] as const) {
      const { root } = await createRepository("shape/sample-feature");
      const externalRoot = await mkdtemp(join(tmpdir(), "feature-flow-init-external-"));
      roots.push(externalRoot);
      if (ancestor === "docs/features") {
        await mkdir(join(root, "docs"));
      }
      await symlink(externalRoot, join(root, ancestor), "dir");
      execFileSync("git", ["add", ancestor], { cwd: root });
      execFileSync("git", ["commit", "--quiet", "-m", `test: symlink ${ancestor}`], {
        cwd: root,
      });
      const head = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();

      const result = run(
        root,
        "init",
        "sample-feature",
        "--branch",
        "shape/sample-feature",
        "--base",
        head,
      );

      expect({ ancestor, status: result.status }).toEqual({ ancestor, status: 1 });
      expect({
        ancestor,
        reason: (JSON.parse(result.stderr) as { errors: { reason: string }[] }).errors[0]?.reason,
      }).toEqual({
        ancestor,
        reason:
          ancestor === "docs"
            ? "docs path must resolve inside the canonical repository"
            : "features path must resolve inside the canonical repository",
      });
      await expect(readdir(externalRoot)).resolves.toEqual([]);
    }
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
