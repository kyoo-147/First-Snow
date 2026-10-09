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
              <Metric label={t("parent", "simple.screenTime")} value={t("parent", "simple.metrics.screenTimeValue")} />
              <Metric label={t("parent", "simple.safetyLocks")} value={t("parent", "simple.metrics.safetyLocksValue")} />
              <Metric label={t("parent", "simple.careTeam")} value={t("parent", "simple.metrics.careTeamValue")} />
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
  if (title.includes("Settings") || title.includes("Cài đặt")) {
    return [
      {
        title: t("parent", "simple.rows.settings.notifications.title"),
        desc: t("parent", "simple.rows.settings.notifications.desc"),
        status: t("parent", "simple.rows.settings.notifications.status"),
        icon: Bell,
        bg: "bg-snow-primary/15",
        color: "text-snow-primary",
      },
      {
        title: t("parent", "simple.rows.settings.verification.title"),
        desc: t("parent", "simple.rows.settings.verification.desc"),
        status: t("parent", "simple.rows.settings.verification.status"),
        icon: Lock,
        bg: "bg-snow-lavender",
        color: "text-snow-primary",
      },
      {
        title: t("parent", "simple.rows.settings.routines.title"),
        desc: t("parent", "simple.rows.settings.routines.desc"),
        status: t("parent", "simple.rows.settings.routines.status"),
        icon: Calendar,
        bg: "bg-snow-warning/20",
        color: "text-snow-warning",
      },
      {
        title: t("parent", "simple.rows.settings.careTeam.title"),
        desc: t("parent", "simple.rows.settings.careTeam.desc"),
        status: t("parent", "simple.rows.settings.careTeam.status"),
        icon: Users,
        bg: "bg-snow-aqua/20",
        color: "text-snow-aqua",
      },
    ];
  }

  if (title.includes("Safety") || title.includes("An toàn")) {
    return [
      {
        title: t("parent", "simple.rows.safety.safeMode.title"),
        desc: t("parent", "simple.rows.safety.safeMode.desc"),
        status: t("parent", "simple.rows.safety.safeMode.status"),
        icon: ShieldCheck,
        bg: "bg-snow-success/15",
        color: "text-snow-success",
      },
      {
        title: t("parent", "simple.rows.safety.voiceAccess.title"),
        desc: t("parent", "simple.rows.safety.voiceAccess.desc"),
        status: t("parent", "simple.rows.safety.voiceAccess.status"),
        icon: Lock,
        bg: "bg-snow-primary/15",
        color: "text-snow-primary",
      },
      {
        title: t("parent", "simple.rows.safety.supportLanguage.title"),
        desc: t("parent", "simple.rows.safety.supportLanguage.desc"),
        status: t("parent", "simple.rows.safety.supportLanguage.status"),
        icon: Mail,
        bg: "bg-snow-aqua/20",
        color: "text-snow-aqua",
      },
      {
        title: t("parent", "simple.rows.safety.downloadData.title"),
        desc: t("parent", "simple.rows.safety.downloadData.desc"),
        status: t("parent", "simple.rows.safety.downloadData.status"),
        icon: Download,
        bg: "bg-snow-warning/20",
        color: "text-snow-warning",
      },
    ];
  }

  return [
    {
      title: t("parent", "simple.rows.reports.learningReport.title"),
      desc: t("parent", "simple.rows.reports.learningReport.desc"),
      status: t("parent", "simple.rows.reports.learningReport.status"),
      icon: BookOpen,
      bg: "bg-snow-primary/15",
      color: "text-snow-primary",
    },
    {
      title: t("parent", "simple.rows.reports.observationNotes.title"),
      desc: t("parent", "simple.rows.reports.observationNotes.desc"),
      status: t("parent", "simple.rows.reports.observationNotes.status"),
      icon: Mail,
      bg: "bg-snow-aqua/20",
      color: "text-snow-aqua",
    },
    {
      title: t("parent", "simple.rows.reports.progressExport.title"),
      desc: t("parent", "simple.rows.reports.progressExport.desc"),
      status: t("parent", "simple.rows.reports.progressExport.status"),
      icon: Download,
      bg: "bg-snow-warning/20",
      color: "text-snow-warning",
    },
    {
      title: t("parent", "simple.rows.reports.careTeam.title"),
      desc: t("parent", "simple.rows.reports.careTeam.desc"),
      status: t("parent", "simple.rows.reports.careTeam.status"),
      icon: Users,
      bg: "bg-snow-lavender",
      color: "text-snow-primary",
    },
  ];
}
