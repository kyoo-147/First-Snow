import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentPrivacyScreen } from "@/components/pages/parent-privacy-screen";

export const metadata: Metadata = {
  title: "Kiểm soát Quyền riêng tư & Dữ liệu - AgentKid Snow",
  description: "Kiểm soát quyền riêng tư, lưu trữ và xuất dữ liệu gia đình",
};

export default function Page() {
  return (
    <ParentShell activeNav="privacy">
      <ParentPrivacyScreen />
    </ParentShell>
  );
}
