import fs from "node:fs";

const file = process.argv[2];
const needle = process.argv[3];
const before = parseInt(process.argv[4] || "400", 10);
const after = parseInt(process.argv[5] || "200", 10);
const limit = parseInt(process.argv[6] || "6", 10);

const html = fs.readFileSync(file, "utf8");
let idx = -1;
let n = 0;
while ((idx = html.indexOf(needle, idx + 1)) !== -1 && n < limit) {
  n++;
  console.log(`\n########## occurrence ${n} @ ${idx} ##########`);
  console.log(html.slice(Math.max(0, idx - before), idx + after).replace(/></g, ">\n<"));
}
if (!n) console.log("NOT FOUND");
