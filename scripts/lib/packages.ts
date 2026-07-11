import { readdir, stat } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

import { glob } from "glob";
import { SemVer } from "semver";

import {
  isRecord,
  pathExists,
  readJsonFile,
  repositoryRoot,
  stringArray,
  stringRecord,
  toPosixPath,
} from "./repository.ts";

const HOST_PACKAGE = "@earendil-works/pi-coding-agent";
const REPOSITORY_URL = "git+https://github.com/mopeyjellyfish/pi-extensions.git";
const MINIMUM_NODE_VERSION = "22.20.0";
const REQUIRED_ENGINE = `>=${MINIMUM_NODE_VERSION}`;
const REQUIRED_FILES = ["LICENSE", "README.md"];
const REQUIRED_PRODUCTION_FILES = ["CHANGELOG.md"];
const REQUIRED_KEYWORDS = ["pi-package"];
const FORBIDDEN_PACKED_PATH_COMPONENTS = new Set([
  ".pi",
  ".pi-subagents",
  ".worktree",
  ".worktrees",
  "coverage",
  "sessions",
]);

export interface PackageDescriptor {
  readonly kind: "fixture" | "production";
  readonly manifest: Record<string, unknown>;
  readonly root: string;
}

interface PackageResources {
  readonly extensions: readonly string[];
  readonly skills: readonly string[];
}

function packageResources(manifest: Record<string, unknown>): PackageResources {
  const pi = manifest["pi"];
  return {
    extensions: (isRecord(pi) ? stringArray(pi["extensions"]) : undefined) ?? [],
    skills: (isRecord(pi) ? stringArray(pi["skills"]) : undefined) ?? [],
  };
}

