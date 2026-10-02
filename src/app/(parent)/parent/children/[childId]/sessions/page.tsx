import { ParentShell } from "@/components/parent/parent-shell";
import { ParentSessionsScreen } from "@/components/pages/parent-sessions-screen";

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="sessions">
      <ParentSessionsScreen childId={childId} />
    </ParentShell>
  );
}
