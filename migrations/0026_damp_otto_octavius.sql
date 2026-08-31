ALTER TABLE "playlist_items" ADD COLUMN "row_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "playlist_items" SET "row_index" = "position";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "max_playlist_group_size" integer DEFAULT 4 NOT NULL;
