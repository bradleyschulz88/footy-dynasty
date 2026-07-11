// Sync the shared game engine into the mobile app.
//
// The web app (../footy-dynasty/src) is the SINGLE SOURCE OF TRUTH. This copies
// the framework-agnostic engine (lib + data) into mobile/engine/ so React Native's
// Metro bundler — which only reliably serves files inside the project — can import
// it. Run automatically before start/build (see package.json pre* scripts), so the
// mobile copy never drifts. mobile/engine/ is git-ignored (generated, not forked).
import { cp, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const engineSrc = resolve(here, "../../footy-dynasty/src");
const dest = resolve(here, "../engine");

// Only the framework-agnostic parts of src are shared (no screens/components/DOM).
const PARTS = ["lib", "data"];

if (!existsSync(engineSrc)) {
  console.error(`[sync-engine] engine source not found at ${engineSrc}`);
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
for (const part of PARTS) {
  const from = resolve(engineSrc, part);
  if (existsSync(from)) await cp(from, resolve(dest, part), { recursive: true });
}
console.log(`[sync-engine] synced ${PARTS.join(", ")} → mobile/engine`);
