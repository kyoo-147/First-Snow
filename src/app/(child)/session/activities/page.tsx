import { AppShell } from "@/components/app-shell/app-shell";
import { ChildActivitiesScreen } from "@/components/pages/child-activities-screen";

export default function Page() {
  return (
    <AppShell activeNav="activities">
      <ChildActivitiesScreen />
    </AppShell>
  );
}
