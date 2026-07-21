const MAX_ARTIFACT_BYTES = 100_000;
const PITCH_SCHEMA = "dev-workflow/pitch-v1";
const SLICE_SCHEMA = "dev-workflow/vertical-slice-v1";

export interface ArtifactValidation {
  readonly id: string;
  readonly valid: true;
}

interface ParsedDocument {
  readonly body: string;
  readonly frontmatter: ReadonlyMap<string, string>;
}

function parseDocument(source: string): ParsedDocument {
  if (source.length === 0 || source.length > MAX_ARTIFACT_BYTES) {
    throw new Error(`Artifact must contain 1-${String(MAX_ARTIFACT_BYTES)} characters.`);
  }
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/u.exec(source.replaceAll("\r\n", "\n"));
  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error("Artifact must begin with YAML frontmatter bounded by --- lines.");
  }
  const frontmatter = new Map<string, string>();
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim();
    if (line === "") continue;
    const separator = line.indexOf(":");
    const key = separator === -1 ? "" : line.slice(0, separator).trim();
    const value = separator === -1 ? "" : line.slice(separator + 1).trim();
    if (!/^[a-z_]+$/u.test(key)) throw new Error(`Unsupported frontmatter line: ${line}`);
    if (frontmatter.has(key)) throw new Error(`Duplicate frontmatter key: ${key}`);
    frontmatter.set(key, value);
  }
  for (const mutable of ["status", "progress", "complete", "completed", "active"]) {
    if (frontmatter.has(mutable)) {
      throw new Error(`Mutable ${mutable} belongs in the workflow ledger, not frontmatter.`);
    }
  }
  if (/^\s*[-*]\s+\[[ x]\]/imu.test(match[2])) {
    throw new Error("Mutable checklist status belongs in the workflow ledger, not artifacts.");
  }
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

function exactKeys(frontmatter: ReadonlyMap<string, string>, allowed: readonly string[]): void {
  const unexpected = [...frontmatter.keys()].filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new Error(`Unsupported frontmatter keys: ${unexpected.join(", ")}.`);
  }
}

export function validatePlanDocument(source: string): ArtifactValidation {
  const normalized = source.replaceAll("\r\n", "\n");
  if (normalized.length === 0 || normalized.length > MAX_ARTIFACT_BYTES) {
    throw new Error(`Plan must contain 1-${String(MAX_ARTIFACT_BYTES)} characters.`);
  }
  if (/^\s*[-*]\s+\[[ x]\]/imu.test(normalized)) {
    throw new Error("plan.md is an evolving slice map, not a mutable task checklist.");
  }
  if (/^\s*(?:status|progress|complete|completed|active)\s*:/imu.test(normalized)) {
    throw new Error("Mutable status belongs in the workflow ledger, not plan.md.");
  }
  for (const heading of ["Appetite", "No-Gos", "Vertical Slices", "Dependencies and Sequencing"]) {
    requiredHeading(normalized, heading);
  }
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

export function validatePitchDocument(source: string): ArtifactValidation {
  const { body, frontmatter } = parseDocument(source);
  exactKeys(frontmatter, ["schema", "id"]);
  if (frontmatter.get("schema") !== PITCH_SCHEMA)
    throw new Error(`schema must be ${PITCH_SCHEMA}.`);
  const id = frontmatter.get("id");
  if (id === undefined || !/^PITCH-\d{3,}$/u.test(id))
    throw new Error("Pitch id must match PITCH-NNN.");
  requiredHeading(body, "Problem");
  requiredHeading(body, "Appetite");
  const solution = requiredHeading(body, "Solution");
  if (!/^###\s+Acceptance Signals\s*$/imu.test(solution)) {
    throw new Error("Solution must contain an Acceptance Signals subsection.");
  }
  requiredHeading(body, "Rabbit Holes");
  requiredHeading(body, "No-Gos");
  return { id, valid: true };
}

export function validateSliceDocument(source: string): ArtifactValidation {
  const { body, frontmatter } = parseDocument(source);
  exactKeys(frontmatter, ["schema", "id", "depends_on", "requirements", "risk"]);
  if (frontmatter.get("schema") !== SLICE_SCHEMA)
    throw new Error(`schema must be ${SLICE_SCHEMA}.`);
  const id = frontmatter.get("id");
  if (id === undefined || !/^VS-\d{3,}$/u.test(id)) throw new Error("Slice id must match VS-NNN.");
  const dependsOn = frontmatter.get("depends_on");
  if (
    dependsOn === undefined ||
    !/^\[(?:\s*VS-\d{3,}(?:\s*,\s*VS-\d{3,})*\s*)?\]$/u.test(dependsOn)
  ) {
    throw new Error("depends_on must be an array of VS-NNN ids.");
  }
  const requirements = frontmatter.get("requirements");
  if (
    requirements === undefined ||
    !/^\[\s*REQ-\d{3,}(?:\s*,\s*REQ-\d{3,})*\s*\]$/u.test(requirements)
  ) {
    throw new Error("requirements must be a nonempty array of REQ-NNN ids.");
  }
  if (!["low", "medium", "high"].includes(frontmatter.get("risk") ?? "")) {
    throw new Error("risk must be low, medium, or high.");
  }
  const outcome = requiredHeading(body, "Observable Outcome");
  requiredHeading(body, "Pitch Fit");
  const boundaries = requiredHeading(body, "Boundaries Crossed");
  requiredHeading(body, "RED");
  requiredHeading(body, "GREEN");
  requiredHeading(body, "Verification");
  requiredHeading(body, "Done When");
  if (!/[\n,]|\band\b/iu.test(boundaries)) {
    throw new Error(
      "Boundaries Crossed must identify the integrated boundaries needed by the outcome.",
    );
  }
  if (/^(?:all|every)\s+(?:models?|apis?|backends?|frontends?|tests?|ui)\b/imu.test(outcome)) {
    throw new Error("Slice outcome is horizontal; describe independently demonstrable behavior.");
  }
  return { id, valid: true };
}
