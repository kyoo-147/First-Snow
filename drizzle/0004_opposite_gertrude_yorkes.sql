ALTER TYPE "public"."notification_channel" ADD VALUE 'sms';--> statement-breakpoint
ALTER TYPE "public"."notification_channel" ADD VALUE 'voice';--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD COLUMN "notify_on_alert" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD COLUMN "consent_granted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "emergency_contact_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "provider_reference" varchar(80);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "provider_status" varchar(40);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "last_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_emergency_contact_id_emergency_contacts_id_fk" FOREIGN KEY ("emergency_contact_id") REFERENCES "public"."emergency_contacts"("id") ON DELETE cascade ON UPDATE no action;