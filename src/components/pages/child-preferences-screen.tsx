import { BellOff, HelpCircle, Mic, Moon, Type } from "lucide-react";
import { ChildSessionFrame, PageHeader, SettingsSection } from "@/components/layout/snow-page-frame";

const preferences = [
  {
    title: "AgentKid voice",
    description: "Use a calm voice during sessions.",
    icon: Mic,
    value: "Calm",
  },
  {
    title: "Big text",
    description: "Make reading choices easier to see.",
    icon: Type,
    value: "On",
  },
  {
    title: "Quiet animations",
    description: "Keep movement soft and slow.",
    icon: Moon,
    value: "On",
  },
  {
    title: "Sound reminders",
    description: "Gentle sounds when a step is ready.",
    icon: BellOff,
    value: "Soft",
  },
];

export function ChildPreferencesScreen() {
  return (
    <ChildSessionFrame className="justify-center">
      <PageHeader
        title="My AgentKid preferences"
        description="Small choices for how AgentKid talks and helps during learning. A grown-up manages privacy and safety settings."
        compact
      />
      <div className="grid gap-4 md:grid-cols-2">
        {preferences.map((item) => {
          const Icon = item.icon;
          return (
            <SettingsSection key={item.title} title={item.title} description={item.description}>
              <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-snow-primary-soft text-snow-primary">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-sm font-black text-snow-primary-dark">{item.value}</span>
                </div>
                <div className="relative h-6 w-11 rounded-full bg-snow-primary">
                  <div className="absolute right-1 top-1 size-4 rounded-full bg-white" />
                </div>
              </div>
            </SettingsSection>
          );
        })}
      </div>
      <div className="rounded-[var(--radius-lg)] border border-snow-border bg-snow-lavender p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-snow-primary">
            <HelpCircle className="size-5" />
          </div>
          <div>
            <p className="text-base font-black text-snow-primary-dark">Need help changing something?</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-snow-primary-dark">
              Ask a grown-up to open Parent Access for privacy, camera, storage, and safety choices.
            </p>
          </div>
        </div>
      </div>
    </ChildSessionFrame>
  );
}
