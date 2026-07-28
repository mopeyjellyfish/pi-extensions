#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const FRONTMATTER_FIELDS = new Set(["schema", "feature", "status", "revision"]);
const STATUSES = new Set(["draft", "ready", "accepted"]);
const PLAN_FRONTMATTER_FIELDS = new Set([
  "schema",
  "feature",
  "slice",
  "pitch_revision",
  "dependencies",
  "status",
  "revision",
]);
const PLAN_STATUSES = new Set(["draft", "reviewed"]);
const REQUIRED_SECTIONS = ["Problem", "Solution", "Rabbit holes", "No-gos", "Acceptance criteria"];
const REQUIRED_SECTION_SET = new Set(REQUIRED_SECTIONS);
const REQUIRED_PLAN_SECTIONS = [
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
const MAX_OUTPUT_FIELD_LENGTH = 128;
const MAX_OUTPUT_PATH_LENGTH = 1024;
const MAX_GIT_LINES = 40;
const MAX_GIT_LINE_LENGTH = MAX_OUTPUT_FIELD_LENGTH;
const MAX_REPORTED_PLANS = 100;

class FlowError extends Error {
  constructor(path, reason) {
    super(reason);
    this.path = path;
  }
}

function fail(path, reason) {
  throw new FlowError(path, reason);
}

function sectionText(body, heading) {
  const lines = body.split("\n");
  const start = lines.indexOf(`## ${heading}`);
  if (start === -1) return;
  const next = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  return lines.slice(start + 1, next === -1 ? lines.length : next).join("\n");
}

function outputJson(value) {
  return JSON.stringify(value, (key, field) =>
    typeof field === "string"
      ? field.slice(
          0,
          key === "path" || key === "reason" ? MAX_OUTPUT_PATH_LENGTH : MAX_OUTPUT_FIELD_LENGTH,
        )
      : field,
  );
}

async function parsePitch(inputPath, textOverride) {
  const path = resolve(inputPath);
  let text;
  try {
    text = textOverride ?? (await readFile(path, "utf8"));
  } catch (error) {
    fail(
      path,
      error instanceof Error && "code" in error
        ? `cannot read pitch: ${error.code}`
        : "cannot read pitch",
    );
  }

  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!match) fail(path, "pitch must contain canonical frontmatter");

  const values = new Map();
  for (const [index, line] of match[1].split("\n").entries()) {
    const lineNumber = index + 2;
    const field = /^([a-z_]+): (.*)$/.exec(line);
    if (!field) fail(path, `invalid frontmatter at line ${lineNumber}`);
    const [, name, value] = field;
    if (!FRONTMATTER_FIELDS.has(name))
      fail(path, `unknown frontmatter field at line ${lineNumber}`);
    if (values.has(name)) fail(path, `duplicate frontmatter field at line ${lineNumber}`);
    values.set(name, value);
  }
  for (const field of FRONTMATTER_FIELDS) {
    if (!values.has(field)) fail(path, `missing frontmatter field: ${field}`);
  }
  if (values.get("schema") !== "feature-flow-pitch/v2")
    fail(path, "schema must be feature-flow-pitch/v2");

  const feature = values.get("feature");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(feature))
    fail(path, "feature must be a canonical kebab-case name");
  const featureRoot = resolve(path, "..", "..");
  const expectedPath = resolve(featureRoot, feature, "pitch.md");
  if (
    basename(featureRoot) !== "features" ||
    basename(resolve(featureRoot, "..")) !== "docs" ||
    path !== expectedPath
  ) {
    fail(path, `pitch path must be ${expectedPath}`);
  }

  const status = values.get("status");
  if (!STATUSES.has(status)) fail(path, "status must be draft, ready, or accepted");
  const revisionText = values.get("revision");
  const revision = Number(revisionText);
  if (!/^[1-9]\d*$/.test(revisionText) || !Number.isSafeInteger(revision)) {
    fail(path, "revision must be a positive integer");
  }

  for (const section of REQUIRED_SECTIONS) {
    if (sectionText(match[2], section) === undefined)
      fail(path, `missing required section: ${section}`);
  }
  const sections = [...match[2].matchAll(/^##(?: (.*))?$/gm)].map((section) => section[1] ?? "");
  const unexpected = sections.find((section) => !REQUIRED_SECTION_SET.has(section));
  if (unexpected !== undefined) fail(path, `unexpected section: ${unexpected || "<empty>"}`);
  const duplicate = sections.find((section, index) => sections.indexOf(section) !== index);
  if (duplicate) fail(path, `duplicate section: ${duplicate}`);
  if (sections.some((section, index) => section !== REQUIRED_SECTIONS[index]))
    fail(path, "pitch sections must follow canonical order");

  const acceptanceCriteria = sectionText(match[2], "Acceptance criteria");
  const acIds = [...new Set(acceptanceCriteria.match(/\bAC-\d{3}\b/g))];
  return { path, text, feature, status, revision, acIds };
}

async function parsePlan(inputPath, pitch, textOverride) {
  const path = resolve(inputPath);
  let text;
  try {
    text = textOverride ?? (await readFile(path, "utf8"));
  } catch (error) {
    fail(
      path,
      error instanceof Error && "code" in error
        ? `cannot read plan: ${error.code}`
        : "cannot read plan",
    );
  }

  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!match) fail(path, "plan must contain canonical frontmatter");

  const values = new Map();
  const lines = match[1].split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 2;
    const field =
      lines[index] === "dependencies:"
        ? [lines[index], "dependencies", ""]
        : /^([a-z_]+): (.*)$/.exec(lines[index]);
    if (!field) fail(path, `invalid frontmatter at line ${lineNumber}`);
    const [, name, value] = field;
    if (!PLAN_FRONTMATTER_FIELDS.has(name))
      fail(path, `unknown frontmatter field at line ${lineNumber}`);
    if (values.has(name)) fail(path, `duplicate frontmatter field at line ${lineNumber}`);

    if (name === "dependencies") {
      const dependencies = [];
      if (value === "") {
        while (index + 1 < lines.length) {
          const dependency = /^ {2}- ([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(lines[index + 1]);
          if (!dependency) break;
          dependencies.push(dependency[1]);
          index += 1;
        }
      } else if (value !== "[]") {
        fail(path, "dependencies must be [] or a canonical list");
      }
      values.set(name, dependencies);
    } else {
      values.set(name, value);
    }
  }
  for (const field of PLAN_FRONTMATTER_FIELDS) {
    if (!values.has(field)) fail(path, `missing frontmatter field: ${field}`);
  }
  if (values.get("schema") !== "feature-flow-plan/v1")
    fail(path, "schema must be feature-flow-plan/v1");
  if (values.get("feature") !== pitch.feature)
    fail(path, `feature must match pitch feature ${pitch.feature}`);

  const slice = values.get("slice");
  if (!/^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slice))
    fail(path, "slice must be NNN-canonical-kebab-case");
  const expectedFilename = `${slice}.md`;
  if (basename(path) !== expectedFilename) fail(path, `plan filename must be ${expectedFilename}`);

  const pitchRevisionText = values.get("pitch_revision");
  const pitchRevision = Number(pitchRevisionText);
  if (!/^[1-9]\d*$/.test(pitchRevisionText) || !Number.isSafeInteger(pitchRevision))
    fail(path, "pitch_revision must be a positive integer");
  if (pitchRevision !== pitch.revision)
    fail(path, `pitch_revision must match accepted pitch revision ${pitch.revision}`);

  const status = values.get("status");
  if (!PLAN_STATUSES.has(status)) fail(path, "status must be draft or reviewed");
  const revisionText = values.get("revision");
  const revision = Number(revisionText);
  if (!/^[1-9]\d*$/.test(revisionText) || !Number.isSafeInteger(revision))
    fail(path, "revision must be a positive integer");

  for (const section of REQUIRED_PLAN_SECTIONS) {
    if (sectionText(match[2], section) === undefined)
      fail(path, `missing required section: ${section}`);
  }

  const pitchTrace = sectionText(match[2], "Pitch trace to AC IDs");
  return {
    path,
    text,
    slice,
    dependencies: values.get("dependencies"),
    status,
    revision,
    acIds: [...new Set(pitchTrace.match(/\bAC-\d{3}\b/g))],
  };
}

