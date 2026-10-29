// "npm run start" (2026-10-29): `next start` on the port the host gives
// (Hostinger sets PORT), or 3002 on Tom's PC, so one script serves both.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const next = require.resolve("next/dist/bin/next");
const port = process.env.PORT || "3002";
const child = spawn(process.execPath, [next, "start", "-p", port], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
