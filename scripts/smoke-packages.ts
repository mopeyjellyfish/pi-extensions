import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { x as extractTar } from "tar";

import {
  discoverProductionPackages,
  loadFixturePackage,
  type PackageDescriptor,
} from "./lib/packages.ts";
import {
  credentialFreeEnvironment,
  describeFailure,
  resolveExecutable,
  runCommand,
} from "./lib/process.ts";
import { isRecord, repositoryRoot } from "./lib/repository.ts";

const piModulePath = fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
const piCliPath = resolve(dirname(piModulePath), "cli.js");
const RPC_REQUEST_ID = "pi-extension-smoke";

interface PackResult {
  readonly filename: string;
}

function parsePackResult(stdout: string): PackResult {
  const value = JSON.parse(stdout) as unknown;
  if (
    !Array.isArray(value) ||
    value.length !== 1 ||
    !isRecord(value[0]) ||
    typeof value[0]["filename"] !== "string"
  ) {
    throw new Error("npm pack returned an unexpected JSON document.");
  }
  return { filename: value[0]["filename"] };
}

function isolatedEnvironment(home: string, marker: string): NodeJS.ProcessEnv {
  const blockedProxy = "http://127.0.0.1:9";
  return {
    ...credentialFreeEnvironment(),
    ALL_PROXY: blockedProxy,
    all_proxy: blockedProxy,
    CI: "true",
    GIT_TERMINAL_PROMPT: "0",
    HOME: home,
    HTTPS_PROXY: blockedProxy,
    https_proxy: blockedProxy,
    HTTP_PROXY: blockedProxy,
    http_proxy: blockedProxy,
    NO_COLOR: "1",
    NO_PROXY: "",
    no_proxy: "",
    PI_EXTENSIONS_SMOKE_MARKER: marker,
    USERPROFILE: home,
    XDG_CACHE_HOME: join(home, ".cache"),
    XDG_CONFIG_HOME: join(home, ".config"),
    XDG_DATA_HOME: join(home, ".local", "share"),
  };
}

function isolatedNpmEnvironment(home: string): NodeJS.ProcessEnv {
  return {
    ...credentialFreeEnvironment(),
    CI: "true",
    GIT_TERMINAL_PROMPT: "0",
    HOME: home,
    NPM_CONFIG_CACHE: join(home, ".npm-cache"),
    NPM_CONFIG_GLOBALCONFIG: join(home, "global.npmrc"),
    NPM_CONFIG_USERCONFIG: join(home, ".npmrc"),
    USERPROFILE: home,
    XDG_CACHE_HOME: join(home, ".cache"),
    XDG_CONFIG_HOME: join(home, ".config"),
    XDG_DATA_HOME: join(home, ".local", "share"),
  };
}

async function assertListModels(
  extensionPath: string,
  cwd: string,
  environment: NodeJS.ProcessEnv,
): Promise<void> {
  const result = await runCommand(
    process.execPath,
    [piCliPath, "--no-session", "-e", extensionPath, "--list-models"],
    { cwd, env: environment, timeoutMs: 30_000 },
  );
  if (result.code !== 0) {
    throw new Error(describeFailure(`pi -e ${extensionPath} --list-models`, result));
  }
}

async function assertRpcLifecycle(
  extensionPath: string,
  cwd: string,
  environment: NodeJS.ProcessEnv,
  expectFixtureCommand: boolean,
): Promise<void> {
  const input = `${JSON.stringify({ id: RPC_REQUEST_ID, type: "get_commands" })}\n`;
  const result = await runCommand(
    process.execPath,
    [piCliPath, "--mode", "rpc", "--no-session", "-e", extensionPath],
    { cwd, env: environment, input, timeoutMs: 30_000 },
  );
  if (result.code !== 0) {
    throw new Error(describeFailure(`pi --mode rpc -e ${extensionPath}`, result));
  }

  const messages: Record<string, unknown>[] = [];
  for (const line of result.stdout.split("\n").filter((candidate) => candidate.trim() !== "")) {
    const value = JSON.parse(line) as unknown;
    if (!isRecord(value)) {
      throw new TypeError(`Pi RPC emitted a non-object JSON record: ${line}`);
    }
    messages.push(value);
  }
  const extensionError = messages.find((message) => message["type"] === "extension_error");
  if (extensionError !== undefined) {
    throw new Error(`Pi emitted extension_error: ${JSON.stringify(extensionError)}`);
  }
  const response = messages.find(
    (message) => message["type"] === "response" && message["id"] === RPC_REQUEST_ID,
  );
  if (response?.["success"] !== true) {
    throw new Error(`Pi RPC did not return a successful get_commands response: ${result.stdout}`);
  }
  if (expectFixtureCommand) {
    const data = response["data"];
    const commands = isRecord(data) ? data["commands"] : undefined;
    const found =
      Array.isArray(commands) &&
      commands.some((command) => isRecord(command) && command["name"] === "fixture-health");
    if (!found) {
      throw new Error("The fixture command was absent from the Pi RPC response.");
    }
  }
}