async function parsePlanSet(pitch, inputPlansPath, textOverrides = new Map()) {
  const plansPath = resolve(inputPlansPath);
  const expectedPlansPath = resolve(pitch.path, "..", "plans");
  if (plansPath !== expectedPlansPath) fail(plansPath, `plans path must be ${expectedPlansPath}`);

  let entries;
  try {
    entries = await readdir(plansPath, { withFileTypes: true });
  } catch (error) {
    fail(
      plansPath,
      error instanceof Error && "code" in error
        ? `cannot read plans directory: ${error.code}`
        : "cannot read plans directory",
    );
  }
  const paths = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => resolve(plansPath, entry.name))
    .sort((left, right) => (left === right ? 0 : left < right ? -1 : 1));
  if (paths.length === 0) fail(plansPath, "plans directory contains no plans");

  const plans = [];
  for (const path of paths) plans.push(await parsePlan(path, pitch, textOverrides.get(path)));
  const slices = new Set();
  const sliceNumbers = new Set();
  const covered = new Set();
  const pitchAcIds = new Set(pitch.acIds);
  for (const [index, plan] of plans.entries()) {
    if (slices.has(plan.slice)) fail(plan.path, `duplicate plan slice: ${plan.slice}`);
    slices.add(plan.slice);
    const expectedNumber = String(index + 1).padStart(3, "0");
    const actualNumber = plan.slice.slice(0, 3);
    if (sliceNumbers.has(actualNumber))
      fail(plan.path, `duplicate plan slice number: ${actualNumber}`);
    sliceNumbers.add(actualNumber);
    if (index === 0 && actualNumber !== "001") fail(plan.path, "plan slices must start at 001");
    if (actualNumber !== expectedNumber)
      fail(plan.path, `missing plan slice number: ${expectedNumber}`);

    if (index === 0) {
      if (plan.dependencies.length !== 0) fail(plan.path, "first plan dependencies must be empty");
    } else {
      const predecessor = plans[index - 1].slice;
      if (plan.dependencies.length !== 1 || plan.dependencies[0] !== predecessor)
        fail(plan.path, `dependencies must contain only ${predecessor}`);
    }
    if (plan.acIds.length === 0) fail(plan.path, "plan must trace at least one pitch AC");
    for (const id of plan.acIds) {
      if (!pitchAcIds.has(id)) fail(plan.path, `plan references unknown pitch AC: ${id}`);
      covered.add(id);
    }
  }
  for (const id of pitchAcIds) {
    if (!covered.has(id)) fail(plans[0].path, `pitch AC is not covered by any plan: ${id}`);
  }
  const status = plans[0].status;
  const mixed = plans.find((plan) => plan.status !== status);
  if (mixed) fail(mixed.path, "all plans must have the same status");
  return { path: plansPath, status, plans };
}

