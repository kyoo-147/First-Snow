import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { ChildRoutineScreen } from "@/components/pages/child-routine-screen";

export const metadata: Metadata = {
  title: "Thời khóa biểu của Bé - AgentKid Snow",
  description: "Theo dõi và thực hiện lịch trình sinh hoạt, học tập mỗi ngày",
};

export default function Page() {
  return (
    <AppShell activeNav="routine">
      <ChildRoutineScreen />
    </AppShell>
  );
}
