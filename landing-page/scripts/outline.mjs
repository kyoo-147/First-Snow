import fs from "node:fs";

const html = fs.readFileSync("RECON/original-rendered-dom.html", "utf8");

const marks = [];
const re = /<(h[1-6]|img|section|iframe|video)\b[^>]*>/gi;
let m;
while ((m = re.exec(html))) {
  marks.push({ i: m.index, tag: m[1].toLowerCase(), raw: m[0] });
}

function attr(raw, name) {
  const r = new RegExp(name + '="([^"]*)"', "i");
  const mm = raw.match(r);
  return mm ? mm[1] : "";
}

function textAfter(idx, len = 300) {
  const chunk = html.slice(idx, idx + 4000);
  const t = chunk
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.slice(0, len);
}

console.log("=== DOCUMENT OUTLINE (headings / images / embeds in order) ===\n");
for (const mk of marks) {
  if (mk.tag === "img") {
    const src = attr(mk.raw, "src");
    const name = src.split("/").pop();
    let set = attr(mk.raw, "srcset");
    const variants = set ? set.split(",").length : 1;
    console.log(`   [IMG] ${name}  (variants=${variants})`);
  } else if (mk.tag === "h1" || mk.tag === "h2" || mk.tag === "h3" || mk.tag === "h4") {
    console.log(`\n[${mk.tag.toUpperCase()}] ${textAfter(mk.i, 220)}`);
  } else if (mk.tag === "iframe") {
    console.log(`   [IFRAME] ${attr(mk.raw, "src")}`);
  } else if (mk.tag === "video") {
    console.log(`   [VIDEO] ${attr(mk.raw, "src")} poster=${attr(mk.raw, "poster")}`);
  }
}
