import { AppShell } from "@/components/app-shell/app-shell";
import { ChildPreferencesScreen } from "@/components/pages/child-preferences-screen";

export default function Page() {
  return (
    <AppShell activeNav="settings">
      <ChildPreferencesScreen />
    </AppShell>
  );
}
