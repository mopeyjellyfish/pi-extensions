import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = join(import.meta.dirname, "..");
const PITCH_SKILL_PATH = join(PACKAGE_ROOT, "skills", "feature-pitch", "SKILL.md");
const PLAN_SKILL_PATH = join(PACKAGE_ROOT, "skills", "feature-plan", "SKILL.md");
const BUILD_SKILL_PATH = join(PACKAGE_ROOT, "skills", "feature-build", "SKILL.md");
const BUILD_CONTRACT_PATH = join(
  PACKAGE_ROOT,
  "skills",
  "feature-build",
  "references",
  "build-contract.md",
);

function normalizeWhitespace(text: string) {
  return text.replaceAll(/\s+/g, " ");
}

describe("feature-pitch skill contract", () => {
  it("keeps mechanical pitch facts in the package-relative helper", async () => {
    expect.hasAssertions();
    const skill = await readFile(PITCH_SKILL_PATH, "utf8");

    expect(skill).toContain("name: feature-pitch");
    expect(skill).toContain("../../scripts/feature-flow.mjs status");
    expect(skill).toContain("../../scripts/feature-flow.mjs validate-pitch");
    expect(skill).toContain("../../scripts/feature-flow.mjs pitch");
    expect(skill).toContain("Do not reparse");
    expect(skill).toContain("exact helper errors");
    expect(skill).not.toContain("feature-plan");
    expect(skill).not.toContain("feature-build");
  });

  it("retains research, decisions, quality, and complete-pitch acceptance in reasoning", async () => {
    expect.hasAssertions();
    const skill = await readFile(PITCH_SKILL_PATH, "utf8");

    expect(skill).toContain("repository evidence");
    expect(skill).toContain("external research");
    expect(skill).toContain("pitch-level decision");
    expect(skill).toContain("blocker-free");
    expect(skill).toContain("helper success is not review or acceptance");
    expect(skill).toContain("entire ready pitch");
    expect(skill).toContain("Approve pitch");
    expect(skill).toContain("only after that choice");
    expect(skill).toContain("draft --revise");
    expect(skill).toContain("repeat complete review and human acceptance");
  });

  it("requires capability preflight and fresh serial terminal delegation", async () => {
    expect.hasAssertions();
    const skill = await readFile(PITCH_SKILL_PATH, "utf8");

    expect(skill).toContain("subagent");
    expect(skill).toContain("subagent_wait");
    expect(skill).toContain("question");
    expect(skill).toContain("builtin `worker`");
    expect(skill).toContain("builtin `reviewer`");
    expect(skill).toContain('"async": true');
    expect(skill).toContain('"progress": false');
    expect(skill).toContain('"concurrency": 1');
    expect(skill).toContain("exactly one item");
    expect(skill).toContain("explicit routed `cwd`");
    expect(skill).toContain("same run ID");
    expect(skill).toContain("observed process termination");
    expect(skill).toContain("one writer");
    expect(skill).toContain("Parent asks every question");
  });

  it("forbids implementation and unauthorized source-control actions", async () => {
    expect.hasAssertions();
    const skill = await readFile(PITCH_SKILL_PATH, "utf8");

    expect(skill).toContain("Do not implement");
    expect(skill).toContain("Do not stage, commit, push, merge, or open a pull request");
    expect(skill).toContain("unless already authorized");
  });
});

