ALTER TABLE "sessions" ALTER COLUMN "token_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_actor_fk_check" CHECK (("user_id" IS NOT NULL AND "child_id" IS NULL) OR ("user_id" IS NULL AND "child_id" IS NOT NULL));