function pitchResult(command, pitch) {
  return {
    ok: true,
    command,
    pitch: {
      path: pitch.path,
      feature: pitch.feature,
      status: pitch.status,
      revision: pitch.revision,
    },
  };
}

function planSetResult(command, pitch, planSet) {
  return {
    ...pitchResult(command, pitch),
    plans: {
      path: planSet.path,
      state: "valid",
      status: planSet.status,
      ready: planSet.status === "reviewed",
      count: planSet.plans.length,
      slices: planSet.plans.slice(0, MAX_REPORTED_PLANS).map((plan) => plan.slice),
      truncated: planSet.plans.length > MAX_REPORTED_PLANS,
    },
  };
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    fail(process.cwd(), `git ${args.join(" ")} failed`);
  }
}

function gitFacts() {
  const rawStatus = gitOutput(["status", "--short", "--untracked-files=all"]);
  const allLines = rawStatus
    .split("\n")
    .filter(Boolean)
    .sort((left, right) => (left === right ? 0 : left < right ? -1 : 1));
  const status = allLines.slice(0, MAX_GIT_LINES).map((line) => line.slice(0, MAX_GIT_LINE_LENGTH));
  const shortstat = gitOutput(["diff", "--shortstat", "HEAD"]);
  const files = Number(/(\d+) files? changed/.exec(shortstat)?.[1] ?? 0);
  const insertions = Number(/(\d+) insertions?\(\+\)/.exec(shortstat)?.[1] ?? 0);
  const deletions = Number(/(\d+) deletions?\(-\)/.exec(shortstat)?.[1] ?? 0);
  return {
    status,
    diff: { files, insertions, deletions },
    truncated:
      allLines.length > MAX_GIT_LINES || allLines.some((line) => line.length > MAX_GIT_LINE_LENGTH),
  };
}

