ALTER TABLE "plans" ADD COLUMN "is_demo_plan" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "demo_lifetime_hours" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "demo_max_uploads" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "demo_max_file_bytes" bigint;--> statement-breakpoint
INSERT INTO "plans" (
	"code", "name", "description", "storage_quota_bytes", "trial_days", "is_default", "active",
	"visible_on_website", "featured_on_website", "custom_layouts_enabled", "playlists_enabled",
	"remote_control_enabled", "max_projects", "is_demo_plan", "demo_lifetime_hours",
	"demo_max_uploads", "demo_max_file_bytes", "display_order"
) VALUES (
	'demo-public', 'Démonstration publique', 'Sessions temporaires ouvertes depuis la démonstration publique SonoRiva.',
	83886080, 0, false, true, false, false, true, true, true, 1, true, 24, 15, 5242880, 10000
);--> statement-breakpoint
UPDATE "accounts" SET "plan_code" = 'demo-public', "storage_quota_override_bytes" = NULL, "updated_at" = now()
WHERE "is_demo" = true;
