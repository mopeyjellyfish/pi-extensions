import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { glob } from "glob";

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function toPosixPath(value: string): string {
  return value.replaceAll("\\", "/");
}

export async function readJsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return undefined;
  }
  return value as string[];
}

export function stringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value) || Object.values(value).some((item) => typeof item !== "string")) {
    return undefined;
  }
  return value as Record<string, string>;
}

export async function findGoModules(root = repositoryRoot): Promise<string[]> {
  const paths = await glob("**/go.mod", {
    absolute: true,
    cwd: root,
    dot: true,
    ignore: [
      "**/.git/**",
      "**/.pi-subagents/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/dist/**",
      "**/vendor/**",
    ],
    nodir: true,
  });
  return paths.map((path) => resolve(path)).sort((left, right) => left.localeCompare(right));
}

export function pathExists(path: string): boolean {
  return existsSync(path);
}
