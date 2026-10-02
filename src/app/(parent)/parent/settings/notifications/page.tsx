import { ParentShell } from "@/components/parent/parent-shell";
import { ParentNotificationsScreen } from "@/components/pages/parent-notifications-screen";

export default function Page() {
  return (
    <ParentShell activeNav="notifications">
      <ParentNotificationsScreen />
    </ParentShell>
  );
}
