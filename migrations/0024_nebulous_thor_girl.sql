ALTER TABLE "projects" ADD COLUMN "next_category_shortcut" text DEFAULT 'Tab' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "previous_category_shortcut" text DEFAULT 'Control+Tab' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "start_track_shortcut" text DEFAULT 'TrackKey' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "crossfade_track_shortcut" text DEFAULT 'Control+TrackKey' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "load_category_shortcut" text DEFAULT 'AltGraph' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "secondary_output_hold_shortcut" text DEFAULT 'Shift' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "toggle_output_shortcut" text DEFAULT 'CapsLock' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "master_volume_up_shortcut" text DEFAULT 'Plus' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "master_volume_up_fast_shortcut" text DEFAULT 'Control+Plus' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "master_volume_down_shortcut" text DEFAULT 'Minus' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "master_volume_down_fast_shortcut" text DEFAULT 'Control+Minus' NOT NULL;