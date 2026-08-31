ALTER TABLE "projects" ALTER COLUMN "backspace_key_action" SET DEFAULT 'stop-last-immediate';--> statement-breakpoint
UPDATE "projects" SET "backspace_key_action" = 'stop-last-immediate' WHERE "backspace_key_action" = 'stop-all';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "keyboard_action" text DEFAULT 'start' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "shift_backspace_key_action" text DEFAULT 'stop-last' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "search_shortcut" text DEFAULT 'Primary+KeyK' NOT NULL;
