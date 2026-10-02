import { ParentShell } from "@/components/parent/parent-shell";
import { ParentAlertsScreen } from "@/components/pages/parent-alerts-screen";

export default function Page() {
  return (
    <ParentShell activeNav="alerts">
      <ParentAlertsScreen />
    </ParentShell>
  );
}
