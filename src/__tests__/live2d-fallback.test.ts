import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const managerSource = readFileSync(
  new URL("../vtuber-app/WebSDK/src/lapplive2dmanager.ts", import.meta.url),
  "utf8",
);
const live2dSource = readFileSync(
  new URL("../vtuber-app/src/components/canvas/live2d.tsx", import.meta.url),
  "utf8",
);

describe("Live2D missing-model fallback", () => {
  it("fails closed before constructing a model URL from incomplete config", () => {
    expect(managerSource).toContain("typeof model !== 'string' || !model.trim()");
    expect(managerSource).toContain("typeof configuredFileName !== 'string' || !configuredFileName.trim()");
    expect(managerSource).toContain("typeof LAppDefine.ResourcesPath !== 'string' || !LAppDefine.ResourcesPath.trim()");
    expect(managerSource).toContain("return;");
    expect(managerSource).not.toContain("undefined.model3.json");
  });

  it("keeps the usable honest UI fallback when no model URL is configured", () => {
    expect(live2dSource).toContain("const isModelAbsent = !modelInfo || !modelInfo.url;");
    expect(live2dSource).toContain("{isModelAbsent && <FallbackSnowAvatar aiState={aiState} />}");
    expect(live2dSource).toContain('display: isModelAbsent ? "none" : "block"');
  });
});
