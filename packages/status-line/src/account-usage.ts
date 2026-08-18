import { stripAnsi } from "./powerline.ts";

interface AccountLimit {
  readonly label: string;
  readonly limit?: number;
  readonly remaining?: number;
  readonly remainingPercent: number;
  readonly resetsAt?: number;
  readonly scope: "account" | "model" | "provider" | "spend";
  readonly usedPercent: number;
  readonly windowSeconds?: number;
}

export type AccountUsageSnapshot =
  | {
      readonly limits: readonly AccountLimit[];
      readonly observedAt: number;
      readonly plan?: string;
      readonly provider: string;
      readonly source: "codex-usage" | "response-headers";
      readonly status: "available";
    }
  | {
      readonly provider?: string;
      readonly reason: string;
      readonly status: "unavailable";
    };

interface AccountUsageModel {
  readonly api: string;
  readonly baseUrl?: string;
  readonly headers?: Readonly<Record<string, string | null>>;
  readonly id: string;
  readonly provider: string;
}

interface RequestAuth {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly error?: string;
  readonly headers?: Readonly<Record<string, string | null>>;
  readonly ok: boolean;
}

export interface AccountUsageContext {
  readonly fetch?: typeof globalThis.fetch;
  readonly model?: AccountUsageModel;
  readonly modelRegistry: {
    getApiKeyAndHeaders(model: AccountUsageModel): Promise<RequestAuth>;
    isUsingOAuth(model: AccountUsageModel): boolean;
  };
  readonly now?: () => number;
}

interface CodexWindow {
  readonly limit_window_seconds: number;
  readonly reset_at: number;
  readonly used_percent: number;
}

const JWT_CLAIM = "https://api.openai.com/auth";
const CODEX_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";
const MAX_USAGE_BYTES = 64 * 1024;
const MAX_ADDITIONAL_LIMITS = 20;
const MAX_LABEL_LENGTH = 80;
const MAX_WINDOW_SECONDS = 10 * 365 * 24 * 60 * 60;
const MAX_RESET_SECONDS = 8_640_000_000_000;

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function percentage(value: unknown): value is number {
  return finite(value) && value >= 0 && value <= 100;
}

function resetSeconds(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= MAX_RESET_SECONDS
  );
}

function cleanLabel(value: string): string | undefined {
  let clean = "";
  let length = 0;
  for (const character of stripAnsi(value)) {
    const codePoint = character.codePointAt(0) ?? 0;
    clean += codePoint < 32 || (codePoint >= 127 && codePoint <= 159) ? " " : character;
    length += 1;
    if (length >= MAX_LABEL_LENGTH) break;
  }
  clean = clean.replaceAll(/\s+/gu, " ").trim();
  return clean === "" ? undefined : clean;
}

function windowLabel(seconds: number): string {
  if (seconds === 604_800) return "Weekly limit";
  if (seconds % 86_400 === 0) return `${String(seconds / 86_400)} day limit`;
  if (seconds % 3600 === 0) return `${String(seconds / 3600)} hour limit`;
  return `${String(Math.round(seconds / 60))} minute limit`;
}

function codexWindow(value: unknown): CodexWindow | undefined {
  const candidate = record(value);
  if (
    candidate === undefined ||
    !finite(candidate["used_percent"]) ||
    candidate["used_percent"] < 0 ||
    candidate["used_percent"] > 100 ||
    !Number.isSafeInteger(candidate["limit_window_seconds"]) ||
    (candidate["limit_window_seconds"] as number) <= 0 ||
    (candidate["limit_window_seconds"] as number) > MAX_WINDOW_SECONDS ||
    !Number.isSafeInteger(candidate["reset_at"]) ||
    (candidate["reset_at"] as number) < 0 ||
    (candidate["reset_at"] as number) > MAX_RESET_SECONDS
  ) {
    return undefined;
  }
  return {
    limit_window_seconds: candidate["limit_window_seconds"] as number,
    reset_at: candidate["reset_at"] as number,
    used_percent: candidate["used_percent"],
  };
}

