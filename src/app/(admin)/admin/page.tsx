import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDashboardScreen } from "@/components/pages/admin-dashboard-screen";

export default function Page() {
  return (
    <AdminShell activeNav="dashboard">
      <AdminDashboardScreen view="dashboard" />
    </AdminShell>
  );
}
