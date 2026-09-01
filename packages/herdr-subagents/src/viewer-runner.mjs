import { startViewer } from "./viewer.ts";

const descriptorPath = process.env.PI_HERDR_SUBAGENT_DESCRIPTOR;
if (!descriptorPath) throw new Error("PI_HERDR_SUBAGENT_DESCRIPTOR is required.");
const session = await startViewer(descriptorPath);
process.once("SIGINT", session.close);
process.once("SIGTERM", session.close);
