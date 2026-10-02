import { AppShell } from "@/components/app-shell/app-shell";
import { LessonCatalog } from "@/components/learning";

export default function Page() {
  return (
    <AppShell activeNav="lessons" childName="Minh" childLevel="Level 3">
      <LessonCatalog />
    </AppShell>
  );
}
