const MAX_ARTIFACT_BYTES = 100_000;
const PITCH_SCHEMA = "dev-workflow/pitch-v1";
const RESEARCH_SCHEMA = "dev-workflow/research-v1";
const SLICE_SCHEMA = "dev-workflow/vertical-slice-v1";

export interface ArtifactValidation {
  readonly dependsOn?: readonly string[];
  readonly id: string;
  readonly valid: true;
}

interface ParsedDocument {
  readonly body: string;
  readonly frontmatter: ReadonlyMap<string, string>;
}

function parseFrontmatter(source: string): ReadonlyMap<string, string> {
  const frontmatter = new Map<string, string>();
  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    if (line === "") continue;
    const separator = line.indexOf(":");
    const key = separator === -1 ? "" : line.slice(0, separator).trim();
    const value = separator === -1 ? "" : line.slice(separator + 1).trim();
    if (!/^[a-z_]+$/u.test(key)) throw new Error(`Unsupported frontmatter line: ${line}`);
    if (frontmatter.has(key)) throw new Error(`Duplicate frontmatter key: ${key}`);
    frontmatter.set(key, value);
  }
  return frontmatter;
}

function parseDocument(source: string): ParsedDocument {
  if (source.length === 0 || source.length > MAX_ARTIFACT_BYTES) {
    throw new Error(`Artifact must contain 1-${String(MAX_ARTIFACT_BYTES)} characters.`);
  }
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/u.exec(source.replaceAll("\r\n", "\n"));
  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error("Artifact must begin with YAML frontmatter bounded by --- lines.");
  }
  const frontmatter = parseFrontmatter(match[1]);
  const mutable = ["status", "progress", "complete", "completed", "active"].find((key) =>
    frontmatter.has(key),
  );
  if (mutable !== undefined)
    throw new Error(`Mutable ${mutable} belongs in the workflow ledger, not frontmatter.`);
  if (/^\s*[-*]\s+\[[ x]\]/imu.test(match[2]))
    throw new Error("Mutable checklist status belongs in the workflow ledger, not artifacts.");
  if (/\{\{[^}]+\}\}/u.test(match[2]))
    throw new Error("Artifact still contains unresolved template guidance.");
  return { body: match[2], frontmatter };
}

function requiredHeading(body: string, heading: string): string {
  const pattern = new RegExp(`^#(?:#)?\\s+${heading.replaceAll("-", "[- ]")}\\s*$`, "imu");
  const match = pattern.exec(body);
  if (match === null) throw new Error(`Missing required ${heading} section.`);
  const start = match.index + match[0].length;
  const remainder = body.slice(start);
  const next = /^#{1,2}\s+/mu.exec(remainder);
  const content = remainder.slice(0, next === null ? remainder.length : next.index).trim();
  if (content.length < 3) throw new Error(`${heading} section must be substantive.`);
  return content;
}

function requiredSubheading(section: string, heading: string): string {
  const pattern = new RegExp(`^###\\s+${heading.replaceAll("-", "[- ]")}\\s*$`, "imu");
  const match = pattern.exec(section);
  if (match === null) throw new Error(`Missing required ${heading} subsection.`);
  const start = match.index + match[0].length;
  const remainder = section.slice(start);
  const next = /^#{1,3}\s+/mu.exec(remainder);
  const content = remainder.slice(0, next === null ? remainder.length : next.index).trim();
  if (content.length < 3) throw new Error(`${heading} subsection must be substantive.`);
  return content;
}

function exactKeys(frontmatter: ReadonlyMap<string, string>, allowed: readonly string[]): void {
  const unexpected = [...frontmatter.keys()].filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new Error(`Unsupported frontmatter keys: ${unexpected.join(", ")}.`);
  }
}

function validatePlanPreamble(normalized: string): void {
  if (normalized.length === 0 || normalized.length > MAX_ARTIFACT_BYTES)
    throw new Error(`Plan must contain 1-${String(MAX_ARTIFACT_BYTES)} characters.`);
  if (/\{\{[^}]+\}\}/u.test(normalized))
    throw new Error("Artifact still contains unresolved template guidance.");
  if (/^\s*[-*]\s+\[[ x]\]/imu.test(normalized))
    throw new Error("plan.md is an evolving slice map, not a mutable task checklist.");
  if (/^\s*(?:status|progress|complete|completed|active)\s*:/imu.test(normalized))
    throw new Error("Mutable status belongs in the workflow ledger, not plan.md.");
  if (/^#{1,6}\s+(?:Appetite|No[- ]Gos)\s*$/imu.test(normalized))
    throw new Error(
      "plan.md must link pitch boundaries instead of duplicating Appetite or No-Gos.",
    );
}

