const fs = require('fs');
const path = require('path');

const writeComponent = (name, content) => {
  fs.writeFileSync(path.join(__dirname, 'src', 'components', 'pages', name), content);
};

const replacePage = (base, route, compName, activeNav) => {
  const filePath = path.join(__dirname, 'src', 'app', base, route);
  const content = base === '(parent)' ? `import { ParentShell } from "@/components/parent/parent-shell";
import { ${compName} } from "@/components/pages/${compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}";

export default function Page() {
  return (
    <ParentShell activeNav="${activeNav}">
      <${compName} />
    </ParentShell>
  );
}
` : base === '(child)' ? `import { ChildSessionShell } from "@/components/app-shell/app-shell";
import { ${compName} } from "@/components/pages/${compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}";

export default function Page() {
  return (
    <ChildSessionShell activeNav="${activeNav}">
      <${compName} />
    </ChildSessionShell>
  );
}
` : `import { AdminShell } from "@/components/admin/admin-shell";
import { ${compName} } from "@/components/pages/${compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}";

export default function Page() {
  return (
    <AdminShell activeNav="${activeNav}">
      <${compName} />
    </AdminShell>
  );
}
`;
  
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  fs.writeFileSync(filePath, content);
};

// --- Parent Settings Sub-pages ---

writeComponent('parent-notifications-screen.tsx', `"use client";
import { BellRing } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
export function ParentNotificationsScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-snow-primary-dark">Notifications</h1>
          <p className="mt-2 text-snow-muted">Manage email and push notifications.</p>
        </div>
      </header>
      <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-snow-muted">Weekly Progress Reports</span>
          <div className="w-12 h-6 bg-snow-primary rounded-full relative"><div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div></div>
        </div>
      </div>
    </div>
  );
}`);
replacePage('(parent)', 'parent/settings/notifications/page.tsx', 'ParentNotificationsScreen', 'notifications');

writeComponent('parent-account-screen.tsx', `"use client";
import { UserCircle } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
export function ParentAccountScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-snow-primary-dark">Account Details</h1>
          <p className="mt-2 text-snow-muted">Manage your subscription and email.</p>
        </div>
      </header>
      <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)] space-y-4">
        <div>
          <label className="block text-sm font-bold text-snow-muted mb-1">Email</label>
          <input type="email" value="parent@example.com" readOnly className="w-full max-w-md bg-snow-surface-soft border border-snow-border rounded-[var(--radius-lg)] px-4 py-2 text-snow-primary-dark outline-none" />
        </div>
      </div>
    </div>
  );
}`);
replacePage('(parent)', 'parent/settings/account/page.tsx', 'ParentAccountScreen', 'account');

writeComponent('parent-emergency-screen.tsx', `"use client";
import { PhoneCall } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
export function ParentEmergencyScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-snow-primary-dark">Emergency Contacts</h1>
          <p className="mt-2 text-snow-muted">Who should Snow contact if an emergency is detected?</p>
        </div>
        <SnowButton className="shadow-[var(--shadow-card)]">Add Contact</SnowButton>
      </header>
      <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex justify-between items-center bg-snow-surface-soft p-4 rounded-[var(--radius-lg)] border border-snow-border">
          <div>
            <h3 className="font-black text-snow-primary-dark">Linh Nguyen (Mother)</h3>
            <p className="text-sm text-snow-muted">+84 987 654 321</p>
          </div>
          <span className="text-xs font-bold text-snow-primary bg-snow-primary-soft px-2 py-1 rounded-full">Primary</span>
        </div>
      </div>
    </div>
  );
}`);
replacePage('(parent)', 'parent/settings/emergency/page.tsx', 'ParentEmergencyScreen', 'emergency');


// --- Child Mode ---

writeComponent('child-lessons-screen.tsx', `"use client";
import { lessons } from "@/data/snow-data";
import Image from "next/image";
import Link from "next/link";
export function ChildLessonsScreen() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h1 className="text-4xl font-black text-snow-primary-dark text-center mt-8">Pick a Lesson!</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {lessons.map((lesson) => (
          <Link key={lesson.id} href={\`/session/lessons/\${lesson.id}\`} className="group overflow-hidden rounded-[var(--radius-xl)] border-2 border-snow-border bg-snow-surface shadow-[var(--shadow-card)] transition hover:-translate-y-2 hover:border-snow-primary hover:shadow-xl">
            <div className={\`relative h-48 bg-snow-accent-\${lesson.accent}/20\`}>
              <Image src={lesson.image} alt="" fill className="object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-black text-snow-primary-dark">{lesson.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}`);
