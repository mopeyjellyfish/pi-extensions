#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

const GIT_SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_FIELD_LENGTH = 1024;
const MAX_FEATURE_LENGTH = 100;
const MAX_BRANCH_LENGTH = 256;
const MAX_SLICES = 100;
const MAX_ARTIFACT_BYTES = 1024 * 1024;
const MAX_QUESTION_DOCUMENT_CHARS = 100_000;
const MAX_BANK_CANDIDATES = 1000;

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

function gitSucceeds(args, cwd = process.cwd()) {
  try {
    execFileSync("git", args, {
      cwd,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function git(args, cwd = process.cwd()) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    fail(cwd, `git ${args.join(" ")} failed`);
  }
}

function parseInitArguments(args) {
  const withoutBase = args.length === 3 && args[1] === "--branch";
  if (
    (!withoutBase && (args.length !== 5 || args[1] !== "--branch" || args[3] !== "--base")) ||
    !SLUG.test(args[0] ?? "") ||
    args[0].length > MAX_FEATURE_LENGTH ||
    !boundedText(args[2]) ||
    args[2].length > MAX_BRANCH_LENGTH ||
    isAbsolute(args[2]) ||
    (!withoutBase && !GIT_SHA.test(args[4] ?? ""))
  ) {
    fail(
      "<arguments>",
      "usage: init <feature> --branch <expected-branch> --base <expected-base-sha>",
    );
  }
  return { feature: args[0], branch: args[2], base: withoutBase ? null : args[4] };
}

function routeFacts(cwd = process.cwd()) {
  return {
    root: git(["rev-parse", "--show-toplevel"], cwd),
    branch: git(["branch", "--show-current"], cwd),
    head: git(["rev-parse", "HEAD"], cwd),
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

async function readArtifact(path) {
  const facts = await lstat(path);
  if (!facts.isFile() || facts.size > MAX_ARTIFACT_BYTES) {
    fail(path, "artifact must be a regular file no larger than 1 MiB");
  }
  return readFile(path, "utf8");
}

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function requireCanonicalDirectory(path, reason) {
  let canonical;
  try {
    canonical = await realpath(path);
  } catch {
    fail(path, reason);
  }
  if (canonical !== path || !(await lstat(path)).isDirectory()) fail(path, reason);
}

async function canonicalRepositoryRoot(root = process.cwd(), routedRoot) {
  try {
    const repositoryRoot = await realpath(
      routedRoot ?? git(["rev-parse", "--show-toplevel"], root),
    );
    if ((await realpath(root)) !== repositoryRoot) {
      fail(root, "working directory must be the canonical repository root");
    }
    return repositoryRoot;
  } catch (error) {
    if (error instanceof FlowError) throw error;
    fail(root, "cannot resolve the canonical repository root");
  }
}

async function canonicalFeaturesRoot(root = process.cwd(), routedRoot) {
  const repositoryRoot = await canonicalRepositoryRoot(root, routedRoot);
  const featuresRoot = resolve(repositoryRoot, "docs", "features");
  await requireCanonicalDirectory(
    featuresRoot,
    "features path must resolve inside the canonical repository",
  );
  return { repositoryRoot, featuresRoot };
}

async function ensureCanonicalFeaturesRoot(root = process.cwd(), routedRoot) {
  const repositoryRoot = await canonicalRepositoryRoot(root, routedRoot);
  const docsRoot = resolve(repositoryRoot, "docs");
  if (await pathExists(docsRoot)) {
    await requireCanonicalDirectory(
      docsRoot,
      "docs path must resolve inside the canonical repository",
    );
  } else {
    await mkdir(docsRoot);
  }
  const featuresRoot = resolve(docsRoot, "features");
  if (await pathExists(featuresRoot)) {
    await requireCanonicalDirectory(
      featuresRoot,
      "features path must resolve inside the canonical repository",
    );
  } else {
    await mkdir(featuresRoot);
  }
  return { repositoryRoot, featuresRoot };
}

async function canonicalFeaturePaths(feature, root = process.cwd(), routedRoot) {
  const { repositoryRoot, featuresRoot } = await canonicalFeaturesRoot(root, routedRoot);
  const featureRoot = resolve(featuresRoot, feature);
  await requireCanonicalDirectory(
    featureRoot,
    "feature path must resolve inside the canonical repository",
  );
  return { repositoryRoot, featuresRoot, featureRoot };
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

  const { featuresRoot } = await ensureCanonicalFeaturesRoot(process.cwd(), actual.root);
  const featureRoot = resolve(featuresRoot, expected.feature);
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
  validateLedger(ledger, "<generated-ledger>", expected.feature);
  await requireCanonicalDirectory(
    featuresRoot,
    "features path must resolve inside the canonical repository",
  );
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

function containsLocalAbsolutePath(value) {
  const text = value.replaceAll(/\b(?:git|https?|ssh):\/\/\S+/giu, "");
  return (
    /\bfile:\/{1,3}/iu.test(text) ||
    /(?:^|[^A-Z0-9/])(?:~[\\/]|[A-Z]:[\\/]|\\\\[^\\\s]+\\)/iu.test(text) ||
    /(?:^|[^A-Z0-9/])\/{2}\S*/iu.test(text) ||
    /(?:^|[^A-Z0-9/])\/(?:Applications|Library|Users|Volumes|bin|boot|dev|etc|home|lib|lib64|media|mnt|opt|private|proc|root|run|sbin|srv|sys|tmp|usr|var)(?=\/|$|[\s)\]},.;:'"`])/iu.test(
      text,
    ) ||
    /(?:^|[^A-Z0-9/.])\/[^/\s]+\/\S*/iu.test(text)
  );
}

function boundedText(value) {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    value.length <= MAX_FIELD_LENGTH &&
    !containsLocalAbsolutePath(value)
  );
}

// Match the pinned question schema's TypeBox maxLength rules; Intl.Segmenter differs.
function codePointLength(value) {
  return value > 0xff_ff ? 2 : 1;
}

function isQuestionStringModifier(value) {
  return (
    (value >= 0x03_00 && value <= 0x03_6f) ||
    (value >= 0x1a_b0 && value <= 0x1a_ff) ||
    (value >= 0x1d_c0 && value <= 0x1d_ff) ||
    (value >= 0xfe_20 && value <= 0xfe_2f) ||
    (value >= 0xfe_00 && value <= 0xfe_0f)
  );
}

function consumeQuestionStringModifiers(value, index) {
  while (index < value.length) {
    const point = value.codePointAt(index);
    if (!isQuestionStringModifier(point)) break;
    index += codePointLength(point);
  }
  return index;
}

function isRegionalIndicator(value) {
  return value >= 0x1_f1_e6 && value <= 0x1_f1_ff;
}

function nextQuestionStringCharacter(value, start) {
  const first = value.codePointAt(start);
  let end = consumeQuestionStringModifiers(value, start + codePointLength(first));
  while (end < value.length - 1 && value[end] === "\u{200D}") {
    const next = value.codePointAt(end + 1);
    end = consumeQuestionStringModifiers(value, end + 1 + codePointLength(next));
  }
  if (
    isRegionalIndicator(first) &&
    end < value.length &&
    isRegionalIndicator(value.codePointAt(end))
  ) {
    end += codePointLength(value.codePointAt(end));
  }
  return end;
}

function exceedsQuestionStringLimitSlow(value, limit) {
  let count = 0;
  let index = 0;
  while (index < value.length) {
    index = nextQuestionStringCharacter(value, index);
    count += 1;
    if (count > limit) return true;
  }
  return false;
}

function usesQuestionStringSlowPath(value) {
  return (
    (value >= 0xd8_00 && value <= 0xdb_ff) ||
    (value >= 0x03_00 && value <= 0x03_6f) ||
    value === 0x20_0d
  );
}

function exceedsQuestionStringLimit(value, limit) {
  let index = 0;
  while (index < value.length) {
    // TypeBox's fast path deliberately checks UTF-16 code units, not full code points.
    // eslint-disable-next-line unicorn/prefer-code-point
    if (usesQuestionStringSlowPath(value.charCodeAt(index))) {
      return exceedsQuestionStringLimitSlow(value, limit);
    }
    index += 1;
    if (index > limit) return true;
  }
  return false;
}

function validBankingEvidence(value) {
  return (
    value === "commit" || (typeof value === "string" && /^checkpoint: \S[\s\S]*$/u.test(value))
  );
}

function validateLedger(ledger, path, feature) {
  if (!hasExactKeys(ledger, ["schema", "feature", "worktree", "pitch", "slices"])) {
    fail(path, "ledger must contain only schema, feature, worktree, pitch, and slices");
  }
  if (ledger.schema !== "feature-flow/v3") fail(path, "schema must be feature-flow/v3");
  if (ledger.feature !== feature || feature.length > MAX_FEATURE_LENGTH) {
    fail(path, `feature must be the canonical bounded slug ${feature}`);
  }
  if (
    !hasExactKeys(ledger.worktree, ["branch", "base_sha"]) ||
    !boundedText(ledger.worktree.branch) ||
    ledger.worktree.branch.length > MAX_BRANCH_LENGTH ||
    isAbsolute(ledger.worktree.branch) ||
    !GIT_SHA.test(ledger.worktree.base_sha ?? "")
  ) {
    fail(path, "worktree must contain a bounded branch and full base_sha");
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
  if (!Array.isArray(ledger.slices) || ledger.slices.length > MAX_SLICES) {
    fail(path, `slices must be an array with at most ${String(MAX_SLICES)} entries`);
  }
  const ids = new Set();
  const allIds = new Set(ledger.slices.map((slice) => slice?.id));
  const statuses = new Map(ledger.slices.map((slice) => [slice?.id, slice?.status]));
  let current = 0;
  for (const slice of ledger.slices) {
    if (
      !hasExactKeys(slice, ["id", "plan", "goal", "depends_on", "status", "blocker", "evidence"]) ||
      !/^\d{3}$/.test(slice.id ?? "") ||
      typeof slice.plan !== "string" ||
      !boundedText(slice.goal) ||
      !Array.isArray(slice.depends_on) ||
      slice.depends_on.length > MAX_SLICES ||
      !["pending", "active", "blocked", "done", "cut"].includes(slice.status) ||
      !hasExactKeys(slice.evidence, ["red_green", "review", "dogfood", "checks", "banking"])
    ) {
      fail(path, "slice has invalid fields");
    }
    if (ids.has(slice.id)) fail(path, `duplicate slice id: ${slice.id}`);
    if (!new RegExp(`^plans/${slice.id}-[a-z0-9]+(?:-[a-z0-9]+)*\\.md$`, "u").test(slice.plan)) {
      fail(path, `slice ${slice.id} plan must be a canonical feature-relative plan path`);
    }
    if (
      new Set(slice.depends_on).size !== slice.depends_on.length ||
      slice.depends_on.some((id) => typeof id !== "string" || !allIds.has(id))
    ) {
      fail(path, `slice ${slice.id} has a duplicate or unknown dependency`);
    }
    if (
      ["active", "blocked", "done"].includes(slice.status) &&
      slice.depends_on.some((id) => statuses.get(id) !== "done")
    ) {
      fail(path, `slice ${slice.id} has an incomplete dependency`);
    }
    const cutDependency = slice.depends_on.find((id) => statuses.get(id) === "cut");
    if (slice.status === "pending" && cutDependency !== undefined) {
      fail(path, `pending slice ${slice.id} depends on cut slice ${cutDependency}`);
    }
    ids.add(slice.id);
    if (slice.status === "active" || slice.status === "blocked") current += 1;
    if (
      slice.status === "blocked" &&
      (!hasExactKeys(slice.blocker, ["reason", "next_action"]) ||
        Object.values(slice.blocker).some((value) => !boundedText(value)))
    ) {
      fail(path, `blocked slice ${slice.id} requires bounded blocker details`);
    }
    if (slice.status !== "blocked" && slice.blocker !== null) {
      fail(path, `slice ${slice.id} cannot have blocker details`);
    }
    for (const [key, value] of Object.entries(slice.evidence)) {
      if (!(value === null || boundedText(value))) {
        fail(path, `slice ${slice.id} evidence ${key} must be null or a bounded string`);
      }
    }
    if (slice.status === "done" && Object.values(slice.evidence).includes(null)) {
      fail(path, `done slice ${slice.id} requires complete evidence`);
    }
    if (slice.status !== "done" && Object.values(slice.evidence).some((value) => value !== null)) {
      fail(path, `slice ${slice.id} cannot have completion evidence before it is done`);
    }
    if (slice.evidence.banking !== null && !validBankingEvidence(slice.evidence.banking)) {
      fail(path, `slice ${slice.id} banking must be commit or checkpoint: <reason>`);
    }
  }
  if (current > 1) fail(path, "at most one slice may be active or blocked");
  validateDependencyGraph(ledger.slices, path);
  return ledger;
}

function validateDependencyGraph(slices, path) {
  const dependencies = new Map(slices.map((slice) => [slice.id, slice.depends_on]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) fail(path, `slice dependency graph contains a cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of dependencies.get(id) ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of dependencies.keys()) visit(id);
}

function parsePitchFacts(pitch, path) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(pitch)?.[1];
  if (frontmatter === undefined) fail(path, "pitch must have canonical frontmatter");
  const facts = {};
  for (const line of frontmatter.split(/\r?\n/u)) {
    const match = /^(schema|feature|pitch|status): (.+)$/u.exec(line);
    if (match?.[1] === undefined || match[2] === undefined || match[1] in facts) {
      fail(path, "pitch frontmatter must contain only schema, feature, pitch, and status");
    }
    facts[match[1]] = match[2];
  }
  if (!hasExactKeys(facts, ["schema", "feature", "pitch", "status"])) {
    fail(path, "pitch frontmatter must contain only schema, feature, pitch, and status");
  }
  return facts;
}

async function loadFeature(feature, root = process.cwd()) {
  const actual = routeFacts(root);
  const { featureRoot } = await canonicalFeaturePaths(feature, root, actual.root);
  const path = resolve(featureRoot, "index.json");
  let ledger;
  try {
    ledger = validateLedger(JSON.parse(await readArtifact(path)), path, feature);
  } catch (error) {
    if (error instanceof FlowError) throw error;
    fail(path, "cannot read or parse ledger");
  }
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
  if (!gitSucceeds(["merge-base", "--is-ancestor", expected.base, actual.head], root)) {
    routeDecision(
      "base-mismatch",
      expected,
      actual,
      "Use Worktrunk to restore the recorded base lineage, then retry.",
    );
  }
  if (resolve(root) !== resolve(actual.root)) {
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
    pitch = await readArtifact(pitchPath);
  } catch {
    fail(pitchPath, "cannot read pitch");
  }
  const facts = parsePitchFacts(pitch, pitchPath);
  const pitchFeature = /^"?([a-z0-9]+(?:-[a-z0-9]+)*)"?$/u.exec(facts.feature)?.[1];
  const pitchNumber = /^\d+$/u.test(facts.pitch) ? Number(facts.pitch) : NaN;
  const status = /^(?:draft|accepted)$/u.test(facts.status) ? facts.status : undefined;
  if (
    facts.schema !== "feature-flow-pitch/v3" ||
    pitchFeature !== feature ||
    !Number.isSafeInteger(pitchNumber) ||
    pitchNumber !== ledger.pitch.number ||
    status === undefined
  ) {
    fail(pitchPath, "pitch frontmatter does not match the canonical ledger facts");
  }
  if (status === "accepted") {
    const hash = createHash("sha256").update(pitch).digest("hex");
    if (ledger.pitch.sha256 !== hash)
      fail(pitchPath, "accepted pitch sha256 does not match ledger");
  } else if (ledger.pitch.sha256 !== null) {
    fail(path, "draft pitch sha256 must be null");
  }
  if (status === "accepted" && ledger.slices.length > 0) {
    await validateRegisteredPlans(dirname(path), ledger, pitch);
  }
  return { path, ledger, pitch, status };
}

async function validateRegisteredPlans(featureRoot, ledger, pitch) {
  const plansRoot = resolve(featureRoot, "plans");
  await requireCanonicalDirectory(
    plansRoot,
    "registered plans require a canonical plans directory",
  );
  const entries = await readdir(plansRoot, { withFileTypes: true });
  const expected = new Set(ledger.slices.map((slice) => basename(slice.plan)));
  if (
    entries.length !== expected.size ||
    entries.some((entry) => !entry.isFile() || !expected.has(entry.name))
  ) {
    fail(plansRoot, "plans directory must contain exactly the registered plan files");
  }
  const criteria = pitchAcceptanceCriteria(pitch, resolve(featureRoot, ledger.pitch.path));
  const anchors = pitchAnchors(pitch);
  const covered = new Set();
  for (const slice of ledger.slices) {
    const planPath = resolve(featureRoot, slice.plan);
    const content = await readArtifact(planPath);
    const plan = parsePlan(
      content,
      planPath,
      ledger.feature,
      ledger.pitch.sha256,
      criteria,
      anchors,
    );
    if (plan.id !== slice.id || plan.plan !== slice.plan) {
      fail(planPath, `plan ${slice.id} identity does not match ledger`);
    }
    if (!isDeepStrictEqual(plan.depends_on, slice.depends_on)) {
      fail(planPath, `plan ${slice.id} dependencies do not match ledger`);
    }
    for (const criterion of plan.acceptance_criteria) covered.add(criterion);
  }
  const missing = [...criteria].filter((criterion) => !covered.has(criterion));
  if (missing.length > 0)
    fail(plansRoot, `registered plan set does not cover ${missing.join(", ")}`);
}

function isConventionalSubject(subject) {
  return /^[^\s!:()]+(?:\([^()\r\n]+\))?!?: \S[^\r\n]*$/u.test(subject);
}

function hasExactSliceTrailer(message, id, root) {
  const lines = message.split("\n");
  while (lines.at(-1) === "") lines.pop();
  const footer = lines.slice(lines.lastIndexOf("") + 1);
  const trailers = execFileSync("git", ["interpret-trailers", "--parse"], {
    cwd: root,
    encoding: "utf8",
    input: message,
    stdio: ["pipe", "pipe", "ignore"],
  })
    .trim()
    .split("\n")
    .filter(Boolean);
  const sliceTrailers = trailers.filter((trailer) => /^Feature-Slice:/iu.test(trailer));
  return (
    footer.filter((line) => line === `Feature-Slice: ${id}`).length === 1 &&
    sliceTrailers.length === 1 &&
    sliceTrailers[0] === `Feature-Slice: ${id}`
  );
}

function bankCandidates(commitSlices, ledgerPath, root) {
  const repositoryRoot = git(["rev-parse", "--show-toplevel"], root);
  const repositoryPath = relative(repositoryRoot, ledgerPath).replaceAll("\\", "/");
  const ids = commitSlices.map((slice) => slice.id).join("|");
  const commits = git(
    [
      "log",
      "--format=%H",
      `--max-count=${String(MAX_BANK_CANDIDATES)}`,
      "--extended-regexp",
      `--grep=^Feature-Slice: (${ids})$`,
      "--",
      repositoryPath,
    ],
    root,
  )
    .split("\n")
    .filter(Boolean);
  return { commits, repositoryPath };
}

const bankLookupCache = new WeakMap();

function commitBankedSliceIds(ledger, ledgerPath, root = process.cwd()) {
  const cached = bankLookupCache.get(ledger);
  if (cached !== undefined) return cached;
  const banked = new Set();
  bankLookupCache.set(ledger, banked);
  const commitSlices = ledger.slices.filter(
    (slice) => slice.status === "done" && slice.evidence.banking === "commit",
  );
  if (commitSlices.length === 0) return banked;
  const candidates = bankCandidates(commitSlices, ledgerPath, root);
  for (const commit of candidates.commits) {
    try {
      const detail = execFileSync("git", ["show", "-s", "--format=%s%x00%B", commit], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: MAX_ARTIFACT_BYTES,
        stdio: ["ignore", "pipe", "ignore"],
      });
      const separator = detail.indexOf("\0");
      const subject = detail.slice(0, separator);
      const message = detail.slice(separator + 1);
      const slice = commitSlices.find((candidate) =>
        hasExactSliceTrailer(message, candidate.id, root),
      );
      if (slice === undefined || !isConventionalSubject(subject)) continue;
      const committed = JSON.parse(
        execFileSync("git", ["show", `${commit}:${candidates.repositoryPath}`], {
          cwd: root,
          encoding: "utf8",
          maxBuffer: MAX_ARTIFACT_BYTES,
          stdio: ["ignore", "pipe", "ignore"],
        }),
      );
      const committedSlice = committed.slices?.find((candidate) => candidate.id === slice.id);
      if (
        committed.feature === ledger.feature &&
        committed.pitch?.number === ledger.pitch.number &&
        committed.pitch?.sha256 === ledger.pitch.sha256 &&
        isDeepStrictEqual(committedSlice, slice)
      ) {
        banked.add(slice.id);
      }
    } catch {
      // A candidate lacking the exact identity, receipt, and snapshot is not a bank.
    }
  }
  return banked;
}

function isBanked(slice, ledger, ledgerPath, root = process.cwd()) {
  if (typeof slice.evidence.banking !== "string") return false;
  if (slice.evidence.banking.startsWith("checkpoint: ")) return true;
  return (
    slice.evidence.banking === "commit" &&
    commitBankedSliceIds(ledger, ledgerPath, root).has(slice.id)
  );
}

function firstReadySlice(slices) {
  const byId = new Map(slices.map((slice) => [slice.id, slice]));
  return slices.find(
    (slice) =>
      slice.status === "pending" && slice.depends_on.every((id) => byId.get(id)?.status === "done"),
  );
}

function derive(status, ledger, ledgerPath, root = process.cwd()) {
  if (status === "draft") {
    return {
      phase: "shaping",
      current_slice: null,
      next_action: "Continue shaping the draft pitch.",
    };
  }
  const slices = ledger.slices;
  if (slices.length === 0) {
    return {
      phase: "planning",
      current_slice: null,
      next_action: "Generate and review the vertical slice plans.",
    };
  }
  const unbanked = slices.find(
    (slice) => slice.status === "done" && !isBanked(slice, ledger, ledgerPath, root),
  );
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
        current.status === "blocked" ? current.blocker.next_action : `Deliver slice ${current.id}.`,
    };
  }
  const pending = firstReadySlice(slices);
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

async function writeArtifact(path, content) {
  const temporary = `${path}.tmp-${String(process.pid)}`;
  await writeFile(temporary, content, { flag: "wx" });
  try {
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

async function writeLedger(path, ledger) {
  validateLedger(ledger, path, ledger.feature);
  await writeArtifact(path, `${JSON.stringify(ledger, null, 2)}\n`);
}

function pitchAcceptanceCriteria(pitch, path) {
  const criteria = [...pitch.matchAll(/^- \*\*(AC-\d{3})\s+—/gmu)].map((match) => match[1]);
  if (new Set(criteria).size !== criteria.length)
    fail(path, "pitch acceptance criteria must be unique");
  return new Set(criteria);
}

function pitchAnchors(pitch) {
  return new Set(
    [...pitch.matchAll(/^#{2,6} (.+)$/gmu)].map((match) =>
      match[1]
        .toLowerCase()
        .replaceAll(/[^a-z0-9\s-]/gu, "")
        .trim()
        .replaceAll(/\s+/gu, "-"),
    ),
  );
}

function planSection(content, heading, path) {
  const match = new RegExp(
    `^## ${heading}\\r?\\n\\r?\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`,
    "mu",
  ).exec(content);
  if (match?.[1] === undefined || match[1].trim() === "") {
    fail(path, `plan requires a non-empty ${heading} section`);
  }
  return match[1].trim();
}

function planGoal(content, path, id) {
  const goal = planSection(content, "Goal", path)
    .split(/\r?\n\r?\n/u, 1)[0]
    .replaceAll(/\s+/gu, " ")
    .trim();
  if (!boundedText(goal)) fail(path, `plan ${id} goal must be bounded text`);
  return goal;
}

function parsePlan(content, sourcePath, feature, pitchHash, pitchCriteria, anchors) {
  if (containsLocalAbsolutePath(content))
    fail(sourcePath, "plan must not contain local absolute paths");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content)?.[1];
  if (frontmatter === undefined) fail(sourcePath, "plan must have canonical v2 frontmatter");
  const match = new RegExp(
    `^schema: feature-flow-plan/v2\\r?\\nfeature: (?:"${feature}"|${feature})\\r?\\nid: "(\\d{3})"\\r?\\npitch_sha256: ("?)(${SHA256.source.slice(1, -1)})\\2\\r?\\ndepends_on:(?: \\[\\]|((?:\\r?\\n  - "\\d{3}")+))$`,
    "u",
  ).exec(frontmatter);
  if (match?.[1] === undefined || match[3] === undefined) {
    fail(sourcePath, "plan must have canonical v2 feature, id, pitch pin, and dependencies");
  }
  const id = match[1];
  const dependencies = [...(match[4] ?? "").matchAll(/ {2}- "(\d{3})"/gu)].map(
    (dependency) => dependency[1],
  );
  if (match[3] !== pitchHash) fail(sourcePath, `plan ${id} pitch_sha256 must match accepted pitch`);
  const name = basename(sourcePath);
  if (!new RegExp(`^${id}-[a-z0-9]+(?:-[a-z0-9]+)*\\.md$`, "u").test(name)) {
    fail(sourcePath, `plan ${id} filename must be ${id}-<vertical-outcome>.md`);
  }
  if (!new RegExp(`^# Slice ${id}: \\S`, "mu").test(content)) {
    fail(sourcePath, `plan ${id} requires its canonical slice title`);
  }
  if (/^## (?:Estimates?|Status)\b/mu.test(content)) {
    fail(sourcePath, `plan ${id} must not contain estimate or status sections`);
  }
  const goal = planGoal(content, sourcePath, id);
  const trace = planSection(content, "Pitch trace", sourcePath);
  planSection(content, "Dependencies and predecessor postconditions", sourcePath);
  planSection(content, "Public seam and first TDD tracer", sourcePath);
  planSection(content, "Validation", sourcePath);
  planSection(content, "Dogfood and QA", sourcePath);
  planSection(content, "Done when", sourcePath);
  const links = [...trace.matchAll(/\.\.\/pitch\.md#([a-z0-9-]+)/gu)].map((link) => link[1]);
  if (links.length === 0 || links.some((anchor) => !anchors.has(anchor))) {
    fail(sourcePath, `plan ${id} pitch trace must link exact accepted pitch sections`);
  }
  const criteria = [...trace.matchAll(/\*\*(AC-\d{3})\*\*/gu)].map((criterion) => criterion[1]);
  const mentioned = [...content.matchAll(/\bAC-\d{3}\b/gu)].map((criterion) => criterion[0]);
  const unknown = mentioned.find((criterion) => !pitchCriteria.has(criterion));
  if (unknown !== undefined) fail(sourcePath, `plan ${id} references unknown ${unknown}`);
  if (pitchCriteria.size > 0 && criteria.length === 0) {
    fail(sourcePath, `plan ${id} pitch trace must contain exact literal acceptance criteria`);
  }
  return {
    id,
    plan: `plans/${name}`,
    goal,
    depends_on: dependencies,
    status: "pending",
    blocker: null,
    evidence: {
      red_green: null,
      review: null,
      dogfood: null,
      checks: null,
      banking: null,
    },
    acceptance_criteria: criteria,
    content,
  };
}

async function preparePlanSet(args) {
  if (
    args.length < 2 ||
    args.length > MAX_SLICES + 1 ||
    !SLUG.test(args[0] ?? "") ||
    args.slice(1).some((path) => typeof path !== "string" || path.trim() === "")
  ) {
    fail("<arguments>", "usage: <plan-command> <feature> <complete-plan-file>...");
  }
  const [feature, ...sourcePaths] = args;
  const { path, ledger, pitch, status } = await loadFeature(feature);
  if (status !== "accepted" || ledger.pitch.sha256 === null) {
    fail(path, "pitch must be accepted before planning");
  }
  const contents = await Promise.all(
    sourcePaths.map((sourcePath) => readArtifact(resolve(sourcePath))),
  );
  const criteria = pitchAcceptanceCriteria(pitch, resolve(dirname(path), ledger.pitch.path));
  const anchors = pitchAnchors(pitch);
  const plans = contents.map((content, index) =>
    parsePlan(
      content,
      resolve(sourcePaths[index]),
      feature,
      ledger.pitch.sha256,
      criteria,
      anchors,
    ),
  );
  const planPaths = new Set(plans.map((plan) => plan.plan));
  if (planPaths.size !== plans.length) fail("<arguments>", "plan filenames must be unique");
  const planLedger = structuredClone(ledger);
  planLedger.slices = plans.map((plan) => {
    const slice = structuredClone(plan);
    delete slice.acceptance_criteria;
    delete slice.content;
    return slice;
  });
  validateLedger(planLedger, path, feature);
  const covered = new Set(plans.flatMap((plan) => plan.acceptance_criteria));
  const missing = [...criteria].filter((criterion) => !covered.has(criterion));
  if (missing.length > 0) fail("<plans>", `plan set does not cover ${missing.join(", ")}`);
  return { feature, path, ledger, planLedger, plans, status };
}

async function validatePlans(args) {
  const prepared = await preparePlanSet(args);
  if (prepared.ledger.slices.length > 0) await prepareRefinement(prepared);
  return {
    ok: true,
    command: "validate-plans",
    feature: prepared.feature,
    plans: prepared.plans.length,
    valid: true,
  };
}

async function prepareRefinement(prepared) {
  const featureRoot = dirname(prepared.path);
  const plansPath = resolve(featureRoot, "plans");
  if (prepared.ledger.slices.length === 0 || !(await pathExists(plansPath))) {
    fail(prepared.path, "a registered plan set is required before refinement");
  }
  if (
    prepared.ledger.slices.some(
      (slice) => slice.status === "done" && !isBanked(slice, prepared.ledger, prepared.path),
    )
  ) {
    fail(prepared.path, "all done slices must be banked before refinement");
  }
  const candidates = new Map(prepared.plans.map((plan) => [plan.id, plan]));
  const fixed = prepared.ledger.slices.filter((slice) => slice.status !== "pending");
  for (const slice of fixed) {
    const candidate = candidates.get(slice.id);
    if (
      candidate === undefined ||
      candidate.plan !== slice.plan ||
      !isDeepStrictEqual(candidate.depends_on, slice.depends_on)
    ) {
      fail(prepared.path, `fixed slice ${slice.id} record must remain unchanged`);
    }
    const currentContent = await readArtifact(resolve(featureRoot, slice.plan));
    if (candidate.content !== currentContent) {
      fail(
        resolve(featureRoot, slice.plan),
        `fixed slice ${slice.id} plan bytes must remain unchanged`,
      );
    }
  }
  const fixedIds = new Set(fixed.map((slice) => slice.id));
  const candidateFixedOrder = prepared.plans
    .filter((plan) => fixedIds.has(plan.id))
    .map((plan) => plan.id);
  if (
    !isDeepStrictEqual(
      candidateFixedOrder,
      fixed.map((slice) => slice.id),
    )
  ) {
    fail(prepared.path, "fixed slice relative order must remain unchanged");
  }
  const pendingGoals = new Map();
  for (const slice of prepared.ledger.slices.filter(({ status }) => status === "pending")) {
    const planPath = resolve(featureRoot, slice.plan);
    pendingGoals.set(slice.id, planGoal(await readArtifact(planPath), planPath, slice.id));
  }
  prepared.planLedger.slices = prepared.plans.map((plan) => {
    const previous = prepared.ledger.slices.find((candidate) => candidate.id === plan.id);
    if (previous?.status !== "pending" && previous !== undefined) return structuredClone(previous);
    const slice = structuredClone(plan);
    delete slice.acceptance_criteria;
    delete slice.content;
    if (previous !== undefined && pendingGoals.get(plan.id) === plan.goal) {
      slice.goal = previous.goal;
    }
    return slice;
  });
  validateLedger(prepared.planLedger, prepared.path, prepared.feature);
  return prepared;
}

async function publishPlans(featureRoot, plans, ledgerPath, publishLedger) {
  const plansPath = resolve(featureRoot, "plans");
  const ledgerBefore = await readArtifact(ledgerPath);
  const staged = resolve(featureRoot, `.feature-flow-plans-${String(process.pid)}`);
  const backup = resolve(featureRoot, `.feature-flow-plans-backup-${String(process.pid)}`);
  await mkdir(staged);
  try {
    await Promise.all(
      plans.map((plan) =>
        writeFile(resolve(staged, basename(plan.plan)), plan.content, { flag: "wx" }),
      ),
    );
  } catch (error) {
    await rm(staged, { force: true, recursive: true });
    throw error;
  }
  const hadPlans = await pathExists(plansPath);
  let backedUp = false;
  let published = false;
  try {
    if (hadPlans) {
      await rename(plansPath, backup);
      backedUp = true;
    }
    await rename(staged, plansPath);
    published = true;
    await publishLedger();
  } catch (error) {
    try {
      if (published) await rm(plansPath, { force: true, recursive: true });
      if (backedUp) await rename(backup, plansPath);
      await writeArtifact(ledgerPath, ledgerBefore);
      await rm(staged, { force: true, recursive: true });
    } catch {
      fail(
        featureRoot,
        "plan publication failed and rollback was incomplete; recover preserved .feature-flow-plans-* artifacts",
      );
    }
    throw error;
  }
  if (backedUp) {
    try {
      await rm(backup, { recursive: true });
    } catch {
      // Canonical plans and ledger are committed; preserve the bounded backup for recovery.
    }
  }
}

async function registerPlans(args) {
  const prepared = await preparePlanSet(args);
  const featureRoot = dirname(prepared.path);
  if (prepared.ledger.slices.length !== 0) fail(prepared.path, "plan set is already registered");
  if (await pathExists(resolve(featureRoot, "plans"))) {
    fail(resolve(featureRoot, "plans"), "plans must not exist before registration");
  }
  await canonicalFeaturePaths(prepared.feature);
  await publishPlans(featureRoot, prepared.plans, prepared.path, () =>
    writeLedger(prepared.path, prepared.planLedger),
  );
  return {
    ok: true,
    command: "register-plans",
    feature: prepared.feature,
    plans: prepared.plans.length,
    ...derive(prepared.status, prepared.planLedger, prepared.path),
  };
}

async function refinePlans(args) {
  const prepared = await prepareRefinement(await preparePlanSet(args));
  const featureRoot = dirname(prepared.path);
  await canonicalFeaturePaths(prepared.feature);
  await publishPlans(featureRoot, prepared.plans, prepared.path, () =>
    writeLedger(prepared.path, prepared.planLedger),
  );
  return {
    ok: true,
    command: "refine-plans",
    feature: prepared.feature,
    plans: prepared.plans.length,
    ...derive(prepared.status, prepared.planLedger, prepared.path),
  };
}

async function inspectCandidates(args) {
  if (args.length === 0 || args.length > 100 || args.some((path) => !isAbsolute(path))) {
    fail(
      "<arguments>",
      "usage: inspect-candidates <absolute-worktree-path>... (maximum 100 paths)",
    );
  }
  const result = { valid: [], stale: [], invalid: [] };
  const inspectedRoots = new Set();
  for (const [index, suppliedPath] of args.entries()) {
    let root;
    try {
      root = await realpath(suppliedPath);
    } catch {
      result.invalid.push({
        candidate: index + 1,
        reason: "cannot inspect candidate Git facts",
        next_action: "Exclude this invalid candidate.",
      });
      continue;
    }
    if (inspectedRoots.has(root)) {
      result.invalid.push({
        candidate: index + 1,
        reason: "candidate resolves to a duplicate canonical worktree",
        next_action: "Exclude this duplicate candidate alias.",
      });
      continue;
    }
    inspectedRoots.add(root);

    let actual;
    try {
      actual = routeFacts(root);
      if ((await realpath(actual.root)) !== root) {
        fail(root, "candidate path must be its Git top-level");
      }
    } catch {
      result.invalid.push({
        candidate: index + 1,
        reason: "cannot inspect candidate Git facts",
        next_action: "Exclude this invalid candidate.",
      });
      continue;
    }

    let features;
    const canonicalFeature = /^shape\/([a-z0-9]+(?:-[a-z0-9]+)*)$/u.exec(actual.branch)?.[1];
    try {
      if (!(await pathExists(resolve(root, "docs", "features")))) continue;
      const { featuresRoot } = await canonicalFeaturesRoot(root, actual.root);
      if (canonicalFeature === undefined) {
        const entries = await readdir(featuresRoot, { withFileTypes: true });
        const featureEntries = entries.filter(
          (entry) => entry.isDirectory() && SLUG.test(entry.name),
        );
        if (featureEntries.length > 100) {
          result.invalid.push({
            candidate: index + 1,
            reason: "candidate contains more than 100 feature directories",
            next_action: "Narrow or repair this candidate before retrying.",
          });
          continue;
        }
        features = [];
        for (const entry of featureEntries) {
          try {
            const { featureRoot } = await canonicalFeaturePaths(entry.name, root, actual.root);
            const ledger = JSON.parse(await readArtifact(resolve(featureRoot, "index.json")));
            if (isRecord(ledger.worktree) && ledger.worktree.branch === actual.branch) {
              features.push(entry.name);
            }
          } catch {
            // A legacy candidate must have a parseable recorded branch matching this branch.
          }
        }
      } else {
        const ledgerPath = resolve(root, "docs", "features", canonicalFeature, "index.json");
        features = (await pathExists(ledgerPath)) ? [canonicalFeature] : [];
      }
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
      result.invalid.push({
        candidate: index + 1,
        reason: "cannot read candidate feature directory",
        next_action: "Exclude this invalid candidate.",
      });
      continue;
    }

    for (const feature of features.sort((left, right) => left.localeCompare(right))) {
      try {
        const { ledger, status, path } = await loadFeature(feature, root);
        result.valid.push({
          feature,
          branch: actual.branch,
          ...derive(status, ledger, path, root),
        });
      } catch (error) {
        if (error instanceof RoutingDecision) {
          result.stale.push({
            feature,
            ledger: `docs/features/${feature}/index.json`,
            expected: error.decision.expected,
            actual: error.decision.actual,
            reason:
              error.decision.reason === "branch-mismatch"
                ? "recorded branch does not match the candidate worktree branch"
                : "recorded base is not an ancestor of the candidate worktree HEAD",
            next_action: "Do not activate this stale candidate; inspect its recorded route.",
          });
        } else {
          result.invalid.push({
            candidate: index + 1,
            feature,
            reason: error instanceof FlowError ? error.message : "cannot validate candidate ledger",
            next_action: "Repair or exclude this invalid candidate.",
          });
        }
      }
    }
  }
  return { ok: true, command: "inspect-candidates", ...result };
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
    ...derive(status, ledger, resolve("docs", "features", feature, "index.json")),
  };
}

async function prepareAcceptance(feature) {
  const { path, ledger, pitch: draft, status } = await loadFeature(feature);
  if (status !== "draft") fail(path, "pitch must be draft before acceptance");
  if (ledger.slices.length !== 0)
    fail(path, "draft pitch cannot be accepted with registered slices");
  const featureRoot = dirname(path);
  if (await pathExists(resolve(featureRoot, "plans"))) {
    fail(resolve(featureRoot, "plans"), "plans must not exist before pitch acceptance");
  }
  const pitchPath = resolve(featureRoot, ledger.pitch.path);
  if (exceedsQuestionStringLimit(draft, MAX_QUESTION_DOCUMENT_CHARS)) {
    fail(pitchPath, "pitch must fit the question tool's 100000-character document limit");
  }
  const accepted = draft.replace(/^status: draft$/mu, "status: accepted");
  if (accepted === draft) fail(pitchPath, "pitch status must be draft before acceptance");
  const sha256 = createHash("sha256").update(accepted).digest("hex");
  const acceptedLedger = structuredClone(ledger);
  acceptedLedger.pitch.sha256 = sha256;
  validateLedger(acceptedLedger, path, feature);
  return { path, pitchPath, draft, accepted, acceptedLedger, sha256 };
}

async function validatePitch(args) {
  if (args.length !== 1 || !SLUG.test(args[0] ?? "")) {
    fail("<arguments>", "usage: validate-pitch <feature>");
  }
  const feature = args[0];
  const { sha256 } = await prepareAcceptance(feature);
  return {
    ok: true,
    command: "validate-pitch",
    feature,
    prospective_sha256: sha256,
    ready_for_approval: true,
  };
}

async function accept(args) {
  if (args.length !== 2 || !SLUG.test(args[0] ?? "") || !SHA256.test(args[1] ?? "")) {
    fail("<arguments>", "usage: accept <feature> <prospective-sha256>");
  }
  const [feature, approvedHash] = args;
  const { path, pitchPath, draft, accepted, acceptedLedger, sha256 } =
    await prepareAcceptance(feature);
  if (sha256 !== approvedHash) {
    fail(pitchPath, "current prospective pitch sha256 does not match the approved hash");
  }
  await canonicalFeaturePaths(feature);
  await writeArtifact(pitchPath, accepted);
  try {
    await writeLedger(path, acceptedLedger);
  } catch (error) {
    await writeArtifact(pitchPath, draft);
    throw error;
  }
  return {
    ok: true,
    command: "accept",
    feature,
    sha256,
    ...derive("accepted", acceptedLedger, path),
  };
}

async function repitch(args) {
  if (args.length !== 1 || !SLUG.test(args[0] ?? "")) {
    fail("<arguments>", "usage: repitch <feature>");
  }
  const feature = args[0];
  const { path, ledger, pitch: accepted, status } = await loadFeature(feature);
  if (status !== "accepted") fail(path, "pitch must be accepted before repitching");
  if (ledger.slices.some((slice) => slice.status === "done" && !isBanked(slice, ledger, path))) {
    fail(path, "all done slices must be banked before repitching");
  }
  const featureRoot = dirname(path);
  const pitchPath = resolve(featureRoot, ledger.pitch.path);
  const version = String(ledger.pitch.number).padStart(3, "0");
  const archivedPitchPath = resolve(featureRoot, `pitch-v${version}.md`);
  const plansPath = resolve(featureRoot, "plans");
  const archivedPlansPath = resolve(featureRoot, `plans-v${version}`);
  const hasPlans = await pathExists(plansPath);
  if (await pathExists(archivedPitchPath)) fail(archivedPitchPath, "pitch archive already exists");
  if (await pathExists(archivedPlansPath)) fail(archivedPlansPath, "plan archive already exists");
  if (ledger.slices.length > 0 && !hasPlans) fail(plansPath, "registered slices require plans");
  if (ledger.slices.length === 0 && hasPlans)
    fail(plansPath, "unregistered plans cannot be archived");
  if (hasPlans) {
    const facts = await lstat(plansPath);
    if (!facts.isDirectory()) fail(plansPath, "plans must be a directory");
    await Promise.all(ledger.slices.map((slice) => readArtifact(resolve(featureRoot, slice.plan))));
  }

  const nextNumber = ledger.pitch.number + 1;
  const draft = accepted
    .replace(
      new RegExp(`^pitch: ${String(ledger.pitch.number)}$`, "mu"),
      `pitch: ${String(nextNumber)}`,
    )
    .replace(/^status: accepted$/mu, "status: draft");
  if (draft === accepted || parsePitchFacts(draft, pitchPath).status !== "draft") {
    fail(pitchPath, "accepted pitch cannot be converted to the next canonical draft");
  }
  const nextLedger = structuredClone(ledger);
  nextLedger.pitch.number = nextNumber;
  nextLedger.pitch.sha256 = null;
  nextLedger.slices = [];
  validateLedger(nextLedger, path, feature);

  const stagedPitch = resolve(featureRoot, `.feature-flow-repitch-pitch-${String(process.pid)}`);
  const stagedLedger = resolve(featureRoot, `.feature-flow-repitch-ledger-${String(process.pid)}`);
  const ledgerBackup = resolve(
    featureRoot,
    `.feature-flow-repitch-ledger-backup-${String(process.pid)}`,
  );
  await canonicalFeaturePaths(feature);
  await writeFile(stagedPitch, draft, { flag: "wx" });
  try {
    await writeFile(stagedLedger, `${JSON.stringify(nextLedger, null, 2)}\n`, { flag: "wx" });
  } catch (error) {
    await Promise.all([rm(stagedPitch, { force: true }), rm(stagedLedger, { force: true })]);
    throw error;
  }

  let pitchArchived = false;
  let plansArchived = false;
  let ledgerBackedUp = false;
  let pitchPublished = false;
  let ledgerPublished = false;
  try {
    await rename(pitchPath, archivedPitchPath);
    pitchArchived = true;
    if (hasPlans) {
      await rename(plansPath, archivedPlansPath);
      plansArchived = true;
    }
    await rename(path, ledgerBackup);
    ledgerBackedUp = true;
    await rename(stagedPitch, pitchPath);
    pitchPublished = true;
    await rename(stagedLedger, path);
    ledgerPublished = true;
    await rm(ledgerBackup, { force: true });
  } catch (error) {
    try {
      if (ledgerPublished) await rm(path, { force: true });
      if (ledgerBackedUp) await rename(ledgerBackup, path);
      if (pitchPublished) await rm(pitchPath, { force: true });
      if (plansArchived) await rename(archivedPlansPath, plansPath);
      if (pitchArchived) await rename(archivedPitchPath, pitchPath);
      await Promise.all([rm(stagedPitch, { force: true }), rm(stagedLedger, { force: true })]);
    } catch {
      fail(
        featureRoot,
        "repitch failed and rollback was incomplete; recover preserved .feature-flow-repitch-* artifacts",
      );
    }
    throw error;
  }
  return {
    ok: true,
    command: "repitch",
    feature,
    archived_pitch: basename(archivedPitchPath),
    archived_plans: hasPlans ? basename(archivedPlansPath) : null,
    pitch_number: nextNumber,
    ...derive("draft", nextLedger, path),
  };
}

async function verify(args) {
  if (args.length !== 1 || !SLUG.test(args[0] ?? "")) {
    fail("<arguments>", "usage: verify <feature>");
  }
  const feature = args[0];
  const { ledger, status } = await loadFeature(feature);
  if (status !== "accepted") fail(ledger.pitch.path, "pitch must be accepted before verification");
  return {
    ok: true,
    command: "verify",
    feature,
    sha256: ledger.pitch.sha256,
    immutable: true,
  };
}

function requireAcceptedBuild(status, path) {
  if (status !== "accepted") fail(path, "pitch must be accepted before slice transitions");
}

function requireBankedDoneSlices(ledger, path) {
  const unbanked = ledger.slices.find(
    (slice) => slice.status === "done" && !isBanked(slice, ledger, path),
  );
  if (unbanked) fail(path, `slice ${unbanked.id} must be banked before any other transition`);
}

function requireCleanCommitActivation(ledger, path) {
  const lastDone = ledger.slices.findLast((slice) => slice.status === "done");
  if (
    lastDone?.evidence.banking === "commit" &&
    git(["status", "--porcelain=v1", "--untracked-files=all"]) !== ""
  ) {
    fail(path, "checkout must be clean before commit banking permits activation");
  }
}

async function block(args) {
  if (
    args.length !== 6 ||
    !SLUG.test(args[0] ?? "") ||
    !/^\d{3}$/.test(args[1] ?? "") ||
    args[2] !== "--reason" ||
    !boundedText(args[3]) ||
    args[4] !== "--next-action" ||
    !boundedText(args[5])
  ) {
    fail(
      "<arguments>",
      "usage: block <feature> <slice-id> --reason <reason> --next-action <next-action>",
    );
  }
  const [feature, id] = args;
  const { path, ledger, status } = await loadFeature(feature);
  requireAcceptedBuild(status, path);
  requireBankedDoneSlices(ledger, path);
  const target = ledger.slices.find((slice) => slice.id === id);
  if (!target || target.status !== "active") fail(path, `slice ${id} must be active`);
  target.status = "blocked";
  target.blocker = { reason: args[3], next_action: args[5] };
  await writeLedger(path, ledger);
  return { ok: true, command: "block", feature, ...derive(status, ledger, path) };
}

async function unblock(args) {
  if (args.length !== 2 || !SLUG.test(args[0] ?? "") || !/^\d{3}$/.test(args[1] ?? "")) {
    fail("<arguments>", "usage: unblock <feature> <slice-id>");
  }
  const [feature, id] = args;
  const { path, ledger, status } = await loadFeature(feature);
  requireAcceptedBuild(status, path);
  requireBankedDoneSlices(ledger, path);
  const target = ledger.slices.find((slice) => slice.id === id);
  if (!target || target.status !== "blocked") fail(path, `slice ${id} must be blocked`);
  target.status = "active";
  target.blocker = null;
  await writeLedger(path, ledger);
  return { ok: true, command: "unblock", feature, ...derive(status, ledger, path) };
}

async function cut(args) {
  if (args.length !== 2 || !SLUG.test(args[0] ?? "") || !/^\d{3}$/.test(args[1] ?? "")) {
    fail("<arguments>", "usage: cut <feature> <slice-id>");
  }
  const [feature, id] = args;
  const { path, ledger, status } = await loadFeature(feature);
  requireAcceptedBuild(status, path);
  requireBankedDoneSlices(ledger, path);
  const target = ledger.slices.find((slice) => slice.id === id);
  if (!target || target.status !== "pending") fail(path, `slice ${id} must be pending`);
  const dependent = ledger.slices.find(
    (slice) => slice.depends_on.includes(id) && slice.status !== "cut",
  );
  if (dependent) fail(path, `slice ${id} still has ${dependent.status} dependent ${dependent.id}`);
  target.status = "cut";
  await writeLedger(path, ledger);
  return { ok: true, command: "cut", feature, ...derive(status, ledger, path) };
}

async function complete(args) {
  const flags = ["--red-green", "--review", "--dogfood", "--checks", "--banking"];
  if (
    args.length !== 12 ||
    !SLUG.test(args[0] ?? "") ||
    !/^\d{3}$/.test(args[1] ?? "") ||
    flags.some((flag, index) => args[2 + index * 2] !== flag) ||
    flags.some((_, index) => !boundedText(args[3 + index * 2]))
  ) {
    fail(
      "<arguments>",
      "usage: complete <feature> <slice-id> --red-green <evidence> --review <evidence> --dogfood <evidence> --checks <evidence> --banking <commit|checkpoint: reason>",
    );
  }
  const [feature, id] = args;
  const banking = args[11];
  if (!validBankingEvidence(banking)) {
    fail("<arguments>", "banking must be commit or checkpoint: <reason>");
  }
  const { path, ledger, status } = await loadFeature(feature);
  requireAcceptedBuild(status, path);
  requireBankedDoneSlices(ledger, path);
  const target = ledger.slices.find((slice) => slice.id === id);
  if (!target || !["active", "blocked"].includes(target.status)) {
    fail(path, `slice ${id} must be active or blocked`);
  }
  target.status = "done";
  target.blocker = null;
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
    ...derive(status, ledger, path),
  };
}

async function activate(args) {
  if (args.length !== 2 || !SLUG.test(args[0] ?? "") || !/^\d{3}$/.test(args[1] ?? "")) {
    fail("<arguments>", "usage: activate <feature> <slice-id>");
  }
  const [feature, id] = args;
  const { path, ledger, status } = await loadFeature(feature);
  requireAcceptedBuild(status, path);
  requireBankedDoneSlices(ledger, path);
  if (ledger.slices.some((slice) => slice.status === "active" || slice.status === "blocked")) {
    fail(path, "another slice is already active or blocked");
  }
  const target = ledger.slices.find((slice) => slice.id === id);
  if (!target || target.status !== "pending") fail(path, `slice ${id} must be pending`);
  const ready = firstReadySlice(ledger.slices);
  if (ready?.id !== id) {
    const byId = new Map(ledger.slices.map((slice) => [slice.id, slice]));
    if (target.depends_on.some((dependency) => byId.get(dependency)?.status !== "done")) {
      fail(path, `slice ${id} dependencies are not done`);
    }
    fail(path, `slice ${ready?.id ?? "<none>"} is the first dependency-ready pending slice`);
  }
  requireCleanCommitActivation(ledger, path);
  target.status = "active";
  await writeLedger(path, ledger);
  return {
    ok: true,
    command: "activate",
    feature,
    ...derive(status, ledger, path),
  };
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  let result;
  switch (command) {
    case "accept":
      result = await accept(args);
      break;
    case "block":
      result = await block(args);
      break;
    case "activate":
      result = await activate(args);
      break;
    case "complete":
      result = await complete(args);
      break;
    case "cut":
      result = await cut(args);
      break;
    case "init":
      result = await init(args);
      break;
    case "inspect":
      result = await inspect(args);
      break;
    case "inspect-candidates":
      result = await inspectCandidates(args);
      break;
    case "refine-plans":
      result = await refinePlans(args);
      break;
    case "register-plans":
      result = await registerPlans(args);
      break;
    case "repitch":
      result = await repitch(args);
      break;
    case "validate-pitch":
      result = await validatePitch(args);
      break;
    case "validate-plans":
      result = await validatePlans(args);
      break;
    case "unblock":
      result = await unblock(args);
      break;
    case "verify":
      result = await verify(args);
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
    const reason = error instanceof FlowError ? error.message : "unexpected failure";
    process.stderr.write(`${outputJson({ ok: false, errors: [{ path, reason }] })}\n`);
  }
  process.exitCode = 1;
}
