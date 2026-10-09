import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentLearningView } from "@/components/learning";

export const metadata: Metadata = {
  title: "Tiến độ Học tập - AgentKid Snow",
  description: "Xem xét chi tiết tiến trình học tập và kết quả bài học của học sinh.",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="learning">
      <ParentLearningView childId={childId} />
    </ParentShell>
  );
}
