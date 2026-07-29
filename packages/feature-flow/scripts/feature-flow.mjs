#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

const SHA256 = /^[0-9a-f]{40}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_FIELD_LENGTH = 1024;

class FlowError extends Error {
  constructor(path, reason) {
    super(reason);
    this.path = path;
  }
}

class RoutingDecision extends Error {
  constructor(decision) {
    super(decision.reason);
    this.decision = decision;
  }
}

function fail(path, reason) {
  throw new FlowError(path, reason);
}

function outputJson(value) {
  return JSON.stringify(value, (_key, field) =>
    typeof field === "string" ? field.slice(0, MAX_FIELD_LENGTH) : field,
  );
}

function gitSucceeds(args) {
  try {
    execFileSync("git", args, {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    fail(process.cwd(), `git ${args.join(" ")} failed`);
  }
}

function parseInitArguments(args) {
  const withoutBase = args.length === 3 && args[1] === "--branch";
  if (
    (!withoutBase && (args.length !== 5 || args[1] !== "--branch" || args[3] !== "--base")) ||
    !SLUG.test(args[0] ?? "") ||
    !args[2] ||
    (!withoutBase && !SHA256.test(args[4] ?? ""))
  ) {
    fail(
      "<arguments>",
      "usage: init <feature> --branch <expected-branch> --base <expected-base-sha>",
    );
  }
  return { feature: args[0], branch: args[2], base: withoutBase ? null : args[4] };
}

function routeFacts() {
  return {
    root: git(["rev-parse", "--show-toplevel"]),
    branch: git(["branch", "--show-current"]),
    head: git(["rev-parse", "HEAD"]),
  };
}

function routeDecision(reason, expected, actual, nextAction) {
  throw new RoutingDecision({
    kind: "routing",
    reason,
    expected: { branch: expected.branch, base_sha: expected.base },
    actual: { branch: actual.branch, head_sha: actual.head },
    next_action: nextAction,
  });
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function init(args) {
  const expected = parseInitArguments(args);
  const actual = routeFacts();
  if (expected.base === null) {
    routeDecision(
      "ambiguous-base",
      expected,
      actual,
      "Choose one verified base commit, then retry init with --base.",
    );
  }
  if (actual.branch !== expected.branch) {
    const collision = git(["branch", "--list", expected.branch]) !== "";
    routeDecision(
      collision ? "branch-collision" : "branch-mismatch",
      expected,
      actual,
      collision
        ? "Inspect the existing branch with Worktrunk before choosing a route."
        : "Use Worktrunk to activate the expected branch, then retry init.",
    );
  }
  if (actual.head !== expected.base) {
    routeDecision(
      "base-mismatch",
      expected,
      actual,
      "Use Worktrunk to recreate the route from the expected base, then retry init.",
    );
  }
  if (git(["status", "--porcelain=v1", "--untracked-files=all"]) !== "") {
    routeDecision(
      "dirty-checkout",
      expected,
      actual,
      "Choose how to preserve or move the existing changes before retrying init.",
    );
  }
  if (resolve(process.cwd()) !== resolve(actual.root)) {
    routeDecision(
      "route-mismatch",
      expected,
      actual,
      "Run the helper from the routed Git top-level, then retry init.",
    );
  }

  const featureRoot = resolve(actual.root, "docs", "features", expected.feature);
  if (await pathExists(featureRoot)) fail(featureRoot, "feature directory already exists");
  const templates = resolve(import.meta.dirname, "..", "skills", "shape", "templates");
  const [pitchTemplate, ledgerTemplate] = await Promise.all([
    readFile(resolve(templates, "pitch.md"), "utf8"),
    readFile(resolve(templates, "index.json"), "utf8"),
  ]);
  const pitch = pitchTemplate.replaceAll("{{feature}}", expected.feature);
  const ledger = JSON.parse(
    ledgerTemplate
      .replaceAll("{{feature}}", expected.feature)
      .replaceAll("{{branch}}", expected.branch)
      .replaceAll("{{base_sha}}", expected.base),
  );
  const featuresRoot = dirname(featureRoot);
  await mkdir(featuresRoot, { recursive: true });
  const stagingRoot = await mkdtemp(resolve(featuresRoot, `.${basename(featureRoot)}.tmp-`));
  try {
    await Promise.all([
      writeFile(resolve(stagingRoot, "pitch.md"), pitch, { flag: "wx" }),
      writeFile(resolve(stagingRoot, "index.json"), `${JSON.stringify(ledger, null, 2)}\n`, {
        flag: "wx",
      }),
    ]);
    await rename(stagingRoot, featureRoot);
  } catch (error) {
    await rm(stagingRoot, { force: true, recursive: true });
    throw error;
  }
  return {
    ok: true,
    command: "init",
    feature: expected.feature,
    feature_root: resolve(featureRoot),
    phase: "shaping",
    next_action: "Continue shaping the draft pitch.",
  };
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  const compare = (left, right) => left.localeCompare(right);
  return (
    isRecord(value) &&
    Object.keys(value).sort(compare).join("\0") === [...keys].sort(compare).join("\0")
  );
}

function validateLedger(ledger, path, feature) {
  if (!hasExactKeys(ledger, ["schema", "feature", "worktree", "pitch", "slices"])) {
    fail(path, "ledger must contain only schema, feature, worktree, pitch, and slices");
  }
  if (ledger.schema !== "feature-flow/v3") fail(path, "schema must be feature-flow/v3");
  if (ledger.feature !== feature) fail(path, `feature must be ${feature}`);
  if (
    !hasExactKeys(ledger.worktree, ["branch", "base_sha"]) ||
    typeof ledger.worktree.branch !== "string" ||
    !SHA256.test(ledger.worktree.base_sha ?? "")
  ) {
    fail(path, "worktree must contain a branch and full base_sha");
  }
  if (
    !hasExactKeys(ledger.pitch, ["path", "number", "sha256"]) ||
    ledger.pitch.path !== "pitch.md" ||
    !Number.isSafeInteger(ledger.pitch.number) ||
    ledger.pitch.number < 1 ||
    !(ledger.pitch.sha256 === null || /^[0-9a-f]{64}$/.test(ledger.pitch.sha256))
  ) {
    fail(path, "pitch must contain path, positive number, and nullable sha256");
  }
  if (!Array.isArray(ledger.slices)) fail(path, "slices must be an array");
  const ids = new Set();
  let current = 0;
  for (const slice of ledger.slices) {
    if (
      !hasExactKeys(slice, ["id", "plan", "goal", "depends_on", "status", "blocker", "evidence"]) ||
      !/^\d{3}$/.test(slice.id ?? "") ||
      typeof slice.plan !== "string" ||
      typeof slice.goal !== "string" ||
      !Array.isArray(slice.depends_on) ||
      !["pending", "active", "blocked", "done", "cut"].includes(slice.status) ||
      !hasExactKeys(slice.evidence, ["red_green", "review", "dogfood", "checks", "banking"])
    ) {
      fail(path, "slice has invalid fields");
    }
    if (ids.has(slice.id)) fail(path, `duplicate slice id: ${slice.id}`);
    if (slice.depends_on.some((id) => typeof id !== "string" || !ids.has(id))) {
      fail(path, `slice ${slice.id} has an unknown or forward dependency`);
    }
    ids.add(slice.id);
    if (slice.status === "active" || slice.status === "blocked") current += 1;
    if (
      slice.status === "blocked" &&
      (!hasExactKeys(slice.blocker, ["reason", "next_action"]) ||
        Object.values(slice.blocker).some(
          (value) =>
            typeof value !== "string" || value.trim() === "" || value.length > MAX_FIELD_LENGTH,
        ))
    ) {
      fail(path, `blocked slice ${slice.id} requires bounded blocker details`);
    }
    if (slice.status !== "blocked" && slice.blocker !== null) {
      fail(path, `slice ${slice.id} cannot have blocker details`);
    }
    for (const [key, value] of Object.entries(slice.evidence)) {
      if (!(
        value === null ||
        (typeof value === "string" && value.trim() !== "" && value.length <= MAX_FIELD_LENGTH)
      )) {
        fail(path, `slice ${slice.id} evidence ${key} must be null or a bounded string`);
      }
    }
    if (slice.status === "done" && Object.values(slice.evidence).includes(null)) {
      fail(path, `done slice ${slice.id} requires complete evidence`);
    }
    if (
      slice.evidence.banking !== null &&
      slice.evidence.banking !== "commit" &&
      !/^checkpoint: \S[\s\S]*$/u.test(slice.evidence.banking)
    ) {
      fail(path, `slice ${slice.id} banking must be commit or checkpoint: <reason>`);
    }
  }
  if (current > 1) fail(path, "at most one slice may be active or blocked");
  return ledger;
}

async function loadFeature(feature) {
  const path = resolve("docs", "features", feature, "index.json");
  let ledger;
  try {
    ledger = validateLedger(JSON.parse(await readFile(path, "utf8")), path, feature);
  } catch (error) {
    if (error instanceof FlowError) throw error;
    fail(path, error instanceof Error ? error.message : "cannot read ledger");
  }
  const actual = routeFacts();
  const expected = {
    branch: ledger.worktree.branch,
    base: ledger.worktree.base_sha,
  };
  if (actual.branch !== expected.branch) {
    routeDecision(
      "branch-mismatch",
      expected,
      actual,
      "Use Worktrunk to activate the recorded feature route, then retry.",
    );
  }
  if (!gitSucceeds(["merge-base", "--is-ancestor", expected.base, actual.head])) {
    routeDecision(
      "base-mismatch",
      expected,
      actual,
      "Use Worktrunk to restore the recorded base lineage, then retry.",
    );
  }
  if (resolve(process.cwd()) !== resolve(actual.root)) {
    routeDecision(
      "route-mismatch",
      expected,
      actual,
      "Run the helper from the recorded Git top-level, then retry.",
    );
  }
  const pitchPath = resolve(path, "..", ledger.pitch.path);
  let pitch;
  try {
    pitch = await readFile(pitchPath, "utf8");
  } catch (error) {
    fail(pitchPath, error instanceof Error ? error.message : "cannot read pitch");
  }
  const status = /^status: (draft|accepted)$/mu.exec(pitch)?.[1];
  if (status === undefined) fail(pitchPath, "pitch must declare draft or accepted status");
  if (status === "accepted") {
    const hash = createHash("sha256").update(pitch).digest("hex");
    if (ledger.pitch.sha256 !== hash)
      fail(pitchPath, "accepted pitch sha256 does not match ledger");
  } else if (ledger.pitch.sha256 !== null) {
    fail(path, "draft pitch sha256 must be null");
  }
  return { path, ledger, status };
}

function isBanked(slice, ledgerPath) {
  if (typeof slice.evidence.banking !== "string") return false;
  if (slice.evidence.banking.startsWith("checkpoint: ")) return true;
  if (slice.evidence.banking !== "commit") return false;
  const repositoryRoot = git(["rev-parse", "--show-toplevel"]);
  const repositoryPath = relative(repositoryRoot, ledgerPath).replaceAll("\\", "/");
  const commits = git([
    "log",
    "--format=%H",
    "--extended-regexp",
    `--grep=^Feature-Slice: ${slice.id}$`,
  ])
    .split("\n")
    .filter(Boolean);
  for (const commit of commits) {
    try {
      const committed = JSON.parse(
        execFileSync("git", ["show", `${commit}:${repositoryPath}`], {
          cwd: process.cwd(),
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }),
      );
      const committedSlice = committed.slices?.find((candidate) => candidate.id === slice.id);
      if (isDeepStrictEqual(committedSlice, slice)) return true;
    } catch {
      // A matching message that does not contain the canonical done transition is not a bank.
    }
  }
  return false;
}

function derive(status, slices, ledgerPath) {
  if (status === "draft") {
    return {
      phase: "shaping",
      current_slice: null,
      next_action: "Continue shaping the draft pitch.",
    };
  }
  if (slices.length === 0) {
    return {
      phase: "planning",
      current_slice: null,
      next_action: "Generate and review the vertical slice plans.",
    };
  }
  const unbanked = slices.find((slice) => slice.status === "done" && !isBanked(slice, ledgerPath));
  if (unbanked) {
    return {
      phase: "banking",
      current_slice: unbanked.id,
      next_action: `Bank slice ${unbanked.id} before any other transition.`,
    };
  }
  const current = slices.find((slice) => slice.status === "active" || slice.status === "blocked");
  if (current) {
    return {
      phase: current.status === "blocked" ? "blocked" : "building",
      current_slice: current.id,
      next_action:
        current.status === "blocked"
          ? `Resolve the blocker for slice ${current.id}.`
          : `Deliver slice ${current.id}.`,
    };
  }
  const pending = slices.find((slice) => slice.status === "pending");
  if (pending) {
    return {
      phase: "building",
      current_slice: null,
      next_action: `Activate dependency-ready slice ${pending.id}.`,
    };
  }
  return {
    phase: "locally-complete",
    current_slice: null,
    next_action: "Report local completion.",
  };
}

async function writeLedger(path, ledger) {
  validateLedger(ledger, path, ledger.feature);
  const temporary = `${path}.tmp-${String(process.pid)}`;
  await writeFile(temporary, `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
  try {
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

async function inspect(args) {
  if (args.length !== 1 || !SLUG.test(args[0] ?? "")) {
    fail("<arguments>", "usage: inspect <feature>");
  }
  const feature = args[0];
  const { ledger, status } = await loadFeature(feature);
  return {
    ok: true,
    command: "inspect",
    feature,
    ...derive(status, ledger.slices, resolve("docs", "features", feature, "index.json")),
  };
}

async function complete(args) {
  const flags = ["--red-green", "--review", "--dogfood", "--checks", "--banking"];
  if (
    args.length !== 12 ||
    !SLUG.test(args[0] ?? "") ||
    !/^\d{3}$/.test(args[1] ?? "") ||
    flags.some((flag, index) => args[2 + index * 2] !== flag) ||
    flags.some((_, index) => {
      const value = args[3 + index * 2];
      return typeof value !== "string" || value.trim() === "" || value.length > 1024;
    })
  ) {
    fail(
      "<arguments>",
      "usage: complete <feature> <slice-id> --red-green <evidence> --review <evidence> --dogfood <evidence> --checks <evidence> --banking <commit|checkpoint: reason>",
    );
  }
  const [feature, id] = args;
  const banking = args[11];
  if (banking !== "commit" && !/^checkpoint: \S[\s\S]*$/u.test(banking)) {
    fail("<arguments>", "banking must be commit or checkpoint: <reason>");
  }
  const { path, ledger, status } = await loadFeature(feature);
  const target = ledger.slices.find((slice) => slice.id === id);
  if (!target || target.status !== "active") fail(path, `slice ${id} must be active`);
  target.status = "done";
  target.evidence = {
    red_green: args[3],
    review: args[5],
    dogfood: args[7],
    checks: args[9],
    banking,
  };
  await writeLedger(path, ledger);
  return {
    ok: true,
    command: "complete",
    feature,
    ...derive(status, ledger.slices, path),
  };
}

async function activate(args) {
  if (args.length !== 2 || !SLUG.test(args[0] ?? "") || !/^\d{3}$/.test(args[1] ?? "")) {
    fail("<arguments>", "usage: activate <feature> <slice-id>");
  }
  const [feature, id] = args;
  const { path, ledger, status } = await loadFeature(feature);
  if (status !== "accepted") fail(path, "pitch must be accepted before slice activation");
  if (ledger.slices.some((slice) => slice.status === "active" || slice.status === "blocked")) {
    fail(path, "another slice is already active or blocked");
  }
  if (ledger.slices.some((slice) => slice.status === "done" && !isBanked(slice, path))) {
    fail(path, "an earlier done slice must be banked before activation");
  }
  if (
    ledger.slices.some((slice) => slice.status === "done" && slice.evidence.banking === "commit") &&
    git(["status", "--porcelain=v1", "--untracked-files=all"]) !== ""
  ) {
    fail(path, "checkout must be clean before commit banking permits activation");
  }
  const target = ledger.slices.find((slice) => slice.id === id);
  if (!target || target.status !== "pending") fail(path, `slice ${id} must be pending`);
  const byId = new Map(ledger.slices.map((slice) => [slice.id, slice]));
  if (target.depends_on.some((dependency) => byId.get(dependency)?.status !== "done")) {
    fail(path, `slice ${id} dependencies are not done`);
  }
  target.status = "active";
  await writeLedger(path, ledger);
  return {
    ok: true,
    command: "activate",
    feature,
    ...derive(status, ledger.slices, path),
  };
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  let result;
  switch (command) {
    case "activate":
      result = await activate(args);
      break;
    case "complete":
      result = await complete(args);
      break;
    case "init":
      result = await init(args);
      break;
    case "inspect":
      result = await inspect(args);
      break;
    default:
      fail("<arguments>", `unknown command: ${command ?? "<missing>"}`);
  }
  process.stdout.write(`${outputJson(result)}\n`);
}

try {
  await main();
} catch (error) {
  if (error instanceof RoutingDecision) {
    process.stderr.write(`${outputJson({ ok: false, decision: error.decision })}\n`);
  } else {
    const path = error instanceof FlowError ? error.path : "<internal>";
    const reason = error instanceof Error ? error.message : "unexpected failure";
    process.stderr.write(`${outputJson({ ok: false, errors: [{ path, reason }] })}\n`);
  }
  process.exitCode = 1;
}
