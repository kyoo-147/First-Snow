import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentEmergencyScreen } from "@/components/pages/parent-emergency-screen";

export const metadata: Metadata = {
  title: "Liên hệ Khẩn cấp - AgentKid Snow",
  description: "Quản lý thông tin liên hệ khẩn cấp khi có cảnh báo",
};

export default function Page() {
  return (
    <ParentShell activeNav="emergency">
      <ParentEmergencyScreen />
    </ParentShell>
  );
}
