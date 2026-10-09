import Image from "next/image";
import Link from "next/link";
import { Clock, Star } from "lucide-react";
import type { LessonCardData } from "@/types/snow";
import type { LessonSummary } from "@/lib/learning-client";
import { ProgressStrip } from "@/components/ui/progress-strip";
import { t } from "@/i18n";

const accentClass: Record<string, string> = {
  primary: "bg-snow-primary-soft text-snow-primary-dark",
  aqua: "bg-snow-ice text-snow-primary-dark",
  peach: "bg-snow-cream text-snow-primary-dark",
  pink: "bg-snow-lavender text-snow-primary-dark",
  ice: "bg-snow-ice text-snow-primary-dark",
};

export function LessonCard({ lesson }: { lesson: LessonCardData | LessonSummary }) {
  const accent = (lesson.accent && accentClass[lesson.accent]) ? accentClass[lesson.accent] : accentClass.primary;
  const rawImage = lesson.image || "/images/lesson-abc.png";
  const image =
    rawImage === "/images/lesson-abc.png" ? "/images/lesson-abc-v2.png" :
    rawImage === "/images/lesson-math.png" ? "/images/lesson-math-v2.png" :
    rawImage === "/images/lesson-story.png" ? "/images/lesson-story-v2.png" :
    rawImage === "/images/lesson-social.png" ? "/images/lesson-social-v2.png" :
    rawImage;
  const rawDuration = "duration" in lesson && lesson.duration ? lesson.duration : `${(lesson as LessonSummary).estimatedMinutes || 12}`;
  const duration = rawDuration.includes("phút")
    ? rawDuration
    : t("learning", "lesson.duration", { minutes: rawDuration.replace(/\D/g, "") || "12" });
  const rating = lesson.rating || "4.8";

  return (
    <Link
      href={`/session/lessons/${lesson.id}`}
      className="group block overflow-hidden rounded-[var(--radius-md)] border border-snow-border bg-snow-surface shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src={image} alt="" fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, 25vw" />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold ${accent}`}>
          {lesson.subject}
        </span>
      </div>
      <div className="space-y-2.5 p-3.5">
        <div>
          <h3 className="text-[15px] font-black leading-tight text-snow-primary-dark">{lesson.title}</h3>
          <p className="mt-1 text-[13px] font-semibold text-snow-muted">
            {lesson.subtitle || ("description" in lesson && typeof lesson.description === "string" ? lesson.description : "")}
          </p>
        </div>
        {typeof lesson.progress === "number" ? <ProgressStrip value={lesson.progress} /> : null}
        <div className="flex items-center justify-between text-xs font-bold text-snow-muted">
          <span className="flex items-center gap-1"><Star className="size-4 fill-snow-warning text-snow-warning" />{rating}</span>
          <span className="flex items-center gap-1"><Clock className="size-4" />{duration}</span>
        </div>
      </div>
    </Link>
  );
}
