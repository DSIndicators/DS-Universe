// "prebuild" (2026-10-29). On Tom's PC it refreshes the covers and the pointers
// from his folders (tools/covers.mjs, tools/cursors.mjs). On the server
// (Hostinger builds from the repo) those folders do not exist, so it does
// NOTHING: the covers, their manifest (content/drop-covers.json) and the
// pointers are already in the repo as Tom's PC last made them. Without this
// guard the server would empty public/covers/drop and ship a site with no covers.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(".");
const DROP = path.join(ROOT, "Product Covers - drop new white covers here");
if (!fs.existsSync(DROP) || process.env.DS_SKIP_PREBUILD === "1") {
  console.log("  prebuild: no cover folders here (server build) - using the covers and pointers already in the repo.");
  process.exit(0);
}
for (const step of ["tools/covers.mjs", "tools/cursors.mjs"]) execFileSync(process.execPath, [step], { stdio: "inherit" });