replacePage('(child)', 'session/lessons/page.tsx', 'ChildLessonsScreen', 'lessons');

writeComponent('child-activities-screen.tsx', `"use client";
import { Heart, Star, Smile, Sun } from "lucide-react";
import Link from "next/link";
export function ChildActivitiesScreen() {
  const emojis = [
    { label: "Happy", icon: Smile, color: "bg-snow-accent-peach", text: "text-white" },
    { label: "Excited", icon: Star, color: "bg-snow-primary", text: "text-white" },
    { label: "Calm", icon: Sun, color: "bg-snow-accent-aqua", text: "text-white" },
    { label: "Sad", icon: Heart, color: "bg-snow-surface-soft", text: "text-snow-muted" }
  ];
  return (
    <div className="mx-auto max-w-4xl flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in slide-in-from-bottom-4 duration-500 text-center pb-20">
      <h1 className="text-5xl font-black text-snow-primary-dark mb-12">How are you feeling today?</h1>
      <div className="flex flex-wrap justify-center gap-6">
        {emojis.map((emoji) => {
          const Icon = emoji.icon;
          return (
            <button key={emoji.label} className={\`group relative flex flex-col items-center gap-4 p-8 rounded-[var(--radius-xl)] transition hover:-translate-y-2 hover:scale-110 \${emoji.color} shadow-[var(--shadow-card)]\`}>
              <Icon className={\`size-16 \${emoji.text}\`} />
              <span className={\`text-xl font-black \${emoji.text}\`}>{emoji.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
}`);
replacePage('(child)', 'session/activities/page.tsx', 'ChildActivitiesScreen', 'feelings');


// --- Admin Mode ---

writeComponent('admin-dashboard-screen.tsx', `"use client";
import { Settings2, Cpu, Database, Network } from "lucide-react";
import { SnowButton } from "@/components/ui/snow-button";
export function AdminDashboardScreen() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-snow-primary-dark">System Control Panel</h1>
          <p className="mt-2 text-snow-muted">Manage LLM parameters, TTS engine, and Vision module.</p>
        </div>
        <SnowButton className="shadow-[var(--shadow-card)]"><Settings2 className="mr-2 size-4" /> Apply Config</SnowButton>
      </header>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-snow-surface-soft rounded-full text-snow-primary-dark"><Cpu className="size-6" /></div>
            <h2 className="text-lg font-black text-snow-primary-dark">LLM Engine</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-snow-muted mb-1 uppercase tracking-wider">Model</label>
              <select className="w-full bg-snow-surface-soft border border-snow-border rounded-[var(--radius-md)] px-3 py-2 text-sm font-bold text-snow-primary-dark outline-none">
                <option>gemini-1.5-flash</option>
                <option>gemini-1.5-pro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-snow-muted mb-1 uppercase tracking-wider">Temperature</label>
              <input type="range" min="0" max="100" defaultValue="40" className="w-full accent-snow-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-snow-surface-soft rounded-full text-snow-primary-dark"><Network className="size-6" /></div>
            <h2 className="text-lg font-black text-snow-primary-dark">Live2D & TTS</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-snow-muted mb-1 uppercase tracking-wider">Voice ID</label>
              <select className="w-full bg-snow-surface-soft border border-snow-border rounded-[var(--radius-md)] px-3 py-2 text-sm font-bold text-snow-primary-dark outline-none">
                <option>snow-en-us-1</option>
                <option>snow-vn-1</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-snow-border bg-snow-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-snow-surface-soft rounded-full text-snow-primary-dark"><Database className="size-6" /></div>
            <h2 className="text-lg font-black text-snow-primary-dark">Memory & RAG</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-snow-muted">Semantic Cache</span>
              <div className="w-10 h-5 bg-snow-primary rounded-full relative"><div className="absolute right-1 top-1 size-3 bg-white rounded-full"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`);
replacePage('(admin)', 'admin/page.tsx', 'AdminDashboardScreen', 'dashboard');

console.log("Done generating remaining UI routes.");
