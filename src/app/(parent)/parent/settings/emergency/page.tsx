import { ParentShell } from "@/components/parent/parent-shell";
import { ParentEmergencyScreen } from "@/components/pages/parent-emergency-screen";

export default function Page() {
  return (
    <ParentShell activeNav="emergency">
      <ParentEmergencyScreen />
    </ParentShell>
  );
}
