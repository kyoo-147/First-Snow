import { ParentShell } from "@/components/parent/parent-shell";
import { SettingsScreen } from "@/components/pages/settings-screen";

export default function Page() {
  return (
    <ParentShell activeNav="settings">
      <SettingsScreen />
    </ParentShell>
  );
}
