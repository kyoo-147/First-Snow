import { AppShell } from "@/components/app-shell/app-shell";
import { ChildLessonsScreen } from "@/components/pages/child-lessons-screen";

export default function Page() {
  return (
    <AppShell activeNav="lessons" childName="Minh" childLevel="Level 3">
      <ChildLessonsScreen />
    </AppShell>
  );
}
