import { ParentShell } from "@/components/parent/parent-shell";
import { ParentTranscriptsScreen } from "@/components/pages/parent-transcripts-screen";

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="transcripts">
      <ParentTranscriptsScreen childId={childId} />
    </ParentShell>
  );
}
