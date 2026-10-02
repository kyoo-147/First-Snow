import { LessonCard } from "@/components/lessons/lesson-card";
import { lessons } from "@/data/snow-data";

export function LessonsScreen() {
  const lessonList = [
    ...lessons,
    { ...lessons[0], id: "word-garden", title: "Word Garden", subtitle: "Build new words", progress: 18 },
    { ...lessons[1], id: "shape-train", title: "Shape Train", subtitle: "Patterns and shapes", progress: 25 },
    { ...lessons[2], id: "kind-choices", title: "Kind Choices", subtitle: "Friendship practice", progress: 10 },
    { ...lessons[3], id: "share-and-care", title: "Share and Care", subtitle: "Social practice", progress: 36 },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-4xl font-black text-snow-primary-dark">Lessons</h1>
        <p className="mt-3 text-base font-bold text-snow-muted">Choose one calm learning adventure at a time.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {lessonList.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
