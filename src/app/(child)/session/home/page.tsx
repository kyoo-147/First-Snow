import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/app-shell";
import { HomeScreen } from "@/components/pages/home-screen";

export const metadata: Metadata = {
  title: "Góc Học tập của Bé - AgentKid Snow",
  description: "Trang chủ học tập tương tác và theo dõi tiến độ của học sinh",
};

export default function Page() {
  return (
    <AppShell activeNav="home">
      <HomeScreen />
    </AppShell>
  );
}
