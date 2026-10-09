import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentTranscriptsScreen } from "@/components/pages/parent-transcripts-screen";

export const metadata: Metadata = {
  title: "Bản ghi Trò chuyện - AgentKid Snow",
  description: "Xem và đối chiếu lịch sử trao đổi của học sinh",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="transcripts">
      <ParentTranscriptsScreen childId={childId} />
    </ParentShell>
  );
}
