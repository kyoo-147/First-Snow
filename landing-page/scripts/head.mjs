import fs from "node:fs";

const html = fs.readFileSync("RECON/original-rendered-dom.html", "utf8");
const headEnd = html.indexOf("</head>");
let head = html.slice(0, headEnd + 7);

// collapse <style> bodies so we can read the tag structure
head = head.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (m, attrs, body) => {
  return `<style${attrs}>/* ...${body.length} bytes of inline CSS... */</style>`;
});
// collapse inline scripts that are huge
head = head.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs, body) => {
  const short = body.replace(/\s+/g, " ").trim().slice(0, 400);
  return `<script${attrs}>${body.length > 400 ? short + " /* ..." + body.length + " bytes... */" : short}</script>`;
});

console.log(head.replace(/></g, ">\n<"));
