import { getEnvApiKey } from "@earendil-works/pi-ai/compat";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  type AgentToolUpdateCallback,
  type ExtensionAPI,
  type ExtensionContext,
  truncateHead,
} from "@earendil-works/pi-coding-agent";

import type { Api, Model } from "@earendil-works/pi-ai";

interface SearchSource {
  readonly title: string;
  readonly url: string;
}

export interface NativeSearchResult {
  readonly text: string;
  readonly sources: readonly SearchSource[];
}

type JsonObject = Record<string, unknown>;
type SearchThinkingLevel = ReturnType<ExtensionAPI["getThinkingLevel"]>;
const PROVIDER_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"] as const;
type ProviderThinkingLevel = (typeof PROVIDER_THINKING_LEVELS)[number];

interface SearchAuth {
  readonly apiKey?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly headers?: Readonly<Record<string, string>>;
}

interface SearchState {
  text: string;
}

interface AnthropicAttemptState {
  readonly blocks: (JsonObject | undefined)[];
  readonly partialJson: Map<number, string>;
  paused: boolean;
}

function supportsThinkingLevel(
  map: Readonly<Record<string, string | null>> | undefined,
  level: ProviderThinkingLevel,
): boolean {
  const mapped = map?.[level];
  return level === "xhigh" ? mapped !== undefined && mapped !== null : mapped !== null;
}

function clampThinkingLevel(
  map: Readonly<Record<string, string | null>> | undefined,
  requested: ProviderThinkingLevel,
): ProviderThinkingLevel {
  const requestedIndex = PROVIDER_THINKING_LEVELS.indexOf(requested);
  for (const level of PROVIDER_THINKING_LEVELS.slice(requestedIndex)) {
    if (supportsThinkingLevel(map, level)) {
      return level;
    }
  }
  const lowerLevels = PROVIDER_THINKING_LEVELS.slice(0, requestedIndex);
  while (lowerLevels.length > 0) {
    const level = lowerLevels.pop() ?? "off";
    if (supportsThinkingLevel(map, level)) {
      return level;
    }
  }
  return "off";
}

function mappedThinkingEffort(model: Model<Api>, thinkingLevel: SearchThinkingLevel): string {
  const map = model.thinkingLevelMap as Readonly<Record<string, string | null>> | undefined;
  const direct = map?.[thinkingLevel];
  if (typeof direct === "string") {
    return direct;
  }
  const requested = thinkingLevel === "max" ? "xhigh" : thinkingLevel;
  const clamped = clampThinkingLevel(map, requested);
  return map?.[clamped] ?? (clamped === "off" ? "none" : clamped);
}

function anthropicThinkingBudget(thinkingLevel: SearchThinkingLevel): number {
  const budgets: Readonly<Record<SearchThinkingLevel, number>> = {
    high: 16_384,
    low: 2048,
    max: 16_384,
    medium: 8192,
    minimal: 1024,
    off: 0,
    xhigh: 16_384,
  };
  return budgets[thinkingLevel];
}

function object(value: unknown): JsonObject | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

