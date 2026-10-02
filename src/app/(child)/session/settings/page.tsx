import { AppShell } from "@/components/app-shell/app-shell";
import { ChildPreferencesScreen } from "@/components/pages/child-preferences-screen";

export default function Page() {
  return (
    <AppShell activeNav="settings" childName="Minh" childLevel="Level 3">
      <ChildPreferencesScreen />
    </AppShell>
  );
}
