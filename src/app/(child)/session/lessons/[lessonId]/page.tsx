import { AppShell } from "@/components/app-shell/app-shell";
import { LessonRightRail } from "@/components/app-shell/right-rail";
import { InteractiveLessonRunner } from "@/components/learning";

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;

  return (
    <AppShell activeNav="lessons" rightPanel={<LessonRightRail />}>
      <InteractiveLessonRunner lessonId={lessonId} />
    </AppShell>
  );
}
