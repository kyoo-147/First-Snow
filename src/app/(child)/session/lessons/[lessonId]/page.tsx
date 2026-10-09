import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { LessonRightRail } from "@/components/app-shell/right-rail";
import { InteractiveLessonRunner } from "@/components/learning";

export const metadata: Metadata = {
  title: "Luyện tập Bài học - AgentKid Snow",
  description: "Trải nghiệm bài học tương tác cùng phản hồi thông minh từ trợ lý Snow",
};

export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;

  return (
    <AppShell activeNav="lessons" rightPanel={<LessonRightRail />}>
      <InteractiveLessonRunner lessonId={lessonId} />
    </AppShell>
  );
}