export function validatePlanDocument(source: string): ArtifactValidation {
  const normalized = source.replaceAll("\r\n", "\n");
  validatePlanPreamble(normalized);
  for (const heading of [
    "Vertical Slices",
    "Dependencies and Sequencing",
    "Simplification Review",
  ]) {
    requiredHeading(normalized, heading);
  }
  const simplification = requiredHeading(normalized, "Simplification Review");
  if (
    !/\b(?:reuse|existing|standard library|stdlib|native)\b/iu.test(simplification) ||
    !/\b(?:avoid|delete|remove|no|not)\b/iu.test(simplification)
  )
    throw new Error(
      "Simplification Review must name reused/native seams and complexity that will not be added or retained.",
    );
  if (!/\[[^\]]*PITCH-[^\]]*\]\([^)]*spec\.md\)/iu.test(normalized)) {
    throw new Error("plan.md must link its pitch spec.md.");
  }
  if (!/\bfirst\s+(?:integrated|demonstrable|vertical)\s+slice\b/iu.test(normalized)) {
    throw new Error("plan.md must identify the first integrated demonstrable slice.");
  }
  if (!/\bVS-\d{3,}\b[\s\S]+(?:depend|sequence|first|after|before)/iu.test(normalized)) {
    throw new Error("plan.md must encode slice dependencies and sequencing.");
  }
  if (
    /^#{1,6}\s+(?:backend|frontend|models?|apis?|ui|tests?)(?:\s|$)/imu.test(normalized) ||
    /\b(?:backend|frontend|models?|apis?|ui|tests?)\s+(?:first|phase|layer)\b/iu.test(normalized)
  ) {
    throw new Error("plan.md contains horizontal phases; plan integrated vertical slices instead.");
  }
  if (/\b(?:exhaustive|complete)\s+(?:task|work)\s+(?:list|breakdown)\b/iu.test(normalized)) {
    throw new Error(
      "plan.md must evolve with discovered work, not freeze an exhaustive task plan.",
    );
  }
  return { id: "plan", valid: true };
}

function routeCount(section: string): number {
  const routes = section.match(/\b(?:adopt|extend|compose|build|retain|reuse)\w*\b/giu) ?? [];
  return new Set(routes.map((route) => route.toLowerCase())).size;
}

function validatePriorArt(priorArt: string): void {
  const dispositions = priorArt.match(/\b(?:completed|not[- ]applicable|unavailable)\b/giu) ?? [];
  const [rawDisposition] = dispositions;
  if (dispositions.length !== 1 || rawDisposition === undefined)
    throw new Error(
      "External Prior Art must state exactly one of completed, not-applicable, or unavailable.",
    );
  const disposition = rawDisposition.toLowerCase().replace(" ", "-");
  if (disposition === "completed") {
    if (!/https?:\/\/\S+/iu.test(priorArt) || /example\.invalid/iu.test(priorArt))
      throw new Error("Completed External Prior Art must cite at least one real source URL.");
    if (!/\b(?:implication|therefore|changed|confirmed|supports?)\b/iu.test(priorArt))
      throw new Error("Completed External Prior Art must state its pitch implication.");
    return;
  }
  if (disposition === "not-applicable") {
    if (!/\b(?:rationale|because)\b/iu.test(priorArt) || priorArt.length < 40)
      throw new Error("Not-applicable External Prior Art must give a substantive rationale.");
    return;
  }
  if (
    !/\b(?:attempted|searched|tried)\b/iu.test(priorArt) ||
    !/\b(?:limitation|unavailable|failed|blocked)\b/iu.test(priorArt) ||
    !/\b(?:uncertainty|risk|unknown)\b/iu.test(priorArt)
  )
    throw new Error(
      "Unavailable External Prior Art must record the attempt, limitation, and resulting uncertainty.",
    );
}

