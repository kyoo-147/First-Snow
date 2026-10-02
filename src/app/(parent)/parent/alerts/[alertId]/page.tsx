import { ParentShell } from "@/components/parent/parent-shell";
import { ParentPageFrame, PageHeader, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowCard } from "@/components/ui/snow-card";
import { getAlertsByChildId, getChildById } from "@/data";
import { formatSnowDate, formatSnowTime } from "@/lib/format";
import { Bell, CalendarClock, CheckCircle2, ShieldAlert } from "lucide-react";

export default async function Page({ params }: { params: Promise<{ alertId: string }> }) {
  const { alertId } = await params;
  const child = getChildById("minh");
  const alert = getAlertsByChildId(child.id).find((item) => item.id === alertId) ?? getAlertsByChildId(child.id)[0];

  return (
    <ParentShell activeNav="alerts">
      <ParentPageFrame>
        <PageHeader
          eyebrow="Alert review"
          title={alert.title}
          description={`Review what AgentKid noticed for ${child.name}. This screen supports parent follow-up with observation-only language.`}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatusTile label="Priority" value={alert.severity} detail="Parent review" icon={<ShieldAlert className="size-5 text-snow-primary" />} />
          <StatusTile label="Child" value={`${child.name}, age ${child.age}`} detail={child.grade} icon={<Bell className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
          <StatusTile label="Logged" value={formatSnowDate(alert.date)} detail={formatSnowTime(alert.date)} icon={<CalendarClock className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <SnowCard className="p-5">
            <h2 className="text-xl font-black text-snow-primary-dark">What AgentKid noticed</h2>
            <p className="mt-3 text-base font-semibold leading-7 text-snow-muted">{alert.description}</p>
            <div className="mt-5 rounded-[var(--radius-md)] bg-snow-surface-soft p-4">
              <p className="text-sm font-black text-snow-primary-dark">Suggested parent follow-up</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-snow-muted">
                Ask {child.name} how the session felt, keep the conversation short, and offer a calm break before another activity.
              </p>
            </div>
          </SnowCard>

          <aside className="space-y-4">
            <SnowCard className="p-5">
              <h2 className="text-lg font-black text-snow-primary-dark">Review actions</h2>
              <div className="mt-4 space-y-3">
                {["Mark reviewed", "Open related transcript", "Adjust routine timing"].map((item) => (
                  <button key={item} className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3 text-left text-sm font-black text-snow-primary-dark">
                    <CheckCircle2 className="size-4 text-snow-success" />
                    {item}
                  </button>
                ))}
              </div>
            </SnowCard>
            <SnowCard className="bg-snow-lavender p-5">
              <h2 className="text-lg font-black text-snow-primary-dark">Safety note</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-snow-primary-dark">Emergency contacts and alert settings are parent-only and never visible in child sessions.</p>
            </SnowCard>
          </aside>
        </div>
      </ParentPageFrame>
    </ParentShell>
  );
}