async function validatePitch(args) {
  if (args.length !== 1) fail("<arguments>", "usage: validate-pitch <pitch-path>");
  return pitchResult("validate-pitch", await parsePitch(args[0]));
}

async function validatePlans(args) {
  if (args.length !== 2) fail("<arguments>", "usage: validate-plans <pitch-path> <plans-dir>");
  const pitch = await parsePitch(args[0]);
  if (pitch.status !== "accepted") fail(pitch.path, "pitch must be accepted");
  return planSetResult("validate-plans", pitch, await parsePlanSet(pitch, args[1]));
}

async function status(args) {
  if (args.length !== 2) fail("<arguments>", "usage: status <pitch-path> <plans-dir>");
  const path = resolve(args[0]);
  const plansPath = resolve(args[1]);
  const git = gitFacts();
  let pitch;
  try {
    pitch = await parsePitch(path);
  } catch (error) {
    if (!(error instanceof FlowError)) throw error;
    return {
      ok: true,
      command: "status",
      git,
      pitch:
        error.message === "cannot read pitch: ENOENT"
          ? { path, state: "missing" }
          : { path, state: "invalid", reason: error.message.slice(0, 500) },
      plans: { path: plansPath, state: "unavailable", ready: false },
    };
  }
  const expectedPlansPath = resolve(pitch.path, "..", "plans");
  if (plansPath !== expectedPlansPath) fail(plansPath, `plans path must be ${expectedPlansPath}`);
  const readiness = {
    path: pitch.path,
    state: "valid",
    feature: pitch.feature,
    status: pitch.status,
    revision: pitch.revision,
  };
  let plans;
  try {
    const planSet = await parsePlanSet(pitch, plansPath);
    plans = {
      path: planSet.path,
      state: "valid",
      status: planSet.status,
      ready: pitch.status === "accepted" && planSet.status === "reviewed",
      count: planSet.plans.length,
      slices: planSet.plans.slice(0, MAX_REPORTED_PLANS).map((plan) => plan.slice),
      truncated: planSet.plans.length > MAX_REPORTED_PLANS,
    };
  } catch (error) {
    if (!(error instanceof FlowError)) throw error;
    plans =
      error.message === "plans directory contains no plans" ||
      error.message === "cannot read plans directory: ENOENT"
        ? { path: plansPath, state: "missing", ready: false }
        : {
            path: plansPath,
            state: "invalid",
            ready: false,
            reason: error.message.slice(0, 500),
          };
  }
  return { ok: true, command: "status", git, pitch: readiness, plans };
}

async function transitionPitch(args) {
  if (args.length < 2 || args.length > 3) {
    fail("<arguments>", "usage: pitch <pitch-path> <draft|ready|accepted> [--revise]");
  }
  const [inputPath, target, option] = args;
  if (!STATUSES.has(target) || (option !== undefined && option !== "--revise")) {
    fail(inputPath, "usage: pitch <pitch-path> <draft|ready|accepted> [--revise]");
  }
  const pitch = await parsePitch(inputPath);
  const revise = option === "--revise";
  if (revise && target !== "draft")
    fail(pitch.path, "--revise is valid only when returning to draft");
  if (revise && pitch.status === "draft")
    fail(pitch.path, `illegal pitch transition: ${pitch.status} -> ${target}`);
  if (!revise && target === "draft") fail(pitch.path, "returning to draft requires --revise");
  if (
    !revise &&
    !(
      (pitch.status === "draft" && target === "ready") ||
      (pitch.status === "ready" && target === "accepted")
    )
  ) {
    fail(pitch.path, `illegal pitch transition: ${pitch.status} -> ${target}`);
  }

  const revision = pitch.revision + (revise ? 1 : 0);
  const nextText = pitch.text
    .replace(/^status: .*$/m, `status: ${target}`)
    .replace(/^revision: .*$/m, `revision: ${revision}`);
  const next = await parsePitch(pitch.path, nextText);
  try {
    await writeFile(pitch.path, nextText);
  } catch (error) {
    fail(
      pitch.path,
      error instanceof Error && "code" in error
        ? `cannot write pitch: ${error.code}`
        : "cannot write pitch",
    );
  }
  return pitchResult("pitch", next);
}

