import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tùy chỉnh Bạn đồng hành - AgentKid Snow",
  description: "Trải nghiệm và tương tác cùng nhân vật bạn đồng hành ảo Snow",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
