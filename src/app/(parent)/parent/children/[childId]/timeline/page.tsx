import { ParentShell } from "@/components/parent/parent-shell";
import { ParentTimelineScreen } from "@/components/pages/parent-timeline-screen";

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="timeline">
      <ParentTimelineScreen childId={childId} />
    </ParentShell>
  );
}
