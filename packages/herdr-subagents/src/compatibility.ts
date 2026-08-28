interface CompatibilityEvidence {
  readonly herdr: unknown;
  readonly rpc: unknown;
}

export type CompatibilityResult =
  { readonly enabled: true } | { readonly enabled: false; readonly reason: string };

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function version(value: unknown): readonly [number, number, number] | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(?:herdr\s+)?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/iu.exec(value.trim());
  if (match === null) return undefined;
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part))) return undefined;
  return parts as unknown as readonly [number, number, number];
}

function atLeast(
  actual: readonly [number, number, number],
  minimum: readonly [number, number, number],
): boolean {
  for (const index of [0, 1, 2] as const) {
    if (actual[index] !== minimum[index]) return actual[index] > minimum[index];
  }
  return true;
}

export function compatibility(value: unknown): CompatibilityResult {
  const evidence = record(value) as CompatibilityEvidence | undefined;
  if (evidence?.rpc !== 1) {
    return { enabled: false, reason: "pi-subagents RPC v1 is unavailable" };
  }
  const herdr = version(evidence.herdr);
  if (herdr === undefined || !atLeast(herdr, [0, 7, 5])) {
    return { enabled: false, reason: "Herdr 0.7.5 or later is required" };
  }
  return { enabled: true };
}
