import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "assets", "received");
const SITE_ASSETS = path.join(ROOT, "site", "mirror", "khanmigo", "assets");

const assets = [
  ["agentkid-logo-final.png", path.join("brand", "agentkid-logo.png")],
  ["agentkid-favicon.png", path.join("brand", "agentkid-favicon.png")],
  ["hero-source.png", path.join("agentkid", "hero.png")],
  ["children-source.png", path.join("agentkid", "children.png")],
  ["parents-source.png", path.join("agentkid", "parents.png")],
  ["safety-source.png", path.join("agentkid", "safety.png")],
  ["product-surface-source.png", path.join("agentkid", "product-surface.png")],
  ["footer-source.png", path.join("agentkid", "footer.png")],
];

for (const [sourceName, destination] of assets) {
  const source = path.join(SOURCE, sourceName);
  const target = path.join(SITE_ASSETS, destination);
  if (!fs.existsSync(source)) {
    console.error(`Missing AgentKid source asset: ${source}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`${sourceName} -> ${path.relative(ROOT, target)}`);
}
