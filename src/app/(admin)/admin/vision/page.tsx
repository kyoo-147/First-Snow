import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDashboardScreen } from "@/components/pages/admin-dashboard-screen";

export const metadata: Metadata = {
  title: "Quản trị Thị giác - AgentKid Snow",
  description: "Cấu hình mô hình nhận diện thị giác và thiết bị camera",
};

export default function Page() {
  return (
    <AdminShell activeNav="vision">
      <AdminDashboardScreen view="vision" />
    </AdminShell>
  );
}
