import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentAccountScreen } from "@/components/pages/parent-account-screen";

export const metadata: Metadata = {
  title: "Tài khoản Phụ huynh - AgentKid Snow",
  description: "Quản lý thông tin hồ sơ, mật khẩu và phiên đăng nhập",
};

export default function Page() {
  return (
    <ParentShell activeNav="account">
      <ParentAccountScreen />
    </ParentShell>
  );
}
