import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentDashboard } from "@/components/pages/parent-dashboard";

export const metadata: Metadata = {
  title: "Bảng điều khiển Phụ huynh - AgentKid Snow",
  description: "Theo dõi tiến trình học tập, sự phát triển cảm xúc và thói quen hàng ngày của học sinh.",
};

export default function Page() {
  return (
    <ParentShell activeNav="dashboard">
      <ParentDashboard />
    </ParentShell>
  );
}
