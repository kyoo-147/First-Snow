import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentNotificationsScreen } from "@/components/pages/parent-notifications-screen";

export const metadata: Metadata = {
  title: "Cài đặt Thông báo - AgentKid Snow",
  description: "Tùy chọn kênh thông báo và tần suất nhận cảnh báo",
};

export default function Page() {
  return (
    <ParentShell activeNav="notifications">
      <ParentNotificationsScreen />
    </ParentShell>
  );
}
