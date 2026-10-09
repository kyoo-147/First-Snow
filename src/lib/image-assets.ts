/**
 * Image asset registry and fallback-safe resolver.
 * Maps versioned public assets (/images/*-v2.png) with fallback to original assets.
 */

export const IMAGE_ASSETS = {
  // Characters & Mascots
  snowMascot: {
    src: "/images/snow-mascot-v2.png",
    fallback: "/images/snow-mascot-ui.png",
    altVi: "Linh vật Snow",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "84e278137328579cd4363fce04c14ef70e6a0a820597de20738859a183d6135d",
  },
  snowAvatar: {
    src: "/images/snow-avatar-v2.png",
    fallback: "/images/snow-avatar-final.png",
    altVi: "Ảnh đại diện Snow",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "21199e4135d7c3c674728e8da4c6b206a3e1f5002998dd6dbcfa1eb6a0e6beb3",
  },
  momoMascot: {
    src: "/images/momo-mascot-v2.png",
    fallback: "/images/momo_mascot.png",
    altVi: "Mascot Momo",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "dc5a02fdc8a1c290d16e7badd42488e75f6442bebf0211d4442d8ce57f7fef45",
  },
  leoAvatar: {
    src: "/images/leo-avatar-v2.png",
    fallback: "/images/leo_avatar.png",
    altVi: "Ảnh đại diện Leo",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "316818e132260bb0504599a8d79dd96b963835919239526a7cd30ad7986d1a7e",
  },
  nanaAvatar: {
    src: "/images/nana-avatar-v2.png",
    fallback: "/images/nana_avatar.png",
    altVi: "Ảnh đại diện Nana",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "1884d652c10e3c9053a217916047272684cb6b3f7dcf9e1a1603cb69d914fb0b",
  },

  // Environments & Stages
  classroomStage: {
    src: "/images/snow-classroom-empty-stage-v2.png",
    fallback: "/images/snow-companion-stage.png",
    altVi: "Sân khấu lớp học Snow",
    width: 1536,
    height: 1024,
    hasAlpha: false,
    sha256: "ce78cda4e2a17a7b5fd1437bfd3574d855d5da0d871c8379c2f0acd8c1344239",
  },

  // Lesson Foregrounds
  lessonAbc: {
    src: "/images/lesson-abc-v2.png",
    fallback: "/images/lesson-abc.png",
    altVi: "Bài học chữ cái ABC",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "7dc06995de4c522d56c0710d3e2e158f4905ba404a9a54525ff895f2beaa7096",
  },
  lessonMath: {
    src: "/images/lesson-math-v2.png",
    fallback: "/images/lesson-math.png",
    altVi: "Bài học đếm số và toán học",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "ebc6da88c745655b91a20173487e13dfc381c12179c60bfe441cf1d98bf12d90",
  },
  lessonStory: {
    src: "/images/lesson-story-v2.png",
    fallback: "/images/lesson-story.png",
    altVi: "Bài học kể chuyện",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "9a0f1447b6bbbd24e67b097343e07f4490bfcc12be47fa3ea71424490b4b3d1b",
  },
  lessonSocial: {
    src: "/images/lesson-social-v2.png",
    fallback: "/images/lesson-social.png",
    altVi: "Bài học kỹ năng xã hội và cảm xúc",
    width: 1024,
    height: 1024,
    hasAlpha: true,
    sha256: "822d7d8cc746832fea80166b3aaba52aee9915842ca14f7b7b6f16a182ba1710",
  },
} as const;

export type ImageAssetKey = keyof typeof IMAGE_ASSETS;

export interface ImageAssetMeta {
  readonly src: string;
  readonly fallback: string;
  readonly altVi: string;
  readonly width: number;
  readonly height: number;
  readonly hasAlpha: boolean;
  readonly sha256: string;
}

/**
 * Metric constants reflecting exact disposition:
 * Exactly 10 approved assets exist and are integrated.
 * Exactly 47 baseline image files exist in the repository inventory.
 */
export const IMAGE_ASSET_METRICS = {
  totalBaselineFiles: 47,
  approvedAssetsCount: 10,
  blockedConceptsCount: 14,
} as const;

export interface BlockedVisualConcept {
  readonly id: string;
  readonly concept: string;
  readonly originalFile: string;
  readonly status: "BLOCKED" | "UNVERIFIED" | "SUPERSEDED" | "DEPRECATED" | "STATIC_EDITORIAL_ONLY" | "REJECTED" | "BLOCKED_EXTERNAL";
  readonly reason: string;
  readonly disposition: string;
}

