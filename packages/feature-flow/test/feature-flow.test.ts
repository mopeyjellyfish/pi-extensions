import { execFileSync, spawnSync } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const HELPER = join(PACKAGE_ROOT, "scripts", "feature-flow.mjs");
const REQUIRED_HEADINGS = ["Problem", "Solution", "Rabbit holes", "No-gos", "Acceptance criteria"];
const REQUIRED_PLAN_HEADINGS = [
  "End-to-end observable outcome",
  "Pitch trace to AC IDs",
  "Preconditions and dependency postconditions",
  "In scope and non-goals",
  "TDD Red",
  "TDD Green",
  "TDD Refactor",
  "Expected files and public seams",
  "Focused validation",
  "Observable readiness evidence",
  "Risks and parent decisions",
  "Exit criteria",
];
const roots: string[] = [];

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function pitchText(
  overrides: Partial<Record<"schema" | "feature" | "status" | "revision", string>> = {},
) {
  const values = {
    schema: "feature-flow-pitch/v2",
    feature: "sample-feature",
    status: "draft",
    revision: "1",
    ...overrides,
  };
  return `---\nschema: ${values.schema}\nfeature: ${values.feature}\nstatus: ${values.status}\nrevision: ${values.revision}\n---\n\n# Sample feature\n\n${REQUIRED_HEADINGS.map(
    (heading) =>
      heading === "Acceptance criteria"
        ? `## ${heading}\n\n- **AC-001:** First outcome.\n- **AC-002:** Second outcome.`
        : `## ${heading}\n\nContent for ${heading}.`,
  ).join("\n\n")}\n`;
}

function planText(
  slice: string,
  dependencies: string[],
  acIds: string[],
  overrides: Partial<
    Record<"schema" | "feature" | "slice" | "pitch_revision" | "status" | "revision", string>
  > = {},
) {
  const values = {
    schema: "feature-flow-plan/v1",
    feature: "sample-feature",
    slice,
    pitch_revision: "1",
    status: "draft",
    revision: "1",
    ...overrides,
  };
  const dependencyLines =
    dependencies.length === 0
      ? "dependencies: []"
      : `dependencies:\n${dependencies.map((dependency) => `  - ${dependency}`).join("\n")}`;
  return `---\nschema: ${values.schema}\nfeature: ${values.feature}\nslice: ${values.slice}\npitch_revision: ${values.pitch_revision}\n${dependencyLines}\nstatus: ${values.status}\nrevision: ${values.revision}\n---\n\n# ${slice}\n\n${REQUIRED_PLAN_HEADINGS.map(
    (heading) =>
      heading === "Pitch trace to AC IDs"
        ? `## ${heading}\n\n${acIds.map((id) => `- **${id}:** Covered.`).join("\n")}`
        : `## ${heading}\n\nContent for ${heading}.`,
  ).join("\n\n")}\n`;
}

async function createRepository(text: string | null = pitchText()) {
  const root = await mkdtemp(join(tmpdir(), "feature-flow-"));
  roots.push(root);
  const pitchPath = join(root, "docs", "features", "sample-feature", "pitch.md");
  const plansDir = join(root, "docs", "features", "sample-feature", "plans");
  await mkdir(plansDir, { recursive: true });
  await writeFile(join(root, "README.md"), "fixture\n");
  if (text !== null) await writeFile(pitchPath, text);
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Feature Flow Test"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "fixture"], { cwd: root });
  return { root, pitchPath, plansDir };
}

async function writeValidPlans(
  plansDir: string,
  overrides: { first?: string; second?: string } = {},
) {
  const firstPath = join(plansDir, "001-first.md");
  const secondPath = join(plansDir, "002-second.md");
  await writeFile(firstPath, overrides.first ?? planText("001-first", [], ["AC-001"]));
  await writeFile(
    secondPath,
    overrides.second ?? planText("002-second", ["001-first"], ["AC-002"]),
  );
  return { firstPath, secondPath };
}

function run(cwd: string, ...args: string[]): RunResult {
  const result = spawnSync(process.execPath, [HELPER, ...args], {
    cwd,
    encoding: "utf8",
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function json(output: string): unknown {
  return JSON.parse(output);
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map(async (root) => rm(root, { recursive: true, force: true })),
  );
});

describe("feature-flow helper", () => {
  it("validates a canonical pitch and reports bounded pitch and Git facts", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository();

    const validation = run(root, "validate-pitch", pitchPath);
    expect(validation.status).toBe(0);
    expect(validation.stderr).toBe("");
    expect(json(validation.stdout)).toEqual({
      ok: true,
      command: "validate-pitch",
      pitch: { path: pitchPath, feature: "sample-feature", status: "draft", revision: 1 },
    });

    await writeFile(join(root, "changed.txt"), "untrusted body content\n");
    await writeFile(pitchPath, `${pitchText()}\nworking tree change\n`);
    const status = run(root, "status", pitchPath, plansDir);
    expect(status.status).toBe(0);
    expect(status.stderr).toBe("");
    expect(json(status.stdout)).toEqual({
      ok: true,
      command: "status",
      git: {
        status: [" M docs/features/sample-feature/pitch.md", "?? changed.txt"],
        diff: { files: 1, insertions: 2, deletions: 0 },
        truncated: false,
      },
      pitch: {
        path: pitchPath,
        state: "valid",
        feature: "sample-feature",
        status: "draft",
        revision: 1,
      },
      plans: { path: plansDir, state: "missing", ready: false },
    });
    expect(status.stdout).not.toContain("untrusted body content");
    expect(Buffer.byteLength(status.stdout)).toBeLessThan(50_000);
  });

  it.each([
    [
      "unknown field",
      (text: string) => text.replace("status: draft", "extra: no\nstatus: draft"),
      "unknown frontmatter field at line 4",
    ],
    [
      "missing field",
      (text: string) => text.replace("revision: 1\n", ""),
      "missing frontmatter field: revision",
    ],
    [
      "duplicate field",
      (text: string) => text.replace("status: draft", "status: draft\nstatus: draft"),
      "duplicate frontmatter field at line 5",
    ],
    [
      "schema",
      (text: string) => text.replace("feature-flow-pitch/v2", "feature-flow-pitch/v1"),
      "schema must be feature-flow-pitch/v2",
    ],
    [
      "status",
      (text: string) => text.replace("status: draft", "status: done"),
      "status must be draft, ready, or accepted",
    ],
    [
      "revision",
      (text: string) => text.replace("revision: 1", "revision: 0"),
      "revision must be a positive integer",
    ],
    [
      "heading",
      (text: string) => text.replace("## Solution", "## Other"),
      "missing required section: Solution",
    ],
  ])("rejects an invalid %s without mutation", async (_name, mutate, reason) => {
    expect.hasAssertions();
    const text = mutate(pitchText());
    const { root, pitchPath } = await createRepository(text);
    const before = await readFile(pitchPath, "utf8");

    const result = run(root, "validate-pitch", pitchPath);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(json(result.stderr)).toEqual({ ok: false, errors: [{ path: pitchPath, reason }] });
    expect(Buffer.byteLength(result.stderr)).toBeLessThan(50_000);
    expect(await readFile(pitchPath, "utf8")).toBe(before);
  });

  it("rejects pitch sections outside the exact five-heading contract", async () => {
    expect.hasAssertions();
    const text = pitchText().replace(
      "## Acceptance criteria",
      "## Delivery plan\n\nTask breakdown.\n\n## Acceptance criteria",
    );
    const { root, pitchPath } = await createRepository(text);

    const result = run(root, "validate-pitch", pitchPath);

    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: pitchPath, reason: "unexpected section: Delivery plan" }],
    });
  });

  it.each([
    ["empty", "##\n\nEmpty section.", "unexpected section: <empty>"],
    ["duplicate", "## Problem\n\nDuplicate problem.", "duplicate section: Problem"],
  ])("rejects a %s pitch section", async (_name, heading, reason) => {
    expect.hasAssertions();
    const text = pitchText().replace(
      "## Acceptance criteria",
      `${heading}\n\n## Acceptance criteria`,
    );
    const { root, pitchPath } = await createRepository(text);

    const result = run(root, "validate-pitch", pitchPath);

    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: pitchPath, reason }],
    });
  });

  it("rejects reordered pitch sections", async () => {
    expect.hasAssertions();
    const text = pitchText().replace(
      "## Problem\n\nContent for Problem.\n\n## Solution\n\nContent for Solution.",
      "## Solution\n\nContent for Solution.\n\n## Problem\n\nContent for Problem.",
    );
    const { root, pitchPath } = await createRepository(text);

    const result = run(root, "validate-pitch", pitchPath);

    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: pitchPath, reason: "pitch sections must follow canonical order" }],
    });
  });

  it("reports Git facts and missing artifact readiness before first-time pitch creation", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(null);
    await writeFile(join(root, "changed.txt"), "untrusted body content\n");

    const result = run(root, "status", pitchPath, plansDir);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(json(result.stdout)).toEqual({
      ok: true,
      command: "status",
      git: {
        status: ["?? changed.txt"],
        diff: { files: 0, insertions: 0, deletions: 0 },
        truncated: false,
      },
      pitch: { path: pitchPath, state: "missing" },
      plans: { path: plansDir, state: "unavailable", ready: false },
    });
    expect(result.stdout).not.toContain("untrusted body content");
  });

  it("reports Git facts and safe invalid artifact readiness", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(
      pitchText({ schema: "feature-flow-pitch/v1" }),
    );
    await writeFile(join(root, "changed.txt"), "untrusted body content\n");

    const result = run(root, "status", pitchPath, plansDir);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(json(result.stdout)).toEqual({
      ok: true,
      command: "status",
      git: {
        status: ["?? changed.txt"],
        diff: { files: 0, insertions: 0, deletions: 0 },
        truncated: false,
      },
      pitch: {
        path: pitchPath,
        state: "invalid",
        reason: "schema must be feature-flow-pitch/v2",
      },
      plans: { path: plansDir, state: "unavailable", ready: false },
    });
    expect(result.stdout).not.toContain("untrusted body content");
  });

  it("never emits malformed frontmatter content", async () => {
    expect.hasAssertions();
    const secret = "api_token SUPER-SECRET-FRONTMATTER-VALUE";
    const { root, pitchPath, plansDir } = await createRepository(
      pitchText().replace("revision: 1", secret),
    );

    const validation = run(root, "validate-pitch", pitchPath);
    expect(validation.status).toBe(1);
    expect(json(validation.stderr)).toEqual({
      ok: false,
      errors: [{ path: pitchPath, reason: "invalid frontmatter at line 5" }],
    });
    expect(`${validation.stdout}${validation.stderr}`).not.toContain(secret);

    const status = run(root, "status", pitchPath, plansDir);
    expect(status.status).toBe(0);
    expect(status.stderr).toBe("");
    expect(json(status.stdout)).toMatchObject({
      pitch: { path: pitchPath, state: "invalid", reason: "invalid frontmatter at line 5" },
    });
    expect(`${status.stdout}${status.stderr}`).not.toContain(secret);
  });

  it("bounds very long paths without emitting artifact bodies", async () => {
    expect.hasAssertions();
    const secret = "SUPER-SECRET-LONG-PATH-BODY";
    const base = await mkdtemp(join(tmpdir(), "feature-flow-long-"));
    roots.push(base);
    const root = join(
      base,
      ...Array.from(
        { length: 7 },
        (_, index) => `${String(index).padStart(2, "0")}-${"nested".repeat(12)}`,
      ),
    );
    const pitchPath = join(root, "docs", "features", "sample-feature", "pitch.md");
    await mkdir(join(root, "docs", "features", "sample-feature"), { recursive: true });
    await writeFile(pitchPath, `${pitchText({ schema: "feature-flow-pitch/v1" })}\n${secret}\n`);

    const result = run(base, "validate-pitch", pitchPath);
    const output = json(result.stderr) as { errors: { path: string; reason: string }[] };

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(output.errors[0]?.path.length).toBeLessThanOrEqual(1024);
    expect(output.errors[0]?.reason).toBe("schema must be feature-flow-pitch/v2");
    expect(Buffer.byteLength(result.stderr)).toBeLessThan(50_000);
    expect(result.stderr).not.toContain(secret);

    const missing = run(base, "validate-pitch", join(base, "x".repeat(60_000)));
    const missingOutput = json(missing.stderr) as { errors: { path: string }[] };
    expect(missing.status).toBe(1);
    expect(missingOutput.errors[0]?.path).toHaveLength(1024);
    expect(Buffer.byteLength(missing.stderr)).toBeLessThan(50_000);

    await writeFile(pitchPath, pitchText({ feature: "a".repeat(2000) }));
    const mismatch = run(base, "validate-pitch", pitchPath);
    const mismatchOutput = json(mismatch.stderr) as { errors: { reason: string }[] };
    expect(mismatch.status).toBe(1);
    expect(mismatchOutput.errors[0]?.reason).toHaveLength(1024);
    expect(Buffer.byteLength(mismatch.stderr)).toBeLessThan(50_000);
  });

  it("truncates large Git status output without reading file bodies", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository();
    await Promise.all(
      Array.from({ length: 105 }, async (_, index) =>
        writeFile(join(root, `untracked-${String(index).padStart(3, "0")}.txt`), "secret body\n"),
      ),
    );

    const result = run(root, "status", pitchPath, plansDir);
    expect(result.status).toBe(0);
    const output = json(result.stdout) as { git: { status: string[]; truncated: boolean } };
    expect(output.git.status).toHaveLength(40);
    expect(output.git.truncated).toBe(true);
    expect(result.stdout).not.toContain("secret body");
    expect(Buffer.byteLength(result.stdout)).toBeLessThan(50_000);
  });

  it("bounds aggregate UTF-8 status output", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const slices = Array.from({ length: 100 }, (_, index) => {
      const number = String(index + 1).padStart(3, "0");
      return `${number}-${"slice".repeat(30)}`;
    });
    await Promise.all(
      slices.map((slice, index) =>
        writeFile(
          join(plansDir, `${slice}.md`),
          planText(
            slice,
            index === 0 ? [] : slices.slice(index - 1, index),
            index === 0 ? ["AC-001", "AC-002"] : ["AC-001"],
            {
              status: "reviewed",
            },
          ),
        ),
      ),
    );
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "--quiet", "-m", "plans"], { cwd: root });
    execFileSync("git", ["config", "core.quotePath", "false"], { cwd: root });
    await Promise.all(
      Array.from({ length: 100 }, async (_, index) => {
        const path = join(
          root,
          `unicode-${String(index).padStart(3, "0")}`,
          "界".repeat(70),
          "界".repeat(70),
          "entry.txt",
        );
        await mkdir(join(path, ".."), { recursive: true });
        await writeFile(path, "untrusted body\n");
      }),
    );

    const result = run(root, "status", pitchPath, plansDir);
    const output = json(result.stdout) as {
      git: { status: string[]; truncated: boolean };
      pitch: { path: string };
      plans: { path: string; slices: string[] };
    };

    expect(result.status).toBe(0);
    const allGitStatus = execFileSync("git", ["status", "--short", "--untracked-files=all"], {
      cwd: root,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)
      .sort((left, right) => (left === right ? 0 : left < right ? -1 : 1));
    const priorHundredLineOutput = JSON.stringify({
      ...output,
      git: {
        ...output.git,
        status: allGitStatus.slice(0, 100).map((line) => line.slice(0, 128)),
      },
      pitch: { ...output.pitch, path: "x".repeat(1024) },
      plans: { ...output.plans, path: "x".repeat(1024) },
    });

    expect(output.git.status).toHaveLength(40);
    expect(output.git.status.every((line) => line.includes("界"))).toBe(true);
    expect(output.git.truncated).toBe(true);
    expect(output.plans.slices).toHaveLength(100);
    expect(Buffer.byteLength(priorHundredLineOutput)).toBeGreaterThanOrEqual(50_000);
    expect(Buffer.byteLength(result.stdout)).toBeLessThan(50_000);
    expect(result.stdout).not.toContain("untrusted body");
  });

  it("rejects a pitch whose feature does not match its canonical directory", async () => {
    expect.hasAssertions();
    const { root, pitchPath } = await createRepository(pitchText({ feature: "other-feature" }));
    const before = await readFile(pitchPath, "utf8");
    const expected = join(root, "docs", "features", "other-feature", "pitch.md");

    const result = run(root, "validate-pitch", pitchPath);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: pitchPath, reason: `pitch path must be ${expected}` }],
    });
    expect(await readFile(pitchPath, "utf8")).toBe(before);
  });

  it("performs legal status and explicit revision transitions without changing the body", async () => {
    expect.hasAssertions();
    const { root, pitchPath } = await createRepository();
    const original = await readFile(pitchPath, "utf8");
    const body = original.slice(original.indexOf("---", 3) + 3);

    const ready = run(root, "pitch", pitchPath, "ready");
    expect(ready.status).toBe(0);
    expect(json(ready.stdout)).toEqual({
      ok: true,
      command: "pitch",
      pitch: { path: pitchPath, feature: "sample-feature", status: "ready", revision: 1 },
    });
    expect(
      (await readFile(pitchPath, "utf8")).slice(
        (await readFile(pitchPath, "utf8")).indexOf("---", 3) + 3,
      ),
    ).toBe(body);

    const accepted = run(root, "pitch", pitchPath, "accepted");
    expect(accepted.status).toBe(0);
    expect(json(accepted.stdout)).toMatchObject({ pitch: { status: "accepted", revision: 1 } });

    const revised = run(root, "pitch", pitchPath, "draft", "--revise");
    expect(revised.status).toBe(0);
    expect(json(revised.stdout)).toMatchObject({ pitch: { status: "draft", revision: 2 } });
    const revisedText = await readFile(pitchPath, "utf8");
    expect(revisedText.slice(revisedText.indexOf("---", 3) + 3)).toBe(body);
  });

  it("validates plans, reports readiness, and performs status-only review", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const { firstPath, secondPath } = await writeValidPlans(plansDir);

    const validation = run(root, "validate-plans", pitchPath, plansDir);
    expect(validation.status).toBe(0);
    expect(validation.stderr).toBe("");
    expect(Buffer.byteLength(validation.stdout)).toBeLessThan(50_000);
    expect(json(validation.stdout)).toEqual({
      ok: true,
      command: "validate-plans",
      pitch: {
        path: pitchPath,
        feature: "sample-feature",
        status: "accepted",
        revision: 1,
      },
      plans: {
        path: plansDir,
        state: "valid",
        status: "draft",
        ready: false,
        count: 2,
        slices: ["001-first", "002-second"],
        truncated: false,
      },
    });

    const reviewed = run(root, "plans", pitchPath, plansDir, "reviewed");
    expect(reviewed.status).toBe(0);
    expect(json(reviewed.stdout)).toMatchObject({
      command: "plans",
      plans: { status: "reviewed", ready: true },
    });
    const status = run(root, "status", pitchPath, plansDir);
    expect(json(status.stdout)).toMatchObject({
      pitch: { status: "accepted", revision: 1 },
      plans: { state: "valid", status: "reviewed", ready: true, count: 2 },
    });
    expect(await readFile(firstPath, "utf8")).toContain("status: reviewed\nrevision: 1");
    expect(await readFile(secondPath, "utf8")).toContain("status: reviewed\nrevision: 1");
  });

  it.each([
    [
      "schema",
      (text: string) => text.replace("feature-flow-plan/v1", "feature-flow-plan/v2"),
      "schema must be feature-flow-plan/v1",
    ],
    [
      "field",
      (text: string) => text.replace("status: draft", "extra: no\nstatus: draft"),
      "unknown frontmatter field at line 8",
    ],
    [
      "status",
      (text: string) => text.replace("status: draft", "status: done"),
      "status must be draft or reviewed",
    ],
    [
      "revision",
      (text: string) => text.replace("\nrevision: 1\n---", "\nrevision: 0\n---"),
      "revision must be a positive integer",
    ],
    [
      "pin",
      (text: string) => text.replace("pitch_revision: 1", "pitch_revision: 2"),
      "pitch_revision must match accepted pitch revision 1",
    ],
    [
      "empty pin",
      (text: string) => text.replace("pitch_revision: 1", "pitch_revision: "),
      "pitch_revision must be a positive integer",
    ],
    [
      "section",
      (text: string) => text.replace("## TDD Red", "## Tests"),
      "missing required section: TDD Red",
    ],
    [
      "readiness section",
      (text: string) =>
        text.replace("## Observable readiness evidence", "## Internal readiness notes"),
      "missing required section: Observable readiness evidence",
    ],
  ])("rejects invalid plan %s without set mutation", async (_name, mutate, reason) => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const { firstPath, secondPath } = await writeValidPlans(plansDir, {
      second: mutate(planText("002-second", ["001-first"], ["AC-002"])),
    });
    const before = await Promise.all([readFile(firstPath, "utf8"), readFile(secondPath, "utf8")]);
    const result = run(root, "validate-plans", pitchPath, plansDir);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: secondPath, reason }],
    });
    expect(Buffer.byteLength(result.stderr)).toBeLessThan(50_000);
    expect(await Promise.all([readFile(firstPath, "utf8"), readFile(secondPath, "utf8")])).toEqual(
      before,
    );
  });

  it.each([
    ["wrong.md", "001-first", "plan filename must be 001-first.md"],
    ["003-third.md", "003-third", "plan slices must start at 001"],
  ])("rejects invalid or missing canonical plan paths", async (filename, slice, reason) => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const path = join(plansDir, filename);
    await writeFile(path, planText(slice, [], ["AC-001", "AC-002"]));
    const result = run(root, "validate-plans", pitchPath, plansDir);
    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({ ok: false, errors: [{ path, reason }] });
  });

  it.each([
    ["001-first.md", "003-third.md", "missing plan slice number: 002"],
    ["001-first.md", "001-other.md", "duplicate plan slice number: 001"],
  ])("rejects missing or duplicate slice numbers", async (firstName, secondName, reason) => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const firstSlice = firstName.slice(0, -3);
    const secondSlice = secondName.slice(0, -3);
    await writeFile(join(plansDir, firstName), planText(firstSlice, [], ["AC-001"]));
    const secondPath = join(plansDir, secondName);
    await writeFile(secondPath, planText(secondSlice, [firstSlice], ["AC-002"]));

    const result = run(root, "validate-plans", pitchPath, plansDir);
    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: secondPath, reason }],
    });
  });

  it("invalidates plans when the accepted pitch revision changes", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(
      pitchText({ status: "accepted", revision: "2" }),
    );
    const path = join(plansDir, "001-first.md");
    await writeFile(path, planText("001-first", [], ["AC-001", "AC-002"]));

    const result = run(root, "validate-plans", pitchPath, plansDir);
    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path, reason: "pitch_revision must match accepted pitch revision 2" }],
    });
  });

  it.each([
    ["non-accepted pitch", "ready", "pitch", "pitch must be accepted"],
    ["empty set", "accepted", "plans", "plans directory contains no plans"],
  ])("rejects %s", async (_name, pitchStatus, errorTarget, reason) => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(
      pitchText({ status: pitchStatus }),
    );
    const result = run(root, "validate-plans", pitchPath, plansDir);
    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: errorTarget === "pitch" ? pitchPath : plansDir, reason }],
    });
  });

  it.each([
    [["001-first", "other"], "dependencies must contain only 001-first"],
    [["003-third"], "dependencies must contain only 001-first"],
    [[], "dependencies must contain only 001-first"],
  ])("rejects non-direct, forward, or missing dependencies", async (dependencies, reason) => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const { secondPath } = await writeValidPlans(plansDir, {
      second: planText("002-second", dependencies, ["AC-002"]),
    });
    const result = run(root, "validate-plans", pitchPath, plansDir);
    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: secondPath, reason }],
    });
  });

  it.each([
    [["AC-001"], "pitch AC is not covered by any plan: AC-002"],
    [["AC-001", "AC-999"], "plan references unknown pitch AC: AC-999"],
    [[], "plan must trace at least one pitch AC"],
  ])("rejects incomplete or unknown AC coverage", async (ids, reason) => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const path = join(plansDir, "001-first.md");
    await writeFile(path, planText("001-first", [], ids));
    const result = run(root, "validate-plans", pitchPath, plansDir);
    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({ ok: false, errors: [{ path, reason }] });
  });

  it("recognizes pitch AC IDs only in Acceptance criteria", async () => {
    expect.hasAssertions();
    const relocatedPitch = pitchText({ status: "accepted" })
      .replace("- **AC-002:** Second outcome.\n", "")
      .replace("Content for Rabbit holes.", "Content for Rabbit holes mentions AC-002.");
    const { root, pitchPath, plansDir } = await createRepository(relocatedPitch);
    const { secondPath } = await writeValidPlans(plansDir);

    const result = run(root, "validate-plans", pitchPath, plansDir);

    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: secondPath, reason: "plan references unknown pitch AC: AC-002" }],
    });
  });

  it("recognizes plan AC references only in Pitch trace to AC IDs", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const path = join(plansDir, "001-first.md");
    const plan = planText("001-first", [], ["AC-001"]).replace(
      "Content for TDD Green.",
      "Content for TDD Green mentions AC-002.",
    );
    await writeFile(path, plan);

    const result = run(root, "validate-plans", pitchPath, plansDir);

    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path, reason: "pitch AC is not covered by any plan: AC-002" }],
    });
  });

  it("rejects mixed plan statuses", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const { secondPath } = await writeValidPlans(plansDir, {
      second: planText("002-second", ["001-first"], ["AC-002"], { status: "reviewed" }),
    });

    const result = run(root, "validate-plans", pitchPath, plansDir);
    expect(result.status).toBe(1);
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: secondPath, reason: "all plans must have the same status" }],
    });
  });

  it("rolls back earlier plan writes when a later write fails", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const { firstPath, secondPath } = await writeValidPlans(plansDir);
    const before = await Promise.all([readFile(firstPath), readFile(secondPath)]);
    await chmod(secondPath, 0o444);

    const result = run(root, "plans", pitchPath, plansDir, "reviewed");
    await chmod(secondPath, 0o644);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: secondPath, reason: "cannot write plan: EACCES" }],
    });
    const after = await Promise.all([readFile(firstPath), readFile(secondPath)]);
    expect(after[0].equals(before[0])).toBe(true);
    expect(after[1].equals(before[1])).toBe(true);
  });

  it("increments an explicitly revised draft plan before a semantic fix", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const { firstPath, secondPath } = await writeValidPlans(plansDir);
    const beforeFirst = await readFile(firstPath, "utf8");

    const result = run(root, "plans", pitchPath, plansDir, "draft", "--revise", secondPath);
    expect(result.status).toBe(0);
    expect(await readFile(firstPath, "utf8")).toBe(beforeFirst);
    expect(await readFile(secondPath, "utf8")).toContain("\nrevision: 2\n---");
  });

  it("revises only named plans while preserving canonical content", async () => {
    expect.hasAssertions();
    const { root, pitchPath, plansDir } = await createRepository(pitchText({ status: "accepted" }));
    const { firstPath, secondPath } = await writeValidPlans(plansDir);
    expect(run(root, "plans", pitchPath, plansDir, "reviewed").status).toBe(0);
    const reviewed = await Promise.all([readFile(firstPath, "utf8"), readFile(secondPath, "utf8")]);

    const revised = run(root, "plans", pitchPath, plansDir, "draft", "--revise", secondPath);
    expect(revised.status).toBe(0);
    expect(json(revised.stdout)).toMatchObject({ plans: { status: "draft", ready: false } });
    const next = await Promise.all([readFile(firstPath, "utf8"), readFile(secondPath, "utf8")]);
    expect(next[0]).toBe(reviewed[0].replace("status: reviewed", "status: draft"));
    expect(next[1]).toBe(
      reviewed[1]
        .replace("status: reviewed", "status: draft")
        .replace("\nrevision: 1\n---", "\nrevision: 2\n---"),
    );
  });

  it.each([
    [
      ["plans", "PATH", "PLANS", "draft", "--revise"],
      "<arguments>",
      "--revise requires at least one plan path",
    ],
    [
      ["plans", "PATH", "PLANS", "reviewed", "--revise", "PLAN"],
      "PLAN",
      "--revise is valid only when returning plans to draft",
    ],
    [["plans", "PATH", "PLANS", "draft"], "PLANS", "returning plans to draft requires --revise"],
    [
      ["plans", "PATH", "PLANS", "reviewed"],
      "PLANS",
      "illegal plan transition: reviewed -> reviewed",
    ],
    [
      ["plans", "PATH", "PLANS", "draft", "--revise", "OUTSIDE"],
      "OUTSIDE",
      "revised plan is not in the complete plan set",
    ],
    [["validate-plans", "PATH"], "<arguments>", "usage: validate-plans <pitch-path> <plans-dir>"],
    [
      ["plans", "PATH", "PLANS"],
      "<arguments>",
      "usage: plans <pitch-path> <plans-dir> <draft|reviewed> [--revise <plan-path> ...]",
    ],
  ])(
    "rejects invalid plan arguments or transitions without partial writes",
    async (arguments_, errorPath, reason) => {
      expect.hasAssertions();
      const { root, pitchPath, plansDir } = await createRepository(
        pitchText({ status: "accepted" }),
      );
      const { firstPath, secondPath } = await writeValidPlans(plansDir);
      const setupStatus =
        reason.includes("reviewed -> reviewed") || reason.includes("returning plans")
          ? run(root, "plans", pitchPath, plansDir, "reviewed").status
          : 0;
      expect(setupStatus).toBe(0);
      const before = await Promise.all([readFile(firstPath, "utf8"), readFile(secondPath, "utf8")]);
      const outside = join(root, "outside.md");
      const replacements: Record<string, string> = {
        PATH: pitchPath,
        PLANS: plansDir,
        PLAN: firstPath,
        OUTSIDE: outside,
      };
      const args = arguments_.map((argument) => replacements[argument] ?? argument);
      const result = run(root, ...args);

      expect(result.status).toBe(1);
      expect(json(result.stderr)).toEqual({
        ok: false,
        errors: [{ path: replacements[errorPath] ?? errorPath, reason }],
      });
      expect(
        await Promise.all([readFile(firstPath, "utf8"), readFile(secondPath, "utf8")]),
      ).toEqual(before);
    },
  );

  it.each([
    [["pitch", "ready"], "usage: pitch <pitch-path> <draft|ready|accepted> [--revise]"],
    [["pitch", "PATH", "accepted"], "illegal pitch transition: draft -> accepted"],
    [["pitch", "PATH", "ready", "--revise"], "--revise is valid only when returning to draft"],
    [["pitch", "PATH", "draft"], "returning to draft requires --revise"],
    [["pitch", "PATH", "draft", "--revise"], "illegal pitch transition: draft -> draft"],
    [["unknown"], "unknown command: unknown"],
  ])("rejects invalid arguments or transitions without mutation", async (arguments_, reason) => {
    expect.hasAssertions();
    const { root, pitchPath } = await createRepository();
    const before = await readFile(pitchPath, "utf8");
    const args = arguments_.map((argument) => (argument === "PATH" ? pitchPath : argument));

    const result = run(root, ...args);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(json(result.stderr)).toEqual({
      ok: false,
      errors: [{ path: args.includes(pitchPath) ? pitchPath : "<arguments>", reason }],
    });
    expect(await readFile(pitchPath, "utf8")).toBe(before);
  });
});
