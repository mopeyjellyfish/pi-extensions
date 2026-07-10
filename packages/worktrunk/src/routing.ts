import { isAbsolute, relative, resolve, sep } from "node:path";

export interface PathOperations {
  readonly isAbsolute: typeof isAbsolute;
  readonly relative: typeof relative;
  readonly resolve: typeof resolve;
  readonly sep: string;
}

const DEFAULT_PATH_OPERATIONS: PathOperations = { isAbsolute, relative, resolve, sep };

function isInside(root: string, candidate: string, pathOperations: PathOperations): boolean {
  const difference = pathOperations.relative(
    pathOperations.resolve(root),
    pathOperations.resolve(candidate),
  );
  return (
    difference === "" ||
    (!difference.startsWith(`..${pathOperations.sep}`) &&
      difference !== ".." &&
      !pathOperations.isAbsolute(difference))
  );
}

function normalizeToolPath(input: string): string {
  return input.startsWith("@") ? input.slice(1) : input;
}

export function routePath(
  input: string,
  mainPath: string,
  activePath: string,
  pathOperations: PathOperations = DEFAULT_PATH_OPERATIONS,
): string {
  const normalized = normalizeToolPath(input);
  if (!pathOperations.isAbsolute(normalized)) {
    return pathOperations.resolve(activePath, normalized);
  }
  if (isInside(activePath, normalized, pathOperations)) {
    return pathOperations.resolve(normalized);
  }
  if (isInside(mainPath, normalized, pathOperations)) {
    return pathOperations.resolve(activePath, pathOperations.relative(mainPath, normalized));
  }
  return normalized;
}

function quoteBash(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

export function routeBashCommand(command: string, activePath: string): string {
  const shellPath = activePath.replaceAll("\\", "/");
  const prefix = `cd -- ${quoteBash(shellPath)} && `;
  return command.startsWith(prefix) ? command : `${prefix}${command}`;
}

export function routeOptionalPath(
  input: Record<string, unknown>,
  mainPath: string,
  activePath: string,
): void {
  const path = input["path"];
  input["path"] = routePath(typeof path === "string" ? path : ".", mainPath, activePath);
}
