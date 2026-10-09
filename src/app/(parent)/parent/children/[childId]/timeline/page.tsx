import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentTimelineScreen } from "@/components/pages/parent-timeline-screen";

export const metadata: Metadata = {
  title: "Dòng thời gian Hoạt động - AgentKid Snow",
  description: "Dòng thời gian các sự kiện và hoạt động học tập",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="timeline">
      <ParentTimelineScreen childId={childId} />
    </ParentShell>
  );
}
