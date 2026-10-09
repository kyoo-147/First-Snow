import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const aiChatCtaFiles = [
  "src/data/snow-data.ts",
  "src/components/pages/home-screen.tsx",
  "src/components/pages/child-routine-screen.tsx",
  "src/components/pages/child-activities-screen.tsx",
  "src/app/(child)/companion/avatar/page.tsx",
];

describe("Mia AI-chat CTA navigation contract", () => {
  it("routes every confirmed AI-chat CTA to /mia with native focusable links", () => {
    for (const file of aiChatCtaFiles) {
      const source = read(file);
      expect(source, file).toContain("/mia");
      if (file.endsWith(".tsx")) expect(source, file).toContain("snow-focus-ring");
    }

    expect(read("src/data/snow-data.ts")).not.toContain('href: "/companion"');
    expect(read("src/components/pages/home-screen.tsx")).not.toContain('href: "/companion"');
    expect(read("src/components/pages/child-routine-screen.tsx")).not.toContain('href="/companion"');
    expect(read("src/components/pages/child-activities-screen.tsx")).not.toContain("/companion?");
    expect(read("src/app/(child)/companion/avatar/page.tsx")).not.toContain('href="/companion"');
  });

  it("keeps the canonical route on the existing TalkScreen and preserves unrelated destinations", () => {
    const miaPage = read("src/app/(child)/mia/page.tsx");
    expect(miaPage).toContain('import { TalkScreen } from "@/components/pages/talk-screen"');
    expect(miaPage).toContain("<TalkScreen />");

    for (const file of [
      "src/components/pages/child-routine-screen.tsx",
      "src/components/pages/child-activities-screen.tsx",
      "src/components/pages/home-screen.tsx",
    ]) {
      expect(read(file), file).toContain("/session/");
    }

    for (const file of [
      "src/components/safety/emergency-contact-dialog.tsx",
      "src/components/safety/data-export-dialog.tsx",
      "src/components/safety/deletion-request-dialog.tsx",
      "src/components/pages/parent-transcripts-screen.tsx",
      "src/components/pages/settings-screen.tsx",
    ]) {
      expect(read(file), file).not.toContain("/mia");
    }
  });

  it("keeps compatibility routes explicit without making them active CTA targets", () => {
    expect(read("src/app/(child)/companion/page.tsx")).toContain("Compatibility entry point");
    expect(read("src/app/(child)/companion/talk/page.tsx")).toContain('redirect("/companion")');
  });
});
