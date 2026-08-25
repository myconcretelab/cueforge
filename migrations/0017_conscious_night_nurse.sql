ALTER TABLE "plans" ADD COLUMN "visible_on_website" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "featured_on_website" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "plans"
SET "visible_on_website" = true,
    "featured_on_website" = true
WHERE "is_default" = true;
