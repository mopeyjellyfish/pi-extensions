import { join } from "node:path";

import { diagnoseProfile, resolveAgentDir } from "./lib/profile-doctor.ts";

const arguments_ = process.argv.slice(2);
if (arguments_.length > 2) {
  process.stderr.write("Usage: npm run profile:doctor -- [settings.json] [subagent/config.json]\n");
  process.exitCode = 2;
} else {
  const agentDir = resolveAgentDir(process.env["PI_CODING_AGENT_DIR"]);
  const diagnostics = await diagnoseProfile(
    arguments_[0] ?? join(agentDir, "settings.json"),
    arguments_[1] ?? join(agentDir, "extensions", "subagent", "config.json"),
    process.cwd(),
  );
  process.stdout.write(
    `${JSON.stringify({ diagnostics, ok: diagnostics.every((item) => item.severity !== "error") }, null, 2)}\n`,
  );
  process.exitCode = diagnostics.some((item) => item.severity === "error") ? 1 : 0;
}