async function assertFixtureLifecycle(
  marker: string,
  expected: readonly string[],
  invocation: string,
): Promise<void> {
  const stages = (await readFile(marker, "utf8")).trim().split("\n");
  if (JSON.stringify(stages) !== JSON.stringify(expected)) {
    throw new Error(
      `${invocation} fixture lifecycle was ${stages.join(" -> ")}; expected ${expected.join(" -> ")}.`,
    );
  }
}

async function smokePath(
  descriptor: PackageDescriptor,
  extensionPath: string,
  label: string,
  tempRoot: string,
): Promise<void> {
  const runRoot = join(tempRoot, label.replaceAll(/[^a-z0-9-]/giu, "-"));
  const cwd = join(runRoot, "workspace");
  const listModelsHome = join(runRoot, "list-models-home");
  const listModelsMarker = join(runRoot, "list-models-lifecycle.log");
  const rpcHome = join(runRoot, "rpc-home");
  const rpcMarker = join(runRoot, "rpc-lifecycle.log");
  await mkdir(cwd, { recursive: true });
  await mkdir(listModelsHome, { recursive: true });
  await mkdir(rpcHome, { recursive: true });
  await assertListModels(extensionPath, cwd, isolatedEnvironment(listModelsHome, listModelsMarker));
  await assertRpcLifecycle(
    extensionPath,
    cwd,
    isolatedEnvironment(rpcHome, rpcMarker),
    descriptor.kind === "fixture",
  );
  if (descriptor.kind === "fixture") {
    await assertFixtureLifecycle(listModelsMarker, ["factory"], "list-models");
    await assertFixtureLifecycle(
      rpcMarker,
      ["factory", "session_start", "session_shutdown"],
      "RPC",
    );
  }
}

async function packAndInstall(descriptor: PackageDescriptor, tempRoot: string): Promise<string> {
  const packRoot = join(tempRoot, "pack");
  const extractRoot = join(tempRoot, "extract");
  const npmHome = join(tempRoot, "npm-home");
  await mkdir(packRoot, { recursive: true });
  await mkdir(extractRoot, { recursive: true });
  await mkdir(npmHome, { recursive: true });
  const npmEnvironment = isolatedNpmEnvironment(npmHome);
  const packed = await runCommand(
    resolveExecutable("npm", "node-shim"),
    ["pack", "--json", "--ignore-scripts", "--pack-destination", packRoot, descriptor.root],
    { cwd: repositoryRoot, env: npmEnvironment, timeoutMs: 60_000 },
  );
  if (packed.code !== 0) {
    throw new Error(describeFailure(`npm pack ${descriptor.root}`, packed));
  }
  const { filename } = parsePackResult(packed.stdout);
  await extractTar({ cwd: extractRoot, file: join(packRoot, filename) });
  const installedRoot = join(extractRoot, "package");
  const installed = await runCommand(
    resolveExecutable("npm", "node-shim"),
    ["install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund", "--legacy-peer-deps"],
    { cwd: installedRoot, env: npmEnvironment, timeoutMs: 120_000 },
  );
  if (installed.code !== 0) {
    throw new Error(describeFailure(`npm install ${installedRoot}`, installed));
  }
  return installedRoot;
}

async function main(): Promise<void> {
  const sourceOnly = process.argv.includes("--source-only");
  const packedOnly = process.argv.includes("--packed-only");
  if (sourceOnly && packedOnly) {
    throw new Error("Choose at most one of --source-only and --packed-only.");
  }

  const descriptors = [...(await discoverProductionPackages()), await loadFixturePackage()];
  const tempRoot = await mkdtemp(join(tmpdir(), "pi-extensions-smoke-"));
  try {
    for (const descriptor of descriptors) {
      const packageName = String(descriptor.manifest["name"]);
      if (!packedOnly) {
        await smokePath(descriptor, descriptor.root, `${packageName}-source`, tempRoot);
      }
      if (!sourceOnly) {
        const packageTemp = join(tempRoot, packageName.replaceAll(/[^a-z0-9-]/giu, "-"));
        await mkdir(packageTemp, { recursive: true });
        const installedRoot = await packAndInstall(descriptor, packageTemp);
        await smokePath(descriptor, installedRoot, `${packageName}-packed`, tempRoot);
      }
      console.log(
        `Smoke-tested ${packageName} ${sourceOnly ? "from source" : packedOnly ? "from its package" : "from source and package"}.`,
      );
    }
    console.log(`Pi smoke tests passed for ${String(descriptors.length)} package(s).`);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

await main();
