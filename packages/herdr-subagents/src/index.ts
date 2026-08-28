import { registerHerdrSubagentSupervisor } from "./supervisor.ts";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const upstreamSpecifier = ["pi", "subagents"].join("-");
const upstreamModule = (await import(upstreamSpecifier)) as {
  readonly default: (pi: ExtensionAPI) => void;
};
const registerSubagentExtension = upstreamModule.default;

export { compatibility } from "./compatibility.ts";

export default function herdrSubagentsExtension(pi: ExtensionAPI): void {
  registerSubagentExtension(pi);
  if (process.env["PI_SUBAGENT_CHILD"] === "1") return;
  registerHerdrSubagentSupervisor(pi);
}
