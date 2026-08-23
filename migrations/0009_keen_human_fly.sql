ALTER TABLE "playlists" ADD COLUMN "gap_ms" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "playlists" ADD COLUMN "crossfade_ms" integer DEFAULT 0 NOT NULL;