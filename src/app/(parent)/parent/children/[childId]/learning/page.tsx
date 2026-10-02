import { ParentShell } from "@/components/parent/parent-shell";
import { ParentLearningView } from "@/components/learning";

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="learning">
      <ParentLearningView childId={childId} />
    </ParentShell>
  );
}
