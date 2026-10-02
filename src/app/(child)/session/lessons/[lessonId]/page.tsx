import { AppShell } from "@/components/app-shell/app-shell";
import { LessonRightRail } from "@/components/app-shell/right-rail";
import { InteractiveLessonScreen } from "@/components/pages/interactive-lesson-screen";

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  await params;

  return (
    <AppShell activeNav="lessons" childName="Minh" childLevel="Level 3" rightPanel={<LessonRightRail />}>
      <InteractiveLessonScreen />
    </AppShell>
  );
}
