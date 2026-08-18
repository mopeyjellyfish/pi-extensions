import { accessSync, constants } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, posix, resolve, win32 } from "node:path";
import { fileURLToPath } from "node:url";

const UNICODE_SPACES = /[\u{A0}\u{2000}-\u{200A}\u{202F}\u{205F}\u{3000}]/gu;

function normalizeWindowsShellPath(path: string, platform: NodeJS.Platform): string {
  if (platform !== "win32" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    return path;
  const match = /^\/(?:mnt\/|cygdrive\/)?([a-z])(?:\/(.*))?$/iu.exec(path);
  if (match?.[1] === undefined) return path;
  const suffix = match[2]?.replaceAll("/", "\\");
  return `${match[1].toUpperCase()}:\\${suffix ?? ""}`;
}

function expandTilde(path: string, platform: NodeJS.Platform, home: string): string {
  if (path === "~") return home;
  if (!path.startsWith("~/") && (platform !== "win32" || !path.startsWith("~\\"))) return path;
  return (platform === "win32" ? win32 : posix).join(home, path.slice(2));
}

/** Match Pi's path normalization without depending on its private dist modules. */
export function normalizePiPath(
  path: string,
  platform: NodeJS.Platform = process.platform,
  home: string = homedir(),
): string {
  const normalized = normalizeWindowsShellPath(
    path.replaceAll(UNICODE_SPACES, " ").replace(/^@/u, ""),
    platform,
  );
  const expanded = expandTilde(normalized, platform, home);
  return expanded.startsWith("file://") ? fileURLToPath(expanded) : expanded;
}

export function absolutePath(path: string, cwd: string): string {
  const normalized = normalizePiPath(path);
  return isAbsolute(normalized) ? resolve(normalized) : resolve(cwd, normalized);
}

function fileExists(path: string): boolean {
  try {
    accessSync(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Match the built-in read tool's existing-file variants before canonicalization. */
export function resolvePiReadPath(
  path: string,
  cwd: string,
  exists: (candidate: string) => boolean = fileExists,
): string {
  const resolved = absolutePath(path, cwd);
  const nfd = resolved.normalize("NFD");
  const candidates = [
    resolved,
    resolved.replaceAll(/ (AM|PM)\./giu, "\u{202F}$1."),
    nfd,
    resolved.replaceAll("'", "’"),
    nfd.replaceAll("'", "’"),
  ];
  return candidates.find((candidate) => exists(candidate)) ?? resolved;
}
