import { ParentShell } from "@/components/parent/parent-shell";
import { ParentAlertDetailScreen } from "@/components/pages/parent-alert-detail-screen";

export default async function Page({ params }: { params: Promise<{ alertId: string }> }) {
  const { alertId } = await params;
  return (
    <ParentShell activeNav="alerts">
      <ParentAlertDetailScreen alertId={alertId} />
    </ParentShell>
  );
}
