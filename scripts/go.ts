import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

import { describeFailure, resolveExecutable, runCommand } from "./lib/process.ts";
import { findGoModules, repositoryRoot } from "./lib/repository.ts";

function executable(name: string): string {
  return resolveExecutable(name, "native");
}

const REQUIRED_GO_VERSION = "go1.26.5";
const REQUIRED_GOLANGCI_VERSION = "2.12.2";
const MINIMUM_COVERAGE = 80;

type Action = "format" | "format-check" | "lint" | "test" | "verify" | "vuln";

async function runOrThrow(
  command: string,
  arguments_: readonly string[],
  cwd: string,
  environment: NodeJS.ProcessEnv = process.env,
  timeoutMs = 300_000,
): Promise<string> {
  const result = await runCommand(command, arguments_, {
    cwd,
    env: environment,
    timeoutMs,
  });
  if (result.code !== 0) {
    throw new Error(describeFailure(`${command} ${arguments_.join(" ")}`, result));
  }
  return result.stdout;
}

async function verifyToolchain(): Promise<void> {
  const goVersion = (
    await runOrThrow(executable("go"), ["env", "GOVERSION"], repositoryRoot)
  ).trim();
  if (goVersion !== REQUIRED_GO_VERSION) {
    throw new Error(
      `Go ${REQUIRED_GO_VERSION} is required; found ${goVersion}. Run 'source .gvmrc' first.`,
    );
  }
  const golangciVersion = await runOrThrow(
    executable("golangci-lint"),
    ["version"],
    repositoryRoot,
  );
  if (!golangciVersion.includes(`version ${REQUIRED_GOLANGCI_VERSION}`)) {
    throw new Error(`golangci-lint ${REQUIRED_GOLANGCI_VERSION} is required.`);
  }
  await runOrThrow(
    executable("golangci-lint"),
    ["config", "verify", "--config", join(repositoryRoot, ".golangci.yml")],
    repositoryRoot,
  );
}

function moduleEnvironment(): NodeJS.ProcessEnv {
  return { ...process.env, GOWORK: "off" };
}

async function runFormat(modules: readonly string[], check: boolean): Promise<void> {
  for (const modulePath of modules) {
    const arguments_ = [
      "fmt",
      "--config",
      join(repositoryRoot, ".golangci.yml"),
      ...(check ? ["--diff"] : []),
    ];
    await runOrThrow(
      executable("golangci-lint"),
      arguments_,
      dirname(modulePath),
      moduleEnvironment(),
    );
  }
}

async function runLint(modules: readonly string[]): Promise<void> {
  for (const modulePath of modules) {
    await runOrThrow(
      executable("golangci-lint"),
      ["run", "--config", join(repositoryRoot, ".golangci.yml"), "./..."],
      dirname(modulePath),
      moduleEnvironment(),
    );
  }
}

function parseCoverage(output: string): number {
  const match = /^total:\s+\([^)]*\)\s+([\d.]+)%$/mu.exec(output);
  if (match?.[1] === undefined) {
    throw new Error(`Unable to parse Go coverage output:\n${output}`);
  }
  return Number(match[1]);
}

async function runTests(modules: readonly string[]): Promise<void> {
  const coverageRoot = await mkdtemp(join(tmpdir(), "pi-extensions-go-coverage-"));
  try {
    for (const modulePath of modules) {
      const moduleRoot = dirname(modulePath);
      const moduleName = relative(repositoryRoot, moduleRoot).replaceAll(/[\\/]/gu, "-");
      const coverageFile = join(coverageRoot, `${moduleName}.out`);
      const environment = moduleEnvironment();
      await runOrThrow(executable("go"), ["mod", "tidy", "-diff"], moduleRoot, environment);
      await runOrThrow(executable("go"), ["mod", "verify"], moduleRoot, environment);
      await runOrThrow(
        executable("go"),
        [
          "test",
          "-race",
          "-shuffle=on",
          "-count=1",
          "-covermode=atomic",
          `-coverprofile=${coverageFile}`,
          "./...",
        ],
        moduleRoot,
        environment,
      );
      const coverage = await runOrThrow(
        executable("go"),
        ["tool", "cover", `-func=${coverageFile}`],
        moduleRoot,
        environment,
      );
      const percentage = parseCoverage(coverage);
      if (percentage < MINIMUM_COVERAGE) {
        throw new Error(
          `${relative(repositoryRoot, moduleRoot)} has ${percentage.toFixed(1)}% Go coverage; ${String(MINIMUM_COVERAGE)}% is required.`,
        );
      }
      console.log(
        `${relative(repositoryRoot, moduleRoot)}: Go tests passed with ${percentage.toFixed(1)}% coverage.`,
      );
    }
  } finally {
    await rm(coverageRoot, { force: true, recursive: true });
  }
}

async function runVulnerabilityChecks(modules: readonly string[]): Promise<void> {
  for (const modulePath of modules) {
    await runOrThrow(
      executable("govulncheck"),
      ["./..."],
      dirname(modulePath),
      moduleEnvironment(),
    );
  }
}

function parseAction(value: string | undefined): Action {
  if (
    value === "format" ||
    value === "format-check" ||
    value === "lint" ||
    value === "test" ||
    value === "verify" ||
    value === "vuln"
  ) {
    return value;
  }
  throw new Error("Usage: tsx scripts/go.ts <verify|format|format-check|lint|test|vuln>");
}

async function main(): Promise<void> {
  const action = parseAction(process.argv[2]);
  await verifyToolchain();
  const modules = await findGoModules();
  if (modules.length === 0) {
    console.log(`Go toolchain and golangci-lint configuration verified; no Go modules found.`);
    return;
  }

  switch (action) {
    case "format":
      await runFormat(modules, false);
      break;
    case "format-check":
      await runFormat(modules, true);
      break;
    case "lint":
      await runLint(modules);
      break;
    case "test":
      await runTests(modules);
      break;
    case "verify":
      break;
    case "vuln":
      await runVulnerabilityChecks(modules);
      break;
  }
  console.log(`${action} passed for ${String(modules.length)} Go module(s).`);
}

await main();
