import type { Metadata } from "next";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentConsentScreen } from "@/components/pages/parent-consent-screen";

export const metadata: Metadata = {
  title: "Đồng ý của Phụ huynh - AgentKid Snow",
  description: "Quản lý sự đồng ý và quyền riêng tư cho các hoạt động của học sinh",
};

export default function Page() {
  return (
    <ParentShell activeNav="consent">
      <ParentConsentScreen />
    </ParentShell>
  );
}
