import fs from "node:fs";
import path from "node:path";

const RECON = path.resolve(import.meta.dirname, "..", "RECON");
const map = JSON.parse(fs.readFileSync(path.join(RECON, "asset-map.json"), "utf8"));
const net = JSON.parse(fs.readFileSync(path.join(RECON, "original-network.json"), "utf8"));
const signals = JSON.parse(fs.readFileSync(path.join(RECON, "original-signals.json"), "utf8"));
const blocked = JSON.parse(fs.readFileSync(path.join(RECON, "blocked-requests.json"), "utf8"));
const interact = JSON.parse(fs.readFileSync(path.join(RECON, "interaction-test.json"), "utf8"));

const rows = map.rows;
const ext = {};
for (const r of rows) {
  if (r.status !== "LOCALIZED") continue;
  const e = path.extname(r.rel).toLowerCase();
  if (/\.(webp|png|jpg|jpeg|gif|avif|svg)$/.test(e)) ext[e] = (ext[e] || 0) + 1;
}
const imgTotal = Object.values(ext).reduce((a, b) => a + b, 0);

const hosts = {};
net.forEach((r) => {
  let h = "?";
  try {
    h = new URL(r.url).host;
  } catch {}
  hosts[h] = (hosts[h] || 0) + 1;
});

console.log("IMAGE ASSETS (unique files localized):", imgTotal);
console.log("  by format:", JSON.stringify(ext));
console.log("");
console.log("STYLESHEETS:", signals.stylesheets.length);
console.log("SCRIPTS (src):", signals.scripts.length);
console.log("FONT FILES:", rows.filter((r) => r.status === "LOCALIZED" && r.rel.includes("/fonts/")).length);
console.log("FONT FACES in delivered css (browser loaded):", signals.fonts.length, "font-face rules:", signals.fontFaces.length);
console.log("FONT FAMILIES:", [...new Set(signals.fonts.map((f) => f.family))].join(", "));
console.log("");
console.log("img elements in DOM:", signals.images.length);
console.log("  with srcset (responsive variants):", signals.images.filter((i) => i.srcset).length);
console.log("picture elements:", signals.pictureCount);
console.log("video elements:", signals.videos.length);
console.log("iframe elements (live):", signals.iframes.length, JSON.stringify(signals.iframes.map((f) => f.src)));
console.log("svgs inline in DOM:", (fs.readFileSync(path.join(RECON, "original-source.html"), "utf8").match(/<svg/g) || []).length);
console.log("");
console.log("NETWORK total responses:", net.length);
console.log("  by host:", JSON.stringify(hosts, null, 0));
console.log("BLOCKED (tracking/consent) requests:", blocked.length);
const bh = {};
blocked.forEach((u) => {
  try {
    bh[new URL(u).host] = (bh[new URL(u).host] || 0) + 1;
  } catch {}
});
console.log("  blocked hosts:", JSON.stringify(bh));
console.log("");
console.log("scrollHeight original:", signals.scrollHeight);
console.log("console errors on live original:", JSON.parse(fs.readFileSync(path.join(RECON, "original-console.json"), "utf8")).filter((m) => m.type === "error" || m.type === "pageerror").length);
console.log("");
console.log("INTERACTION clone vs original:");
console.log("  typer cycles:", interact.clone.typer.cycles, "/", interact.original.typer.cycles);
console.log("  faq toggles:", interact.clone.faq.openTest.toggled, "/", interact.original.faq.openTest.toggled, "items:", interact.clone.faq.items);
console.log("  slider advances:", interact.clone.slider.advanced, "/", interact.original.slider.advanced);
console.log("  mobile nav opens:", interact.clone.mobileNav.menuVisible, "/", interact.original.mobileNav.menuVisible);
console.log("  ix2:", interact.clone.runtime.ix2Instances, "/", interact.original.runtime.ix2Instances);
console.log("  console errors:", interact.clone.consoleErrors.length, "/", interact.original.consoleErrors.length);
