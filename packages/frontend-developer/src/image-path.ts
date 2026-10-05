import { isAbsolute, relative, resolve } from "node:path";

export function pathFrom(cwd: string, value: string): string {
  const normalized = value.startsWith("@") ? value.slice(1) : value;
  const root = resolve(cwd);
  const path = isAbsolute(normalized) ? resolve(normalized) : resolve(root, normalized);
  const fromRoot = relative(root, path);
  if (fromRoot === "" || fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error("Image paths must stay within the project directory.");
  }
  return path;
}
