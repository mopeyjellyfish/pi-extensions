import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describeFailure, npmInvocation, runCommand } from "./lib/process.ts";
import { repositoryRoot } from "./lib/repository.ts";

const ADVISORY_RANGE = ">=4.0.0 <5.0.8";
const ADVISORY_SOURCE = 1_130_591;
const ADVISORY_URL = "https://github.com/advisories/GHSA-mh99-v99m-4gvg";
const AUDIT_RANGE = "4.0.0 - 5.0.7";
const PI_BRACE_EXPANSION =
  "node_modules/@earendil-works/pi-coding-agent/node_modules/brace-expansion";
const ALLOWED_NODES = new Set([PI_BRACE_EXPANSION, "node_modules/brace-expansion"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExpectedNodes(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.includes(PI_BRACE_EXPANSION) &&
    value.every((node) => typeof node === "string" && ALLOWED_NODES.has(node))
  );
}

function isExpectedAdvisory(value: unknown): boolean {
  return (
    isRecord(value) &&
    value["name"] === "brace-expansion" &&
    value["range"] === ADVISORY_RANGE &&
    value["severity"] === "high" &&
    value["source"] === ADVISORY_SOURCE &&
    value["url"] === ADVISORY_URL
  );
}

export function isExpectedPiDevelopmentAdvisory(report: unknown): boolean {
  if (!isRecord(report) || !isRecord(report["vulnerabilities"])) {
    return false;
  }

  const blocking = Object.entries(report["vulnerabilities"]).filter(
    ([, finding]) =>
      isRecord(finding) && (finding["severity"] === "high" || finding["severity"] === "critical"),
  );
  if (blocking.length !== 1 || blocking[0]?.[0] !== "brace-expansion") {
    return false;
  }

  const finding = blocking[0][1];
  if (!isRecord(finding)) {
    return false;
  }
  const via = finding["via"];
  return (
    finding["severity"] === "high" &&
    finding["isDirect"] === false &&
    finding["range"] === AUDIT_RANGE &&
    finding["fixAvailable"] === true &&
    hasExpectedNodes(finding["nodes"]) &&
    Array.isArray(via) &&
    via.length === 1 &&
    via.every((advisory) => isExpectedAdvisory(advisory))
  );
}

async function audit(arguments_: readonly string[]) {
  const invocation = npmInvocation(["audit", ...arguments_]);
  return await runCommand(invocation.command, invocation.arguments, {
    cwd: repositoryRoot,
    env: process.env,
    timeoutMs: 120_000,
  });
}

async function main(): Promise<void> {
  const fullAudit = await audit(["--json", "--audit-level=high"]);
  if (fullAudit.code === 0) {
    console.log("npm audit found no high or critical vulnerabilities.");
    return;
  }

  let report: unknown;
  try {
    report = JSON.parse(fullAudit.stdout) as unknown;
  } catch {
    throw new Error(describeFailure("npm audit --json --audit-level=high", fullAudit));
  }
  if (!isExpectedPiDevelopmentAdvisory(report)) {
    throw new Error(describeFailure("npm audit --json --audit-level=high", fullAudit));
  }

  const productionAudit = await audit(["--omit=dev", "--audit-level=high"]);
  if (productionAudit.code !== 0) {
    throw new Error(describeFailure("npm audit --omit=dev --audit-level=high", productionAudit));
  }

  // Temporary, exact exception: upstream Pi 0.82.x shrinkwraps the vulnerable dev-only node.
  // Remove this branch when https://github.com/earendil-works/pi/issues/7090 is resolved.
  console.log(
    "Production audit passed; allowing only GHSA-mh99-v99m-4gvg in Pi's development-only shrinkwrap.",
  );
}

const entryPath = process.argv[1];
if (entryPath !== undefined && resolve(entryPath) === fileURLToPath(import.meta.url)) {
  await main();
}