async function transitionPlans(args) {
  const usage = "usage: plans <pitch-path> <plans-dir> <draft|reviewed> [--revise <plan-path> ...]";
  if (args.length < 3) fail("<arguments>", usage);
  const [pitchPath, plansPath, target, ...options] = args;
  if (!PLAN_STATUSES.has(target)) fail(plansPath, usage);
  const pitch = await parsePitch(pitchPath);
  if (pitch.status !== "accepted") fail(pitch.path, "pitch must be accepted");
  const planSet = await parsePlanSet(pitch, plansPath);

  const revise = options[0] === "--revise";
  const revisedPaths = revise ? options.slice(1).map((path) => resolve(path)) : [];
  if (options.length > 0 && !revise) fail(options[0], usage);
  if (revise && revisedPaths.length === 0)
    fail("<arguments>", "--revise requires at least one plan path");
  if (revise && target !== "draft")
    fail(revisedPaths[0], "--revise is valid only when returning plans to draft");
  if (!revise && target === "draft")
    fail(planSet.path, "returning plans to draft requires --revise");
  if (planSet.status === "reviewed" && target === "reviewed")
    fail(planSet.path, "illegal plan transition: reviewed -> reviewed");

  const memberPaths = new Set(planSet.plans.map((plan) => plan.path));
  const revised = new Set();
  for (const path of revisedPaths) {
    if (!memberPaths.has(path)) fail(path, "revised plan is not in the complete plan set");
    if (revised.has(path)) fail(path, "revised plan path must be unique");
    revised.add(path);
  }

  const nextTexts = new Map();
  for (const plan of planSet.plans) {
    const revision = plan.revision + (revised.has(plan.path) ? 1 : 0);
    nextTexts.set(
      plan.path,
      plan.text
        .replace(/^status: .*$/m, `status: ${target}`)
        .replace(/^revision: .*$/m, `revision: ${revision}`),
    );
  }
  const next = await parsePlanSet(pitch, plansPath, nextTexts);
  const originals = new Map(planSet.plans.map((plan) => [plan.path, plan.text]));
  const written = [];
  for (const plan of next.plans) {
    try {
      await writeFile(plan.path, nextTexts.get(plan.path));
      written.push(plan.path);
    } catch (error) {
      const rollbackFailures = [];
      for (const previousPath of written.toReversed()) {
        try {
          await writeFile(previousPath, originals.get(previousPath));
        } catch {
          rollbackFailures.push(previousPath);
        }
      }
      const reason =
        error instanceof Error && "code" in error
          ? `cannot write plan: ${error.code}`
          : "cannot write plan";
      fail(
        plan.path,
        rollbackFailures.length === 0
          ? reason
          : `${reason}; cannot restore plans: ${rollbackFailures.join(", ")}`,
      );
    }
  }
  return planSetResult("plans", pitch, next);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  let result;
  switch (command) {
    case "validate-pitch":
      result = await validatePitch(args);
      break;
    case "validate-plans":
      result = await validatePlans(args);
      break;
    case "status":
      result = await status(args);
      break;
    case "pitch":
      result = await transitionPitch(args);
      break;
    case "plans":
      result = await transitionPlans(args);
      break;
    default:
      fail("<arguments>", `unknown command: ${command ?? "<missing>"}`);
  }
  process.stdout.write(`${outputJson(result)}\n`);
}

try {
  await main();
} catch (error) {
  const path = error instanceof FlowError ? error.path : "<internal>";
  const reason = error instanceof Error ? error.message : "unexpected failure";
  process.stderr.write(`${outputJson({ ok: false, errors: [{ path, reason }] })}\n`);
  process.exitCode = 1;
}
