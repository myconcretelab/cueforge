ALTER TABLE "projects" ADD COLUMN "max_active_playbacks" integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "compact_playback_threshold" integer DEFAULT 5 NOT NULL;