import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentAlertDetailScreen } from "@/components/pages/parent-alert-detail-screen";

export const metadata: Metadata = {
  title: "Chi tiết Cảnh báo - AgentKid Snow",
  description: "Xem xét chi tiết cảnh báo an toàn và hướng dẫn xử lý.",
};

export default async function Page({ params }: { params: Promise<{ alertId: string }> }) {
  const { alertId } = await params;
  return (
    <ParentShell activeNav="alerts">
      <ParentAlertDetailScreen alertId={alertId} />
    </ParentShell>
  );
}