function accountLimit(
  value: CodexWindow,
  label = windowLabel(value.limit_window_seconds),
  scope: AccountLimit["scope"] = "account",
): AccountLimit {
  return {
    label,
    remainingPercent: 100 - value.used_percent,
    resetsAt: value.reset_at * 1000,
    scope,
    usedPercent: value.used_percent,
    windowSeconds: value.limit_window_seconds,
  };
}

function unavailable(provider: string, reason: string): AccountUsageSnapshot {
  return { provider, reason, status: "unavailable" };
}

function additionalLimits(value: unknown): AccountLimit[] | undefined {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_ADDITIONAL_LIMITS) return undefined;
  const limits: AccountLimit[] = [];
  for (const item of value) {
    const details = record(item);
    const rawLabel = details?.["limit_name"];
    const label = typeof rawLabel === "string" ? cleanLabel(rawLabel) : undefined;
    if (label === undefined) return undefined;
    const rawRateLimit = details?.["rate_limit"];
    if (rawRateLimit === undefined || rawRateLimit === null) continue;
    const rateLimit = record(rawRateLimit);
    if (rateLimit === undefined) return undefined;
    const windows = [
      codexWindow(rateLimit["primary_window"]),
      codexWindow(rateLimit["secondary_window"]),
    ].filter((entry): entry is CodexWindow => entry !== undefined);
    if (windows.length === 0) return undefined;
    limits.push(
      ...windows.map((entry) =>
        accountLimit(
          entry,
          windows.length === 1 ? label : `${label} · ${windowLabel(entry.limit_window_seconds)}`,
          "model",
        ),
      ),
    );
  }
  return limits;
}

function spendLimit(value: unknown): AccountLimit | null | undefined {
  if (value === undefined || value === null) return null;
  const spend = record(value);
  if (spend === undefined) return undefined;
  const rawIndividual = spend["individual_limit"];
  if (rawIndividual === undefined || rawIndividual === null) return null;
  const individual = record(rawIndividual);
  const usedPercent = individual?.["used_percent"];
  const remainingPercent = individual?.["remaining_percent"];
  const resetAt = individual?.["reset_at"];
  if (
    individual === undefined ||
    !percentage(usedPercent) ||
    !percentage(remainingPercent) ||
    !resetSeconds(resetAt)
  ) {
    return undefined;
  }
  return {
    label: "Spend limit",
    remainingPercent,
    resetsAt: resetAt * 1000,
    scope: "spend",
    usedPercent,
  };
}

function parseCodexUsagePayload(
  value: unknown,
  provider: string,
  observedAt: number,
): AccountUsageSnapshot {
  const payload = record(value);
  const rateLimit = record(payload?.["rate_limit"]);
  if (payload === undefined || rateLimit === undefined) {
    return unavailable(provider, "Usage response was not recognized");
  }
  const primary = codexWindow(rateLimit["primary_window"]);
  const secondary = codexWindow(rateLimit["secondary_window"]);
  if (primary === undefined && secondary === undefined) {
    return unavailable(provider, "Usage response contained no valid limits");
  }
  const limits = [primary, secondary]
    .filter((item): item is CodexWindow => item !== undefined)
    .map((item) => accountLimit(item));
  const additional = additionalLimits(payload["additional_rate_limits"]);
  if (additional === undefined) return unavailable(provider, "Usage response was not recognized");
  limits.push(...additional);
  const spend = spendLimit(payload["spend_control"]);
  if (spend === undefined) return unavailable(provider, "Usage response was not recognized");
  if (spend !== null) limits.push(spend);
  const rawPlan = payload["plan_type"];
  const plan = typeof rawPlan === "string" ? cleanLabel(rawPlan) : undefined;
  if (plan === undefined) return unavailable(provider, "Usage response was not recognized");
  return {
    limits,
    observedAt,
    plan,
    provider,
    source: "codex-usage",
    status: "available",
  };
}

function accountId(token: string): string | undefined {
  try {
    const payload = token.split(".", 3)[1];
    if (payload === undefined) return undefined;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    const auth = record(record(decoded)?.[JWT_CLAIM]);
    return typeof auth?.["chatgpt_account_id"] === "string"
      ? auth["chatgpt_account_id"]
      : undefined;
  } catch {
    return undefined;
  }
}

