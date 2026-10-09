import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentSessionsScreen } from "@/components/pages/parent-sessions-screen";

export const metadata: Metadata = {
  title: "Phiên Học sinh - AgentKid Snow",
  description: "Theo dõi phiên học và hoạt động tương tác của học sinh",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ParentShell activeNav="sessions">
      <ParentSessionsScreen childId={childId} />
    </ParentShell>
  );
}
