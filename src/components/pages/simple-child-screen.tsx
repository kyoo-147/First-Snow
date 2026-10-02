import type { LucideIcon } from "lucide-react";
import { LessonCard } from "@/components/lessons/lesson-card";
import { lessons } from "@/data/snow-data";

export function SimpleChildScreen({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-7">
      <header className="flex items-center gap-5">
        <span className="grid size-16 place-items-center rounded-[var(--radius-lg)] bg-snow-primary-soft">
          <Icon className="size-8 text-snow-primary" />
        </span>
        <div>
          <h1 className="text-4xl font-black text-snow-primary-dark">{title}</h1>
          <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-snow-muted">{description}</p>
        </div>
      </header>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}
      </div>
    </div>
  );
}
