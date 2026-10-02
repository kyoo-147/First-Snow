import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const CANDIDATES = [
  "playwright",
  "C:/Users/hoang/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright",
];

export function loadPlaywright() {
  for (const c of CANDIDATES) {
    try {
      return require(c);
    } catch {}
  }
  throw new Error("Playwright not found.");
}

export async function launch(chromium, opts = {}) {
  const attempts = [
    { headless: true, ...opts },
    { headless: true, channel: "chrome", ...opts },
    { headless: true, channel: "msedge", ...opts },
  ];
  let last;
  for (const a of attempts) {
    try {
      return await chromium.launch(a);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}
