import { ParentShell } from "@/components/parent/parent-shell";
import { ParentDashboard } from "@/components/pages/parent-dashboard";

export default function Page() {
  return (
    <ParentShell activeNav="dashboard">
      <ParentDashboard />
    </ParentShell>
  );
}
