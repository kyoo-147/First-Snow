import type { ReactNode } from "react";

export const metadata = {
  title: "Authentication - AgentKid Snow",
  description: "Secure, gentle parent and child authentication for AgentKid Snow",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh] w-full">{children}</div>;
}