function string(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

async function readSseJson(
  response: Response,
  signal: AbortSignal | undefined,
  onEvent: (event: JsonObject) => void,
): Promise<void> {
  if (response.body === null) {
    throw new Error("The web search provider returned no response body.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let dataLines: string[] = [];

  const flush = (): void => {
    if (dataLines.length === 0) {
      return;
    }
    const data = dataLines.join("\n").trim();
    dataLines = [];
    if (data === "" || data === "[DONE]") {
      return;
    }
    const parsed = object(JSON.parse(data) as unknown);
    if (parsed !== undefined) {
      onEvent(parsed);
    }
  };

  try {
    for (;;) {
      if (signal?.aborted === true) {
        throw signal.reason instanceof Error ? signal.reason : new Error("Web search was aborted.");
      }
      const readResult: unknown = await reader.read();
      const chunk = object(readResult);
      if (chunk?.["done"] === true) {
        break;
      }
      const value = chunk?.["value"];
      if (!(value instanceof Uint8Array)) {
        throw new TypeError("The web search provider returned an invalid stream chunk.");
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/u);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line === "") {
          flush();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
    }
    if (buffer.startsWith("data:")) {
      dataLines.push(buffer.slice(5).trimStart());
    }
    flush();
  } finally {
    reader.releaseLock();
  }
}

function appendSource(sources: SearchSource[], candidate: SearchSource): void {
  let parsed: URL;
  try {
    parsed = new URL(candidate.url);
  } catch {
    return;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return;
  }
  if (Buffer.byteLength(parsed.href, "utf8") > 2048) {
    return;
  }
  let title = "";
  for (const character of candidate.title.trim()) {
    const codePoint = character.codePointAt(0) ?? 0;
    title += codePoint < 32 || codePoint === 127 ? " " : character;
  }
  const normalized = {
    title: title.slice(0, 300) || parsed.hostname,
    url: parsed.href,
  };
  if (sources.every((source) => source.url !== normalized.url)) {
    sources.push(normalized);
  }
}

function emitUpdate(text: string, update: AgentToolUpdateCallback | undefined): void {
  if (update === undefined) {
    return;
  }
  const visible = truncateHead(text, {
    maxBytes: DEFAULT_MAX_BYTES,
    maxLines: DEFAULT_MAX_LINES,
  });
  update({
    content: [{ text: visible.content, type: "text" }],
    details: { streaming: true, truncated: visible.truncated },
  });
}

function hasAuthHeader(headers: Readonly<Record<string, string>> | undefined): boolean {
  const bag = new Headers(headers);
  return ["authorization", "x-api-key", "x-goog-api-key"].some(
    (name) => (bag.get(name)?.trim().length ?? 0) > 0,
  );
}

async function resolveAuth(ctx: ExtensionContext, model: Model<Api>): Promise<SearchAuth> {
  const resolved = await ctx.modelRegistry.getApiKeyAndHeaders(model);
  if (!resolved.ok) {
    throw new Error(resolved.error);
  }
  if (resolved.apiKey !== undefined || hasAuthHeader(resolved.headers)) {
    return resolved;
  }
  const environmentKey = getEnvApiKey(model.provider, resolved.env);
  return environmentKey === undefined ? resolved : { ...resolved, apiKey: environmentKey };
}

async function providerFailure(provider: string, response: Response): Promise<Error> {
  const body = truncateHead(await response.text(), { maxBytes: 4096, maxLines: 20 });
  const suffix = body.truncated ? " [provider error truncated]" : "";
  return new Error(
    `${provider} web search failed (${String(response.status)}): ${body.content}${suffix}`,
  );
}

function collectOpenAiAnnotation(value: unknown, sources: SearchSource[]): void {
  const annotation = object(value);
  if (annotation?.["type"] !== "url_citation") {
    return;
  }
  const nested = object(annotation["url_citation"]);
  const url = string(annotation["url"]) ?? string(nested?.["url"]);
  if (url === undefined) {
    return;
  }
  const title = string(annotation["title"]) ?? string(nested?.["title"]) ?? "";
  appendSource(sources, { title, url });
}

function collectOpenAiWebSearchCall(item: JsonObject, sources: SearchSource[]): void {
  const action = object(item["action"]);
  for (const sourceValue of array(action?.["sources"])) {
    const source = object(sourceValue);
    const url = string(source?.["url"]);
    if (url !== undefined) {
      appendSource(sources, {
        title: string(source?.["title"]) ?? string(source?.["display_name"]) ?? "",
        url,
      });
    }
  }
}

function collectOpenAiMessage(item: JsonObject, sources: SearchSource[]): void {
  for (const contentValue of array(item["content"])) {
    const content = object(contentValue);
    if (content?.["type"] !== "output_text") {
      continue;
    }
    for (const annotation of array(content["annotations"])) {
      collectOpenAiAnnotation(annotation, sources);
    }
  }
}

function collectOpenAiOutputItem(value: unknown, sources: SearchSource[]): void {
  const item = object(value);
  if (item?.["type"] === "web_search_call") {
    collectOpenAiWebSearchCall(item, sources);
    return;
  }
  if (item?.["type"] === "message") {
    collectOpenAiMessage(item, sources);
  }
}

function collectOpenAiResponse(value: unknown, sources: SearchSource[]): void {
  const response = object(value);
  for (const item of array(response?.["output"])) {
    collectOpenAiOutputItem(item, sources);
  }
}

function resolveOpenAiUrl(model: Model<Api>): string {
  const baseUrl = model.baseUrl.replace(/\/+$/u, "");
  if (model.api !== "openai-codex-responses") {
    return `${baseUrl}/responses`;
  }
  if (baseUrl.endsWith("/codex/responses")) {
    return baseUrl;
  }
  return baseUrl.endsWith("/codex") ? `${baseUrl}/responses` : `${baseUrl}/codex/responses`;
}

function codexAccountId(token: string): string {
  try {
    const payloadPart = token.split(".", 3)[1];
    if (payloadPart === undefined) {
      throw new Error("missing token payload");
    }
    const payload = object(JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")));
    const auth = object(payload?.["https://api.openai.com/auth"]);
    const accountId = string(auth?.["chatgpt_account_id"]);
    if (accountId === undefined || accountId === "") {
      throw new Error("missing account ID");
    }
    return accountId;
  } catch (error) {
    throw new Error("Could not read the ChatGPT account ID from the Codex credential.", {
      cause: error,
    });
  }
}

function bearerToken(authorization: string | null): string | undefined {
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }
  const token = authorization.slice(7).trim();
  return token === "" ? undefined : token;
}

function openAiHeaders(model: Model<Api>, auth: SearchAuth): Headers {
  const headers = new Headers({
    accept: "text/event-stream",
    "content-type": "application/json",
    ...model.headers,
    ...auth.headers,
  });
  if (auth.apiKey !== undefined && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${auth.apiKey}`);
  }
  if (model.api !== "openai-codex-responses") {
    return headers;
  }
  const token = auth.apiKey ?? bearerToken(headers.get("authorization"));
  if (token === undefined) {
    throw new Error("No OAuth credential is configured for the selected Codex model.");
  }
  if (!headers.has("chatgpt-account-id")) {
    headers.set("chatgpt-account-id", codexAccountId(token));
  }
  if (!headers.has("originator")) {
    headers.set("originator", "codex_cli_rs");
  }
  return headers;
}

function handleOpenAiEvent(
  event: JsonObject,
  state: SearchState,
  sources: SearchSource[],
  update: AgentToolUpdateCallback | undefined,
): void {
  const type = string(event["type"]);
  switch (type) {
    case "response.output_text.delta": {
      state.text += string(event["delta"]) ?? "";
      emitUpdate(state.text, update);
      break;
    }
    case "response.output_text.annotation.added": {
      collectOpenAiAnnotation(event["annotation"], sources);
      break;
    }
    case "response.output_item.added":
    case "response.output_item.done": {
      collectOpenAiOutputItem(event["item"], sources);
      break;
    }
    case "response.completed":
    case "response.done": {
      collectOpenAiResponse(event["response"], sources);
      break;
    }
    case "error":
    case "response.failed": {
      const error = object(event["error"]);
      throw new Error(string(event["message"]) ?? string(error?.["message"]) ?? "OpenAI failed.");
    }
    case undefined:
    default:
  }
}

export async function searchOpenAi(
  model: Model<Api>,
  query: string,
  signal: AbortSignal | undefined,
  update: AgentToolUpdateCallback | undefined,
  ctx: ExtensionContext,
  thinkingLevel: SearchThinkingLevel,
): Promise<NativeSearchResult> {
  const auth = await resolveAuth(ctx, model);
  const isCodex = model.api === "openai-codex-responses";
  const headerBag = openAiHeaders(model, auth);
  const input = isCodex
    ? [{ content: [{ text: query, type: "input_text" }], role: "user" }]
    : query;
  const body: Record<string, unknown> = {
    include: ["web_search_call.action.sources"],
    input,
    model: model.id,
    store: false,
    stream: true,
    tools: [{ type: "web_search" }],
  };
  if (model.reasoning) {
    const effort = mappedThinkingEffort(model, thinkingLevel);
    body["reasoning"] = { effort };
  }
  if (isCodex) {
    body["instructions"] = "Answer the user's request using web search.";
    body["parallel_tool_calls"] = true;
    body["tool_choice"] = "required";
  }
  const response = await fetch(resolveOpenAiUrl(model), {
    body: JSON.stringify(body),
    headers: Object.fromEntries(headerBag.entries()),
    method: "POST",
    ...(signal === undefined ? {} : { signal }),
  });
  if (!response.ok) {
    throw await providerFailure("OpenAI", response);
  }

  const state: SearchState = { text: "" };
  const sources: SearchSource[] = [];
  await readSseJson(response, signal, (event) => {
    handleOpenAiEvent(event, state, sources, update);
  });
  return { sources, text: state.text === "" ? "No answer was returned." : state.text };
}

function googleText(event: JsonObject): string {
  const candidate = object(array(event["candidates"])[0]);
  const content = object(candidate?.["content"]);
  let text = "";
  for (const partValue of array(content?.["parts"])) {
    const part = object(partValue);
    text += string(part?.["text"]) ?? "";
  }
  return text;
}

function collectGoogleSources(event: JsonObject, sources: SearchSource[]): void {
  const candidate = object(array(event["candidates"])[0]);
  const metadata = object(candidate?.["groundingMetadata"] ?? candidate?.["grounding_metadata"]);
  for (const chunkValue of array(metadata?.["groundingChunks"] ?? metadata?.["grounding_chunks"])) {
    const chunk = object(chunkValue);
    const web = object(chunk?.["web"]);
    const url = string(web?.["uri"]);
    if (url !== undefined) {
      appendSource(sources, { title: string(web?.["title"]) ?? "", url });
    }
  }
}

function handleGoogleEvent(
  event: JsonObject,
  state: SearchState,
  sources: SearchSource[],
  update: AgentToolUpdateCallback | undefined,
): void {
  const providerError = object(event["error"]);
  if (providerError !== undefined) {
    throw new Error(string(providerError["message"]) ?? "Google web search failed.");
  }
  const delta = googleText(event);
  if (delta !== "") {
    state.text += delta;
    emitUpdate(state.text, update);
  }
  collectGoogleSources(event, sources);
}

export async function searchGoogle(
  model: Model<Api>,
  query: string,
  signal: AbortSignal | undefined,
  update: AgentToolUpdateCallback | undefined,
  ctx: ExtensionContext,
  thinkingLevel: SearchThinkingLevel,
): Promise<NativeSearchResult> {
  const auth = await resolveAuth(ctx, model);
  const headerBag = new Headers({
    accept: "text/event-stream",
    "content-type": "application/json",
    ...model.headers,
    ...auth.headers,
  });
  if (auth.apiKey !== undefined && !headerBag.has("x-goog-api-key")) {
    headerBag.set("x-goog-api-key", auth.apiKey);
  }
  const baseUrl = model.baseUrl.replace(/\/+$/u, "");
  const url = `${baseUrl}/models/${encodeURIComponent(model.id)}:streamGenerateContent?alt=sse`;
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: query }], role: "user" }],
    tools: [{ google_search: {} }],
  };
  if (model.reasoning) {
    const effort = mappedThinkingEffort(model, thinkingLevel);
    body["generationConfig"] = {
      thinkingConfig: { includeThoughts: true, thinkingLevel: effort.toUpperCase() },
    };
  }
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: Object.fromEntries(headerBag.entries()),
    method: "POST",
    ...(signal === undefined ? {} : { signal }),
  });
  if (!response.ok) {
    throw await providerFailure("Google", response);
  }

  const state: SearchState = { text: "" };
  const sources: SearchSource[] = [];
  await readSseJson(response, signal, (event) => {
    handleGoogleEvent(event, state, sources, update);
  });
  return { sources, text: state.text === "" ? "No answer was returned." : state.text };
}

function resolveAnthropicUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/u, "");
  return base.endsWith("/v1") ? `${base}/messages` : `${base}/v1/messages`;
}

function collectAnthropicResults(value: unknown, sources: SearchSource[]): void {
  const block = object(value);
  if (block?.["type"] !== "web_search_tool_result") {
    return;
  }
  const content = block["content"];
  const providerError = object(content);
  if (providerError?.["type"] === "web_search_tool_result_error") {
    const errorCode = string(providerError["error_code"]) ?? "unknown_error";
    throw new Error(`Anthropic web search failed: ${errorCode}`);
  }
  for (const resultValue of array(content)) {
    const result = object(resultValue);
    const url = string(result?.["url"]);
    if (url !== undefined) {
      appendSource(sources, { title: string(result?.["title"]) ?? "", url });
    }
  }
}

function collectAnthropicCitation(value: unknown, sources: SearchSource[]): void {
  const citation = object(value);
  const url = string(citation?.["url"]);
  if (url !== undefined) {
    appendSource(sources, { title: string(citation?.["title"]) ?? "", url });
  }
}

function anthropicEventIndex(event: JsonObject): number | undefined {
  const index = event["index"];
  return typeof index === "number" && Number.isInteger(index) && index >= 0 ? index : undefined;
}

function updateAnthropicContinuationBlock(
  event: JsonObject,
  delta: JsonObject,
  attempt: AnthropicAttemptState,
): void {
  const index = anthropicEventIndex(event);
  if (index === undefined) {
    return;
  }
  if (delta["type"] === "input_json_delta") {
    attempt.partialJson.set(
      index,
      `${attempt.partialJson.get(index) ?? ""}${string(delta["partial_json"]) ?? ""}`,
    );
    return;
  }
  const block = attempt.blocks[index];
  if (block === undefined) {
    return;
  }
  switch (delta["type"]) {
    case "text_delta":
      block["text"] = `${string(block["text"]) ?? ""}${string(delta["text"]) ?? ""}`;
      break;
    case "thinking_delta":
      block["thinking"] = `${string(block["thinking"]) ?? ""}${string(delta["thinking"]) ?? ""}`;
      break;
    case "signature_delta":
      block["signature"] = string(delta["signature"]) ?? "";
      break;
    case "citations_delta":
      block["citations"] = [...array(block["citations"]), delta["citation"]];
      break;
    default:
  }
}

function startAnthropicBlock(
  event: JsonObject,
  state: SearchState,
  attempt: AnthropicAttemptState,
  sources: SearchSource[],
  update: AgentToolUpdateCallback | undefined,
): void {
  const block = object(event["content_block"]);
  const index = anthropicEventIndex(event);
  if (block !== undefined && index !== undefined) {
    attempt.blocks[index] = { ...block };
    if (block["type"] === "text") {
      state.text += string(block["text"]) ?? "";
      emitUpdate(state.text, update);
    }
  }
  collectAnthropicResults(block, sources);
}

function stopAnthropicBlock(event: JsonObject, attempt: AnthropicAttemptState): void {
  const index = anthropicEventIndex(event);
  if (index === undefined) {
    return;
  }
  const partialJson = attempt.partialJson.get(index);
  const block = attempt.blocks[index];
  if (partialJson === undefined || block === undefined) {
    return;
  }
  block["input"] = JSON.parse(partialJson) as unknown;
  attempt.partialJson.delete(index);
}

function applyAnthropicDelta(
  event: JsonObject,
  state: SearchState,
  attempt: AnthropicAttemptState,
  sources: SearchSource[],
  update: AgentToolUpdateCallback | undefined,
): void {
  const delta = object(event["delta"]);
  if (delta === undefined) {
    return;
  }
  updateAnthropicContinuationBlock(event, delta, attempt);
  switch (delta["type"]) {
    case "text_delta":
      state.text += string(delta["text"]) ?? "";
      emitUpdate(state.text, update);
      break;
    case "citations_delta":
      collectAnthropicCitation(delta["citation"], sources);
      break;
    default:
  }
}

function handleAnthropicEvent(
  event: JsonObject,
  state: SearchState,
  attempt: AnthropicAttemptState,
  sources: SearchSource[],
  update: AgentToolUpdateCallback | undefined,
): void {
  const type = string(event["type"]);
  switch (type) {
    case "error": {
      const error = object(event["error"]);
      throw new Error(string(error?.["message"]) ?? "Anthropic web search failed.");
    }
    case "message_delta": {
      const delta = object(event["delta"]);
      if (delta?.["stop_reason"] === "pause_turn") {
        attempt.paused = true;
      }
      break;
    }
    case "content_block_start":
      startAnthropicBlock(event, state, attempt, sources, update);
      break;
    case "content_block_stop":
      stopAnthropicBlock(event, attempt);
      break;
    case "content_block_delta":
      applyAnthropicDelta(event, state, attempt, sources, update);
      break;
    case undefined:
    default:
  }
}

function anthropicHeaders(model: Model<Api>, auth: SearchAuth): Headers {
  const headers = new Headers({
    accept: "text/event-stream",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
    ...model.headers,
    ...auth.headers,
  });
  const isOAuth = auth.apiKey?.includes("sk-ant-oat") === true;
  if (auth.apiKey === undefined) {
    return headers;
  }
  if (!isOAuth) {
    if (!headers.has("x-api-key")) {
      headers.set("x-api-key", auth.apiKey);
    }
    return headers;
  }
  if (!headers.has("authorization")) {
    headers.set("authorization", `Bearer ${auth.apiKey}`);
  }
  const oauthBetas = ["claude-code-20250219", "oauth-2025-04-20"];
  const existingBetas = headers.get("anthropic-beta");
  headers.set(
    "anthropic-beta",
    existingBetas === null ? oauthBetas.join(",") : `${existingBetas},${oauthBetas.join(",")}`,
  );
  if (!headers.has("user-agent")) {
    headers.set("user-agent", "claude-cli/2.1.75");
  }
  if (!headers.has("x-app")) {
    headers.set("x-app", "cli");
  }
  return headers;
}

function addAnthropicThinking(
  body: JsonObject,
  model: Model<Api>,
  thinkingLevel: SearchThinkingLevel,
): void {
  if (!model.reasoning) {
    return;
  }
  if (thinkingLevel === "off") {
    const map = model.thinkingLevelMap as Readonly<Record<string, string | null>> | undefined;
    if (map?.["off"] !== null) {
      body["thinking"] = { type: "disabled" };
    }
    return;
  }
  const effort = mappedThinkingEffort(model, thinkingLevel);
  if (object(model.compat)?.["forceAdaptiveThinking"] === true) {
    body["thinking"] = { type: "adaptive" };
    body["output_config"] = { effort };
    return;
  }
  body["thinking"] = {
    budget_tokens: anthropicThinkingBudget(thinkingLevel),
    type: "enabled",
  };
}

async function runAnthropicSearch(
  model: Model<Api>,
  query: string,
  signal: AbortSignal | undefined,
  update: AgentToolUpdateCallback | undefined,
  headers: Headers,
  body: JsonObject,
): Promise<NativeSearchResult> {
  const initialMessage = { content: query, role: "user" };
  const state: SearchState = { text: "" };
  const sources: SearchSource[] = [];
  const pausedContent: JsonObject[] = [];
  for (let continuation = 0; continuation <= 2; continuation += 1) {
    body["messages"] =
      pausedContent.length === 0
        ? [initialMessage]
        : [initialMessage, { content: pausedContent, role: "assistant" }];
    const response = await fetch(resolveAnthropicUrl(model.baseUrl), {
      body: JSON.stringify(body),
      headers: Object.fromEntries(headers.entries()),
      method: "POST",
      ...(signal === undefined ? {} : { signal }),
    });
    if (!response.ok) {
      throw await providerFailure("Anthropic", response);
    }
    const attempt: AnthropicAttemptState = {
      blocks: [],
      partialJson: new Map(),
      paused: false,
    };
    await readSseJson(response, signal, (event) => {
      handleAnthropicEvent(event, state, attempt, sources, update);
    });
    if (!attempt.paused) {
      return { sources, text: state.text === "" ? "No answer was returned." : state.text };
    }
    pausedContent.push(
      ...attempt.blocks.filter((block): block is JsonObject => block !== undefined),
    );
    if (pausedContent.length === 0) {
      throw new Error("Anthropic paused the web search without resumable content.");
    }
  }
  throw new Error("Anthropic web search remained paused after two continuation requests.");
}

export async function searchAnthropic(
  model: Model<Api>,
  query: string,
  signal: AbortSignal | undefined,
  update: AgentToolUpdateCallback | undefined,
  ctx: ExtensionContext,
  thinkingLevel: SearchThinkingLevel,
): Promise<NativeSearchResult> {
  const auth = await resolveAuth(ctx, model);
  const body: Record<string, unknown> = {
    max_tokens: model.maxTokens,
    model: model.id,
    stream: true,
    tools: [{ max_uses: 15, name: "web_search", type: "web_search_20250305" }],
  };
  addAnthropicThinking(body, model, thinkingLevel);
  return await runAnthropicSearch(
    model,
    query,
    signal,
    update,
    anthropicHeaders(model, auth),
    body,
  );
}
