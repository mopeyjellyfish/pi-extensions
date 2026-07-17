import { cp, copyFile, mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { glob } from "glob";
import { x as extractTar } from "tar";

import {
  discoverProductionPackages,
  findForbiddenPackedPaths,
  loadFixturePackage,
  resolvePackageSkills,
  type PackageDescriptor,
} from "./lib/packages.ts";
import {
  credentialFreeEnvironment,
  describeFailure,
  npmInvocation,
  runCommand,
} from "./lib/process.ts";
import { isRecord, repositoryRoot } from "./lib/repository.ts";

const piModulePath = fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
const piCliPath = resolve(dirname(piModulePath), "cli.js");
const RPC_REQUEST_ID = "pi-extension-smoke";
const ROOT_AGGREGATE_INSTALL_TIMEOUT_MS = process.platform === "win32" ? 300_000 : 120_000;

interface PackResult {
  readonly filename: string;
}

async function assertSafePackedArtifact(root: string): Promise<void> {
  const files = await glob("**/*", { cwd: root, dot: true, nodir: true });
  const forbidden = findForbiddenPackedPaths(files);
  if (forbidden.length > 0) {
    throw new Error(`Packed package includes forbidden paths: ${forbidden.join(", ")}.`);
  }
  const repositoryPath = resolve(repositoryRoot);
  for (const file of files) {
    const content = await readFile(join(root, file));
    if (content.includes(repositoryPath)) {
      throw new Error(
        `Packed package ${file} contains the local repository path ${repositoryPath}.`,
      );
    }
  }
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
  expectedCommands: readonly string[],
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
  const data = response["data"];
  const commands = isRecord(data) ? data["commands"] : undefined;
  for (const expected of expectedCommands) {
    const found =
      Array.isArray(commands) &&
      commands.some((command) => isRecord(command) && command["name"] === expected);
    if (!found) {
      throw new Error(`The ${expected} command was absent from the Pi RPC response.`);
    }
  }
}

async function expectedSkillCommands(descriptor: PackageDescriptor): Promise<string[]> {
  const commands: string[] = [];
  for (const path of await resolvePackageSkills(descriptor)) {
    const skill = await readFile(path, "utf8");
    const match = /^name:\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*$/mu.exec(skill);
    if (match?.[1] === undefined) {
      throw new Error(`Skill ${path} has no valid name for smoke testing.`);
    }
    commands.push(`skill:${match[1]}`);
  }
  return commands.sort((left, right) => left.localeCompare(right));
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
  const expectedCommands = [
    ...(descriptor.kind === "fixture" ? ["fixture-health"] : []),
    ...(await expectedSkillCommands(descriptor)),
  ];
  await assertRpcLifecycle(
    extensionPath,
    cwd,
    isolatedEnvironment(rpcHome, rpcMarker),
    expectedCommands,
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

async function loadRootAggregate(root: string): Promise<PackageDescriptor> {
  const value = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as unknown;
  if (!isRecord(value)) {
    throw new Error("Root aggregate package.json must contain an object.");
  }
  return { kind: "production", manifest: value, root };
}

async function installRootAggregate(tempRoot: string): Promise<string> {
  const installRoot = join(tempRoot, "install");
  const npmHome = join(tempRoot, "npm-home");
  await mkdir(installRoot, { recursive: true });
  await mkdir(npmHome, { recursive: true });
  await Promise.all([
    copyFile(join(repositoryRoot, ".npmrc"), join(installRoot, ".npmrc")),
    copyFile(join(repositoryRoot, "package.json"), join(installRoot, "package.json")),
    copyFile(join(repositoryRoot, "package-lock.json"), join(installRoot, "package-lock.json")),
    cp(join(repositoryRoot, "packages"), join(installRoot, "packages"), { recursive: true }),
  ]);
  const npmEnvironment = isolatedNpmEnvironment(npmHome);
  const installInvocation = npmInvocation(
    ["install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"],
    npmEnvironment,
  );
  const installed = await runCommand(installInvocation.command, installInvocation.arguments, {
    cwd: installRoot,
    env: npmEnvironment,
    timeoutMs: ROOT_AGGREGATE_INSTALL_TIMEOUT_MS,
  });
  if (installed.code !== 0) {
    throw new Error(describeFailure("npm install root aggregate", installed));
  }
  const externalManifest = JSON.parse(
    await readFile(join(installRoot, "node_modules", "@ff-labs", "pi-fff", "package.json"), "utf8"),
  ) as unknown;
  if (!isRecord(externalManifest) || externalManifest["name"] !== "@ff-labs/pi-fff") {
    throw new Error("The installed root aggregate did not contain @ff-labs/pi-fff.");
  }
  return installRoot;
}

async function packAndInstall(descriptor: PackageDescriptor, tempRoot: string): Promise<string> {
  const packRoot = join(tempRoot, "pack");
  const extractRoot = join(tempRoot, "extract");
  const npmHome = join(tempRoot, "npm-home");
  await mkdir(packRoot, { recursive: true });
  await mkdir(extractRoot, { recursive: true });
  await mkdir(npmHome, { recursive: true });
  const npmEnvironment = isolatedNpmEnvironment(npmHome);
  const packInvocation = npmInvocation(
    ["pack", "--json", "--ignore-scripts", "--pack-destination", packRoot, descriptor.root],
    npmEnvironment,
  );
  const packed = await runCommand(packInvocation.command, packInvocation.arguments, {
    cwd: repositoryRoot,
    env: npmEnvironment,
    timeoutMs: 60_000,
  });
  if (packed.code !== 0) {
    throw new Error(describeFailure(`npm pack ${descriptor.root}`, packed));
  }
  const { filename } = parsePackResult(packed.stdout);
  await extractTar({ cwd: extractRoot, file: join(packRoot, filename) });
  const installedRoot = join(extractRoot, "package");
  await assertSafePackedArtifact(installedRoot);
  const installInvocation = npmInvocation(
    ["install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund", "--legacy-peer-deps"],
    npmEnvironment,
  );
  const installed = await runCommand(installInvocation.command, installInvocation.arguments, {
    cwd: installedRoot,
    env: npmEnvironment,
    timeoutMs: 120_000,
  });
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
    const rootAggregate = await loadRootAggregate(repositoryRoot);
    if (!packedOnly) {
      await smokePath(rootAggregate, repositoryRoot, "root-aggregate-source", tempRoot);
    }
    if (!sourceOnly) {
      const installedRoot = await installRootAggregate(join(tempRoot, "root-aggregate"));
      await smokePath(
        await loadRootAggregate(installedRoot),
        installedRoot,
        "root-aggregate-installed",
        tempRoot,
      );
    }
    console.log(
      `Smoke-tested the private root aggregate ${sourceOnly ? "from source" : packedOnly ? "from an isolated production install" : "from source and an isolated production install"}.`,
    );
    console.log(
      `Pi smoke tests passed for ${String(descriptors.length)} package(s) and the private root aggregate.`,
    );
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

await main();