/**
 * Registry of visual concepts not approved or blocked from runtime integration.
 * Explicitly documents why 47/47 coverage cannot be claimed when only 10 assets are approved.
 * Marked as UNVERIFIED or BLOCKED per Founder scope directive. Not required for current delivery.
 */
export const BLOCKED_VISUAL_CONCEPTS: readonly BlockedVisualConcept[] = [
  {
    id: "asking_nicely",
    concept: "Bài học hỏi xin lịch sự (Asking Nicely)",
    originalFile: "public/images/asking_nicely_photo.png",
    status: "BLOCKED",
    reason: "Pseudo-PNG (JPEG JFIF header, 0% alpha). OpenAI API key quota exhausted (HTTP 429). Provider substitution prohibited.",
    disposition: "Retain legacy file with fallback in CoursesPage; pending quota top-up.",
  },
  {
    id: "brushing_teeth",
    concept: "Bài học đánh răng hàng ngày (Brushing Teeth)",
    originalFile: "public/images/brushing_teeth_photo.png",
    status: "BLOCKED",
    reason: "Pseudo-PNG (JPEG JFIF header, 0% alpha). Upstream OpenAI quota exhausted.",
    disposition: "Retain legacy file with fallback in CoursesPage; pending quota top-up.",
  },
  {
    id: "going_to_the_park",
    concept: "Bài học đi chơi công viên (Going to the Park)",
    originalFile: "public/images/going_to_the_park_photo.png",
    status: "BLOCKED",
    reason: "Pseudo-PNG (JPEG JFIF header, 0% alpha). Upstream OpenAI quota exhausted.",
    disposition: "Retain legacy file with fallback in CoursesPage; pending quota top-up.",
  },
  {
    id: "indoor_voice",
    concept: "Bài học dùng giọng nói trong nhà (Indoor Voice)",
    originalFile: "public/images/indoor_voice_photo.png",
    status: "BLOCKED",
    reason: "Pseudo-PNG (JPEG JFIF header, 0% alpha). Upstream OpenAI quota exhausted.",
    disposition: "Retain legacy file with fallback in CoursesPage; pending quota top-up.",
  },
  {
    id: "taking_deep_breaths",
    concept: "Minh họa tập hít thở sâu thư giãn (Taking Deep Breaths)",
    originalFile: "public/images/taking_deep_breaths_illustration.png",
    status: "BLOCKED",
    reason: "Pseudo-PNG (JPEG JFIF header, 0% alpha). Upstream OpenAI quota exhausted.",
    disposition: "Retain legacy file with fallback in CoursesPage; pending quota top-up.",
  },
  {
    id: "taking_turns",
    concept: "Minh họa lượt chơi và chia sẻ (Taking Turns)",
    originalFile: "public/images/taking_turns_illustration.png",
    status: "BLOCKED",
    reason: "Pseudo-PNG (JPEG JFIF header, 0% alpha). Upstream OpenAI quota exhausted.",
    disposition: "Retain legacy file with fallback in CoursesPage; pending quota top-up.",
  },
  {
    id: "snow_hut_stage",
    concept: "Bối cảnh lều tuyết phụ (Snow Hut Stage)",
    originalFile: "public/images/snow-hut.png",
    status: "BLOCKED",
    reason: "Ảnh cắt 235x300 pixel chất lượng thấp, đục mờ (RGB). Thay thế bởi sân khấu lớp học v2.",
    disposition: "Superseded by classroomStage (/images/snow-classroom-empty-stage-v2.png).",
  },
  {
    id: "snow_classroom_baked",
    concept: "Bối cảnh lớp học có nhân vật vẽ sẵn trong nền",
    originalFile: "public/images/snow-classroom.png",
    status: "BLOCKED",
    reason: "Nhân vật snowman vẽ sẵn vào nền gây lỗi hiển thị trùng lặp mascot (double mascot collision) khi Live2D render đè lên.",
    disposition: "Replaced by empty stage (/images/snow-classroom-empty-stage-v2.png) across companion and VTuber runtime surfaces.",
  },
  {
    id: "snow_companion_editorial",
    concept: "Ảnh editorial marketing AI Companion",
    originalFile: "public/images/snow-companion.png",
    status: "UNVERIFIED",
    reason: "Pseudo-PNG binary JPEG. Mockup tĩnh, không phải asset tương tác UI. Chưa được xác minh cho runtime.",
    disposition: "Kept as static documentation/marketing visual; excluded from interactive UI.",
  },
  {
    id: "snow_connected_care_editorial",
    concept: "Ảnh editorial marketing Connected Care",
    originalFile: "public/images/snow-connected-care.png",
    status: "UNVERIFIED",
    reason: "Pseudo-PNG binary JPEG. Mockup tĩnh, không phải asset tương tác UI. Chưa được xác minh cho runtime.",
    disposition: "Kept as static documentation/marketing visual; excluded from interactive UI.",
  },
  {
    id: "snow_dashboard_editorial",
    concept: "Ảnh editorial marketing Dashboard",
    originalFile: "public/images/snow-dashboard.png",
    status: "UNVERIFIED",
    reason: "Pseudo-PNG binary JPEG. Mockup tĩnh, không phải asset tương tác UI. Chưa được xác minh cho runtime.",
    disposition: "Kept as static documentation/marketing visual; excluded from interactive UI.",
  },
  {
    id: "snow_hero_editorial",
    concept: "Ảnh editorial marketing Hero",
    originalFile: "public/images/snow-hero.png",
    status: "UNVERIFIED",
    reason: "Pseudo-PNG binary JPEG. Đã thay thế trên UI tương tác bằng linh vật Snow v2 độc lập. Chưa được xác minh cho runtime.",
    disposition: "Superseded on interactive UI by snowMascot (/images/snow-mascot-v2.png).",
  },
  {
    id: "lesson_abc_initial_variant",
    concept: "Biến thể ban đầu của bài học ABC",
    originalFile: "lesson-abc-transparent.png",
    status: "BLOCKED",
    reason: "Biến thể chứa các khối hình học thay vì các khối chữ cái A, B, C. Đã bị từ chối trong thẩm định nghệ thuật.",
    disposition: "Rejected research variant. Superseded by approved lesson-abc-v2.png.",
  },
  {
    id: "live2d_cubism_model",
    concept: "Tệp mô hình Live2D Cubism WebGL (.moc3 / textures)",
    originalFile: "src/vtuber-app/WebSDK",
    status: "BLOCKED",
    reason: "Phụ thuộc bên thứ ba ngoài kho mã nguồn; cần runtime Live2D Cubism và model textures.",
    disposition: "Blocked externally; documented in BLOCKED.md.",
  },
] as const;

