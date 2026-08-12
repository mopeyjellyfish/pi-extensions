import { describe, expect, it, vi } from "vitest";

import {
  fetchAccountUsage,
  parseProviderLimitHeaders,
  type AccountUsageContext,
} from "../src/account-usage.ts";

const codexModel = {
  api: "openai-codex-responses",
  baseUrl: "https://chatgpt.com/backend-api",
  id: "gpt-5.6-sol",
  provider: "openai-codex",
} as const;

function token(accountId: string): string {
  return `x.${Buffer.from(
    JSON.stringify({ "https://api.openai.com/auth": { chatgpt_account_id: accountId } }),
  ).toString("base64url")}.x`;
}

describe("account usage", () => {
  it("fetches and validates OpenAI Codex subscription limits", async () => {
    expect.hasAssertions();
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      Response.json({
        additional_rate_limits: [
          {
            limit_name: "GPT-5.3-Codex-Spark",
            rate_limit: {
              primary_window: {
                limit_window_seconds: 604_800,
                reset_at: 1_800_000_000,
                used_percent: 40,
              },
            },
          },
        ],
        plan_type: "pro",
        rate_limit: {
          primary_window: {
            limit_window_seconds: 18_000,
            reset_at: 1_700_000_000,
            used_percent: 25,
          },
          secondary_window: {
            limit_window_seconds: 604_800,
            reset_at: 1_800_000_000,
            used_percent: 70,
          },
        },
      }),
    );
    const ctx: AccountUsageContext = {
      fetch,
      model: { ...codexModel, headers: { "X-Client": "old", "X-Model": "yes" } },
      modelRegistry: {
        getApiKeyAndHeaders: vi.fn().mockResolvedValue({
          apiKey: token("account-1"),
          headers: { "X-Client": "pi" },
          ok: true,
        }),
        isUsingOAuth: () => true,
      },
      now: () => 1_600_000_000_000,
    };

    const result = await fetchAccountUsage(ctx);

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe("https://chatgpt.com/backend-api/wham/usage");
    expect(new Headers(init?.headers).get("authorization")).toMatch(/^Bearer /u);
    expect(new Headers(init?.headers).get("chatgpt-account-id")).toBe("account-1");
    expect(new Headers(init?.headers).get("x-client")).toBe("pi");
    expect(new Headers(init?.headers).get("x-model")).toBe("yes");
    expect(result).toMatchObject({
      limits: [
        { label: "5 hour limit", remainingPercent: 75 },
        { label: "Weekly limit", remainingPercent: 30 },
        { label: "GPT-5.3-Codex-Spark", remainingPercent: 60 },
      ],
      plan: "pro",
      provider: "openai-codex",
      source: "codex-usage",
      status: "available",
    });
  });

  it("fails closed for unsupported, malformed, unauthenticated, and failed requests", async () => {
    expect.hasAssertions();
    const unsupported = await fetchAccountUsage({
      model: { api: "google-generative-ai", id: "gemini", provider: "google" },
      modelRegistry: {
        getApiKeyAndHeaders: vi.fn(),
        isUsingOAuth: () => false,
      },
    });
    expect(unsupported).toMatchObject({ status: "unavailable" });

    const malformed = await fetchAccountUsage({
      fetch: vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(
          Response.json({ rate_limit: { primary_window: { used_percent: 101 } } }),
        ),
      model: codexModel,
      modelRegistry: {
        getApiKeyAndHeaders: vi.fn().mockResolvedValue({ apiKey: "bad", ok: true }),
        isUsingOAuth: () => true,
      },
    });
    expect(malformed).toMatchObject({ status: "unavailable" });

    const noAuth = await fetchAccountUsage({
      model: codexModel,
      modelRegistry: {
        getApiKeyAndHeaders: vi.fn().mockResolvedValue({ error: "no auth", ok: false }),
        isUsingOAuth: () => true,
      },
    });
    expect(noAuth).toMatchObject({ reason: "OpenAI Codex authentication is unavailable" });

    const failed = await fetchAccountUsage({
      fetch: vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response("no", { status: 503 })),
      model: codexModel,
      modelRegistry: {
        getApiKeyAndHeaders: vi.fn().mockResolvedValue({ apiKey: token("account-1"), ok: true }),
        isUsingOAuth: () => true,
      },
    });
    expect(failed).toMatchObject({ reason: "Usage request failed (503)" });
  });

  it("honors deleted auth headers and handles alternate windows and request failures", async () => {
    expect.hasAssertions();
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      Response.json({
        additional_rate_limits: [{ limit_name: "unused", rate_limit: null }],
        plan_type: "free",
        rate_limit: {
          primary_window: {
            limit_window_seconds: 86_400,
            reset_at: 1_800_000_000,
            used_percent: 10,
          },
          secondary_window: {
            limit_window_seconds: 60,
            reset_at: 1_800_000_100,
            used_percent: 20,
          },
        },
        spend_control: { individual_limit: null },
      }),
    );
    const modelRegistry = {
      getApiKeyAndHeaders: vi.fn().mockResolvedValue({
        apiKey: token("account-1"),
        headers: { "ChatGPT-Account-Id": null },
        ok: true,
      }),
      isUsingOAuth: () => true,
    };

    const result = await fetchAccountUsage({ fetch, model: codexModel, modelRegistry });
    const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    expect(headers.has("authorization")).toBe(true);
    expect(headers.has("chatgpt-account-id")).toBe(false);
    expect(result).toMatchObject({
      limits: [
        { label: "1 day limit", remainingPercent: 90 },
        { label: "1 minute limit", remainingPercent: 80 },
      ],
      status: "available",
    });

    const failed = await fetchAccountUsage({
      fetch: vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error("network")),
      model: codexModel,
      modelRegistry,
    });
    expect(failed).toMatchObject({ reason: "Usage request failed" });

    const controller = new AbortController();
    controller.abort();
    await expect(
      fetchAccountUsage(
        {
          fetch: vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error("aborted")),
          model: codexModel,
          modelRegistry,
        },
        controller.signal,
      ),
    ).rejects.toThrow("Usage request was cancelled");
  });

  it("bounds auth wait and response size and accepts header-only bearer auth", async () => {
    expect.hasAssertions();
    const controller = new AbortController();
    const pending = fetchAccountUsage(
      {
        model: codexModel,
        modelRegistry: {
          getApiKeyAndHeaders: () =>
            new Promise(() => {
              controller.signal.throwIfAborted();
            }),
          isUsingOAuth: () => true,
        },
      },
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toThrow("Usage request was cancelled");

    const oversized = await fetchAccountUsage({
      fetch: vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response("x".repeat(64 * 1024 + 1))),
      model: codexModel,
      modelRegistry: {
        getApiKeyAndHeaders: vi.fn().mockResolvedValue({
          headers: { Authorization: "Bearer stored" },
          ok: true,
        }),
        isUsingOAuth: () => true,
      },
    });
    expect(oversized).toMatchObject({ reason: "Usage request failed" });

    const headerFetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      Response.json({
        plan_type: "pro",
        rate_limit: {
          primary_window: {
            limit_window_seconds: 3600,
            reset_at: 1_800_000_000,
            used_percent: 50,
          },
        },
      }),
    );
    const headerOnly = await fetchAccountUsage({
      fetch: headerFetch,
      model: { ...codexModel, headers: { Authorization: null } },
      modelRegistry: {
        getApiKeyAndHeaders: vi.fn().mockResolvedValue({
          headers: { Authorization: `Bearer ${token("account-1")}` },
          ok: true,
        }),
        isUsingOAuth: () => true,
      },
    });
    expect(headerOnly).toMatchObject({ status: "available" });
    expect(new Headers(headerFetch.mock.calls[0]?.[1]?.headers).get("chatgpt-account-id")).toBe(
      "account-1",
    );

    const modelOnlyFetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      Response.json({
        plan_type: "pro",
        rate_limit: {
          primary_window: {
            limit_window_seconds: 3600,
            reset_at: 1_800_000_000,
            used_percent: 50,
          },
        },
      }),
    );
    const modelOnly = await fetchAccountUsage({
      fetch: modelOnlyFetch,
      model: {
        ...codexModel,
        headers: { Authorization: `Bearer ${token("account-2")}` },
      },
      modelRegistry: {
        getApiKeyAndHeaders: vi.fn().mockResolvedValue({ ok: true }),
        isUsingOAuth: () => true,
      },
    });
    expect(modelOnly).toMatchObject({ status: "available" });
    expect(new Headers(modelOnlyFetch.mock.calls[0]?.[1]?.headers).get("chatgpt-account-id")).toBe(
      "account-2",
    );
  });

  it("rejects unsafe Codex payload fields and sanitizes bounded labels", async () => {
    expect.hasAssertions();
    const modelRegistry = {
      getApiKeyAndHeaders: vi.fn().mockResolvedValue({ apiKey: token("account-1"), ok: true }),
      isUsingOAuth: () => true,
    };
    const parse = (payload: unknown) =>
      fetchAccountUsage({
        fetch: vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(payload)),
        model: codexModel,
        modelRegistry,
      });
    const window = {
      limit_window_seconds: 3600,
      reset_at: 1_800_000_000,
      used_percent: 10,
    };

    await expect(
      parse({
        plan_type: "pro",
        rate_limit: { primary_window: { ...window, reset_at: 9_000_000_000_000 } },
      }),
    ).resolves.toMatchObject({ status: "unavailable" });
    await expect(
      parse({
        plan_type: "pro",
        rate_limit: { primary_window: window },
        additional_rate_limits: Array.from({ length: 21 }, () => ({})),
      }),
    ).resolves.toMatchObject({ status: "unavailable" });
    await expect(
      parse({ plan_type: "", rate_limit: { primary_window: window } }),
    ).resolves.toMatchObject({ status: "unavailable" });

    const sanitized = await parse({
      additional_rate_limits: [
        {
          limit_name: `\u{1B}[31mSpark\n${"x".repeat(100)}`,
          rate_limit: { primary_window: window },
        },
      ],
      plan_type: "pro",
      rate_limit: { primary_window: window },
      spend_control: {
        individual_limit: {
          remaining_percent: 15,
          reset_at: 1_800_000_000,
          used_percent: 85,
        },
      },
    });
    expect(sanitized).toMatchObject({ status: "available" });
    const label = sanitized.status === "available" ? sanitized.limits[1]?.label : undefined;
    expect(label).not.toContain("\u{1B}");
    expect(label?.length).toBeLessThanOrEqual(80);
    const spend =
      sanitized.status === "available"
        ? sanitized.limits.find((limit) => limit.label === "Spend limit")
        : undefined;
    expect(spend).toMatchObject({ label: "Spend limit", remainingPercent: 15 });
  });

  it("parses documented OpenAI and Anthropic response-header limits", () => {
    expect.hasAssertions();
    expect(
      parseProviderLimitHeaders(
        "openai",
        {
          "x-ratelimit-limit-project-tokens": "40000",
          "x-ratelimit-limit-requests": "100",
          "x-ratelimit-limit-tokens": "20000",
          "x-ratelimit-remaining-project-tokens": "10000",
          "x-ratelimit-remaining-requests": "25",
          "x-ratelimit-remaining-tokens": "10000",
          "x-ratelimit-reset-project-tokens": "1h",
          "x-ratelimit-reset-requests": "6m0s",
          "x-ratelimit-reset-tokens": "30s",
        },
        1000,
      ),
    ).toMatchObject({
      limits: [
        { label: "Requests", remainingPercent: 25 },
        { label: "Tokens", remainingPercent: 50 },
        { label: "Project tokens", remainingPercent: 25 },
      ],
      source: "response-headers",
      status: "available",
    });
    expect(
      parseProviderLimitHeaders(
        "anthropic",
        {
          "anthropic-ratelimit-requests-limit": "50",
          "anthropic-ratelimit-requests-remaining": "5",
          "anthropic-ratelimit-requests-reset": "2030-01-01T00:00:00Z",
          "anthropic-ratelimit-tokens-limit": "10000",
          "anthropic-ratelimit-tokens-remaining": "2000",
          "anthropic-ratelimit-tokens-reset": "2030-01-01T00:00:00Z",
        },
        1000,
      ),
    ).toMatchObject({
      limits: [
        { label: "Requests", remainingPercent: 10 },
        { label: "Tokens", remainingPercent: 20 },
      ],
    });
    expect(
      parseProviderLimitHeaders(
        "openai",
        {
          "x-ratelimit-limit-requests": "100",
          "x-ratelimit-remaining-requests": "50",
        },
        1000,
      ),
    ).toBeUndefined();
    expect(
      parseProviderLimitHeaders(
        "openai",
        {
          "x-ratelimit-limit-requests": "100",
          "x-ratelimit-remaining-requests": "50",
          "x-ratelimit-reset-requests": `${"9".repeat(400)}h`,
        },
        1000,
      ),
    ).toBeUndefined();
    expect(parseProviderLimitHeaders("google", {}, 1000)).toBeUndefined();
  });
});
