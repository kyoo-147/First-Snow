import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..");
const RECON = path.join(OUT, "RECON");

const map = JSON.parse(fs.readFileSync(path.join(RECON, "asset-map.json"), "utf8"));
const blocked = JSON.parse(fs.readFileSync(path.join(RECON, "blocked-requests.json"), "utf8"));

const AREA_LABEL = {
  brand: "Brand",
  hero: "Hero",
  press: "Social proof / press",
  teacher: "On-demand support — teacher block",
  learners: "On-demand support — learner block",
  parents: "On-demand support — parent block",
  testimonials: "Testimonials (slider)",
  ted: "TED / future of learning",
  "final-cta": "Final CTA + footer",
  icons: "Icons / favicons",
  misc: "Misc / shared stylesheet backgrounds",
  styles: "Stylesheets",
  fonts: "Fonts",
  scripts: "Scripts",
  root: "Document",
};

const TYPE = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".html": "text/html",
};

function typeOf(p) {
  const ext = path.extname(p).toLowerCase();
  return TYPE[ext] || ext.replace(".", "") || "?";
}

function areaOf(rel) {
  const m = rel.match(/assets\/([^/]+)\//);
  if (m) return m[1];
  if (rel.includes("/styles/")) return "styles";
  if (rel.includes("/scripts/")) return "scripts";
  if (rel.includes("/fonts/")) return "fonts";
  return "root";
}

const rows = map.rows.filter((r) => {
  // Drop bare origins (preconnect hints such as https://fonts.gstatic.com/) —
  // these are not assets, they were only discovery hints in the source <head>.
  try {
    const u = new URL(r.remote);
    if (u.pathname === "/" || u.pathname === "") return false;
  } catch {
    return false;
  }
  return true;
});

// group by area for readability
const groups = new Map();
for (const r of rows) {
  const a = r.area && AREA_LABEL[r.area] ? r.area : areaOf(r.rel || "");
  if (!groups.has(a)) groups.set(a, []);
  groups.get(a).push(r);
}

const order = ["root", "styles", "scripts", "fonts", "brand", "hero", "press", "teacher", "learners", "parents", "testimonials", "ted", "final-cta", "icons", "misc"];

let md = "";
md += "# Khanmigo Home Mirror — Asset Inventory\n\n";
md += `Source: \`https://www.khanmigo.ai/\` (homepage route only)\n\n`;
md += `Generated: ${new Date().toISOString().slice(0, 10)} from live browser/network inspection.\n\n`;
md += "Local web root is `web-new/site/`. All paths below are relative to it.\n\n";

const counts = {};
for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;

md += "## Summary\n\n";
md += "| Status | Count |\n|---|---|\n";
for (const [k, v] of Object.entries(counts)) md += `| ${k} | ${v} |\n`;
md += `| **Total** | **${rows.length}** |\n\n`;

const localByStatus = (s) => rows.filter((r) => r.status === s);

md += "## UNAVAILABLE (broken on the source itself — reproduced faithfully)\n\n";
md += "| Local Path | Source URL | Type | Homepage Area | Status |\n|---|---|---|---|---|\n";
for (const r of localByStatus("UNAVAILABLE")) {
  md += `| \`${r.rel || "—"}\` | ${r.remote} | ${typeOf(r.remote)} | ${AREA_LABEL[areaOf(r.rel || "")] || "—"} | UNAVAILABLE |\n`;
}
md += "\n";

md += "## Assets\n\n";
for (const key of order) {
  const list = groups.get(key);
  if (!list || !list.length) continue;
  md += `### ${AREA_LABEL[key] || key} (${list.length})\n\n`;
  md += "| Local Path | Source URL | Type | Homepage Area | Status |\n|---|---|---|---|---|\n";
  for (const r of list.sort((a, b) => String(a.rel).localeCompare(String(b.rel)))) {
    md += `| \`${r.rel}\` | ${r.remote} | ${typeOf(r.rel || r.remote)} | ${AREA_LABEL[key] || key} | ${r.status} |\n`;
  }
  md += "\n";
}

md += "## REMOTE_REQUIRED (intentionally left online)\n\n";
md += "These are external destinations/embeds, not homepage assets. Per scope they are not mirrored.\n\n";
md += "| Local Path | Source URL | Type | Homepage Area | Status |\n|---|---|---|---|---|\n";
md += "| — | https://www.youtube.com/watch?v=hJP5GqnTrNo | video embed (Webflow lightbox) | TED / future of learning | REMOTE_REQUIRED |\n";
md += "| — | https://i.ytimg.com/vi/hJP5GqnTrNo/hqdefault.jpg | image (lightbox fallback thumb) | TED / future of learning | REMOTE_REQUIRED |\n";
md += "| — | https://www.khanacademy.org/… | outbound link | Nav / CTAs / footer | NOT_REQUIRED |\n";
md += "| — | https://districts.khanacademy.org/khanmigo | outbound link | Audience cards / footer | NOT_REQUIRED |\n";
md += "| — | https://blog.khanacademy.org/… | outbound link | Social proof | NOT_REQUIRED |\n";
md += "| — | https://support.khanacademy.org/… | outbound link | FAQ | NOT_REQUIRED |\n";
md += "| — | https://www.khanmigo.ai/… | outbound link (internal routes not cloned) | Nav / footer | NOT_REQUIRED |\n\n";

md += "## NOT_REQUIRED (third-party tracking / consent — deliberately stripped)\n\n";
const hosts = [...new Set(blocked.map((u) => { try { return new URL(u).host; } catch { return u; } }))];
md += "| Local Path | Source URL | Type | Homepage Area | Status |\n|---|---|---|---|---|\n";
for (const h of hosts) {
  const sample = blocked.find((u) => u.includes(h));
  const n = blocked.filter((u) => u.includes(h)).length;
  md += `| — | ${h} (${n} requests; e.g. ${sample.slice(0, 90)}) | script/xhr | none — tracking/consent | NOT_REQUIRED |\n`;
}
md += "\n";
md += "Stripped vendors: Google Tag Manager / GA4, OneTrust cookie consent (`cookielaw.org`), OptinMonster (`omappapi.com`), OneTrust geolocation.\n";

fs.mkdirSync(path.join(OUT, "docs"), { recursive: true });
fs.writeFileSync(path.join(OUT, "docs", "KHANMIGO_HOME_MIRROR_ASSETS.md"), md, "utf8");
console.log("wrote docs/KHANMIGO_HOME_MIRROR_ASSETS.md (" + md.split("\n").length + " lines)");