/**
 * Returns primary asset path or falls back to legacy path
 */
export function getAssetPath(key: ImageAssetKey): string {
  return IMAGE_ASSETS[key]?.src ?? "";
}

/**
 * Returns fallback asset path
 */
export function getFallbackPath(key: ImageAssetKey): string {
  return IMAGE_ASSETS[key]?.fallback ?? "";
}

/**
 * Subject to lesson image asset mapping with fallback
 */
export function getLessonImageBySubject(image?: string, subject?: string): string {
  if (image && image.trim().length > 0) return image;
  const s = (subject || "").toLowerCase();
  if (s.includes("math") || s.includes("count") || s.includes("toán")) return IMAGE_ASSETS.lessonMath.src;
  if (s.includes("story") || s.includes("fox") || s.includes("truyện") || s.includes("kể chuyện") || s.includes("việt")) return IMAGE_ASSETS.lessonStory.src;
  if (s.includes("social") || s.includes("friend") || s.includes("feel") || s.includes("cảm xúc") || s.includes("xã hội") || s.includes("bạn")) return IMAGE_ASSETS.lessonSocial.src;
  return IMAGE_ASSETS.lessonAbc.src;
}

/**
 * Returns accessible image props honoring Vietnamese localization or decorative semantics.
 * If isDecorative is true, returns empty alt and aria-hidden="true" per WCAG 2.1 AA.
 * Otherwise returns descriptive Vietnamese alt text.
 */
export function getImageAccessibilityProps(
  key: ImageAssetKey,
  isDecorative = false
): { alt: string; "aria-hidden"?: boolean } {
  const asset = IMAGE_ASSETS[key];
  if (isDecorative) {
    return { alt: "", "aria-hidden": true };
  }
  return { alt: asset?.altVi ?? "" };
}
