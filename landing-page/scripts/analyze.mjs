import fs from "node:fs";

const s = JSON.parse(fs.readFileSync("RECON/original-signals.json", "utf8"));
const net = JSON.parse(fs.readFileSync("RECON/original-network.json", "utf8"));

console.log("TITLE:", s.title);
console.log("LANG:", s.lang);
console.log("HTML CLASS:", s.htmlClass);
console.log("BODY CLASS:", s.bodyClass);
console.log("FRAMEWORK:", JSON.stringify(s.framework));
console.log("SCROLL HEIGHT:", s.scrollHeight);
console.log("INLINE STYLE BYTES:", s.inlineStyleBytes);
console.log("");

console.log("=== STYLESHEETS (" + s.stylesheets.length + ") ===");
s.stylesheets.forEach((x) => console.log("  " + x.href + "  media=" + x.media));
console.log("=== SCRIPTS (" + s.scripts.length + ") ===");
s.scripts.forEach((x) => console.log("  " + x.src + (x.module ? "  [module]" : "")));
console.log("=== MEDIA ===");
console.log("  pictures:", s.pictureCount, "videos:", s.videos.length, "iframes:", s.iframes.length);
s.iframes.forEach((f) => console.log("   iframe:", f.src, "|", f.title));
s.videos.forEach((v) => console.log("   video:", JSON.stringify(v)));
console.log("=== FONT FACES (" + s.fontFaces.length + ") ===");
s.fontFaces.forEach((f) => console.log("   " + f.slice(0, 400)));
console.log("=== LOADED FONT FAMILIES ===");
const fams = {};
s.fonts.forEach((f) => {
  const k = f.family + " " + f.weight + " " + f.style;
  fams[k] = (fams[k] || 0) + 1;
});
console.log("   " + Object.keys(fams).join("\n   "));
console.log("");
console.log("=== IMAGES (" + s.images.length + ") ===");
s.images.forEach((i, n) => {
  console.log(n + 1 + ". " + (i.src || "(no src)"));
  console.log("    natural=" + i.w + "x" + i.h + " alt=" + JSON.stringify(i.alt));
  if (i.srcset) console.log("    srcset=" + (i.srcset.length > 300 ? i.srcset.slice(0, 300) + "..." : i.srcset));
  if (i.sizes) console.log("    sizes=" + i.sizes);
});
console.log("");
console.log("=== BACKGROUND IMAGES (" + s.backgroundImages.length + ") ===");
s.backgroundImages.forEach((b) => console.log("   " + (b.length > 200 ? b.slice(0, 200) + "..." : b)));
console.log("");
console.log("=== NETWORK HOSTS ===");
const byHost = {};
net.forEach((r) => {
  let h = "?";
  try {
    h = new URL(r.url).host;
  } catch {}
  byHost[h] = byHost[h] || { n: 0, types: {} };
  byHost[h].n++;
  byHost[h].types[r.type] = (byHost[h].types[r.type] || 0) + 1;
});
Object.entries(byHost)
  .sort((a, b) => b[1].n - a[1].n)
  .forEach(([h, v]) => console.log("  " + h + "  n=" + v.n + "  " + JSON.stringify(v.types)));
