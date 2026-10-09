import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDashboardScreen } from "@/components/pages/admin-dashboard-screen";

export const metadata: Metadata = {
  title: "Quản trị Hệ thống - AgentKid Snow",
  description: "Trạng thái kết nối, dịch vụ và cấu hình hệ thống",
};

export default function Page() {
  return (
    <AdminShell activeNav="system">
      <AdminDashboardScreen view="system" />
    </AdminShell>
  );
}
