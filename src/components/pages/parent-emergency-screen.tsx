"use client";

import { Bell, PhoneCall, ShieldCheck, UserPlus } from "lucide-react";
import { ParentPageFrame, PageHeader, SettingsSection, StatusTile } from "@/components/layout/snow-page-frame";
import { SnowButton } from "@/components/ui/snow-button";
import { mockEmergencyContacts } from "@/data";

export function ParentEmergencyScreen() {
  return (
    <ParentPageFrame>
      <PageHeader
        eyebrow="Parent-only safety"
        title="Emergency contacts"
        description="Choose who AgentKid should surface to a parent during a serious support moment. These controls never appear in child sessions."
        action={
          <SnowButton>
            <UserPlus className="mr-2 size-4" />
            Add contact
          </SnowButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile label="Contacts saved" value={`${mockEmergencyContacts.length}`} detail="Parent-only" icon={<PhoneCall className="size-5 text-snow-primary" />} />
        <StatusTile label="Alert routing" value="Enabled" detail="Parent portal and notifications" icon={<Bell className="size-5 text-snow-primary" />} tone="bg-snow-ice" />
        <StatusTile label="Child visibility" value="Hidden" detail="Not shown in session UI" icon={<ShieldCheck className="size-5 text-snow-primary" />} tone="bg-snow-lavender" />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsSection title="Contact list" description="Use people who are allowed to help review child support moments.">
          {mockEmergencyContacts.map((contact, index) => (
            <div key={contact.id} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface-soft px-4 py-3">
              <div>
                <p className="text-sm font-black text-snow-primary-dark">{contact.name}</p>
                <p className="mt-1 text-xs font-semibold text-snow-muted">{contact.relation} - {contact.phone}</p>
              </div>
              <span className="rounded-full bg-snow-primary-soft px-3 py-1 text-xs font-black text-snow-primary-dark">{index === 0 ? "Primary" : "Backup"}</span>
            </div>
          ))}
        </SettingsSection>

        <SettingsSection title="Alert settings">
          {["Notify primary contact first", "Use calm parent-facing language", "Keep child UI focused on calm break actions"].map((item) => (
            <div key={item} className="rounded-[var(--radius-md)] bg-snow-surface-soft px-4 py-3 text-sm font-bold leading-6 text-snow-primary-dark">{item}</div>
          ))}
        </SettingsSection>
      </div>
    </ParentPageFrame>
  );
}