describe("feature-plan skill contract", () => {
  it("orders deterministic gates around complete-set reasoning", async () => {
    expect.hasAssertions();
    const skill = await readFile(PLAN_SKILL_PATH, "utf8");
    const status = skill.indexOf("../../scripts/feature-flow.mjs status");
    const pitch = skill.indexOf("../../scripts/feature-flow.mjs validate-pitch");
    const writer = skill.indexOf("fresh plan writer");
    const plans = skill.indexOf("../../scripts/feature-flow.mjs validate-plans");
    const reviewer = skill.indexOf("fresh read-only whole-set reviewer");
    const reviewed = skill.indexOf(
      "../../scripts/feature-flow.mjs plans <pitch-path> <plans-dir> reviewed",
    );

    expect(skill).toContain("name: feature-plan");
    expect(status).toBeGreaterThan(-1);
    expect(pitch).toBeGreaterThan(status);
    expect(writer).toBeGreaterThan(pitch);
    expect(plans).toBeGreaterThan(writer);
    expect(reviewer).toBeGreaterThan(plans);
    expect(reviewed).toBeGreaterThan(reviewer);
    expect(skill).toContain("accepted pitch");
    expect(skill).toContain("exact helper errors");
    expect(skill).toContain("helper success is not review");
  });

  it("keeps vertical TDD plan quality and pitch-level classification in reasoning", async () => {
    expect.hasAssertions();
    const skill = await readFile(PLAN_SKILL_PATH, "utf8");

    expect(skill).toContain("complete set");
    expect(skill).toContain("end-to-end vertical outcomes");
    expect(skill).toContain("scope");
    expect(skill).toContain("feasibility");
    expect(skill).toContain("TDD Red, smallest Green, and bounded Refactor");
    expect(skill).toContain("risks");
    expect(skill).toContain("pitch-level");
    expect(skill).toContain("Do not reparse");
  });

  it("uses fresh serial complete-lifecycle delegation for writers and reviewers", async () => {
    expect.hasAssertions();
    const skill = await readFile(PLAN_SKILL_PATH, "utf8");

    expect(skill).toContain("subagent");
    expect(skill).toContain("subagent_wait");
    expect(skill).toContain("question");
    expect(skill).toContain("builtin `worker`");
    expect(skill).toContain("builtin `reviewer`");
    expect(skill).toContain('"async": true');
    expect(skill).toContain('"progress": false');
    expect(skill).toContain('"concurrency": 1');
    expect(skill).toMatch(/exactly\s+one item/);
    expect(skill).toContain("explicit routed `cwd`");
    expect(skill).toContain("same run ID");
    expect(skill).toContain("observed process termination");
    expect(skill).toContain("one writer");
    expect(skill).toContain("fresh serial fix worker");
  });

  it("requires explicit revise/re-review and forbids plan gates or implementation", async () => {
    expect.hasAssertions();
    const skill = await readFile(PLAN_SKILL_PATH, "utf8");

    expect(skill).toContain("draft --revise <changed-plan-path> ...");
    expect(skill).toContain("only changed plans");
    expect(skill).toContain("rerun deterministic validation");
    expect(skill).toContain("another fresh whole-set review");
    expect(skill).toContain("blocker-free");
    expect(skill).not.toContain("Approve plan");
    expect(skill).toContain("Never ask a plan question");
    expect(skill).toContain("Do not implement");
    expect(skill).toContain("Do not create a receipt");
  });

  it("stops only for pitch-level decisions and handles changed versus unchanged pitch", async () => {
    expect.hasAssertions();
    const skill = await readFile(PLAN_SKILL_PATH, "utf8");

    expect(skill).toContain("new pitch-level decision");
    expect(skill).toContain("pitch <pitch-path> draft --revise");
    expect(skill).toContain("repeat complete pitch review and human acceptance");
    expect(skill).toContain("regenerate the complete plan set");
    expect(skill).toContain("accepted pitch is unchanged");
    expect(skill).toMatch(/bounded\s+parent evidence/);
  });
});

