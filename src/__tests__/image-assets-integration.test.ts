import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { IMAGE_ASSETS, getAssetPath, getLessonImageBySubject } from "@/lib/image-assets";

describe("Accepted image assets integration and fallback safety", () => {
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
    const publicImagesDir = path.resolve(process.cwd(), "public/images");
    for (const asset of Object.values(IMAGE_ASSETS)) {
      const fileName = path.basename(asset.src);
      const filePath = path.join(publicImagesDir, fileName);
      expect(fs.existsSync(filePath), `Expected ${fileName} to exist in public/images`).toBe(true);

      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  it("verifies all legacy fallback image files exist on disk in public/images", () => {
    const publicImagesDir = path.resolve(process.cwd(), "public/images");
    for (const asset of Object.values(IMAGE_ASSETS)) {
      const fileName = path.basename(asset.fallback);
      const filePath = path.join(publicImagesDir, fileName);
      expect(fs.existsSync(filePath), `Expected fallback ${fileName} to exist in public/images`).toBe(true);
    }
  });

  it("matches accepted asset SHA256 hashes against original accepted research assets", () => {
    const publicImagesDir = path.resolve(process.cwd(), "public/images");

    const expectedHashes: Record<string, string> = {
      "snow-mascot-v2.png": "84e278137328579cd4363fce04c14ef70e6a0a820597de20738859a183d6135d",
      "snow-avatar-v2.png": "21199e4135d7c3c674728e8da4c6b206a3e1f5002998dd6dbcfa1eb6a0e6beb3",
      "momo-mascot-v2.png": "dc5a02fdc8a1c290d16e7badd42488e75f6442bebf0211d4442d8ce57f7fef45",
      "leo-avatar-v2.png": "316818e132260bb0504599a8d79dd96b963835919239526a7cd30ad7986d1a7e",
      "nana-avatar-v2.png": "1884d652c10e3c9053a217916047272684cb6b3f7dcf9e1a1603cb69d914fb0b",
      "snow-classroom-empty-stage-v2.png": "ce78cda4e2a17a7b5fd1437bfd3574d855d5da0d871c8379c2f0acd8c1344239",
      "lesson-abc-v2.png": "7dc06995de4c522d56c0710d3e2e158f4905ba404a9a54525ff895f2beaa7096",
      "lesson-math-v2.png": "ebc6da88c745655b91a20173487e13dfc381c12179c60bfe441cf1d98bf12d90",
      "lesson-story-v2.png": "9a0f1447b6bbbd24e67b097343e07f4490bfcc12be47fa3ea71424490b4b3d1b",
      "lesson-social-v2.png": "822d7d8cc746832fea80166b3aaba52aee9915842ca14f7b7b6f16a182ba1710",
    };

    for (const [fileName, expectedHash] of Object.entries(expectedHashes)) {
      const filePath = path.join(publicImagesDir, fileName);
      const buf = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      expect(hash).toBe(expectedHash);
    }
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

  it("correctly resolves getAssetPath helper", () => {
    expect(getAssetPath("snowMascot")).toBe("/images/snow-mascot-v2.png");
    expect(getAssetPath("classroomStage")).toBe("/images/snow-classroom-empty-stage-v2.png");
  });
});
