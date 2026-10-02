import { ParentShell } from "@/components/parent/parent-shell";
import { ParentLearningScreen } from "@/components/pages/parent-learning-screen";

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="learning">
      <ParentLearningScreen childId={childId} />
    </ParentShell>
  );
}
