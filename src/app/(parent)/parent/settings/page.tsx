import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { SettingsScreen } from "@/components/pages/settings-screen";

export const metadata: Metadata = {
  title: "Cài đặt Phụ huynh - AgentKid Snow",
  description: "Tùy chỉnh cấu hình, thông báo và tài khoản phụ huynh",
};

export default function Page() {
  return (
    <ParentShell activeNav="settings">
      <SettingsScreen />
    </ParentShell>
  );
}
