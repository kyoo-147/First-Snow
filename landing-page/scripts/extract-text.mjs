import fs from "node:fs";
import path from "node:path";
import { loadPlaywright, launch } from "./pw.mjs";

const OUT = path.resolve(import.meta.dirname, "..");
const CLONE = process.argv[2] || "http://127.0.0.1:8124/";

const pw = loadPlaywright();
const browser = await launch(pw.chromium);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(CLONE, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(2000);

const data = await page.evaluate(() => {
  const sectionName = (el) => {
    let n = el;
    while (n && n !== document.body) {
      if (n.tagName === "SECTION" || (n.className || "").toString().match(/faq|footer|header|nav/i)) {
        const c = (n.className || "").toString().trim().split(/\s+/)[0] || n.tagName.toLowerCase();
        return c;
      }
      n = n.parentElement;
    }
    return "head/other";
  };

  const out = [];
  const seen = new Set();
  const walk = (el) => {
    const kids = [...el.children];
    const text = kids.length === 0 ? (el.textContent || "").trim().replace(/\s+/g, " ") : "";
    if (text && text.length > 1 && !seen.has(text)) {
      seen.add(text);
      out.push({
        section: sectionName(el),
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().trim().slice(0, 46),
        text,
        href: el.tagName === "A" ? el.getAttribute("href") : null,
      });
    }
    kids.forEach(walk);
  };
  walk(document.body);

  const title = document.title;
  const metas = [...document.querySelectorAll("meta[name=description],meta[property='og:title'],meta[property='og:description'],meta[name='twitter:title'],meta[name='twitter:description']")].map(
    (m) => ({ attr: m.getAttribute("name") || m.getAttribute("property"), content: m.getAttribute("content") })
  );

  const links = [...document.querySelectorAll("a[href]")]
    .map((a) => ({ text: a.textContent.trim().replace(/\s+/g, " ").slice(0, 60), href: a.getAttribute("href") }))
    .filter((l, i, arr) => l.href && l.href.startsWith("http") && arr.findIndex((x) => x.href === l.href) === i);

  return { title, metas, out, links };
});

let md = "# Phase 2 — AgentKid content swap inventory\n\n";
md += "Extracted from the running mirror (`index.html`) — every user-visible string in document order.\n\n";
md += `Total strings: ${data.out.length} · external links: ${data.links.length}\n\n`;

md += "## Head\n\n| Field | Current value |\n|---|---|\n";
md += `| \`<title>\` | ${data.title} |\n`;
for (const m of data.metas) md += `| meta \`${m.attr}\` | ${(m.content || "").slice(0, 220)} |\n`;
md += "\n";

md += "## Visible strings\n\n| # | Section | Tag | Class | Current text |\n|---|---|---|---|---|\n";
data.out.forEach((o, i) => {
  const t = o.text.replace(/\|/g, "\\|").slice(0, 230);
  md += `| ${i + 1} | \`${o.section}\` | ${o.tag} | \`${o.cls}\` | ${t} |\n`;
});
md += "\n";

md += "## Links (text -> href)\n\n| Link text | href |\n|---|---|\n";
for (const l of data.links) md += `| ${(l.text || "(icon/empty)").replace(/\|/g, "\\|")} | ${l.href} |\n`;

fs.writeFileSync(path.join(OUT, "docs", "PHASE2_TEXT_INVENTORY.md"), md, "utf8");
console.log(`wrote docs/PHASE2_TEXT_INVENTORY.md — ${data.out.length} strings, ${data.links.length} links`);
await browser.close();
