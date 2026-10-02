import Image from "next/image";
import Link from "next/link";
import { Clock, Star } from "lucide-react";
import type { LessonCardData } from "@/types/snow";
import { ProgressStrip } from "@/components/ui/progress-strip";

const accentClass = {
  primary: "bg-snow-primary-soft text-snow-primary-dark",
  aqua: "bg-snow-ice text-snow-primary-dark",
  peach: "bg-snow-peach text-snow-primary-dark",
  pink: "bg-snow-pink text-snow-primary-dark",
  ice: "bg-snow-ice text-snow-primary-dark",
};

export function LessonCard({ lesson }: { lesson: LessonCardData }) {
  return (
    <Link
      href={`/session/lessons/${lesson.id}`}
      className="group block overflow-hidden rounded-[var(--radius-md)] border border-snow-border bg-snow-surface shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src={lesson.image} alt="" fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, 25vw" />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold ${accentClass[lesson.accent]}`}>
          {lesson.subject}
        </span>
      </div>
      <div className="space-y-2.5 p-3.5">
        <div>
          <h3 className="text-[15px] font-black leading-tight text-snow-primary-dark">{lesson.title}</h3>
          <p className="mt-1 text-[13px] font-semibold text-snow-muted">{lesson.subtitle}</p>
        </div>
        {typeof lesson.progress === "number" ? <ProgressStrip value={lesson.progress} /> : null}
        <div className="flex items-center justify-between text-xs font-bold text-snow-muted">
          <span className="flex items-center gap-1"><Star className="size-4 fill-snow-warning text-snow-warning" />{lesson.rating}</span>
          <span className="flex items-center gap-1"><Clock className="size-4" />{lesson.duration}</span>
        </div>
      </div>
    </Link>
  );
}
