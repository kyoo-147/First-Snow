import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { ChildPreferencesScreen } from "@/components/pages/child-preferences-screen";

export const metadata: Metadata = {
  title: "Cài đặt Học sinh - AgentKid Snow",
  description: "Tùy chọn trải nghiệm học tập và tương tác của học sinh",
};

export default function Page() {
  return (
    <AppShell activeNav="settings">
      <ChildPreferencesScreen />
    </AppShell>
  );
}
