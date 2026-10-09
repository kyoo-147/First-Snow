import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentRoutinesScreen } from "@/components/pages/parent-routines-screen";

export const metadata: Metadata = {
  title: "Lịch trình Học sinh - AgentKid Snow",
  description: "Quản lý lịch trình và thói quen học tập của học sinh",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="routines">
      <ParentRoutinesScreen childId={childId} />
    </ParentShell>
  );
}
