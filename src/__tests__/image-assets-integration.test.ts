import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  IMAGE_ASSETS,
  IMAGE_ASSET_METRICS,
  BLOCKED_VISUAL_CONCEPTS,
  getAssetPath,
  getFallbackPath,
  getLessonImageBySubject,
  getImageAccessibilityProps,
} from "@/lib/image-assets";

describe("Accepted image assets integration and fallback safety", () => {
  const publicImagesDir = path.resolve(process.cwd(), "public/images");

  it("defines exactly 10 accepted versioned assets and does not claim 47/47", () => {
    const keys = Object.keys(IMAGE_ASSETS);
    expect(keys.length).toBe(10);
    expect(IMAGE_ASSET_METRICS.approvedAssetsCount).toBe(10);
    expect(IMAGE_ASSET_METRICS.totalBaselineFiles).toBe(47);
  });

  it("defines versioned paths for all accepted assets and fallbacks", () => {
    for (const [key, asset] of Object.entries(IMAGE_ASSETS)) {
      expect(asset.src).toMatch(/^\/images\/[\w-]+-v2\.png$/);
      expect(asset.fallback).toMatch(/^\/images\/[\w.-]+\.png$/);
      expect(asset.altVi.trim().length).toBeGreaterThan(0);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
    }
  });

  it("verifies all versioned image files exist on disk in public/images", () => {
    for (const asset of Object.values(IMAGE_ASSETS)) {
      const fileName = path.basename(asset.src);
      const filePath = path.join(publicImagesDir, fileName);
      expect(fs.existsSync(filePath), `Expected ${fileName} to exist in public/images`).toBe(true);

      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  it("verifies all legacy fallback image files exist on disk in public/images", () => {
    for (const asset of Object.values(IMAGE_ASSETS)) {
      const fileName = path.basename(asset.fallback);
      const filePath = path.join(publicImagesDir, fileName);
      expect(fs.existsSync(filePath), `Expected fallback ${fileName} to exist in public/images`).toBe(true);
    }
  });

  it("matches accepted asset SHA256 hashes against original accepted research assets", () => {
    for (const [key, asset] of Object.entries(IMAGE_ASSETS)) {
      const fileName = path.basename(asset.src);
      const filePath = path.join(publicImagesDir, fileName);
      const buf = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      expect(hash).toBe(asset.sha256);
    }
  });

  it("verifies exact pixel dimensions and PNG formats", () => {
    for (const [key, asset] of Object.entries(IMAGE_ASSETS)) {
      const fileName = path.basename(asset.src);
      const filePath = path.join(publicImagesDir, fileName);
      const buf = fs.readFileSync(filePath);

      // Verify PNG magic header
      expect(buf.slice(0, 8).toString("hex")).toBe("89504e470d0a1a0a");

      // Verify dimensions from IHDR chunk
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBe(asset.width);
      expect(height).toBe(asset.height);

      if (key === "classroomStage") {
        expect(width).toBe(1536);
        expect(height).toBe(1024);
      } else {
        expect(width).toBe(1024);
        expect(height).toBe(1024);
      }
    }
  });

  it("verifies genuine alpha transparency for cutouts and RGB mode for stage background", () => {
    for (const [key, asset] of Object.entries(IMAGE_ASSETS)) {
      const fileName = path.basename(asset.src);
      const filePath = path.join(publicImagesDir, fileName);
      const buf = fs.readFileSync(filePath);
      const colorType = buf[25];

      if (key === "classroomStage") {
        // Full bleed background is RGB (ColorType 2)
        expect(colorType).toBe(2);
        expect(asset.hasAlpha).toBe(false);
      } else {
        // Cutouts and avatars are RGBA (ColorType 6)
        expect(colorType).toBe(6);
        expect(asset.hasAlpha).toBe(true);
      }
    }
  });

  it("verifies stage background uses empty classroom to avoid duplicate mascot collisions", () => {
    expect(IMAGE_ASSETS.classroomStage.src).toBe("/images/snow-classroom-empty-stage-v2.png");
    expect(IMAGE_ASSETS.classroomStage.fallback).toBe("/images/snow-companion-stage.png");
    // Verify that the empty stage asset is distinct from legacy mascot-baked stage
    const emptyBuf = fs.readFileSync(path.join(publicImagesDir, "snow-classroom-empty-stage-v2.png"));
    const legacyBuf = fs.readFileSync(path.join(publicImagesDir, "snow-companion-stage.png"));
    const emptySha = crypto.createHash("sha256").update(emptyBuf).digest("hex");
    const legacySha = crypto.createHash("sha256").update(legacyBuf).digest("hex");
    expect(emptySha).not.toBe(legacySha);
  });

  it("maps subject strings to the appropriate versioned lesson image", () => {
    expect(getLessonImageBySubject(undefined, "Toán học")).toBe(IMAGE_ASSETS.lessonMath.src);
    expect(getLessonImageBySubject(undefined, "Kể chuyện")).toBe(IMAGE_ASSETS.lessonStory.src);
    expect(getLessonImageBySubject(undefined, "Kỹ năng xã hội")).toBe(IMAGE_ASSETS.lessonSocial.src);
    expect(getLessonImageBySubject(undefined, "Tiếng Anh")).toBe(IMAGE_ASSETS.lessonAbc.src);
    expect(getLessonImageBySubject(undefined, "Unknown subject")).toBe(IMAGE_ASSETS.lessonAbc.src);
  });

  it("preserves explicit custom lesson image if passed", () => {
    expect(getLessonImageBySubject("/custom/image.png", "Toán học")).toBe("/custom/image.png");
  });

  it("correctly resolves getAssetPath and getFallbackPath helpers", () => {
    expect(getAssetPath("snowMascot")).toBe("/images/snow-mascot-v2.png");
    expect(getFallbackPath("snowMascot")).toBe("/images/snow-mascot-ui.png");
    expect(getAssetPath("classroomStage")).toBe("/images/snow-classroom-empty-stage-v2.png");
    expect(getFallbackPath("classroomStage")).toBe("/images/snow-companion-stage.png");
  });

  it("provides Vietnamese accessibility and decorative semantics", () => {
    for (const key of Object.keys(IMAGE_ASSETS) as (keyof typeof IMAGE_ASSETS)[]) {
      const informativeProps = getImageAccessibilityProps(key, false);
      expect(informativeProps.alt).toBe(IMAGE_ASSETS[key].altVi);
      expect(informativeProps["aria-hidden"]).toBeUndefined();

      const decorativeProps = getImageAccessibilityProps(key, true);
      expect(decorativeProps.alt).toBe("");
      expect(decorativeProps["aria-hidden"]).toBe(true);
    }
  });

  it("documents blocked visual concepts with truthful status and reasons", () => {
    expect(BLOCKED_VISUAL_CONCEPTS.length).toBeGreaterThan(0);
    for (const concept of BLOCKED_VISUAL_CONCEPTS) {
      expect(concept.id.length).toBeGreaterThan(0);
      expect(concept.concept.length).toBeGreaterThan(0);
      expect(concept.originalFile.length).toBeGreaterThan(0);
      expect(["BLOCKED", "UNVERIFIED", "SUPERSEDED", "DEPRECATED", "STATIC_EDITORIAL_ONLY", "REJECTED", "BLOCKED_EXTERNAL"]).toContain(concept.status);
      expect(concept.reason.length).toBeGreaterThan(0);
      expect(concept.disposition.length).toBeGreaterThan(0);
    }
  });
});