function validateResearchDecisions(body: string): void {
  if (routeCount(requiredHeading(body, "Options Considered")) < 2)
    throw new Error("Options Considered must compare at least two viable routes.");
  const simplicity = requiredHeading(body, "Simplicity Check");
  if (
    !/\b(?:reuse|existing|standard library|stdlib|native)\b/iu.test(simplicity) ||
    !/\b(?:dependency|abstraction|configuration|configurability|files?)\b/iu.test(simplicity)
  )
    throw new Error(
      "Simplicity Check must evaluate reuse/native capability and unnecessary dependencies or abstractions.",
    );
  const recommendation = requiredHeading(body, "Recommendation");
  const recommendations =
    recommendation.match(/\b(?:adopt|extend|compose|build|retain)\b/giu) ?? [];
  if (recommendations.length !== 1)
    throw new Error(
      "Recommendation must choose exactly one of adopt, extend, compose, build, or retain.",
    );
}

export function validateResearchDocument(source: string): ArtifactValidation {
  const { body, frontmatter } = parseDocument(source);
  exactKeys(frontmatter, ["schema", "id"]);
  if (frontmatter.get("schema") !== RESEARCH_SCHEMA)
    throw new Error(`schema must be ${RESEARCH_SCHEMA}.`);
  const id = frontmatter.get("id");
  if (id === undefined || !/^RESEARCH-\d{3,}$/u.test(id))
    throw new Error("Research id must match RESEARCH-NNN.");
  for (const heading of [
    "Repository Evidence",
    "External Prior Art",
    "Options Considered",
    "Recommendation",
    "Pitch Implications",
    "Simplicity Check",
    "Unknowns",
  ])
    requiredHeading(body, heading);
  validatePriorArt(requiredHeading(body, "External Prior Art"));
  validateResearchDecisions(body);
  return { id, valid: true };
}

export function validatePitchDocument(source: string): ArtifactValidation {
  const { body, frontmatter } = parseDocument(source);
  exactKeys(frontmatter, ["schema", "id"]);
  if (frontmatter.get("schema") !== PITCH_SCHEMA)
    throw new Error(`schema must be ${PITCH_SCHEMA}.`);
  const id = frontmatter.get("id");
  if (id === undefined || !/^PITCH-\d{3,}$/u.test(id))
    throw new Error("Pitch id must match PITCH-NNN.");
  const problem = requiredHeading(body, "Problem");
  const researchBasis = requiredSubheading(problem, "Research Basis");
  if (!/\[[^\]]*RESEARCH-[^\]]*\]\([^)]*research\.md\)/iu.test(researchBasis))
    throw new Error("Research Basis must link the validated research.md artifact.");
  requiredSubheading(problem, "Prior Art");
  const alternatives = requiredSubheading(problem, "Alternatives");
  if (routeCount(alternatives) < 2)
    throw new Error("Alternatives must compare at least two routes and explain the selection.");
  const understanding = requiredSubheading(problem, "Shared Understanding");
  if (
    !/\b(?:agreed|fixed|user decision)\b/iu.test(understanding) ||
    !/\b(?:agent discretion|implementation choice)\b/iu.test(understanding)
  )
    throw new Error(
      "Shared Understanding must separate agreed fixed decisions from agent discretion.",
    );
  const appetite = requiredHeading(body, "Appetite");
  requiredSubheading(appetite, "Why This Is Worth the Investment");
  requiredSubheading(appetite, "Agent Investment");
  requiredSubheading(appetite, "Scope Control");
  requiredSubheading(appetite, "Fixed Floors");
  const solution = requiredHeading(body, "Solution");
  const simplicityCase = requiredSubheading(solution, "Simplicity Case");
  if (
    !/\b(?:reuse|existing|standard library|stdlib|native)\b/iu.test(simplicityCase) ||
    !/\b(?:avoid|no|not|remove|delete)\b/iu.test(simplicityCase)
  )
    throw new Error("Simplicity Case must name reused seams and rejected accidental complexity.");
  requiredSubheading(solution, "Agent Discretion");
  requiredSubheading(solution, "Acceptance Signals");
  requiredHeading(body, "Rabbit Holes");
  requiredHeading(body, "No-Gos");
  return { id, valid: true };
}