function requestHeaders(model: AccountUsageModel, auth: RequestAuth): Headers {
  const headers = new Headers();
  const deleted = new Set<string>();
  for (const source of [model.headers, auth.headers]) {
    for (const [name, value] of Object.entries(source ?? {})) {
      if (value === null) {
        deleted.add(name.toLowerCase());
        headers.delete(name);
      } else {
        deleted.delete(name.toLowerCase());
        headers.set(name, value);
      }
    }
  }
  if (auth.apiKey !== undefined && !headers.has("authorization") && !deleted.has("authorization")) {
    headers.set("authorization", `Bearer ${auth.apiKey}`);
  }
  if (!headers.has("chatgpt-account-id") && !deleted.has("chatgpt-account-id")) {
    const authorization = headers.get("authorization");
    const bearer = authorization?.replace(/^Bearer\s+/iu, "");
    const id = accountId(auth.apiKey ?? bearer ?? "");
    if (id !== undefined) headers.set("chatgpt-account-id", id);
  }
  headers.set("accept", "application/json");
  return headers;
}

function supportsCodexUsage(ctx: AccountUsageContext): boolean {
  return (
    ctx.model?.provider === "openai-codex" &&
    ctx.model.api === "openai-codex-responses" &&
    ctx.modelRegistry.isUsingOAuth(ctx.model)
  );
}

async function boundedJson(response: Response): Promise<unknown> {
  const bodyStream = response.body;
  if (bodyStream === null) return undefined;
  const reader = bodyStream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const result = await reader.read();
    const chunk = result.value as Uint8Array | undefined;
    if (chunk === undefined) break;
    size += chunk.byteLength;
    if (size > MAX_USAGE_BYTES) {
      await reader.cancel();
      throw new Error("Usage response is too large");
    }
    chunks.push(chunk);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body)) as unknown;
}

async function authWithSignal(
  ctx: AccountUsageContext,
  model: AccountUsageModel,
  signal: AbortSignal,
): Promise<RequestAuth | undefined> {
  if (signal.aborted) return undefined;
  return Promise.race([
    ctx.modelRegistry.getApiKeyAndHeaders(model),
    new Promise<undefined>((resolve) => {
      signal.addEventListener(
        "abort",
        () => {
          resolve(undefined);
        },
        { once: true },
      );
    }),
  ]);
}

async function requestCodexUsage(
  ctx: AccountUsageContext,
  model: AccountUsageModel,
  auth: RequestAuth,
  signal: AbortSignal,
  callerSignal?: AbortSignal,
): Promise<AccountUsageSnapshot> {
  try {
    const response = await (ctx.fetch ?? globalThis.fetch)(CODEX_USAGE_URL, {
      headers: requestHeaders(model, auth),
      signal,
    });
    if (!response.ok) {
      return unavailable(model.provider, `Usage request failed (${String(response.status)})`);
    }
    return parseCodexUsagePayload(
      await boundedJson(response),
      model.provider,
      (ctx.now ?? Date.now)(),
    );
  } catch (error) {
    if (callerSignal?.aborted === true) throw error;
    return unavailable(model.provider, "Usage request failed");
  }
}

export async function fetchAccountUsage(
  ctx: AccountUsageContext,
  signal?: AbortSignal,
): Promise<AccountUsageSnapshot> {
  const model = ctx.model;
  if (model === undefined || !supportsCodexUsage(ctx)) {
    return {
      ...(model === undefined ? {} : { provider: model.provider }),
      reason: "This provider does not expose reliable account usage",
      status: "unavailable",
    };
  }
  const timeout = AbortSignal.timeout(5000);
  const requestSignal = signal === undefined ? timeout : AbortSignal.any([signal, timeout]);
  const auth = await authWithSignal(ctx, model, requestSignal);
  if (auth === undefined) {
    if (signal?.aborted === true) throw new Error("Usage request was cancelled");
    return unavailable(model.provider, "Usage request timed out");
  }
  if (!auth.ok || !requestHeaders(model, auth).has("authorization")) {
    return {
      provider: model.provider,
      reason: "OpenAI Codex authentication is unavailable",
      status: "unavailable",
    };
  }
  return requestCodexUsage(ctx, model, auth, requestSignal, signal);
}

