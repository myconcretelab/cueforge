ALTER TABLE "tracks" ADD COLUMN "start_time_ms" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "end_time_ms" integer;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "copyright_text" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "source_id" text;