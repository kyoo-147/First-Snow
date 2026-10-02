const fs = require('fs');
const path = require('path');

const writeComponent = (name, content) => {
  fs.writeFileSync(path.join(__dirname, 'src', 'components', 'pages', name), content);
};

const replacePage = (route, compName) => {
  const filePath = path.join(__dirname, 'src', 'app', '(parent)', 'parent', route);
  const activeNav = route.split('/').slice(-2, -1)[0] || route.split('/')[0];
  const content = `import { ParentShell } from "@/components/parent/parent-shell";
import { ${compName} } from "@/components/pages/${compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}";

export default function Page() {
  return (
    <ParentShell activeNav="${activeNav.replace(/\[|\]/g, '')}">
      <${compName} />
    </ParentShell>
  );
}
`;
  fs.writeFileSync(filePath, content);
};

// Learning
writeComponent('parent-learning-screen.tsx', `"use client";
import { GraduationCap, BarChart3 } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
export function ParentLearningScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-snow-primary-dark">Learning Progress</h1>
          <p className="mt-2 text-snow-muted">Track academic milestones and skill development.</p>
        </div>
        <SnowButton variant="outline" className="shadow-[var(--shadow-card)]"><BarChart3 className="mr-2 size-4" /> Full Report</SnowButton>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-snow-accent-peach/20 rounded-full text-snow-accent-peach"><GraduationCap className="size-6" /></div>
            <h2 className="text-xl font-black text-snow-primary-dark">Reading Level</h2>
          </div>
          <div className="h-2 w-full bg-snow-surface-soft rounded-full overflow-hidden mb-2"><div className="h-full bg-snow-accent-peach w-3/4"></div></div>
          <p className="text-sm font-bold text-snow-muted text-right">Level 3 (75% to Level 4)</p>
        </div>
      </div>
    </div>
  );
}`);
replacePage('children/[childId]/learning/page.tsx', 'ParentLearningScreen');

// Routines
writeComponent('parent-routines-screen.tsx', `"use client";
import { CalendarCheck, Plus } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
export function ParentRoutinesScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-snow-primary-dark">Daily Routines</h1>
          <p className="mt-2 text-snow-muted">Manage bedtime, focus time, and learning schedules.</p>
        </div>
        <SnowButton className="shadow-[var(--shadow-card)]"><Plus className="mr-2 size-4" /> Add Routine</SnowButton>
      </header>
      <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)] flex flex-col gap-4">
        <div className="flex items-center justify-between p-4 border border-snow-border rounded-[var(--radius-lg)] bg-snow-surface-soft">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-snow-primary-soft rounded-full text-snow-primary"><CalendarCheck className="size-6" /></div>
            <div>
              <h3 className="font-black text-snow-primary-dark">Bedtime Wind-down</h3>
              <p className="text-sm text-snow-muted">Everyday • 8:00 PM</p>
            </div>
          </div>
          <div className="w-12 h-6 bg-snow-primary rounded-full relative"><div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div></div>
        </div>
      </div>
    </div>
  );
}`);
replacePage('children/[childId]/routines/page.tsx', 'ParentRoutinesScreen');

// Alerts
writeComponent('parent-alerts-screen.tsx', `"use client";
import { Bell, ShieldAlert } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
export function ParentAlertsScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-snow-primary-dark">Safety Alerts</h1>
          <p className="mt-2 text-snow-muted">Important notifications regarding child safety.</p>
        </div>
      </header>
      <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-8 shadow-[var(--shadow-card)] text-center">
        <ShieldAlert className="size-12 text-snow-muted mx-auto mb-4" />
        <h2 className="text-lg font-black text-snow-primary-dark">No active alerts</h2>
        <p className="text-sm text-snow-muted mt-1">Everything looks safe and sound.</p>
      </div>
    </div>
  );
}`);
replacePage('alerts/page.tsx', 'ParentAlertsScreen');

// Privacy
writeComponent('parent-privacy-screen.tsx', `"use client";
import { Shield, Lock } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
export function ParentPrivacyScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-snow-primary-dark">Privacy Controls</h1>
          <p className="mt-2 text-snow-muted">Manage data sharing, voice recordings, and AI context.</p>
        </div>
        <SnowButton className="shadow-[var(--shadow-card)]"><Lock className="mr-2 size-4" /> Save Changes</SnowButton>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-snow-primary-soft rounded-full text-snow-primary"><Shield className="size-6" /></div>
            <h2 className="text-xl font-black text-snow-primary-dark">Data Collection</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-snow-muted">Save Voice Transcripts</span>
              <div className="w-12 h-6 bg-snow-primary rounded-full relative"><div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-snow-muted">Enable Personalized AI Memory</span>
              <div className="w-12 h-6 bg-snow-primary rounded-full relative"><div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`);
replacePage('privacy/page.tsx', 'ParentPrivacyScreen');
replacePage('consent/page.tsx', 'ParentPrivacyScreen'); // Reuse for now

console.log("Done generating simple parent routes.");
