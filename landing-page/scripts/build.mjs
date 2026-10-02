import { spawnSync } from "node:child_process";
import path from "node:path";

// Full, reproducible build:
//   1. pull + localize the live Khanmigo homepage  -> site/ (pristine)
//   2. snapshot that pristine document
//   3. swap all copy to AgentKid, emitting EN (/) and VI (/vi/)
//
// Pass --skip-mirror to re-run only the content swap against the existing
// snapshot (fast, no network).

const HERE = import.meta.dirname;
const skipMirror = process.argv.includes("--skip-mirror");

const steps = skipMirror
  ? [
      ["restore-brand-assets.mjs", "1/2  restore AgentKid assets"],
      ["swap-content.mjs", "2/2  swap content -> EN + VI"],
    ]
  : [
      ["mirror.mjs", "1/4  mirror live homepage"],
      ["restore-brand-assets.mjs", "2/4  restore AgentKid assets"],
      ["snapshot-pristine.mjs", "3/4  snapshot pristine"],
      ["swap-content.mjs", "4/4  swap content -> EN + VI"],
    ];

for (const [script, label] of steps) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync(process.execPath, [path.join(HERE, script)], { stdio: "inherit", cwd: path.resolve(HERE, "..") });
  if (r.status !== 0) {
    console.error(`\nFAILED at ${script}`);
    process.exit(r.status || 1);
  }
}

console.log("\nBuild complete. Serve with:  node scripts/server.mjs 8124");
