import fs from "node:fs";

const html = fs.readFileSync(process.argv[2] || "RECON/original-rendered-dom.html", "utf8");
const needle = process.argv[3] || "Build your brain power";
const before = parseInt(process.argv[4] || "4000", 10);
const after = parseInt(process.argv[5] || "9000", 10);

const i = html.indexOf(needle);
if (i < 0) {
  console.log("NOT FOUND");
  process.exit(1);
}
const chunk = html.slice(Math.max(0, i - before), i + after);
const pretty = chunk.replace(/></g, ">\n<");
const lines = pretty.split("\n");
const startLine = pretty.slice(0, pretty.indexOf(needle)).split("\n").length;
lines.forEach((l, n) => {
  const ln = n + 1;
  const marker = ln === startLine ? ">>" : "  ";
  if (l.trim()) console.log(marker + String(ln).padStart(4) + " | " + l.trim().slice(0, 300));
});
