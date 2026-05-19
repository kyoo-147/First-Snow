CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('pending', 'sent', 'acknowledged', 'failed');--> statement-breakpoint
CREATE TYPE "public"."alert_trigger_type" AS ENUM('keyword', 'emotion');--> statement-breakpoint
CREATE TYPE "public"."child_condition" AS ENUM('ASD', 'language_delay', 'both');--> statement-breakpoint
CREATE TYPE "public"."emotion_type" AS ENUM('happy', 'sad', 'angry', 'fearful', 'surprised', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."lesson_category" AS ENUM('emotion', 'social', 'routine');--> statement-breakpoint
CREATE TYPE "public"."lesson_framework" AS ENUM('ABA', 'PECS', 'SocialStories');--> statement-breakpoint
CREATE TYPE "public"."lesson_status" AS ENUM('suggested', 'approved', 'active', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed', 'interrupted');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"trigger_type" "alert_trigger_type" NOT NULL,
	"message" text NOT NULL,
	"emotion_history" jsonb,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "alert_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"date_of_birth" date,
	"condition" "child_condition" NOT NULL,
	"communication_preferences" jsonb,
	"goals" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emotion_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"emotion" "emotion_type" NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"framework" "lesson_framework" NOT NULL,
	"category" "lesson_category" NOT NULL,
	"title" text NOT NULL,
	"status" "lesson_status" DEFAULT 'suggested' NOT NULL,
	"nodes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"fact" text NOT NULL,
	"source_session_id" uuid,
	"confidence" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"score" numeric(5, 2),
	"ai_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"phone" text,
	"alert_channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_subject_id_unique" UNIQUE("auth_subject_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotion_events" ADD CONSTRAINT "emotion_events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_source_session_id_sessions_id_fk" FOREIGN KEY ("source_session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_session_id_idx" ON "alerts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "alerts_severity_idx" ON "alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "alerts_created_at_idx" ON "alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "children_user_id_idx" ON "children" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "emotion_events_session_id_idx" ON "emotion_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "emotion_events_timestamp_idx" ON "emotion_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "lessons_child_id_idx" ON "lessons" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "lessons_status_idx" ON "lessons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lessons_child_status_idx" ON "lessons" USING btree ("child_id","status");--> statement-breakpoint
CREATE INDEX "memories_child_id_idx" ON "memories" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "memories_child_created_at_idx" ON "memories" USING btree ("child_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_session_id_idx" ON "messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "messages_timestamp_idx" ON "messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "sessions_child_id_idx" ON "sessions" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "sessions_child_status_idx" ON "sessions" USING btree ("child_id","status");--> statement-breakpoint
CREATE INDEX "sessions_started_at_idx" ON "sessions" USING btree ("started_at");--> statement-breakpoint
COMMENT ON EXTENSION "vector" IS 'Enabled for future memory embeddings; no vector columns are created until embedding dimensions are finalized.';--> statement-breakpoint
COMMENT ON TABLE "users" IS 'Parent profile table. auth_subject_id maps to the external auth identity subject; this is not an auth credential table.';
