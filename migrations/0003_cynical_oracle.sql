ALTER TABLE "projects" ADD COLUMN "left_click_action" text DEFAULT 'start' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "right_click_action" text DEFAULT 'crossfade' NOT NULL;