import { AppShell } from "@/components/app-shell/app-shell";
import { ChildActivitiesScreen } from "@/components/pages/child-activities-screen";

export default function Page() {
  return (
    <AppShell activeNav="activities" childName="Minh" childLevel="Level 3">
      <ChildActivitiesScreen />
    </AppShell>
  );
}
