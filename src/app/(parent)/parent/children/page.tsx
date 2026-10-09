import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentChildrenScreen } from "@/components/pages/parent-children-screen";

export const metadata: Metadata = {
  title: "Quản lý Học sinh - AgentKid Snow",
  description: "Quản lý hồ sơ học sinh, thêm trẻ mới và điều chỉnh thông tin.",
};

export default function Page() {
  return (
    <ParentShell activeNav="children">
      <ParentChildrenScreen />
    </ParentShell>
  );
}
