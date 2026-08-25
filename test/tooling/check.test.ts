import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runChecks, type CheckCommand } from "../../scripts/check.ts";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (root) => rm(root, { force: true, recursive: true })),
  );
});

describe("bounded check runner", () => {
  it("starts independent commands concurrently and prints buffered output in declaration order", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-check-test-"));
    temporaryRoots.push(root);
    const output: string[] = [];
    const command = (name: string, waitFor?: string): CheckCommand => {
      const marker = join(root, `${name}.started`);
      const wait =
        waitFor === undefined
          ? `console.log(${JSON.stringify(name)});`
          : `const deadline=Date.now()+2000;const timer=setInterval(()=>{if(fs.existsSync(${JSON.stringify(
              join(root, `${waitFor}.started`),
            )})){clearInterval(timer);console.log(${JSON.stringify(
              name,
            )});}else if(Date.now()>deadline){clearInterval(timer);process.exit(2);}},5);`;
      return {
        name,
        command: process.execPath,
        arguments: [
          "-e",
          `const fs=require('node:fs');fs.writeFileSync(${JSON.stringify(marker)},'');${wait}`,
        ],
      };
    };
    const result = await runChecks(
      [command("first", "second"), command("second", "first"), command("third")],
      { concurrency: 2, cwd: root, write: (text) => output.push(text) },
    );

    expect(result).toBe(0);
    expect(output.join("")).toMatch(/== first ==[\s\S]*== second ==[\s\S]*== third ==/u);
  });

  it("aggregates independent failures instead of stopping at the first command", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-check-test-"));
    temporaryRoots.push(root);
    const output: string[] = [];
    const command = (name: string, code: number): CheckCommand => ({
      name,
      command: process.execPath,
      arguments: ["-e", `console.log(${JSON.stringify(name)});process.exit(${String(code)})`],
    });

    const result = await runChecks(
      [command("first failure", 1), command("success", 0), command("second failure", 2)],
      { concurrency: 3, cwd: root, write: (text) => output.push(text) },
    );

    expect(result).toBe(1);
    expect(output.join("")).toMatch(/first failure[\s\S]*success[\s\S]*second failure/iu);
    expect(output.join("")).toContain("2 required check(s) failed");
  });

  it("rejects a non-positive concurrency bound", async () => {
    expect.hasAssertions();
    await expect(
      runChecks([], { concurrency: 0, cwd: process.cwd(), write: (): void => undefined }),
    ).rejects.toThrow(/positive integer/iu);
  });

  it("reports every failure and stops pending commands when cancelled", async () => {
    expect.hasAssertions();
    const root = await mkdtemp(join(tmpdir(), "pi-check-test-"));
    temporaryRoots.push(root);
    const output: string[] = [];
    const controller = new AbortController();
    const commands: CheckCommand[] = [
      {
        name: "failure",
        command: process.execPath,
        arguments: ["-e", "setTimeout(() => { console.error('failed');process.exit(1) }, 100)"],
      },
      {
        name: "waiting",
        command: process.execPath,
        arguments: ["-e", "setTimeout(() => console.log('late'), 1000)"],
      },
      {
        name: "pending",
        command: process.execPath,
        arguments: ["-e", "console.log('must not run')"],
      },
    ];
    setTimeout(() => {
      controller.abort();
    }, 20);

    const result = await runChecks(commands, {
      concurrency: 2,
      cwd: root,
      signal: controller.signal,
      write: (text) => output.push(text),
    });

    expect(result).toBe(1);
    expect(output.join("")).toContain("cancelled");
    expect(output.join("")).not.toContain("must not run");
  });
});
