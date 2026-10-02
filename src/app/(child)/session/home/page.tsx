import { AppShell } from "@/components/app-shell/app-shell";
import { HomeScreen } from "@/components/pages/home-screen";

export default function Page() {
  return (
    <AppShell activeNav="home" childName="Minh" childLevel="Level 3">
      <HomeScreen />
    </AppShell>
  );
}
