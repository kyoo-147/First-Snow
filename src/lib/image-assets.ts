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
  },
  snowAvatar: {
    src: "/images/snow-avatar-v2.png",
    fallback: "/images/snow-avatar-final.png",
    altVi: "Ảnh đại diện Snow",
    width: 1024,
    height: 1024,
  },
  momoMascot: {
    src: "/images/momo-mascot-v2.png",
    fallback: "/images/momo_mascot.png",
    altVi: "Mascot Momo",
    width: 1024,
    height: 1024,
  },
  leoAvatar: {
    src: "/images/leo-avatar-v2.png",
    fallback: "/images/leo_avatar.png",
    altVi: "Ảnh đại diện Leo",
    width: 1024,
    height: 1024,
  },
  nanaAvatar: {
    src: "/images/nana-avatar-v2.png",
    fallback: "/images/nana_avatar.png",
    altVi: "Ảnh đại diện Nana",
    width: 1024,
    height: 1024,
  },

  // Environments & Stages
  classroomStage: {
    src: "/images/snow-classroom-empty-stage-v2.png",
    fallback: "/images/snow-companion-stage.png",
    altVi: "Sân khấu lớp học Snow",
    width: 1536,
    height: 1024,
  },

  // Lesson Foregrounds
  lessonAbc: {
    src: "/images/lesson-abc-v2.png",
    fallback: "/images/lesson-abc.png",
    altVi: "Bài học chữ cái ABC",
    width: 1024,
    height: 1024,
  },
  lessonMath: {
    src: "/images/lesson-math-v2.png",
    fallback: "/images/lesson-math.png",
    altVi: "Bài học đếm số và toán học",
    width: 1024,
    height: 1024,
  },
  lessonStory: {
    src: "/images/lesson-story-v2.png",
    fallback: "/images/lesson-story.png",
    altVi: "Bài học kể chuyện",
    width: 1024,
    height: 1024,
  },
  lessonSocial: {
    src: "/images/lesson-social-v2.png",
    fallback: "/images/lesson-social.png",
    altVi: "Bài học kỹ năng xã hội và cảm xúc",
    width: 1024,
    height: 1024,
  },
} as const;

export type ImageAssetKey = keyof typeof IMAGE_ASSETS;

/**
 * Returns primary asset path or falls back to legacy path
 */
export function getAssetPath(key: ImageAssetKey): string {
  return IMAGE_ASSETS[key]?.src ?? "";
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
