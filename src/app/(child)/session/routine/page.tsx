import { AppShell } from "@/components/app-shell/app-shell";
import { ChildRoutineScreen } from "@/components/pages/child-routine-screen";

export default function Page() {
  return (
    <AppShell activeNav="routine">
      <ChildRoutineScreen />
    </AppShell>
  );
}
