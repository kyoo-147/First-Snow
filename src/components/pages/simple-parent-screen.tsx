import { Bell, BookOpen, Calendar, ChevronRight, Download, Lock, Mail, ShieldCheck, Users } from "lucide-react";
import { t } from "@/i18n";
import { SnowCard } from "@/components/ui/snow-card";

export function SimpleParentScreen({ title }: { title: string }) {
  const rows = getRows(title);

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-3xl font-black text-snow-primary-dark">{title}</h1>
        <p className="mt-1 text-sm font-bold text-snow-muted">{t("parent", "simple.manage")}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <SnowCard key={row.title} className="flex min-h-28 items-center gap-4 p-5">
                <div className={`grid size-12 shrink-0 place-items-center rounded-full ${row.bg}`}>
                  <Icon className={`size-5 ${row.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black text-snow-primary-dark">{row.title}</h2>
                  <p className="mt-1 text-xs font-semibold leading-5 text-snow-muted">{row.desc}</p>
                  <p className="mt-2 text-xs font-black text-snow-primary">{row.status}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-snow-muted" />
              </SnowCard>
            );
          })}
        </div>

        <aside className="space-y-5">
          <SnowCard className="p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "simple.summary")}</h2>
            <div className="mt-5 space-y-4">
              <Metric label={t("parent", "simple.screenTime")} value="45 min" />
              <Metric label={t("parent", "simple.safetyLocks")} value="Active" />
              <Metric label={t("parent", "simple.careTeam")} value="2 adults" />
            </div>
          </SnowCard>
          <SnowCard className="bg-snow-lavender p-5">
            <h2 className="text-lg font-black text-snow-primary-dark">{t("parent", "simple.parentNote")}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-snow-primary-dark">{t("parent", "simple.parentNoteDesc")}</p>
          </SnowCard>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-snow-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm font-bold text-snow-muted">{label}</span>
      <span className="text-sm font-black text-snow-primary-dark">{value}</span>
    </div>
  );
}

function getRows(title: string) {
  if (title.includes("Settings")) {
    return [
      { title: "Notification Preferences", desc: "Choose email and push updates for progress and safety.", status: "Email and push enabled", icon: Bell, bg: "bg-snow-primary/15", color: "text-snow-primary" },
      { title: "Parent Verification", desc: "Sensitive changes require a parent PIN before saving.", status: "Protected", icon: Lock, bg: "bg-snow-lavender", color: "text-snow-primary" },
      { title: "Routine Schedule", desc: "After-school learning and bedtime wind-down are active.", status: "2 routines set", icon: Calendar, bg: "bg-snow-warning/20", color: "text-snow-warning" },
      { title: "Care Team Sharing", desc: "Share gentle progress summaries with trusted adults.", status: "2 members connected", icon: Users, bg: "bg-snow-aqua/20", color: "text-snow-aqua" },
    ];
  }

  if (title.includes("Safety")) {
    return [
      { title: "Child Safe Mode", desc: "Filters inappropriate content and keeps child mode simple.", status: "On", icon: ShieldCheck, bg: "bg-snow-success/15", color: "text-snow-success" },
      { title: "Voice Access", desc: "Voice interactions are limited to child-safe prompts.", status: "Enabled", icon: Lock, bg: "bg-snow-primary/15", color: "text-snow-primary" },
      { title: "Support Language", desc: "AgentKid uses encouraging, observation-based language.", status: "Calm", icon: Mail, bg: "bg-snow-aqua/20", color: "text-snow-aqua" },
      { title: "Download Data", desc: "Export progress and privacy summaries for review.", status: "Available", icon: Download, bg: "bg-snow-warning/20", color: "text-snow-warning" },
    ];
  }

  return [
    { title: "Learning Report", desc: "Review recent lessons, reading practice, and completion trends.", status: "Updated today", icon: BookOpen, bg: "bg-snow-primary/15", color: "text-snow-primary" },
    { title: "Observation Notes", desc: "See what AgentKid noticed in gentle parent-friendly language.", status: "2 new notes", icon: Mail, bg: "bg-snow-aqua/20", color: "text-snow-aqua" },
    { title: "Progress Export", desc: "Download a parent-friendly summary of Minh's week.", status: "PDF ready", icon: Download, bg: "bg-snow-warning/20", color: "text-snow-warning" },
    { title: "Care Team", desc: "Manage trusted adults who can view parent summaries.", status: "2 adults", icon: Users, bg: "bg-snow-lavender", color: "text-snow-primary" },
  ];
}