function numericHeader(
  headers: Readonly<Record<string, string>>,
  name: string,
): number | undefined {
  const value = headers[name];
  if (value === undefined || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function resetTime(value: string | undefined, observedAt: number): number | undefined {
  if (value === undefined) return undefined;
  const absolute = Date.parse(value);
  if (!Number.isNaN(absolute)) return absolute;
  const duration = value.trim();
  let consumed = 0;
  let milliseconds = 0;
  for (const match of duration.matchAll(/(\d+(?:\u{2E}\d+)?)(ms|[smh])/gu)) {
    if (match.index !== consumed) return undefined;
    const amount = Number(match[1]);
    const unit = match[2];
    const multiplier = unit === "ms" ? 1 : unit === "s" ? 1000 : unit === "m" ? 60_000 : 3_600_000;
    milliseconds += amount * multiplier;
    consumed += match[0].length;
  }
  const timestamp = observedAt + milliseconds;
  return consumed === duration.length &&
    consumed > 0 &&
    Number.isFinite(timestamp) &&
    timestamp >= 0 &&
    timestamp <= 8_640_000_000_000
    ? timestamp
    : undefined;
}

function headerLimit(
  headers: Readonly<Record<string, string>>,
  label: string,
  names: readonly [limit: string, remaining: string, reset: string],
  observedAt: number,
): AccountLimit | undefined {
  const limit = numericHeader(headers, names[0]);
  const remaining = numericHeader(headers, names[1]);
  if (limit === undefined || limit <= 0 || remaining === undefined || remaining > limit)
    return undefined;
  const remainingPercent = (remaining / limit) * 100;
  const resetsAt = resetTime(headers[names[2]], observedAt);
  if (resetsAt === undefined) return undefined;
  return {
    label,
    limit,
    remaining,
    remainingPercent,
    resetsAt,
    scope: "provider",
    usedPercent: 100 - remainingPercent,
  };
}

export function parseProviderLimitHeaders(
  provider: string,
  input: Readonly<Record<string, string>>,
  observedAt = Date.now(),
): AccountUsageSnapshot | undefined {
  const headers = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key.toLowerCase(), value]),
  );
  const dimensions: readonly [string, readonly [string, string, string]][] =
    provider === "anthropic"
      ? [
          [
            "Requests",
            [
              "anthropic-ratelimit-requests-limit",
              "anthropic-ratelimit-requests-remaining",
              "anthropic-ratelimit-requests-reset",
            ],
          ],
          [
            "Tokens",
            [
              "anthropic-ratelimit-tokens-limit",
              "anthropic-ratelimit-tokens-remaining",
              "anthropic-ratelimit-tokens-reset",
            ],
          ],
          [
            "Input tokens",
            [
              "anthropic-ratelimit-input-tokens-limit",
              "anthropic-ratelimit-input-tokens-remaining",
              "anthropic-ratelimit-input-tokens-reset",
            ],
          ],
          [
            "Output tokens",
            [
              "anthropic-ratelimit-output-tokens-limit",
              "anthropic-ratelimit-output-tokens-remaining",
              "anthropic-ratelimit-output-tokens-reset",
            ],
          ],
        ]
      : provider === "openai"
        ? [
            [
              "Requests",
              [
                "x-ratelimit-limit-requests",
                "x-ratelimit-remaining-requests",
                "x-ratelimit-reset-requests",
              ],
            ],
            [
              "Tokens",
              [
                "x-ratelimit-limit-tokens",
                "x-ratelimit-remaining-tokens",
                "x-ratelimit-reset-tokens",
              ],
            ],
            [
              "Project tokens",
              [
                "x-ratelimit-limit-project-tokens",
                "x-ratelimit-remaining-project-tokens",
                "x-ratelimit-reset-project-tokens",
              ],
            ],
          ]
        : [];
  const limits = dimensions
    .map(([label, names]) => headerLimit(headers, label, names, observedAt))
    .filter((limit): limit is AccountLimit => limit !== undefined);
  return limits.length === 0
    ? undefined
    : { limits, observedAt, provider, source: "response-headers", status: "available" };
}
