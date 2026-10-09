import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDashboardScreen } from "@/components/pages/admin-dashboard-screen";

export const metadata: Metadata = {
  title: "Quản trị Trợ lý - AgentKid Snow",
  description: "Cấu hình nhân vật, giọng đọc và hành vi bạn đồng hành AI",
};

export default function Page() {
  return (
    <AdminShell activeNav="companion">
      <AdminDashboardScreen view="companion" />
    </AdminShell>
  );
}
