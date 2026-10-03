CREATE TYPE "public"."routine_time_of_day" AS ENUM('morning', 'afternoon', 'evening', 'anytime');--> statement-breakpoint
CREATE TABLE "routine_step_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_step_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"completion_date" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routine_step_completions_step_date_unique" UNIQUE("routine_step_id","completion_date")
);
--> statement-breakpoint
CREATE TABLE "routine_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"step_order" integer NOT NULL,
	"duration_minutes" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routine_steps_routine_order_unique" UNIQUE("routine_id","step_order")
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"time_of_day" "routine_time_of_day" DEFAULT 'anytime' NOT NULL,
	"scheduled_time" varchar(5),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routine_step_completions" ADD CONSTRAINT "routine_step_completions_routine_step_id_routine_steps_id_fk" FOREIGN KEY ("routine_step_id") REFERENCES "public"."routine_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_step_completions" ADD CONSTRAINT "routine_step_completions_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "routine_step_completions_child_date_idx" ON "routine_step_completions" USING btree ("child_id","completion_date");--> statement-breakpoint
CREATE INDEX "routines_child_id_idx" ON "routines" USING btree ("child_id");