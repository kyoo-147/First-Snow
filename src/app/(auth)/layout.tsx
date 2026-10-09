import type { ReactNode } from "react";

export const metadata = {
  title: "Xác thực - AgentKid Snow",
  description: "Xác thực an toàn, nhẹ nhàng cho phụ huynh và học sinh cho AgentKid Snow",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh] w-full">{children}</div>;
}
