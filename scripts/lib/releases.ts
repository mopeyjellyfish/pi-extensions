import { join, relative } from "node:path";

import { isRecord, readJsonFile, repositoryRoot, toPosixPath } from "./repository.ts";

import type { PackageDescriptor } from "./packages.ts";

const RELEASE_CONFIG_FILE = "release-please-config.json";
const RELEASE_MANIFEST_FILE = ".release-please-manifest.json";
const REQUIRED_CHANGELOG_TYPES = [
  "build",
  "chore",
  "deps",
  "docs",
  "feat",
  "fix",
  "perf",
  "refactor",
  "revert",
];

function packagePath(descriptor: PackageDescriptor, root: string): string {
  return toPosixPath(relative(root, descriptor.root));
}

function packageIdentity(descriptor: PackageDescriptor):
  | {
      readonly component: string;
      readonly name: string;
      readonly version: string;
    }
  | undefined {
  const name = descriptor.manifest["name"];
  const version = descriptor.manifest["version"];
  if (typeof name !== "string" || typeof version !== "string") {
    return undefined;
  }
  return { component: name.slice(name.lastIndexOf("/") + 1), name, version };
}

function validateVersionPolicy(config: Record<string, unknown>, errors: string[]): void {
  if (config["release-type"] !== "node") {
    errors.push('Release Please release-type must be "node".');
  }
  if (config["versioning"] !== "default") {
    errors.push('Release Please versioning must be "default".');
  }
  if (
    config["bump-minor-pre-major"] !== false ||
    config["bump-patch-for-minor-pre-major"] !== false
  ) {
    errors.push("Release Please must use standard SemVer before 1.0.0.");
  }
}

function validatePullRequestPolicy(config: Record<string, unknown>, errors: string[]): void {
  if (config["include-component-in-tag"] !== true || config["include-v-in-tag"] !== true) {
    errors.push("Release Please tags must include the component and v prefix.");
  }
  if (config["tag-separator"] !== "-") {
    errors.push('Release Please tag-separator must be "-".');
  }
  if (config["separate-pull-requests"] !== false) {
    errors.push("Release Please must use one consolidated release pull request.");
  }
  if (config["sequential-calls"] !== true) {
    errors.push("Release Please sequential-calls must be enabled.");
  }
}

function validateGlobalConfig(config: Record<string, unknown>, errors: string[]): void {
  validateVersionPolicy(config, errors);
  validatePullRequestPolicy(config, errors);
  const plugins = config["plugins"];
  if (!Array.isArray(plugins) || plugins.length !== 1 || plugins[0] !== "node-workspace") {
    errors.push("Release Please must use only the node-workspace plugin.");
  }

  const sections = config["changelog-sections"];
  if (!Array.isArray(sections)) {
    errors.push("Release Please changelog-sections must be an array.");
    return;
  }
  const visibleTypes = new Set(
    sections.flatMap((section) => {
      if (!isRecord(section) || typeof section["type"] !== "string" || section["hidden"] === true) {
        return [];
      }
      return [section["type"]];
    }),
  );
  for (const type of REQUIRED_CHANGELOG_TYPES) {
    if (!visibleTypes.has(type)) {
      errors.push(`Release Please changelog type ${type} must be visible.`);
    }
  }
}

function validatePackageEntry(
  descriptor: PackageDescriptor,
  configuredPackages: Record<string, unknown>,
  manifest: Record<string, unknown>,
  root: string,
): string[] {
  const errors: string[] = [];
  const path = packagePath(descriptor, root);
  const identity = packageIdentity(descriptor);
  const packageConfig = configuredPackages[path];
  if (isRecord(packageConfig)) {
    if (packageConfig["release-type"] !== "node") {
      errors.push(`${path}: release-type must be node.`);
    }
    if ("component" in packageConfig || "package-name" in packageConfig) {
      errors.push(`${path}: Release Please must derive identity from package.json.`);
    }
  } else {
    errors.push(`${RELEASE_CONFIG_FILE} is missing package ${path}.`);
  }
  if (
    identity !== undefined &&
    (identity.name !== `@mopeyjellyfish/${identity.component}` ||
      !identity.component.startsWith("pi-"))
  ) {
    errors.push(`${path}: package name must derive an unscoped pi-* release component.`);
  }

  const releaseVersion = manifest[path];
  if (typeof releaseVersion !== "string") {
    errors.push(`${RELEASE_MANIFEST_FILE} is missing package ${path}.`);
  } else if (identity !== undefined && releaseVersion !== identity.version) {
    errors.push(
      `${path}: release manifest version ${releaseVersion} must match package version ${identity.version}.`,
    );
  }
  return errors;
}

function validateOrphans(
  paths: readonly string[],
  expectedPaths: ReadonlySet<string>,
  file: string,
): string[] {
  return paths
    .filter((path) => !expectedPaths.has(path))
    .map((path) => `${file} contains orphan package ${path}.`);
}

export function validateReleaseState(
  packages: readonly PackageDescriptor[],
  configValue: unknown,
  manifestValue: unknown,
  root = repositoryRoot,
): string[] {
  if (!isRecord(configValue)) {
    return [`${RELEASE_CONFIG_FILE} must contain a JSON object.`];
  }
  if (!isRecord(manifestValue)) {
    return [`${RELEASE_MANIFEST_FILE} must contain a JSON object.`];
  }
  const errors: string[] = [];
  validateGlobalConfig(configValue, errors);

  const configuredPackages = configValue["packages"];
  if (!isRecord(configuredPackages)) {
    errors.push(`${RELEASE_CONFIG_FILE} packages must contain a JSON object.`);
    return errors;
  }

  const expectedPaths = new Set(packages.map((descriptor) => packagePath(descriptor, root)));
  errors.push(
    ...validateOrphans(Object.keys(configuredPackages), expectedPaths, RELEASE_CONFIG_FILE),
    ...validateOrphans(Object.keys(manifestValue), expectedPaths, RELEASE_MANIFEST_FILE),
  );
  for (const descriptor of packages) {
    errors.push(...validatePackageEntry(descriptor, configuredPackages, manifestValue, root));
  }
  return errors;
}

export async function validateReleaseConfiguration(
  packages: readonly PackageDescriptor[],
  root = repositoryRoot,
): Promise<string[]> {
  const [config, manifest] = await Promise.all([
    readJsonFile(join(root, RELEASE_CONFIG_FILE)),
    readJsonFile(join(root, RELEASE_MANIFEST_FILE)),
  ]);
  return validateReleaseState(packages, config, manifest, root);
}
