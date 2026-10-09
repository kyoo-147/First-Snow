import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDashboardScreen } from "@/components/pages/admin-dashboard-screen";

export const metadata: Metadata = {
  title: "Tổng quan Quản trị - AgentKid Snow",
  description: "Trang tổng quan hệ thống và các chỉ số vận hành",
};

export default function Page() {
  return (
    <AdminShell activeNav="dashboard">
      <AdminDashboardScreen view="dashboard" />
    </AdminShell>
  );
}
