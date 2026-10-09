import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { ChildActivitiesScreen } from "@/components/pages/child-activities-screen";

export const metadata: Metadata = {
  title: "Hoạt động Học tập - AgentKid Snow",
  description: "Các hoạt động rèn luyện và khám phá kiến thức thú vị",
};

export default function Page() {
  return (
    <AppShell activeNav="activities">
      <ChildActivitiesScreen />
    </AppShell>
  );
}