describe("feature-build skill contract", () => {
  it("gates build side effects before and after Worktrunk routing", async () => {
    expect.hasAssertions();
    const skill = normalizeWhitespace(await readFile(BUILD_SKILL_PATH, "utf8"));
    const capabilities = skill.indexOf("Preflight every required capability");
    const initialStatus = skill.indexOf("../../scripts/feature-flow.mjs status");
    const initialPlans = skill.indexOf("../../scripts/feature-flow.mjs validate-plans");
    const worktrunk = skill.indexOf("Create or activate the authorized Worktrunk route");
    const cwdProof = skill.indexOf("Verify `pwd` and the Git top-level");
    const routedStatus = skill.indexOf("../../scripts/feature-flow.mjs status", initialStatus + 1);
    const routedPlans = skill.indexOf(
      "../../scripts/feature-flow.mjs validate-plans",
      initialPlans + 1,
    );
    const todo = skill.indexOf("Project the reviewed slice order into `todo`");
    const reasoning = skill.indexOf("Classify current-code assumptions");
    const writer = skill.indexOf("fresh implementation worker");

    expect(skill).toContain("name: feature-build");
    expect(capabilities).toBeGreaterThan(-1);
    expect(initialStatus).toBeGreaterThan(capabilities);
    expect(initialPlans).toBeGreaterThan(initialStatus);
    expect(worktrunk).toBeGreaterThan(initialPlans);
    expect(cwdProof).toBeGreaterThan(worktrunk);
    expect(routedStatus).toBeGreaterThan(cwdProof);
    expect(routedPlans).toBeGreaterThan(routedStatus);
    expect(todo).toBeGreaterThan(routedPlans);
    expect(reasoning).toBeGreaterThan(routedPlans);
    expect(writer).toBeGreaterThan(reasoning);
  });

  it("fails closed without model-derived readiness or mutation", async () => {
    expect.hasAssertions();
    const contract = normalizeWhitespace(await readFile(BUILD_CONTRACT_PATH, "utf8"));

    expect(contract).toContain("exact helper path and reason");
    expect(contract).toContain("Do not reparse");
    expect(contract).toContain("model-derived substitute");
    expect(contract).toContain("no Worktrunk, todo, writer, or artifact mutation");
    expect(contract).toContain("routed working directory");
  });

  it("keeps semantic classification and TDD evidence in parent reasoning", async () => {
    expect.hasAssertions();
    const skill = normalizeWhitespace(await readFile(BUILD_SKILL_PATH, "utf8"));
    const contract = normalizeWhitespace(await readFile(BUILD_CONTRACT_PATH, "utf8"));
    const text = `${skill} ${contract}`;

    expect(text).toContain("unrelated Git changes");
    expect(text).toContain("invalid code assumptions");
    expect(text).toContain("LSP applicability");
    expect(text).toContain("implementation choices");
    expect(text).toContain("review blockers");
    expect(text).toContain("pitch-level findings");
    expect(text).toContain("observable Red before production edits");
    expect(text).toContain("smallest Green");
    expect(text).toContain("bounded Refactor");
    expect(text).toContain("Red, Green, Refactor, diagnostics, focused-test, and diff evidence");
  });

  it("uses fresh one-item serial runs and deterministic terminal barriers", async () => {
    expect.hasAssertions();
    const contract = normalizeWhitespace(await readFile(BUILD_CONTRACT_PATH, "utf8"));

    expect(contract).toContain("fresh async top-level `tasks` group with exactly one item");
    expect(contract).toContain('"async": true');
    expect(contract).toContain('"progress": false');
    expect(contract).toContain('"concurrency": 1');
    expect(contract).toContain('"context": "fresh"');
    expect(contract).toContain("explicit routed `cwd`");
    expect(contract).toContain("recorded run ID");
    expect(contract).toContain("same-run wait");
    expect(contract).toContain("exactly one status check");
    expect(contract).toContain("observed process termination");
    expect(contract).toContain("Never poll");
    expect(contract).toContain(
      "timeout, abort, missing, active, unknown, unobserved, or unresolved attention",
    );
    expect(contract).toContain("same run");
    expect(contract).toContain("at most one indexed steer");
    expect(contract).toContain("soft-interrupt");
    expect(contract).toContain("explicit resume, stop, or replacement choice");
    expect(contract).toContain("Never overlap writers");
    expect(contract).toContain("Never automatically resume");
  });

  it("serializes slice review, routine fixes, and todo closure", async () => {
    expect.hasAssertions();
    const skill = normalizeWhitespace(await readFile(BUILD_SKILL_PATH, "utf8"));
    const worker = skill.indexOf("fresh implementation worker");
    const reviewer = skill.indexOf("fresh adversarial reviewer");
    const fix = skill.indexOf("fresh serial fix worker");
    const rereview = skill.indexOf("another fresh adversarial review");
    const close = skill.indexOf("Close the todo item");
    const next = skill.indexOf("advance to the next dependency-ready slice");

    expect(skill).toContain("at most one `in_progress` item");
    expect(worker).toBeGreaterThan(-1);
    expect(reviewer).toBeGreaterThan(worker);
    expect(fix).toBeGreaterThan(reviewer);
    expect(rereview).toBeGreaterThan(fix);
    expect(close).toBeGreaterThan(rereview);
    expect(next).toBeGreaterThan(close);
  });

  it("escalates only pitch-level findings and revises plans semantically", async () => {
    expect.hasAssertions();
    const skill = normalizeWhitespace(await readFile(BUILD_SKILL_PATH, "utf8"));

    expect(skill).toContain("plan-semantic finding");
    expect(skill).toContain("plans <pitch-path> <plans-dir> draft --revise");
    expect(skill).toContain("automated whole-set review");
    expect(skill).toContain("new pitch-level decision");
    expect(skill).toContain("pitch <pitch-path> draft --revise");
    expect(skill).toContain("repeat complete pitch review and human acceptance");
    expect(skill).toContain("regenerate the complete plan set");
    expect(skill).toContain("accepted pitch is unchanged");
    expect(skill).toContain("bounded parent evidence");
  });

  it("orders final dogfood, checks, evidence, and authorized source control", async () => {
    expect.hasAssertions();
    const skill = normalizeWhitespace(await readFile(BUILD_SKILL_PATH, "utf8"));
    const allSlices = skill.indexOf("After every slice is blocker-free");
    const pi = skill.indexOf("deterministic Pi", allSlices);
    const discovery = skill.indexOf("Confirm all three skills appear exactly once", pi);
    const focused = skill.indexOf("Run the focused test", discovery);
    const reload = skill.indexOf("idle `/reload`", focused);
    const exercise = skill.indexOf("Exercise the changed skill", reload);
    const smoke = skill.indexOf("npm run smoke:source", exercise);
    const packages = skill.indexOf("npm run packages:check", smoke);
    const check = skill.indexOf("npm run check", packages);
    const security = skill.indexOf("npm run security:check", check);
    const evidence = skill.indexOf("bounded AC-by-AC evidence", security);
    const sourceControl = skill.indexOf("pre-authorized source-control action", evidence);

    expect(pi).toBeGreaterThan(allSlices);
    expect(discovery).toBeGreaterThan(pi);
    expect(focused).toBeGreaterThan(discovery);
    expect(reload).toBeGreaterThan(focused);
    expect(exercise).toBeGreaterThan(reload);
    expect(smoke).toBeGreaterThan(exercise);
    expect(packages).toBeGreaterThan(smoke);
    expect(check).toBeGreaterThan(packages);
    expect(security).toBeGreaterThan(check);
    expect(evidence).toBeGreaterThan(security);
    expect(sourceControl).toBeGreaterThan(evidence);
    expect(skill).toContain("uncommitted reviewed ready diff");
  });

  it("forbids widened state, transcripts, destructive cleanup, and unauthorized actions", async () => {
    expect.hasAssertions();
    const contract = normalizeWhitespace(await readFile(BUILD_CONTRACT_PATH, "utf8"));

    expect(contract).toContain("Do not mutate reviewed plans with progress or evidence");
    expect(contract).toContain("human plan or final-feature acceptance gate");
    expect(contract).toContain("full transcripts");
    expect(contract).toContain("credentials or provider output");
    expect(contract).toContain("destructive cleanup");
    expect(contract).toContain("unauthorized source-control action");
    expect(contract).toContain(
      "helper command, state artifact, hash, receipt, scheduler, or workflow engine",
    );
  });
});
