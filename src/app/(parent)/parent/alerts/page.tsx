import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentAlertsScreen } from "@/components/pages/parent-alerts-screen";

export const metadata: Metadata = {
  title: "Cảnh báo An toàn - AgentKid Snow",
  description: "Xem xét các cảnh báo an toàn và sự kiện cần phụ huynh chú ý.",
};

export default function Page() {
  return (
    <ParentShell activeNav="alerts">
      <ParentAlertsScreen />
    </ParentShell>
  );
}
