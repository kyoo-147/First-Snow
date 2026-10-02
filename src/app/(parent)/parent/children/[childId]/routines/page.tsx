import { ParentShell } from "@/components/parent/parent-shell";
import { ParentRoutinesScreen } from "@/components/pages/parent-routines-screen";

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="routines">
      <ParentRoutinesScreen childId={childId} />
    </ParentShell>
  );
}
