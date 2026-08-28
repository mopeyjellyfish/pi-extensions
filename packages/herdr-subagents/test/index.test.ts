import { beforeEach, describe, expect, it, vi } from "vitest";

import herdrSubagentsExtension, { compatibility } from "../src/index.ts";

const { upstream } = vi.hoisted(() => ({ upstream: vi.fn() }));

vi.mock("pi-subagents", () => ({ default: upstream }));

describe("pi-herdr-subagents extension", () => {
  beforeEach(() => upstream.mockClear());
  it("composes the published upstream factory once", () => {
    expect.hasAssertions();

    herdrSubagentsExtension({ events: { on: vi.fn(() => vi.fn()) }, on: vi.fn() } as never);

    expect(upstream).toHaveBeenCalledOnce();
  });

  it("leaves the upstream child guard authoritative without starting a supervisor", () => {
    expect.hasAssertions();
    const previous = process.env["PI_SUBAGENT_CHILD"];
    process.env["PI_SUBAGENT_CHILD"] = "1";
    const on = vi.fn();
    try {
      herdrSubagentsExtension({ events: { on: vi.fn() }, on } as never);
    } finally {
      if (previous === undefined) delete process.env["PI_SUBAGENT_CHILD"];
      else process.env["PI_SUBAGENT_CHILD"] = previous;
    }

    expect(upstream).toHaveBeenCalledOnce();
    expect(on).not.toHaveBeenCalled();
  });

  it("accepts only supported Herdr and RPC capability evidence", () => {
    expect.hasAssertions();

    expect(compatibility({ herdr: "0.8.2", rpc: 1 })).toEqual({ enabled: true });
    expect(compatibility({ herdr: "0.7.4", rpc: 1 })).toMatchObject({ enabled: false });
    expect(compatibility(null)).toMatchObject({ enabled: false });
    expect(compatibility({ herdr: "herdr 0.7.5", rpc: 1 })).toEqual({ enabled: true });
    expect(compatibility({ herdr: "bad", rpc: 1 })).toMatchObject({ enabled: false });
    expect(compatibility({ herdr: "0.8.2", rpc: 2 })).toMatchObject({ enabled: false });
  });
});