function parseSliceIdentity(frontmatter: ReadonlyMap<string, string>): {
  readonly dependencies: readonly string[];
  readonly id: string;
} {
  exactKeys(frontmatter, ["schema", "id", "depends_on", "requirements", "risk"]);
  if (frontmatter.get("schema") !== SLICE_SCHEMA)
    throw new Error(`schema must be ${SLICE_SCHEMA}.`);
  const id = frontmatter.get("id");
  if (id === undefined || !/^VS-\d{3,}$/u.test(id)) throw new Error("Slice id must match VS-NNN.");
  const dependsOn = frontmatter.get("depends_on");
  if (
    dependsOn === undefined ||
    !/^\[(?:\s*VS-\d{3,}(?:\s*,\s*VS-\d{3,})*\s*)?\]$/u.test(dependsOn)
  )
    throw new Error("depends_on must be an array of VS-NNN ids.");
  const requirements = frontmatter.get("requirements");
  if (
    requirements === undefined ||
    !/^\[\s*REQ-\d{3,}(?:\s*,\s*REQ-\d{3,})*\s*\]$/u.test(requirements)
  )
    throw new Error("requirements must be a nonempty array of REQ-NNN ids.");
  if (!["low", "medium", "high"].includes(frontmatter.get("risk") ?? ""))
    throw new Error("risk must be low, medium, or high.");
  const dependencies = dependsOn
    .slice(1, -1)
    .split(",")
    .map((dependency) => dependency.trim())
    .filter(Boolean);
  if (new Set(dependencies).size !== dependencies.length)
    throw new Error("depends_on must not contain duplicate slice ids.");
  if (dependencies.includes(id)) throw new Error("A slice must not depend on itself.");
  return { dependencies, id };
}

function validateExecutionProfile(body: string): void {
  const profile = requiredHeading(body, "Execution Profile");
  if (!/\b(?:terra|sol)\b/iu.test(requiredSubheading(profile, "Worker Model")))
    throw new Error("Worker Model must select Terra or the explicitly revalidated Sol fallback.");
  if (!/\b(?:low|medium|high)\b/iu.test(requiredSubheading(profile, "Worker Effort")))
    throw new Error("Worker Effort must select low, medium, or high.");
  requiredSubheading(profile, "Rationale");
  if (!/\bterra\s+high\b/iu.test(requiredSubheading(profile, "Escalation")))
    throw new Error("Escalation must name Terra high for difficult bounded implementation.");
  if (!/\bsol\b/iu.test(requiredSubheading(profile, "Conceptual Replanning")))
    throw new Error("Conceptual Replanning must return to Sol planning.");
  const frontierFallback = requiredSubheading(profile, "Frontier Fallback");
  if (!/\bsol\s+medium\b/iu.test(frontierFallback))
    throw new Error("Frontier Fallback must be Sol medium after replanning.");
  if (/terra\s+(?:low|medium|high)/iu.test(frontierFallback))
    throw new Error(
      "Frontier Fallback must use Sol medium after conceptual replanning, not Terra.",
    );
  if (!/\bsol\s+high\b/iu.test(requiredSubheading(profile, "Reviewer")))
    throw new Error("Reviewer must select a fresh Sol high reviewer.");
  if (/terra\s+xhigh/iu.test(profile))
    throw new Error("Execution Profile must not use Terra xhigh.");
}

function validateSliceSimplicity(body: string): void {
  const simplification = requiredHeading(body, "Simplification Pass");
  if (
    !/\b(?:reuse|existing|standard library|stdlib|native|delete|remove)\b/iu.test(simplification) ||
    !/\b(?:abstraction|dependency|configuration|configurability|files?|code)\b/iu.test(
      simplification,
    )
  )
    throw new Error(
      "Simplification Pass must name reuse or deletion and the speculative complexity to avoid.",
    );
}

export function validateSliceDocument(source: string): ArtifactValidation {
  const { body, frontmatter } = parseDocument(source);
  const { dependencies, id } = parseSliceIdentity(frontmatter);
  const outcome = requiredHeading(body, "Observable Outcome");
  requiredHeading(body, "Pitch Fit");
  const boundaries = requiredHeading(body, "Boundaries Crossed");
  validateExecutionProfile(body);
  validateSliceSimplicity(body);
  for (const heading of ["RED", "GREEN", "Verification", "Done When"])
    requiredHeading(body, heading);
  if (!/[\n,]|\band\b/iu.test(boundaries))
    throw new Error(
      "Boundaries Crossed must identify the integrated boundaries needed by the outcome.",
    );
  if (/^(?:all|every)\s+(?:models?|apis?|backends?|frontends?|tests?|ui)\b/imu.test(outcome))
    throw new Error("Slice outcome is horizontal; describe independently demonstrable behavior.");
  return { dependsOn: dependencies, id, valid: true };
}
