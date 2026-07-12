import { Buffer } from "node:buffer";

export const MAX_NOTE_JSON_BYTES = 512;
export const MAX_CUSTOM_JSON_BYTES = 2000;
export const MAX_REDIRECT_JSON_BYTES = 2000;
export const MAX_MODEL_CONTENT_BYTES = 8000;
export const MAX_COMPACT_RENDER_BYTES = 320;
export const TRUNCATION_MARKER = "… [truncated]";

function isControl(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return codePoint <= 31 || codePoint === 127;
}

function sanitizeCharacter(character: string): string {
  return isControl(character) && character !== "\t" && character !== "\n" ? "�" : character;
}

export function sanitizeText(value: string): string {
  const normalized = value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  let sanitized = "";
  for (const character of normalized) sanitized += sanitizeCharacter(character);
  return sanitized;
}

export function hasStructuralControl(value: string): boolean {
  for (const character of value) {
    if (isControl(character)) return true;
  }
  return false;
}

function boundSanitized(
  sanitized: string,
  maxBytes: number,
  encodedCost: (value: string) => number,
): string {
  if (encodedCost(sanitized) <= maxBytes) return sanitized;
  const contentBytes = Math.max(0, maxBytes - encodedCost(TRUNCATION_MARKER));
  let used = 0;
  let bounded = "";
  for (const character of sanitized) {
    const bytes = encodedCost(character);
    if (used + bytes > contentBytes) break;
    bounded += character;
    used += bytes;
  }
  return `${bounded}${TRUNCATION_MARKER}`;
}

export function boundUtf8(value: string, maxBytes: number): string {
  return boundSanitized(sanitizeText(value), maxBytes, (text) => Buffer.byteLength(text, "utf8"));
}

export function boundJsonUtf8(value: string, maxBytes: number): string {
  return boundSanitized(sanitizeText(value), maxBytes, (text) =>
    Math.max(0, Buffer.byteLength(JSON.stringify(text), "utf8") - 2),
  );
}