export function findForbiddenPackedPaths(paths: readonly string[]): string[] {
  return paths.filter((path) => {
    const normalized = toPosixPath(path).replace(/^\.\//u, "");
    const components = normalized.split("/");
    return (
      normalized.startsWith("/") ||
      /^[A-Za-z]:\//u.test(normalized) ||
      components.some((component) => FORBIDDEN_PACKED_PATH_COMPONENTS.has(component))
    );
  });
}

export async function discoverProductionPackages(
  root = repositoryRoot,
): Promise<PackageDescriptor[]> {
  const packagesRoot = join(root, "packages");
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const descriptors: PackageDescriptor[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const packageRoot = join(packagesRoot, entry.name);
    const manifestPath = join(packageRoot, "package.json");
    if (!pathExists(manifestPath)) {
      throw new Error(`Workspace directory packages/${entry.name} is missing package.json.`);
    }
    const value = await readJsonFile(manifestPath);
    if (!isRecord(value)) {
      throw new Error(`packages/${entry.name}/package.json must contain a JSON object.`);
    }
    descriptors.push({ kind: "production", manifest: value, root: packageRoot });
  }
  return descriptors.sort((left, right) => left.root.localeCompare(right.root));
}

export async function loadFixturePackage(root = repositoryRoot): Promise<PackageDescriptor> {
  const fixtureRoot = join(root, "test", "fixtures", "minimal-extension");
  const value = await readJsonFile(join(fixtureRoot, "package.json"));
  if (!isRecord(value)) {
    throw new Error("The minimal extension fixture package.json must contain a JSON object.");
  }
  return { kind: "fixture", manifest: value, root: fixtureRoot };
}

function requireString(manifest: Record<string, unknown>, key: string, errors: string[]): string {
  const value = manifest[key];
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${key} must be a non-empty string.`);
    return "";
  }
  return value;
}

function isSemanticVersion(value: string): boolean {
  if (value.trim() !== value || !/^\d/u.test(value)) {
    return false;
  }
  try {
    return new SemVer(value).raw === value;
  } catch {
    return false;
  }
}

function validateHostDependency(
  dependency: string,
  range: string,
  section: string,
  errors: string[],
): void {
  const hostProvided = dependency.startsWith("@earendil-works/pi-") || dependency === "typebox";
  if (!hostProvided) {
    return;
  }
  if (section !== "peerDependencies") {
    errors.push(`${dependency} is host-provided and must be a peerDependency.`);
  } else if (range !== "*") {
    errors.push(`${dependency} must use the "*" peerDependency range.`);
  }
}

function validateDependencyPlacement(
  manifest: Record<string, unknown>,
  resources: PackageResources,
  errors: string[],
): void {
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const seen = new Map<string, string>();
  for (const section of sections) {
    const dependencies = stringRecord(manifest[section]);
    if (manifest[section] !== undefined && dependencies === undefined) {
      errors.push(`${section} must map package names to string versions.`);
      continue;
    }
    for (const dependency of Object.keys(dependencies ?? {})) {
      const previous = seen.get(dependency);
      if (previous !== undefined) {
        errors.push(`${dependency} is declared in both ${previous} and ${section}.`);
      }
      seen.set(dependency, section);
      validateHostDependency(dependency, dependencies?.[dependency] ?? "", section, errors);
    }
  }

  const peers = stringRecord(manifest["peerDependencies"]);
  if (resources.extensions.length > 0 && peers?.[HOST_PACKAGE] === undefined) {
    errors.push(`${HOST_PACKAGE} must be declared as a peerDependency.`);
  }
}

async function resolveExtensionPatterns(
  packageRoot: string,
  patterns: readonly string[],
): Promise<string[]> {
  const resolved: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: packageRoot, nodir: true });
    if (matches.length === 0) {
      throw new Error(`${pattern} does not match an extension entrypoint.`);
    }
    for (const match of matches) {
      const absolute = resolve(packageRoot, match);
      const packageRelative = relative(packageRoot, absolute);
      if (packageRelative.startsWith("..")) {
        throw new Error(`${pattern} resolves outside its package.`);
      }
      resolved.push(toPosixPath(absolute));
    }
  }
  return [...new Set(resolved)].sort((left, right) => left.localeCompare(right));
}

function validateIdentity(descriptor: PackageDescriptor, errors: string[]): void {
  const { kind, manifest } = descriptor;
  const name = requireString(manifest, "name", errors);
  const version = requireString(manifest, "version", errors);
  requireString(manifest, "description", errors);
  if (!isSemanticVersion(version)) {
    errors.push("version must be a semantic version.");
  }
  if (manifest["type"] !== "module") {
    errors.push('type must be "module".');
  }
  if (manifest["license"] !== "MIT") {
    errors.push('license must be "MIT".');
  }
  if (kind === "production" && manifest["private"] !== undefined && manifest["private"] !== false) {
    errors.push("production package private must be absent or false.");
  }
  if (kind === "fixture" && manifest["private"] !== true) {
    errors.push("test fixture packages must be private.");
  }
  if (kind === "production" && !name.startsWith("@mopeyjellyfish/pi-")) {
    errors.push("production package names must start with @mopeyjellyfish/pi-.");
  }
  if (stringRecord(manifest["engines"])?.["node"] !== REQUIRED_ENGINE) {
    errors.push(`engines.node must be ${REQUIRED_ENGINE}.`);
  }
}

function validateManifestLists(descriptor: PackageDescriptor, errors: string[]): void {
  const resources = packageResources(descriptor.manifest);
  const files = stringArray(descriptor.manifest["files"]);
  const requiredFiles = [
    ...REQUIRED_FILES,
    ...(descriptor.kind === "production" ? REQUIRED_PRODUCTION_FILES : []),
    ...(resources.extensions.length > 0 ? ["src/"] : []),
    ...(resources.skills.length > 0 ? ["skills/"] : []),
  ];
  for (const requiredFile of requiredFiles) {
    if (!files?.includes(requiredFile)) {
      errors.push(`files must include ${requiredFile}.`);
    }
  }
  const keywords = stringArray(descriptor.manifest["keywords"]);
  const requiredKeywords = [
    ...REQUIRED_KEYWORDS,
    ...(resources.extensions.length > 0 ? ["pi-extension"] : []),
  ];
  for (const keyword of requiredKeywords) {
    if (!keywords?.includes(keyword)) {
      errors.push(`keywords must include ${keyword}.`);
    }
  }
}

async function resolveSkillPatterns(
  packageRoot: string,
  patterns: readonly string[],
): Promise<string[]> {
  const resolved: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: packageRoot, nodir: false });
    if (matches.length === 0) {
      throw new Error(`${pattern} does not match a skill entrypoint.`);
    }
    for (const match of matches) {
      const absolute = resolve(packageRoot, match);
      const packageRelative = relative(packageRoot, absolute);
      if (packageRelative.startsWith("..")) {
        throw new Error(`${pattern} resolves outside its package.`);
      }
      const information = await stat(absolute);
      if (information.isDirectory()) {
        const skills = await glob(["*.md", "**/SKILL.md"], { absolute: true, cwd: absolute });
        resolved.push(...skills.map((skill) => toPosixPath(resolve(skill))));
      } else if (absolute.endsWith(".md")) {
        resolved.push(toPosixPath(absolute));
      }
    }
  }
  if (resolved.length === 0) {
    throw new Error("pi.skills must resolve to at least one Markdown skill entrypoint.");
  }
  return [...new Set(resolved)].sort((left, right) => left.localeCompare(right));
}

async function validatePiResources(descriptor: PackageDescriptor, errors: string[]): Promise<void> {
  const resources = packageResources(descriptor.manifest);
  if (resources.extensions.length === 0 && resources.skills.length === 0) {
    errors.push("pi must declare at least one extension or skill entrypoint.");
    return;
  }
  try {
    await Promise.all([
      ...(resources.extensions.length === 0
        ? []
        : [resolveExtensionPatterns(descriptor.root, resources.extensions)]),
      ...(resources.skills.length === 0
        ? []
        : [resolveSkillPatterns(descriptor.root, resources.skills)]),
    ]);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

async function validateRequiredPaths(
  descriptor: PackageDescriptor,
  errors: string[],
): Promise<void> {
  const resources = packageResources(descriptor.manifest);
  const requiredPaths = [
    "LICENSE",
    "README.md",
    "package.json",
    ...(resources.extensions.length > 0 ? ["src/index.ts"] : []),
    ...(resources.skills.length > 0 ? ["skills"] : []),
  ];
  if (descriptor.kind === "production") {
    requiredPaths.push("CHANGELOG.md", "test");
    if (resources.extensions.length > 0) {
      requiredPaths.push("tsconfig.json");
    }
  }
  for (const requiredPath of requiredPaths) {
    if (!pathExists(join(descriptor.root, requiredPath))) {
      errors.push(`${requiredPath} is required.`);
    }
  }
  if (descriptor.kind === "production") {
    const tests = await glob("test/**/*.test.ts", { cwd: descriptor.root, nodir: true });
    if (tests.length === 0) {
      errors.push("at least one test/**/*.test.ts file is required.");
    }
  }
}

function validateRepositoryMetadata(descriptor: PackageDescriptor, errors: string[]): void {
  if (descriptor.kind !== "production") {
    return;
  }
  const repository = descriptor.manifest["repository"];
  if (!isRecord(repository) || repository["type"] !== "git") {
    errors.push("repository.type must be git.");
  }
  if (!isRecord(repository) || repository["url"] !== REPOSITORY_URL) {
    errors.push(`repository.url must be ${REPOSITORY_URL}.`);
  }
  const expectedDirectory = toPosixPath(relative(repositoryRoot, descriptor.root));
  if (!isRecord(repository) || repository["directory"] !== expectedDirectory) {
    errors.push(`repository.directory must be ${expectedDirectory}.`);
  }
  const scripts = stringRecord(descriptor.manifest["scripts"]);
  const resources = packageResources(descriptor.manifest);
  const requiredScripts = ["test", ...(resources.extensions.length > 0 ? ["typecheck"] : [])];
  for (const script of requiredScripts) {
    if (scripts?.[script] === undefined) {
      errors.push(`scripts.${script} is required.`);
    }
  }
}

export async function validatePackage(descriptor: PackageDescriptor): Promise<string[]> {
  const errors: string[] = [];
  const resources = packageResources(descriptor.manifest);
  validateIdentity(descriptor, errors);
  validateManifestLists(descriptor, errors);
  await validatePiResources(descriptor, errors);
  validateDependencyPlacement(descriptor.manifest, resources, errors);
  await validateRequiredPaths(descriptor, errors);
  validateRepositoryMetadata(descriptor, errors);
  return errors.map((error) => `${basename(descriptor.root)}: ${error}`);
}

export async function resolvePackageEntrypoints(descriptor: PackageDescriptor): Promise<string[]> {
  const extensions = packageResources(descriptor.manifest).extensions;
  if (extensions.length === 0) {
    return [];
  }
  return await resolveExtensionPatterns(descriptor.root, extensions);
}

export async function resolvePackageSkills(descriptor: PackageDescriptor): Promise<string[]> {
  const skills = packageResources(descriptor.manifest).skills;
  if (skills.length === 0) {
    return [];
  }
  return await resolveSkillPatterns(descriptor.root, skills);
}

function nodeTypesMatchMinimumRuntime(value: unknown): boolean {
  if (typeof value !== "string" || !isSemanticVersion(value)) {
    return false;
  }
  const minimum = new SemVer(MINIMUM_NODE_VERSION);
  const nodeTypes = new SemVer(value);
  return minimum.major === nodeTypes.major && minimum.minor === nodeTypes.minor;
}

function validateRootRuntime(value: Record<string, unknown>, errors: string[]): void {
  if (stringRecord(value["engines"])?.["node"] !== REQUIRED_ENGINE) {
    errors.push(`Root engines.node must be ${REQUIRED_ENGINE}.`);
  }
  const nodeTypes = stringRecord(value["devDependencies"])?.["@types/node"];
  if (!nodeTypesMatchMinimumRuntime(nodeTypes)) {
    const minimum = new SemVer(MINIMUM_NODE_VERSION);
    errors.push(
      `Root @types/node must remain on the ${String(minimum.major)}.${String(minimum.minor)}.x minimum-runtime line.`,
    );
  }
}

function validateRootManifest(value: Record<string, unknown>, errors: string[]): PackageResources {
  if (value["private"] !== true) {
    errors.push("Root package.json must remain private.");
  }
  validateRootRuntime(value, errors);
  const workspaces = stringArray(value["workspaces"]);
  if (workspaces?.length !== 1 || workspaces[0] !== "packages/*") {
    errors.push('Root workspaces must be exactly ["packages/*"].');
  }
  const resources = packageResources(value);
  if (resources.extensions.length === 0) {
    errors.push("Root pi.extensions must contain the aggregate extension glob.");
  }
  return resources;
}

async function collectAggregateEntrypoints(
  root: string,
  patterns: readonly string[],
): Promise<Set<string>> {
  const entrypoints = new Set<string>();
  for (const pattern of patterns) {
    const matches = await glob(pattern, { absolute: true, cwd: root, nodir: true });
    for (const match of matches) {
      entrypoints.add(toPosixPath(resolve(match)));
    }
  }
  return entrypoints;
}

async function collectPackageEntrypoints(
  packages: readonly PackageDescriptor[],
): Promise<Set<string>> {
  const entrypoints = new Set<string>();
  for (const descriptor of packages) {
    for (const entrypoint of await resolvePackageEntrypoints(descriptor)) {
      entrypoints.add(entrypoint);
    }
  }
  return entrypoints;
}

async function collectPackageSkills(packages: readonly PackageDescriptor[]): Promise<Set<string>> {
  const skills = new Set<string>();
  for (const descriptor of packages) {
    for (const skill of await resolvePackageSkills(descriptor)) {
      skills.add(skill);
    }
  }
  return skills;
}

function compareAggregateEntrypoints(
  root: string,
  aggregate: ReadonlySet<string>,
  packages: ReadonlySet<string>,
): string[] {
  const errors = [...packages]
    .filter((path) => !aggregate.has(path))
    .map((path) => `Root aggregate does not include ${toPosixPath(relative(root, path))}.`);
  errors.push(
    ...[...aggregate]
      .filter((path) => !packages.has(path))
      .map(
        (path) =>
          `Root aggregate includes unmanaged entrypoint ${toPosixPath(relative(root, path))}.`,
      ),
  );
  return errors;
}

export async function validateRootAggregate(
  packages: readonly PackageDescriptor[],
  root = repositoryRoot,
): Promise<string[]> {
  const value = await readJsonFile(join(root, "package.json"));
  if (!isRecord(value)) {
    return ["Root package.json must contain a JSON object."];
  }
  const errors: string[] = [];
  const resources = validateRootManifest(value, errors);
  if (resources.extensions.length === 0) {
    return errors;
  }
  const aggregate = await collectAggregateEntrypoints(root, resources.extensions);
  const packageEntrypoints = await collectPackageEntrypoints(packages);
  errors.push(...compareAggregateEntrypoints(root, aggregate, packageEntrypoints));
  const packageSkills = await collectPackageSkills(packages);
  if (packageSkills.size > 0 && resources.skills.length === 0) {
    errors.push("Root pi.skills must contain the aggregate skill glob.");
  } else if (resources.skills.length > 0) {
    const aggregateSkills = new Set(await resolveSkillPatterns(root, resources.skills));
    errors.push(
      ...[...packageSkills]
        .filter((path) => !aggregateSkills.has(path))
        .map(
          (path) => `Root skill aggregate does not include ${toPosixPath(relative(root, path))}.`,
        ),
      ...[...aggregateSkills]
        .filter((path) => !packageSkills.has(path))
        .map(
          (path) =>
            `Root skill aggregate includes unmanaged skill ${toPosixPath(relative(root, path))}.`,
        ),
    );
  }
  return errors;
}
